"""
This file talks to Aurindom's AI model (SentryX AI Service).

If AI_MODEL_URL is not set, it returns dummy/simulated results instead so the
rest of the system (database, alerts, frontend) can still be tested and demoed.

Aurindom's real API:
  POST {AI_MODEL_URL}/api/v1/analytics/full
  form fields: video_file (file), fence_polygon (JSON string of [[x,y],...]),
               tripwire_line (optional), max_duration (int), video_mode (str)
  response: the ANNOTATED VIDEO itself (video/mp4 bytes), with extra info in headers:
               X-SentryX-Breach-Count: number of breaches
               X-SentryX-Alerts-JSON: JSON list of alert dicts

Note: his model does not yet classify movement into walking/crouching/crawling/
group - it only reports raw speed + direction (see his movement.py). Until he
adds that classification, movement_type will show as "unknown" for real results.
"""

import json
import random
import requests

from config import AI_MODEL_URL, USE_DUMMY_DETECTION

REAL_MODEL_ENDPOINT = "/api/v1/analytics/full"


def run_detection(video_path: str, zones: list):
    """
    Always returns a dict with this shape, regardless of dummy or real model:
    {
        "detections": [ {track_id, object_type, movement_type, confidence,
                          frame_number, bbox, zone_breach}, ... ],
        "alerts": [ {message, object_type}, ... ],
        "breach_count": int,
        "annotated_video_bytes": bytes or None
    }
    """
    if USE_DUMMY_DETECTION:
        return _fake_result(zones)
    else:
        return _call_real_model(video_path, zones)


def _fake_result(zones: list):
    object_types = ["person", "person", "vehicle", "animal"]
    movement_types = ["walking", "crouching", "crawling", "group"]
    detections = []
    alerts = []
    breach_count = 0
    for i in range(random.randint(3, 8)):
        obj_type = random.choice(object_types)
        move_type = random.choice(movement_types) if obj_type == "person" else "n/a"
        x1, y1 = random.randint(50, 1500), random.randint(50, 800)
        breach = obj_type == "person" and move_type in ("crouching", "crawling") and random.random() > 0.3
        detection = {
            "track_id": i + 1,
            "object_type": obj_type,
            "movement_type": move_type,
            "confidence": round(random.uniform(0.75, 0.98), 2),
            "frame_number": random.randint(1, 500),
            "bbox": [x1, y1, x1 + random.randint(60, 150), y1 + random.randint(100, 250)],
            "zone_breach": breach,
        }
        detections.append(detection)
        if breach:
            breach_count += 1
            alerts.append({"message": f"{obj_type} entered restricted zone ({move_type})", "object_type": obj_type})
    return {
        "detections": detections,
        "alerts": alerts,
        "breach_count": breach_count,
        "annotated_video_bytes": None,
    }


def _zones_to_polygon(zones: list):
    """Converts our zone format into the [[x,y], ...] polygon Aurindom's API expects."""
    if not zones:
        return None
    # Supports zones as list of {"x":.., "y":..} or already as [x, y] pairs
    points = []
    for z in zones:
        if isinstance(z, dict):
            points.append([z.get("x", 0), z.get("y", 0)])
        elif isinstance(z, (list, tuple)) and len(z) == 2:
            points.append([z[0], z[1]])
    return points or None


def _call_real_model(video_path: str, zones: list):
    polygon = _zones_to_polygon(zones)
    url = AI_MODEL_URL.rstrip("/") + REAL_MODEL_ENDPOINT

    with open(video_path, "rb") as f:
        files = {"video_file": f}
        data = {
            "max_duration": "60",
            "video_mode": "rgb",
        }
        if polygon:
            data["fence_polygon"] = json.dumps(polygon)

        response = requests.post(url, files=files, data=data, timeout=120)

    if response.status_code != 200:
        raise RuntimeError(f"AI model returned {response.status_code}: {response.text[:300]}")

    breach_count = int(response.headers.get("X-SentryX-Breach-Count", "0"))
    alerts_raw = json.loads(response.headers.get("X-SentryX-Alerts-JSON", "[]"))

    # Aurindom's model gives alerts, not a full per-object detection list, and
    # doesn't classify movement type yet - we normalize what we can into our
    # detection shape so the rest of the backend doesn't need to change.
    detections = []
    for i, alert in enumerate(alerts_raw):
        detections.append({
            "track_id": i + 1,
            "object_type": alert.get("class_name", "person"),
            "movement_type": "unknown",  # his model doesn't classify this yet
            "confidence": 1.0,
            "frame_number": alert.get("frame", 0),
            "bbox": [0, 0, 0, 0],  # not provided at the alert level
            "zone_breach": True,
        })

    alerts = [{"message": a.get("message", "Alert"), "object_type": a.get("class_name", "person")} for a in alerts_raw]

    return {
        "detections": detections,
        "alerts": alerts,
        "breach_count": breach_count,
        "annotated_video_bytes": response.content,
    }
