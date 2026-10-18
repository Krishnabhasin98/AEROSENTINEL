from sqlalchemy.orm import Session
from app.models.depot import Depot
from app.models.station import DockingStation
from app.models.drone import Drone
from app.models.system_event import SystemEvent
from app.core.utils import get_utc_now

def assign_drone_to_station(db: Session, drone_id: int, station_id: int) -> DockingStation:
    """
    Safely assigns a drone to a docking station, preventing duplicate occupancy.
    """
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    station = db.query(DockingStation).filter(DockingStation.id == station_id).first()

    if not drone:
        raise ValueError("Drone not found")
    if not station:
        raise ValueError("Docking station not found")

    if station.status == "MAINTENANCE":
        raise ValueError(f"Station {station.station_code} is currently under maintenance")

    if station.status in ("OCCUPIED", "CHARGING") and station.current_drone_id != drone.id:
        raise ValueError(f"Station {station.station_code} is already occupied by another drone")

    if drone.status == "IN_FLIGHT":
        raise ValueError(f"Drone {drone.drone_code} is currently in flight and cannot be directly docked without completing flight")

    # If the drone was already occupying another station, free that station first
    if drone.current_station_id and drone.current_station_id != station.id:
        prev_station = db.query(DockingStation).filter(DockingStation.id == drone.current_station_id).first()
        if prev_station:
            prev_station.current_drone_id = None
            prev_station.status = "AVAILABLE"

    station.current_drone_id = drone.id
    station.status = "OCCUPIED"
    station.updated_at = get_utc_now()

    drone.current_station_id = station.id
    drone.current_depot_id = station.depot_id
    if drone.status != "MAINTENANCE":
        drone.status = "AVAILABLE"
    
    # Snap drone coordinates to the depot coordinates
    depot = db.query(Depot).filter(Depot.id == station.depot_id).first()
    if depot:
        drone.latitude = depot.latitude
        drone.longitude = depot.longitude
        drone.altitude_m = 0.0
        drone.speed_kmh = 0.0

    # Log system event
    event = SystemEvent(
        event_type="DOCKING",
        severity="INFO",
        title=f"Drone {drone.drone_code} Docked",
        message=f"Drone successfully docked at {station.station_code} (Depot: {depot.name if depot else 'Unknown'}).",
        entity_id=drone.drone_code
    )
    db.add(event)
    db.commit()
    db.refresh(station)
    return station

def start_charging_session(db: Session, drone_id: int) -> Drone:
    """
    Initiates battery charging for a docked drone.
    """
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    if not drone:
        raise ValueError("Drone not found")

    if not drone.current_station_id:
        raise ValueError(f"Drone {drone.drone_code} must be docked at a station to initiate charging")

    station = db.query(DockingStation).filter(DockingStation.id == drone.current_station_id).first()
    if not station:
        raise ValueError("Docking station record missing")

    if station.status == "MAINTENANCE":
        raise ValueError(f"Station {station.station_code} is undergoing maintenance and cannot deliver power")

    station.status = "CHARGING"
    drone.status = "CHARGING"
    drone.updated_at = get_utc_now()
    station.updated_at = get_utc_now()

    event = SystemEvent(
        event_type="CHARGING_START",
        severity="SUCCESS",
        title=f"Charging Commenced for {drone.drone_code}",
        message=f"Fast charging active at {station.station_code} ({station.power_output_kw} kW). Current SoC: {drone.battery_pct}%.",
        entity_id=drone.drone_code
    )
    db.add(event)
    db.commit()
    db.refresh(drone)
    return drone

def stop_charging_session(db: Session, drone_id: int) -> Drone:
    """
    Stops battery charging session and marks station as occupied.
    """
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    if not drone:
        raise ValueError("Drone not found")

    if drone.current_station_id:
        station = db.query(DockingStation).filter(DockingStation.id == drone.current_station_id).first()
        if station and station.status == "CHARGING":
            station.status = "OCCUPIED"
            station.updated_at = get_utc_now()

    drone.status = "AVAILABLE"
    drone.updated_at = get_utc_now()

    event = SystemEvent(
        event_type="CHARGING_COMPLETE",
        severity="INFO",
        title=f"Charging Stopped for {drone.drone_code}",
        message=f"Charging terminated at SoC: {drone.battery_pct}%. Drone available for missions.",
        entity_id=drone.drone_code
    )
    db.add(event)
    db.commit()
    db.refresh(drone)
    return drone

def release_drone_from_station(db: Session, drone_id: int) -> Drone:
    """
    Releases drone from docking station bay for takeoff / dispatch.
    """
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    if not drone:
        raise ValueError("Drone not found")

    if drone.current_station_id:
        station = db.query(DockingStation).filter(DockingStation.id == drone.current_station_id).first()
        if station:
            station.current_drone_id = None
            station.status = "AVAILABLE"
            station.updated_at = get_utc_now()
        drone.current_station_id = None

    db.commit()
    db.refresh(drone)
    return drone
