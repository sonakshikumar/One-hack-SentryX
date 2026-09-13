import json
import os
import shutil
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models
from detection import run_detection

# Create all database tables (if they don't exist yet)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SentryX Backend")

# Allow the frontend (running on a different address, e.g. localhost:3000 or Vercel)
# to talk to this backend. For a hackathon, allowing everything is simplest.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "SentryX backend running"}


# ---------- MAIN ANALYSIS ENDPOINT (this is what the frontend's IBVAP API calls) ----------

@app.post("/api/analyze")
async def analyze_video(
    video: UploadFile = File(...),
    zones: str = Form("[]"),  # zone/tripwire coordinates as a JSON string, sent by frontend
    db: Session = Depends(get_db),
):
    # 1. Save the uploaded video
    video_path = os.path.join(UPLOAD_DIR, video.filename)
    with open(video_path, "wb") as f:
        shutil.copyfileobj(video.file, f)

    zones_parsed = json.loads(zones) if zones else []

    # 2. Create a session record in the DB
    session = models.VideoSession(
        filename=video.filename,
        zones_json=zones,
        status="processing",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 3. Run detection (dummy for now, or Aurindom's real model if AI_MODEL_URL is set - see detection.py)
    result = run_detection(video_path, zones_parsed)
    detections = result["detections"]
    breach_count = result["breach_count"]

    for d in detections:
        det_row = models.Detection(
            session_id=session.id,
            track_id=d["track_id"],
            object_type=d["object_type"],
            movement_type=d.get("movement_type", "unknown"),
            confidence=d["confidence"],
            frame_number=d["frame_number"],
            bbox_x1=d["bbox"][0],
            bbox_y1=d["bbox"][1],
            bbox_x2=d["bbox"][2],
            bbox_y2=d["bbox"][3],
            zone_breach=d["zone_breach"],
        )
        db.add(det_row)

    for a in result["alerts"]:
        alert = models.Alert(
            session_id=session.id,
            alert_type="critical" if a.get("object_type") == "person" else "warning",
            message=a["message"],
            object_type=a.get("object_type"),
        )
        db.add(alert)

    # If the real model returned an annotated video, save it so it can be served back
    if result.get("annotated_video_bytes"):
        annotated_path = os.path.join(UPLOAD_DIR, f"annotated_{session.id}.mp4")
        with open(annotated_path, "wb") as f:
            f.write(result["annotated_video_bytes"])
        session.annotated_video_path = annotated_path

    session.status = "completed"
    session.total_frames = max([d["frame_number"] for d in detections], default=0)
    db.commit()

    # 4. Build the response in the shape the frontend expects
    incident_report = {
        "session_id": session.id,
        "filename": video.filename,
        "generated_at": datetime.utcnow().isoformat(),
        "total_detections": len(detections),
        "breach_count": breach_count,
        "detections": detections,
    }

    return {
        "session_id": session.id,
        "breach_count": breach_count,
        "detections": detections,
        "alerts": [{"type": "critical" if a.get("object_type") == "person" else "warning", "message": a["message"]} for a in result["alerts"]],
        "incident_report": incident_report,
        "annotated_video_available": bool(result.get("annotated_video_bytes")),
    }


# ---------- SESSIONS ----------

@app.get("/api/sessions/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.VideoSession).filter(models.VideoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session.id,
        "filename": session.filename,
        "status": session.status,
        "total_frames": session.total_frames,
        "created_at": session.created_at,
    }


@app.get("/api/sessions/{session_id}/report")
def get_incident_report(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.VideoSession).filter(models.VideoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    detections = db.query(models.Detection).filter(models.Detection.session_id == session_id).all()
    breach_count = sum(1 for d in detections if d.zone_breach)

    return {
        "session_id": session.id,
        "filename": session.filename,
        "generated_at": datetime.utcnow().isoformat(),
        "total_detections": len(detections),
        "breach_count": breach_count,
        "detections": [
            {
                "track_id": d.track_id,
                "object_type": d.object_type,
                "confidence": d.confidence,
                "frame_number": d.frame_number,
                "bbox": [d.bbox_x1, d.bbox_y1, d.bbox_x2, d.bbox_y2],
                "zone_breach": d.zone_breach,
            }
            for d in detections
        ],
    }


@app.get("/api/sessions/{session_id}/video")
def get_annotated_video(session_id: int, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse
    session = db.query(models.VideoSession).filter(models.VideoSession.id == session_id).first()
    if not session or not session.annotated_video_path:
        raise HTTPException(status_code=404, detail="Annotated video not available for this session")
    return FileResponse(session.annotated_video_path, media_type="video/mp4")


# ---------- ALERTS ----------

@app.get("/api/alerts")
def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()
    return alerts


@app.patch("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    db.commit()
    return {"message": "Alert acknowledged", "alert_id": alert_id}


# ---------- DRONES (simulated fleet) ----------

@app.get("/api/drones")
def list_drones(db: Session = Depends(get_db)):
    drones = db.query(models.Drone).all()
    if not drones:
        # seed a couple of fake drones on first request, so the Drone Fleet page has something to show
        for name in ["DRONE-01", "DRONE-02"]:
            db.add(models.Drone(name=name, status="online", battery=87, altitude=120, camera_mode="thermal"))
        db.commit()
        drones = db.query(models.Drone).all()
    return drones


# ---------- ANALYTICS ----------

@app.get("/api/analytics/summary")
def analytics_summary(db: Session = Depends(get_db)):
    total_detections = db.query(models.Detection).count()
    total_alerts = db.query(models.Alert).count()
    humans = db.query(models.Detection).filter(models.Detection.object_type == "person").count()
    return {
        "total_detections": total_detections,
        "total_alerts": total_alerts,
        "humans_detected": humans,
    }
