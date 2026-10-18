from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.database import Base
from app.core.utils import get_utc_now

class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False) # MISSION_START, DOCKING, CHARGING_START, OBSTACLE_DETECTED, ALERT
    severity = Column(String(20), default="INFO") # INFO, SUCCESS, WARNING, CRITICAL
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    entity_id = Column(String(50), nullable=True) # e.g. Drone code or Mission code
    created_at = Column(DateTime, default=get_utc_now)
