# SentryX AI backend

FastAPI service for the existing SentryX frontend. It loads the model once at startup, processes uploaded video frame-by-frame, and returns an annotated MP4 from `POST /api/v1/analytics/full`.

FFmpeg with an H.264 encoder (`libx264` or `h264_nvenc`) must be available in the Kaggle runtime. The service writes an intermediate OpenCV video, transcodes it to H.264/yuv420p, validates the result, and returns HTTP 500 instead of returning an unplayable file when encoding fails.

## Kaggle

Configure the runtime without committing weights or secrets:

```bash
export SENTRYX_MODEL_PATH=/kaggle/working/sentryx_training/visdrone_person_v1/weights/best.pt
export SENTRYX_INFERENCE_SIZE=1280
export SENTRYX_DETECTION_CONF=0.20
export SENTRYX_TILE_SIZE=640
export SENTRYX_TILE_OVERLAP=0.25
export SENTRYX_USE_TILED_INFERENCE=true
export SENTRYX_CORS_ORIGINS=https://sentry-x-nine.vercel.app,http://localhost:3000
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

`GET /health` reports whether the configured model loaded and whether CUDA is available. The repository does not include runtime weights, videos, or Kaggle credentials.

Set `SENTRYX_CORS_ORIGINS` to the exact deployed frontend origins that should call the service. The backend intentionally does not enable wildcard origins.
