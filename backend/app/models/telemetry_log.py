from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.db.database import Base
from app.core.utils import get_utc_now

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    drone_id = Column(Integer, ForeignKey("drones.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude_m = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=0.0)
    battery_pct = Column(Float, default=100.0)
    status = Column(String(20), default="AVAILABLE")
    timestamp = Column(DateTime, default=get_utc_now, index=True)
