from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.utils import get_utc_now

class Depot(Base):
    __tablename__ = "depots"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
    status = Column(String(20), default="OPERATIONAL") # OPERATIONAL, MAINTENANCE, OFFLINE
    total_capacity = Column(Integer, default=4)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    stations = relationship("DockingStation", back_populates="depot", cascade="all, delete-orphan")
    drones = relationship("Drone", back_populates="current_depot")
