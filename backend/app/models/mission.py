from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.utils import get_utc_now

class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    mission_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. MSN-2026-001
    name = Column(String(150), nullable=False)
    drone_id = Column(Integer, ForeignKey("drones.id", ondelete="SET NULL"), nullable=True)
    origin_depot_id = Column(Integer, ForeignKey("depots.id", ondelete="RESTRICT"), nullable=False)
    destination_depot_id = Column(Integer, ForeignKey("depots.id", ondelete="RESTRICT"), nullable=False)
    
    # Status: PENDING, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
    status = Column(String(20), default="PENDING", index=True)
    
    # Flight metrics
    distance_km = Column(Float, default=0.0)
    estimated_duration_min = Column(Float, default=0.0)
    battery_required_pct = Column(Float, default=0.0)
    current_progress_pct = Column(Float, default=0.0)
    current_waypoint_index = Column(Integer, default=0)
    
    # Predictive Risk & Safety
    risk_score = Column(Float, default=0.0) # 0 - 100
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    risk_factors_json = Column(Text, default="[]") # JSON string of detected risk factors
    route_geometry_geojson = Column(Text, default="[]") # JSON array of coordinates [[lat, lng], ...]

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    drone = relationship("Drone", foreign_keys=[drone_id])
    origin_depot = relationship("Depot", foreign_keys=[origin_depot_id])
    destination_depot = relationship("Depot", foreign_keys=[destination_depot_id])
