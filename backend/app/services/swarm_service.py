from sqlalchemy.orm import Session
from app.models.swarm import SwarmTeam
from app.models.drone import Drone
from app.models.airspace import AirspaceObservation
from app.models.system_event import SystemEvent
from app.core.utils import get_utc_now

def manage_swarm_drone_assignment(db: Session, swarm_id: int, drone_id: int, action: str) -> SwarmTeam:
    swarm = db.query(SwarmTeam).filter(SwarmTeam.id == swarm_id).first()
    drone = db.query(Drone).filter(Drone.id == drone_id).first()

    if not swarm:
        raise ValueError("Swarm team not found")
    if not drone:
        raise ValueError("Drone not found")

    if action == "assign":
        drone.assigned_swarm_id = swarm.id
        event = SystemEvent(
            event_type="SWARM_ASSIGN",
            severity="INFO",
            title=f"Drone Assigned to {swarm.name}",
            message=f"Drone {drone.drone_code} attached to swarm unit {swarm.name} for coordinated missions.",
            entity_id=drone.drone_code
        )
        db.add(event)
    elif action == "remove":
        if drone.assigned_swarm_id == swarm.id:
            drone.assigned_swarm_id = None
            event = SystemEvent(
                event_type="SWARM_DETACH",
                severity="INFO",
                title=f"Drone Detached from {swarm.name}",
                message=f"Drone {drone.drone_code} released from swarm unit {swarm.name}.",
                entity_id=drone.drone_code
            )
            db.add(event)
    else:
        raise ValueError(f"Unknown action '{action}'. Must be 'assign' or 'remove'")

    db.commit()
    db.refresh(swarm)
    return swarm

def start_swarm_survey(db: Session, swarm_id: int, survey_area: str = None, objective: str = None) -> SwarmTeam:
    swarm = db.query(SwarmTeam).filter(SwarmTeam.id == swarm_id).first()
    if not swarm:
        raise ValueError("Swarm team not found")

    if not swarm.drones or len(swarm.drones) == 0:
        raise ValueError(f"{swarm.name} requires at least one assigned drone to commence survey missions")

    swarm.status = "SURVEYING"
    swarm.coverage_progress_pct = 5.0
    if survey_area:
        swarm.survey_area = survey_area
    if objective:
        swarm.mission_objective = objective
    swarm.last_report_at = get_utc_now()

    event = SystemEvent(
        event_type="SWARM_SURVEY_START",
        severity="SUCCESS",
        title=f"Survey Launched: {swarm.name}",
        message=f"{swarm.name} initiated autonomous sweep over {swarm.survey_area} with {len(swarm.drones)} drones.",
        entity_id=swarm.code
    )
    db.add(event)
    db.commit()
    db.refresh(swarm)
    return swarm

def stop_swarm_survey(db: Session, swarm_id: int) -> SwarmTeam:
    swarm = db.query(SwarmTeam).filter(SwarmTeam.id == swarm_id).first()
    if not swarm:
        raise ValueError("Swarm team not found")

    swarm.status = "IDLE"
    swarm.coverage_progress_pct = 100.0
    swarm.last_report_at = get_utc_now()

    event = SystemEvent(
        event_type="SWARM_SURVEY_COMPLETE",
        severity="INFO",
        title=f"Survey Concluded: {swarm.name}",
        message=f"{swarm.name} completed reconnaissance sweep over {swarm.survey_area}.",
        entity_id=swarm.code
    )
    db.add(event)
    db.commit()
    db.refresh(swarm)
    return swarm
