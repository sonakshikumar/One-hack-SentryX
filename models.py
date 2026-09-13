from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class VideoSession(Base):
    """One row = one uploaded video that was analyzed."""
    __tablename__ = "video_sessions"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    zones_json = Column(Text, nullable=True)  # the zone/tripwire coordinates frontend sends, stored as JSON text
    status = Column(String, default="processing")  # processing, completed, failed
    total_frames = Column(Integer, default=0)
    annotated_video_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    detections = relationship("Detection", back_populates="session")
    alerts = relationship("Alert", back_populates="session")


class Detection(Base):
    """One row = one object detected in one frame (person, vehicle, animal, etc.)"""
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("video_sessions.id"))
    track_id = Column(Integer, nullable=True)  # persistent ID across frames for the same object
    object_type = Column(String)  # "person", "vehicle", "animal", etc.
    movement_type = Column(String, default="walking")  # "walking", "crouching", "crawling", "group"
    confidence = Column(Float)
    frame_number = Column(Integer)
    bbox_x1 = Column(Float)
    bbox_y1 = Column(Float)
    bbox_x2 = Column(Float)
    bbox_y2 = Column(Float)
    zone_breach = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("VideoSession", back_populates="detections")


class Alert(Base):
    """One row = one alert generated (e.g. zone breach, suspicious behavior)."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("video_sessions.id"))
    alert_type = Column(String)  # "critical", "warning", "informational"
    message = Column(String)
    object_type = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("VideoSession", back_populates="alerts")


class Drone(Base):
    """Simulated drone/camera fleet info (for the Drone Fleet page)."""
    __tablename__ = "drones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    status = Column(String, default="online")  # online, offline
    battery = Column(Integer, default=100)
    altitude = Column(Float, default=0)
    camera_mode = Column(String, default="rgb")  # rgb, thermal, low-light
