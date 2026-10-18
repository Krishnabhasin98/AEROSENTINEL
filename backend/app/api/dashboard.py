from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.depot import Depot
from app.models.station import DockingStation
from app.models.drone import Drone
from app.models.swarm import SwarmTeam
from app.models.mission import Mission
from app.models.airspace import AirspaceObservation
from app.models.system_event import SystemEvent
from app.schemas.schemas import DashboardSummaryResponse, DashboardKPIs
from app.api.missions import format_mission_response

router = APIRouter()

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    drones = db.query(Drone).all()
    total_drones = len(drones)
    flying = sum(1 for d in drones if d.status == "IN_FLIGHT")
    available = sum(1 for d in drones if d.status == "AVAILABLE")
    charging = sum(1 for d in drones if d.status == "CHARGING")
    maintenance = sum(1 for d in drones if d.status == "MAINTENANCE")
    
    avg_health = 0.0
    if total_drones > 0:
        avg_health = round(sum(d.health_pct for d in drones) / total_drones, 1)

    depots = db.query(Depot).all()
    total_depots = len(depots)

    stations = db.query(DockingStation).all()
    total_stations = len(stations)
    avail_stations = sum(1 for s in stations if s.status == "AVAILABLE")

    active_missions_count = db.query(Mission).filter(Mission.status == "IN_PROGRESS").count()
    active_swarms_count = db.query(SwarmTeam).filter(SwarmTeam.status.in_(["ACTIVE", "SURVEYING"])).count()

    # Determine general airspace risk indicator based on critical/unverified alerts
    critical_obs_count = db.query(AirspaceObservation).filter(AirspaceObservation.severity == "CRITICAL").count()
    risk_level = "ELEVATED" if critical_obs_count > 0 else "NOMINAL"

    kpis = DashboardKPIs(
        total_drones=total_drones,
        drones_flying=flying,
        drones_available=available,
        drones_charging=charging,
        drones_maintenance=maintenance,
        active_missions=active_missions_count,
        total_depots=total_depots,
        total_stations=total_stations,
        available_stations=avail_stations,
        airspace_risk_level=risk_level,
        overall_fleet_health_avg=avg_health,
        active_swarms=active_swarms_count
    )

    recent_missions = db.query(Mission).order_by(Mission.created_at.desc()).limit(6).all()
    recent_events = db.query(SystemEvent).order_by(SystemEvent.created_at.desc()).limit(8).all()
    risk_alerts = db.query(AirspaceObservation).order_by(AirspaceObservation.created_at.desc()).limit(6).all()

    return {
        "kpis": kpis,
        "recent_missions": [format_mission_response(m, db) for m in recent_missions],
        "recent_events": recent_events,
        "risk_alerts": risk_alerts
    }
