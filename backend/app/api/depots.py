import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.depot import Depot
from app.models.station import DockingStation
from app.models.drone import Drone
from app.core.utils import get_utc_now
from app.schemas.schemas import (
    DepotResponse, DepotCreate, DepotUpdate,
    StationResponse, StationCreate, StationUpdate,
    AssignStationRequest, ChargingActionRequest
)
from app.services.charging_service import (
    assign_drone_to_station,
    start_charging_session,
    stop_charging_session,
    release_drone_from_station
)

router = APIRouter()

@router.get("/depots", response_model=List[DepotResponse])
def get_depots(db: Session = Depends(get_db)):
    depots = db.query(Depot).all()
    results = []
    for d in depots:
        avail = sum(1 for s in d.stations if s.status == "AVAILABLE")
        occ = sum(1 for s in d.stations if s.status == "OCCUPIED")
        chg = sum(1 for s in d.stations if s.status == "CHARGING")
        
        # Serialize with counts
        depot_dict = {
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "address": d.address,
            "status": d.status,
            "total_capacity": d.total_capacity,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "stations": d.stations,
            "available_stations_count": avail,
            "occupied_stations_count": occ,
            "charging_stations_count": chg
        }
        results.append(depot_dict)
    return results

@router.post("/depots", response_model=DepotResponse, status_code=status.HTTP_201_CREATED)
def create_depot(depot_in: DepotCreate, db: Session = Depends(get_db)):
    existing = db.query(Depot).filter(Depot.code == depot_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Depot code already exists")
    
    depot = Depot(**depot_in.model_dump())
    db.add(depot)
    db.commit()
    db.refresh(depot)

    # Automatically create the docking stations for the depot
    for bay in range(1, depot.total_capacity + 1):
        station = DockingStation(
            depot_id=depot.id,
            station_code=f"{depot.code}-BAY-0{bay}",
            bay_number=bay,
            status="AVAILABLE",
            power_output_kw=3.3 if bay <= 2 else 7.4
        )
        db.add(station)
    db.commit()
    db.refresh(depot)
    return depot

@router.put("/depots/{depot_id}", response_model=DepotResponse)
def update_depot(depot_id: int, depot_in: DepotUpdate, db: Session = Depends(get_db)):
    depot = db.query(Depot).filter(Depot.id == depot_id).first()
    if not depot:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    for field, value in depot_in.model_dump(exclude_unset=True).items():
        setattr(depot, field, value)
    depot.updated_at = get_utc_now()
    db.commit()
    db.refresh(depot)
    return depot

@router.get("/stations", response_model=List[StationResponse])
def get_stations(depot_id: int = None, db: Session = Depends(get_db)):
    query = db.query(DockingStation)
    if depot_id:
        query = query.filter(DockingStation.depot_id == depot_id)
    return query.all()

@router.post("/stations", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
def create_station(station_in: StationCreate, db: Session = Depends(get_db)):
    depot = db.query(Depot).filter(Depot.id == station_in.depot_id).first()
    if not depot:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    existing = db.query(DockingStation).filter(DockingStation.station_code == station_in.station_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Station code already exists")

    station = DockingStation(**station_in.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station

@router.put("/stations/{station_id}", response_model=StationResponse)
def update_station(station_id: int, station_in: StationUpdate, db: Session = Depends(get_db)):
    station = db.query(DockingStation).filter(DockingStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    for field, value in station_in.model_dump(exclude_unset=True).items():
        setattr(station, field, value)
    station.updated_at = get_utc_now()
    db.commit()
    db.refresh(station)
    return station

@router.post("/stations/assign", response_model=StationResponse)
def assign_drone(req: AssignStationRequest, db: Session = Depends(get_db)):
    try:
        station = assign_drone_to_station(db, req.drone_id, req.station_id)
        return station
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stations/release")
def release_drone(req: ChargingActionRequest, db: Session = Depends(get_db)):
    try:
        drone = release_drone_from_station(db, req.drone_id)
        return {"status": "SUCCESS", "message": f"Drone {drone.drone_code} released from docking bay"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stations/charging/start")
def start_charging(req: ChargingActionRequest, db: Session = Depends(get_db)):
    try:
        drone = start_charging_session(db, req.drone_id)
        return {"status": "SUCCESS", "message": f"Charging commenced for {drone.drone_code}", "battery_pct": drone.battery_pct}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stations/charging/stop")
def stop_charging(req: ChargingActionRequest, db: Session = Depends(get_db)):
    try:
        drone = stop_charging_session(db, req.drone_id)
        return {"status": "SUCCESS", "message": f"Charging stopped for {drone.drone_code}", "battery_pct": drone.battery_pct}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
