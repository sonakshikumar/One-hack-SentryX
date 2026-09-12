"""SentryX FastAPI computer-vision service.

The model is loaded once at startup. Runtime model weights and videos are not
stored in this repository; configure SENTRYX_MODEL_PATH in the deployment.
"""

import json
import logging
import os
import tempfile
import time
from pathlib import Path

import cv2
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from ultralytics import YOLO

try:
    from .movement import centroid, movement_features, point_in_polygon, tripwire_crossed
except ImportError:  # supports `uvicorn main:app` from the backend directory
    from movement import centroid, movement_features, point_in_polygon, tripwire_crossed

logging.basicConfig(level=os.getenv("SENTRYX_LOG_LEVEL", "INFO"))
log = logging.getLogger("sentryx")

MODEL_PATH = os.getenv("SENTRYX_MODEL_PATH", "yolov8n.pt")
INFERENCE_SIZE = int(os.getenv("SENTRYX_INFERENCE_SIZE", "1280"))
DETECTION_CONF = float(os.getenv("SENTRYX_DETECTION_CONF", "0.20"))
TILE_SIZE = int(os.getenv("SENTRYX_TILE_SIZE", "640"))
TILE_OVERLAP = float(os.getenv("SENTRYX_TILE_OVERLAP", "0.25"))
USE_TILED = os.getenv("SENTRYX_USE_TILED_INFERENCE", "true").lower() in {"1", "true", "yes", "on"}
DEVICE = 0 if torch.cuda.is_available() else "cpu"
MODEL = None
MODEL_ERROR = None

app = FastAPI(title="SentryX AI Service", version="1.0.0")
configured_origins = [origin.strip() for origin in os.getenv("SENTRYX_CORS_ORIGINS", "").split(",") if origin.strip()]
cors_origins = configured_origins or ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Accept", "Content-Type"])


@app.on_event("startup")
def load_model_once():
    global MODEL, MODEL_ERROR
    log.info("SentryX startup: model=%s device=%s inference_size=%s conf=%s tiled=%s tile=%s overlap=%s", MODEL_PATH, DEVICE, INFERENCE_SIZE, DETECTION_CONF, USE_TILED, TILE_SIZE, TILE_OVERLAP)
    try:
        MODEL = YOLO(MODEL_PATH)
        MODEL_ERROR = None
        log.info("SentryX model loaded; classes=%s", getattr(MODEL, "names", {}))
    except Exception as exc:  # deployment health must report failure, not pretend readiness
        MODEL = None
        MODEL_ERROR = str(exc)
        log.exception("SentryX model failed to load")


@app.get("/health")
def health():
    return {
        "status": "ok" if MODEL is not None else "not_ready",
        "service": "sentryx-ai",
        "model_loaded": MODEL is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "model_configured": bool(MODEL_PATH),
        "error": MODEL_ERROR if MODEL is None else None,
    }


def parse_points(value, field):
    if not value:
        return []
    try:
        points = json.loads(value)
        if not isinstance(points, list):
            raise ValueError
        return [(float(p[0]), float(p[1])) for p in points]
    except (ValueError, TypeError, IndexError, json.JSONDecodeError) as exc:
        raise HTTPException(422, f"Invalid {field}") from exc


def detections_from_result(result, offset=(0, 0)):
    detections = []
    if result.boxes is None:
        return detections
    names = result.names or getattr(MODEL, "names", {})
    for box, confidence, cls in zip(result.boxes.xyxy.tolist(), result.boxes.conf.tolist(), result.boxes.cls.tolist()):
        label = str(names.get(int(cls), int(cls))).lower()
        x1, y1, x2, y2 = box
        detections.append({"class_name": label, "confidence": round(float(confidence), 5), "bbox": [x1 + offset[0], y1 + offset[1], x2 + offset[0], y2 + offset[1]]})
    return detections


