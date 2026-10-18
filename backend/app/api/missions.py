import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.mission import Mission
from app.models.drone import Drone
from app.models.depot import Depot
from app.models.station import DockingStation
from app.models.system_event import SystemEvent
from app.core.utils import get_utc_now
from app.schemas.schemas import (
    MissionResponse, MissionCreate,
    RoutePlanRequest, RoutePlanResponse
)
from app.services.route_service import evaluate_route_plan, generate_flight_corridor_waypoints

router = APIRouter()

def format_mission_response(m: Mission, db: Session) -> dict:
    drone_code = m.drone.drone_code if m.drone else None
    origin_name = m.origin_depot.name if m.origin_depot else None
    dest_name = m.destination_depot.name if m.destination_depot else None

    return {
        "id": m.id,
        "mission_code": m.mission_code,
        "name": m.name,
        "drone_id": m.drone_id,
        "origin_depot_id": m.origin_depot_id,
        "destination_depot_id": m.destination_depot_id,
        "status": m.status,
        "distance_km": m.distance_km,
        "estimated_duration_min": m.estimated_duration_min,
        "battery_required_pct": m.battery_required_pct,
        "current_progress_pct": m.current_progress_pct,
        "current_waypoint_index": m.current_waypoint_index,
        "risk_score": m.risk_score,
        "risk_level": m.risk_level,
        "risk_factors_json": m.risk_factors_json,
        "route_geometry_geojson": m.route_geometry_geojson,
        "started_at": m.started_at,
        "completed_at": m.completed_at,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "drone_code": drone_code,
        "origin_name": origin_name,
        "destination_name": dest_name
    }

@router.post("/missions/plan", response_model=RoutePlanResponse)
def plan_mission_route(req: RoutePlanRequest, db: Session = Depends(get_db)):
    try:
        plan = evaluate_route_plan(
            db,
            origin_depot_id=req.origin_depot_id,
            destination_depot_id=req.destination_depot_id,
            drone_id=req.drone_id
        )
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/missions", response_model=List[MissionResponse])
def get_missions(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Mission)
    if status_filter:
        query = query.filter(Mission.status == status_filter.upper())
    missions = query.order_by(Mission.created_at.desc()).all()
    return [format_mission_response(m, db) for m in missions]

@router.get("/missions/{mission_id}", response_model=MissionResponse)
def get_mission(mission_id: int, db: Session = Depends(get_db)):
    m = db.query(Mission).filter(Mission.id == mission_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    return format_mission_response(m, db)

@router.post("/missions", response_model=MissionResponse, status_code=status.HTTP_201_CREATED)
def create_mission(mission_in: MissionCreate, db: Session = Depends(get_db)):
    drone = db.query(Drone).filter(Drone.id == mission_in.drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
    
    # Check if drone is already on an active mission
    if drone.status == "IN_FLIGHT" or drone.assigned_mission_id is not None:
        raise HTTPException(status_code=400, detail=f"Drone {drone.drone_code} is already assigned to an ongoing mission")

    # Evaluate plan feasibility
    try:
        plan = evaluate_route_plan(
            db,
            origin_depot_id=mission_in.origin_depot_id,
            destination_depot_id=mission_in.destination_depot_id,
            drone_id=mission_in.drone_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not plan["feasible"]:
        raise HTTPException(status_code=400, detail=f"Mission infeasible: {plan['rejection_reason']}")

    # Generate sequential mission code
    total_missions = db.query(Mission).count()
    mission_code = f"MSN-DEL-{800 + total_missions + 1}"

    mission = Mission(
        mission_code=mission_code,
        name=mission_in.name,
        drone_id=drone.id,
        origin_depot_id=mission_in.origin_depot_id,
        destination_depot_id=mission_in.destination_depot_id,
        status="PENDING",
        distance_km=plan["distance_km"],
        estimated_duration_min=plan["estimated_duration_min"],
        battery_required_pct=plan["battery_required_pct"],
        current_progress_pct=0.0,
        current_waypoint_index=0,
        risk_score=plan["risk_score"],
        risk_level=plan["risk_level"],
        risk_factors_json=json.dumps(plan["risk_factors"]),
        route_geometry_geojson=json.dumps(plan["route_waypoints"])
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)

    # Attach mission to drone
    drone.assigned_mission_id = mission.id
    db.commit()

    event = SystemEvent(
        event_type="MISSION_CREATED",
        severity="INFO",
        title=f"Mission {mission.mission_code} Logged",
        message=f"Mission planned: {plan['distance_km']} km transit ({plan['risk_level']} risk level).",
        entity_id=mission.mission_code
    )
    db.add(event)
    db.commit()

    return format_mission_response(mission, db)

@router.post("/missions/{mission_id}/start", response_model=MissionResponse)
def start_mission(mission_id: int, db: Session = Depends(get_db)):
    m = db.query(Mission).filter(Mission.id == mission_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    if m.status not in ("PENDING", "PAUSED"):
        raise HTTPException(status_code=400, detail=f"Cannot start mission in '{m.status}' state")

    drone = db.query(Drone).filter(Drone.id == m.drone_id).first()
    if not drone:
        raise HTTPException(status_code=400, detail="No drone assigned to this mission")

    # Release drone from docking station if docked
    if drone.current_station_id:
        st = db.query(DockingStation).filter(DockingStation.id == drone.current_station_id).first()
        if st:
            st.current_drone_id = None
            st.status = "AVAILABLE"
        drone.current_station_id = None

    drone.status = "IN_FLIGHT"
    drone.current_depot_id = None
    m.status = "IN_PROGRESS"
    if not m.started_at:
        m.started_at = get_utc_now()
    m.updated_at = get_utc_now()

    event = SystemEvent(
        event_type="MISSION_START",
        severity="SUCCESS",
        title=f"Mission {m.mission_code} Airborne",
        message=f"Drone {drone.drone_code} departed for destination hub.",
        entity_id=m.mission_code
    )
    db.add(event)
    db.commit()
    db.refresh(m)
    return format_mission_response(m, db)

@router.post("/missions/{mission_id}/pause", response_model=MissionResponse)
def pause_mission(mission_id: int, db: Session = Depends(get_db)):
    m = db.query(Mission).filter(Mission.id == mission_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    if m.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail=f"Cannot pause mission that is in '{m.status}' state")

    m.status = "PAUSED"
    m.updated_at = get_utc_now()
    db.commit()
    db.refresh(m)
    return format_mission_response(m, db)

@router.post("/missions/{mission_id}/cancel", response_model=MissionResponse)
def cancel_mission(mission_id: int, db: Session = Depends(get_db)):
    m = db.query(Mission).filter(Mission.id == mission_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")

    m.status = "CANCELLED"
    m.updated_at = get_utc_now()

    if m.drone:
        m.drone.status = "AVAILABLE"
        m.drone.assigned_mission_id = None
        m.drone.speed_kmh = 0.0

    event = SystemEvent(
        event_type="MISSION_CANCELLED",
        severity="WARNING",
        title=f"Mission {m.mission_code} Aborted",
        message=f"Mission was cancelled by flight operator. Drone returned to loiter.",
        entity_id=m.mission_code
    )
    db.add(event)
    db.commit()
    db.refresh(m)
    return format_mission_response(m, db)
