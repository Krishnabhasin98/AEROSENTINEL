from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.drone import Drone
from app.schemas.schemas import DroneResponse, DroneCreate, DroneUpdate
from app.core.utils import get_utc_now

router = APIRouter()

@router.get("/drones", response_model=List[DroneResponse])
def get_drones(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Drone)
    if status_filter:
        query = query.filter(Drone.status == status_filter.upper())
    return query.all()

@router.get("/drones/{drone_id}", response_model=DroneResponse)
def get_drone(drone_id: int, db: Session = Depends(get_db)):
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
    return drone

@router.post("/drones", response_model=DroneResponse, status_code=status.HTTP_201_CREATED)
def create_drone(drone_in: DroneCreate, db: Session = Depends(get_db)):
    existing = db.query(Drone).filter(Drone.drone_code == drone_in.drone_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Drone code already registered")

    drone = Drone(**drone_in.model_dump())
    db.add(drone)
    db.commit()
    db.refresh(drone)
    return drone

@router.put("/drones/{drone_id}", response_model=DroneResponse)
def update_drone(drone_id: int, drone_in: DroneUpdate, db: Session = Depends(get_db)):
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")

    for field, value in drone_in.model_dump(exclude_unset=True).items():
        setattr(drone, field, value)
    drone.updated_at = get_utc_now()
    db.commit()
    db.refresh(drone)
    return drone
