# SentryX Backend

Backend service for the SentryX border surveillance system. Handles video
ingestion, detection storage, alerts, and analytics, and connects to the
AI detection model.

## Stack

- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM
- **SQLite** (local dev) — swappable for a cloud DB via `config.py`

## Project structure

| File | Purpose |
|---|---|
| `main.py` | API endpoints |
| `models.py` | Database schema (VideoSession, Detection, Alert, Drone) |
| `database.py` | DB connection setup |
| `detection.py` | Detection logic — currently returns simulated detections; swap in the real model call here once available |
| `config.py` | AI model endpoint configuration |

## Setup

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs available at `http://127.0.0.1:8000/docs`.

## Main endpoint

`POST /api/analyze` — accepts a video file and zone coordinates
(`multipart/form-data`), returns detections, breach count, alerts, and an
incident report.

## Connecting the real detection model

1. Set `AI_MODEL_URL` in `config.py`
2. Implement `_call_real_model()` in `detection.py`

No other changes required — the rest of the backend is model-agnostic.
