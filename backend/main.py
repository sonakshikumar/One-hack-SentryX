"""SentryX FastAPI computer-vision service.

The model is loaded once at startup. Runtime model weights and videos are not
stored in this repository; configure SENTRYX_MODEL_PATH in the deployment.
"""

import json
import logging
import os
import shutil
import subprocess
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
INFERENCE_SIZE = int(os.getenv("SENTRYX_INFERENCE_SIZE", "1536"))
DETECTION_CONF = float(os.getenv("SENTRYX_DETECTION_CONF", "0.10"))
TILE_SIZE = int(os.getenv("SENTRYX_TILE_SIZE", "960"))
TILE_OVERLAP = float(os.getenv("SENTRYX_TILE_OVERLAP", "0.30"))
USE_TILED = os.getenv("SENTRYX_USE_TILED_INFERENCE", "true").lower() in {"1", "true", "yes", "on"}
TILE_UPSCALE = float(os.getenv("SENTRYX_TILE_UPSCALE", "2.0"))
DEBUG_DETECTION = os.getenv("SENTRYX_DEBUG_DETECTION", "false").lower() in {"1", "true", "yes", "on"}
DEBUG_DIR = os.getenv("SENTRYX_DEBUG_DIR", "/kaggle/working/sentryx_debug")
LOG_EVERY_N_FRAMES = max(1, int(os.getenv("SENTRYX_LOG_EVERY_N_FRAMES", "30")))
RAW_CONFIDENCE_FLOOR = min(0.05, DETECTION_CONF)
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


def detections_from_result(result, offset=(0, 0), scale=(1.0, 1.0)):
    detections = []
    if result.boxes is None:
        return detections
    names = result.names or getattr(MODEL, "names", {})
    for box, confidence, cls in zip(result.boxes.xyxy.tolist(), result.boxes.conf.tolist(), result.boxes.cls.tolist()):
        label = str(names.get(int(cls), int(cls))).lower()
        x1, y1, x2, y2 = box
        detections.append({"class_name": label, "confidence": round(float(confidence), 5), "bbox": [x1 / scale[0] + offset[0], y1 / scale[1] + offset[1], x2 / scale[0] + offset[0], y2 / scale[1] + offset[1]]})
    return detections


def filter_detections(detections):
    return [detection for detection in detections if detection["confidence"] >= DETECTION_CONF]


def run_detection(frame):
    height, width = frame.shape[:2]
    use_small_object_profile = width >= 2560
    tile_size = 640 if use_small_object_profile else TILE_SIZE
    tile_overlap = 0.50 if use_small_object_profile else TILE_OVERLAP
    tile_upscale = TILE_UPSCALE if use_small_object_profile else 1.0
    if not USE_TILED:
        result = MODEL.predict(frame, imgsz=INFERENCE_SIZE, conf=RAW_CONFIDENCE_FLOOR, device=DEVICE, verbose=False)[0]
        raw = detections_from_result(result)
        return raw, filter_detections(raw), len(raw), 1
    stride = max(1, int(tile_size * (1 - tile_overlap)))
    detections = []
    tile_count = 0
    for y in range(0, max(1, height - tile_size + 1), stride):
        for x in range(0, max(1, width - tile_size + 1), stride):
            x2, y2 = min(width, x + tile_size), min(height, y + tile_size)
            tile = frame[y:y2, x:x2]
            if tile_upscale != 1.0:
                tile = cv2.resize(tile, (int(tile.shape[1] * tile_upscale), int(tile.shape[0] * tile_upscale)), interpolation=cv2.INTER_LINEAR)
            result = MODEL.predict(tile, imgsz=INFERENCE_SIZE, conf=RAW_CONFIDENCE_FLOOR, device=DEVICE, verbose=False)[0]
            detections.extend(detections_from_result(result, (x, y), (tile_upscale, tile_upscale)))
            tile_count += 1
    # Ultralytics NMS runs within each tile; suppress duplicate boxes again
    # after remapping them into the original-frame coordinate system.
    candidates_after_confidence = filter_detections(detections)
    merged = []
    for label in sorted({item['class_name'] for item in candidates_after_confidence}):
        candidates = [item for item in candidates_after_confidence if item['class_name'] == label]
        boxes = [[d['bbox'][0], d['bbox'][1], d['bbox'][2] - d['bbox'][0], d['bbox'][3] - d['bbox'][1]] for d in candidates]
        indices = cv2.dnn.NMSBoxes(boxes, [d['confidence'] for d in candidates], DETECTION_CONF, 0.45)
        for index in indices:
            merged.append(candidates[int(index)])
    return detections, merged, len(candidates_after_confidence), tile_count


def confidence_buckets(detections):
    buckets = {"0.05-0.10": 0, "0.10-0.20": 0, "0.20-0.30": 0, "0.30-0.50": 0, "0.50+": 0}
    for detection in detections:
        confidence = detection["confidence"]
        if confidence < 0.10:
            buckets["0.05-0.10"] += 1
        elif confidence < 0.20:
            buckets["0.10-0.20"] += 1
        elif confidence < 0.30:
            buckets["0.20-0.30"] += 1
        elif confidence < 0.50:
            buckets["0.30-0.50"] += 1
        else:
            buckets["0.50+"] += 1
    return buckets


