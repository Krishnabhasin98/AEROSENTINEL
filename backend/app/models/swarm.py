from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.utils import get_utc_now

class SwarmTeam(Base):
    __tablename__ = "swarms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False) # AIRSWARM ALPHA, AIRSWARM BRAVO
    code = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(20), default="IDLE") # IDLE, ACTIVE, SURVEYING, RETURNING
    survey_area = Column(String(100), default="Delhi Central Air Corridor")
    mission_objective = Column(String(255), default="Perimeter reconnaissance and obstacle scanning")
    coverage_progress_pct = Column(Float, default=0.0)
    detected_obstacles_count = Column(Integer, default=0)
    bird_observations_count = Column(Integer, default=0)
    last_report_at = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    drones = relationship("Drone", back_populates="assigned_swarm")
