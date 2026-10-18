from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.utils import get_utc_now

class DockingStation(Base):
    __tablename__ = "docking_stations"

    id = Column(Integer, primary_key=True, index=True)
    depot_id = Column(Integer, ForeignKey("depots.id", ondelete="CASCADE"), nullable=False)
    station_code = Column(String(50), unique=True, index=True, nullable=False)
    bay_number = Column(Integer, nullable=False)
    status = Column(String(20), default="AVAILABLE") # AVAILABLE, OCCUPIED, CHARGING, MAINTENANCE
    power_output_kw = Column(Float, default=3.3)
    current_drone_id = Column(Integer, nullable=True)
    last_service_date = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    depot = relationship("Depot", back_populates="stations")
