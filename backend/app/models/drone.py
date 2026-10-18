from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.utils import get_utc_now

class Drone(Base):
    __tablename__ = "drones"

    id = Column(Integer, primary_key=True, index=True)
    drone_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. AERO-X1
    model = Column(String(100), nullable=False) # e.g. SkyRanger Pro, Valkyrie VTOL
    serial_number = Column(String(100), unique=True, nullable=False)
    
    # Telemetry State
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude_m = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0)
    battery_pct = Column(Float, default=100.0)
    health_pct = Column(Float, default=98.0)
    
    # Operational Status: AVAILABLE, IN_FLIGHT, CHARGING, MAINTENANCE, OFFLINE
    status = Column(String(20), default="AVAILABLE", index=True)
    
    # Specifications
    max_range_km = Column(Float, default=45.0)
    battery_capacity_kwh = Column(Float, default=1.8)
    consumption_rate_kwh_per_km = Column(Float, default=0.035)
    max_payload_kg = Column(Float, default=5.0)
    
    # Associations
    current_depot_id = Column(Integer, ForeignKey("depots.id", ondelete="SET NULL"), nullable=True)
    current_station_id = Column(Integer, nullable=True)
    assigned_mission_id = Column(Integer, nullable=True)
    assigned_swarm_id = Column(Integer, ForeignKey("swarms.id", ondelete="SET NULL"), nullable=True)
    
    last_telemetry_at = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    current_depot = relationship("Depot", back_populates="drones", foreign_keys=[current_depot_id])
    assigned_swarm = relationship("SwarmTeam", back_populates="drones", foreign_keys=[assigned_swarm_id])
