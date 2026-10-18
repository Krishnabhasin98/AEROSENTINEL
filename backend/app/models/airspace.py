from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from app.db.database import Base
from app.core.utils import get_utc_now

class AirspaceObservation(Base):
    __tablename__ = "airspace_observations"

    id = Column(Integer, primary_key=True, index=True)
    # Category: OBSTACLE, BIRD_HOTSPOT, RESTRICTED_ZONE, WEATHER_ALERT
    category = Column(String(50), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_m = Column(Float, default=200.0)
    altitude_min_m = Column(Float, default=0.0)
    altitude_max_m = Column(Float, default=300.0)
    
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    confidence_pct = Column(Float, default=85.0)
    verified = Column(Boolean, default=False)
    is_hard_constraint = Column(Boolean, default=False) # E.g. IGI Airport No-Fly zone
    
    details = Column(Text, nullable=True)
    reported_by_swarm_id = Column(Integer, ForeignKey("swarms.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
