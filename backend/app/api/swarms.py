from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.swarm import SwarmTeam
from app.schemas.schemas import (
    SwarmResponse, SwarmDroneAssignmentRequest, SwarmStartSurveyRequest
)
from app.services.swarm_service import (
    manage_swarm_drone_assignment,
    start_swarm_survey,
    stop_swarm_survey
)

router = APIRouter()

@router.get("/swarms", response_model=List[SwarmResponse])
def get_swarms(db: Session = Depends(get_db)):
    swarms = db.query(SwarmTeam).all()
    return swarms

@router.post("/swarms/{swarm_id}/assign", response_model=SwarmResponse)
def assign_drone_to_swarm(swarm_id: int, req: SwarmDroneAssignmentRequest, db: Session = Depends(get_db)):
    try:
        swarm = manage_swarm_drone_assignment(db, swarm_id, req.drone_id, req.action)
        return swarm
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/swarms/{swarm_id}/start-survey", response_model=SwarmResponse)
def launch_swarm_survey(swarm_id: int, req: SwarmStartSurveyRequest, db: Session = Depends(get_db)):
    try:
        swarm = start_swarm_survey(db, swarm_id, req.survey_area, req.mission_objective)
        return swarm
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/swarms/{swarm_id}/stop-survey", response_model=SwarmResponse)
def halt_swarm_survey(swarm_id: int, db: Session = Depends(get_db)):
    try:
        swarm = stop_swarm_survey(db, swarm_id)
        return swarm
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