def run_detection(frame):
    if not USE_TILED:
        result = MODEL.predict(frame, imgsz=INFERENCE_SIZE, conf=DETECTION_CONF, device=DEVICE, verbose=False)[0]
        return detections_from_result(result)
    height, width = frame.shape[:2]
    stride = max(1, int(TILE_SIZE * (1 - TILE_OVERLAP)))
    detections = []
    for y in range(0, max(1, height - TILE_SIZE + 1), stride):
        for x in range(0, max(1, width - TILE_SIZE + 1), stride):
            x2, y2 = min(width, x + TILE_SIZE), min(height, y + TILE_SIZE)
            tile = frame[y:y2, x:x2]
            result = MODEL.predict(tile, imgsz=INFERENCE_SIZE, conf=DETECTION_CONF, device=DEVICE, verbose=False)[0]
            detections.extend(detections_from_result(result, (x, y)))
    # Ultralytics NMS runs within each tile; suppress duplicate boxes again
    # after remapping them into the original-frame coordinate system.
    merged = []
    for label in sorted({item['class_name'] for item in detections}):
        candidates = [item for item in detections if item['class_name'] == label]
        boxes = [[d['bbox'][0], d['bbox'][1], d['bbox'][2] - d['bbox'][0], d['bbox'][3] - d['bbox'][1]] for d in candidates]
        indices = cv2.dnn.NMSBoxes(boxes, [d['confidence'] for d in candidates], DETECTION_CONF, 0.45)
        for index in indices:
            merged.append(candidates[int(index)])
    return merged


@app.post("/api/v1/analytics/full")
async def analytics_full(
    video_file: UploadFile = File(...),
    max_duration: int = Form(60),
    fence_polygon: str | None = Form(None),
    tripwire_line: str | None = Form(None),
    video_mode: str = Form("rgb"),
    enabled_classes: str | None = Form(None),
):
    if MODEL is None:
        raise HTTPException(503, "AI model is not ready")
    payload = await video_file.read()
    if not payload:
        raise HTTPException(400, "Empty video upload")
    polygon = parse_points(fence_polygon, "fence_polygon")
    tripwire = parse_points(tripwire_line, "tripwire_line")
    allowed = set(json.loads(enabled_classes)) if enabled_classes else None
    temp_path = None
    output_path = None
    previous_centers = {}
    alerts = []
    breaches = 0
    try:
        with tempfile.NamedTemporaryFile(suffix=Path(video_file.filename or ".mp4").suffix, delete=False) as temp:
            temp.write(payload)
            temp_path = temp.name
        capture = cv2.VideoCapture(temp_path)
        if not capture.isOpened():
            raise HTTPException(400, "Uploaded file is not a readable video")
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
        output_path = tempfile.mktemp(suffix=".mp4")
        writer = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
        frame_index = 0
        started = time.perf_counter()
        while frame_index < max_duration * fps:
            ok, frame = capture.read()
            if not ok:
                break
            detections = run_detection(frame)
            if allowed:
                detections = [d for d in detections if d["class_name"] in allowed]
            for detection in detections:
                x1, y1, x2, y2 = detection["bbox"]
                label = detection["class_name"]
                color = (40, 220, 80) if label == "person" else (0, 210, 220)
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                cv2.putText(frame, f"{label.upper()} {detection['confidence']:.2f}", (int(x1), max(15, int(y1) - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
                center = centroid(detection["bbox"])
                track_key = f"{label}:{int(x1)}:{int(y1)}"
                features = movement_features(previous_centers.get(track_key), center, fps)
                previous_centers[track_key] = center
                if label == "person" and polygon and point_in_polygon(center, polygon):
                    breaches += 1
                    alerts.append({"type": "perimeter_event", "message": "Person present in restricted zone; review movement context.", "class_name": label, "frame": frame_index, "signals": ["Restricted-zone presence"], "movement": features})
            writer.write(frame)
            frame_index += 1
        capture.release()
        writer.release()
        elapsed = time.perf_counter() - started
        log.info("Processed frames=%s detections=%s fps=%.2f", frame_index, sum(1 for _ in alerts), frame_index / elapsed if elapsed else 0)
        with open(output_path, "rb") as output:
            video = output.read()
        return Response(content=video, media_type="video/mp4", headers={"X-SentryX-Breach-Count": str(breaches), "X-SentryX-Alerts-JSON": json.dumps(alerts)})
    finally:
        for path in (temp_path, output_path):
            if path:
                try: os.unlink(path)
                except OSError: pass
