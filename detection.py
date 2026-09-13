"""
This file has ONE job: given a video, return a list of detections.

Right now it returns DUMMY (fake but realistic) detections, so the rest of the
backend + frontend can be built and demoed without waiting for the real AI model.

WHEN AURINDOM'S YOLO/KAGGLE MODEL IS READY:
Just rewrite run_detection() below to call the Kaggle tunnel URL (config.AI_MODEL_URL)
instead of generating fake data. Nothing else in the backend needs to change -
main.py, database, etc. all stay exactly the same.
"""

import random
from config import AI_MODEL_URL, USE_DUMMY_DETECTION


def run_detection(video_path: str, zones: list):
    """
    Returns a list of detection dicts, one per detected object.
    Each detection looks like:
    {
        "track_id": 1,
        "object_type": "person",
        "confidence": 0.94,
        "frame_number": 120,
        "bbox": [x1, y1, x2, y2],
        "zone_breach": True
    }
    """
    if USE_DUMMY_DETECTION:
        return _fake_detections(zones)
    else:
        return _call_real_model(video_path, zones)


def _fake_detections(zones: list):
    """Generates plausible-looking fake detections for demo purposes."""
    object_types = ["person", "person", "vehicle", "animal"]
    movement_types = ["walking", "crouching", "crawling", "group"]
    detections = []
    for i in range(random.randint(3, 8)):
        obj_type = random.choice(object_types)
        move_type = random.choice(movement_types) if obj_type == "person" else "n/a"
        x1, y1 = random.randint(50, 1500), random.randint(50, 800)
        detections.append({
            "track_id": i + 1,
            "object_type": obj_type,
            "movement_type": move_type,
            "confidence": round(random.uniform(0.75, 0.98), 2),
            "frame_number": random.randint(1, 500),
            "bbox": [x1, y1, x1 + random.randint(60, 150), y1 + random.randint(100, 250)],
            "zone_breach": obj_type == "person" and move_type in ("crouching", "crawling") and random.random() > 0.3,
        })
    return detections


def _call_real_model(video_path: str, zones: list):
    """
    TODO (once Kaggle tunnel is stable): send the video to AI_MODEL_URL and
    parse its response into the same format as _fake_detections().
    Example shape once ready:

    import requests
    with open(video_path, "rb") as f:
        response = requests.post(
            f"{AI_MODEL_URL}/detect",
            files={"video": f},
            data={"zones": str(zones)},
        )
    return response.json()["detections"]
    """
    raise NotImplementedError("Real model not connected yet - set AI_MODEL_URL in config.py")
