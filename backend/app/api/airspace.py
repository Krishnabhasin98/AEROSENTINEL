from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.airspace import AirspaceObservation
from app.models.depot import Depot
from app.schemas.schemas import AirspaceObservationResponse, AirspaceObservationCreate
from app.services.route_service import generate_flight_corridor_waypoints
from app.core.utils import get_utc_now

router = APIRouter()

@router.get("/airspace/observations", response_model=List[AirspaceObservationResponse])
def get_observations(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AirspaceObservation)
    if category:
        query = query.filter(AirspaceObservation.category == category.upper())
    return query.all()

@router.post("/airspace/observations", response_model=AirspaceObservationResponse, status_code=status.HTTP_201_CREATED)
def create_observation(obs_in: AirspaceObservationCreate, db: Session = Depends(get_db)):
    obs = AirspaceObservation(**obs_in.model_dump())
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs

@router.put("/airspace/observations/{obs_id}/verify", response_model=AirspaceObservationResponse)
def toggle_verify_observation(obs_id: int, db: Session = Depends(get_db)):
    obs = db.query(AirspaceObservation).filter(AirspaceObservation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Airspace observation not found")

    obs.verified = not obs.verified
    obs.updated_at = get_utc_now()
    db.commit()
    db.refresh(obs)
    return obs

@router.get("/airspace/corridors")
def get_candidate_flight_corridors(db: Session = Depends(get_db)):
    """
    Returns candidate airway corridors connecting Delhi operational hubs.
    """
    depots = db.query(Depot).all()
    corridors = []
    
    for i in range(len(depots)):
        for j in range(i + 1, len(depots)):
            d1 = depots[i]
            d2 = depots[j]
            wps = generate_flight_corridor_waypoints(d1.latitude, d1.longitude, d2.latitude, d2.longitude, 12)
            corridors.append({
                "corridor_id": f"CORR-{d1.code}-{d2.code}",
                "name": f"{d1.name} ↔ {d2.name} Primary Airway",
                "origin_code": d1.code,
                "dest_code": d2.code,
                "waypoints": wps,
                "altitude_block_m": "100m - 150m AGL"
            })
            
    return corridors