def encode_browser_video(source_path, output_path, fps, width, height):
    """Transcode the OpenCV intermediate into browser-friendly H.264 MP4."""
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("FFmpeg and ffprobe are required to encode and validate browser-compatible H.264 output")
    encoder_probe = subprocess.run([ffmpeg, "-hide_banner", "-encoders"], capture_output=True, text=True, check=False)
    if " libx264 " not in encoder_probe.stdout:
        raise RuntimeError("FFmpeg does not provide the required libx264 encoder")
    log.info("[VIDEO] Intermediate output: %s", source_path)
    log.info("[VIDEO] Transcoding to H.264...")
    command = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", source_path, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output_path]
    subprocess.run(command, check=True)
    if not os.path.exists(output_path) or os.path.getsize(output_path) <= 0:
        raise RuntimeError("FFmpeg produced an empty output video")
    probe = subprocess.run([ffprobe, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,codec_type,pix_fmt,width,height,duration", "-of", "json", output_path], capture_output=True, text=True, check=True)
    streams = json.loads(probe.stdout).get("streams", [])
    stream = streams[0] if streams else {}
    codec = stream.get("codec_name")
    codec_type = stream.get("codec_type")
    pixel_format = stream.get("pix_fmt")
    duration = float(stream.get("duration") or 0)
    final_width = int(stream.get("width") or 0)
    final_height = int(stream.get("height") or 0)
    if codec != "h264" or codec_type != "video" or pixel_format != "yuv420p" or duration <= 0 or final_width <= 0 or final_height <= 0:
        raise RuntimeError(f"Invalid encoded video: codec={codec} type={codec_type} pixel_format={pixel_format} duration={duration} dimensions={final_width}x{final_height}")
    log.info("[VIDEO] FFmpeg completed")
    log.info("[VIDEO] Final codec: %s", codec)
    log.info("[VIDEO] Final duration: %.3f", duration)
    log.info("[VIDEO] Final size: %s", os.path.getsize(output_path))


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
    intermediate_path = None
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
        intermediate_path = tempfile.mktemp(suffix=".avi")
        output_path = tempfile.mktemp(suffix=".mp4")
        writer = cv2.VideoWriter(intermediate_path, cv2.VideoWriter_fourcc(*"MJPG"), fps, (width, height))
        if not writer.isOpened():
            raise HTTPException(500, "Could not initialize video encoder")
        frame_index = 0
        started = time.perf_counter()
        while frame_index < max_duration * fps:
            ok, frame = capture.read()
            if not ok:
                break
            raw_detections, detections, before_nms, tile_count = run_detection(frame)
            if allowed:
                detections = [d for d in detections if d["class_name"] in allowed]
            if frame_index % LOG_EVERY_N_FRAMES == 0:
                persons = [d for d in detections if d["class_name"] == "person"]
                confidences = [d["confidence"] for d in raw_detections]
                log.info("[DETECTION DEBUG] frame=%s source_resolution=%sx%s tiles=%s raw_tile_detections=%s after_global_nms=%s person_detections=%s confidence_min=%s confidence_max=%s buckets=%s", frame_index, width, height, tile_count, len(raw_detections), len(detections), len(persons), min(confidences, default=0), max(confidences, default=0), confidence_buckets(raw_detections))
                if DEBUG_DETECTION and frame_index // LOG_EVERY_N_FRAMES < 5:
                    os.makedirs(DEBUG_DIR, exist_ok=True)
                    debug_frame = frame.copy()
                    for detection in detections:
                        x1, y1, x2, y2 = map(int, detection["bbox"])
                        cv2.rectangle(debug_frame, (x1, y1), (x2, y2), (40, 220, 80), 2)
                        cv2.putText(debug_frame, f"{detection['class_name']} {detection['confidence']:.2f}", (x1, max(15, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (40, 220, 80), 2)
                    cv2.imwrite(os.path.join(DEBUG_DIR, f"frame_{frame_index:06d}.jpg"), debug_frame)
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
        try:
            encode_browser_video(intermediate_path, output_path, fps, width, height)
        except (OSError, RuntimeError, subprocess.CalledProcessError, json.JSONDecodeError) as exc:
            log.exception("[VIDEO] Browser-compatible encoding failed")
            raise HTTPException(500, f"Could not produce a validated H.264 MP4: {exc}") from exc
        elapsed = time.perf_counter() - started
        log.info("Processed frames=%s detections=%s fps=%.2f", frame_index, sum(1 for _ in alerts), frame_index / elapsed if elapsed else 0)
        with open(output_path, "rb") as output:
            video = output.read()
        return Response(content=video, media_type="video/mp4", headers={"X-SentryX-Breach-Count": str(breaches), "X-SentryX-Alerts-JSON": json.dumps(alerts)})
    finally:
        for path in (temp_path, intermediate_path, output_path):
            if path:
                try: os.unlink(path)
                except OSError: pass
