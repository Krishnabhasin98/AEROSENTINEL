from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.system_event import SystemEvent
from app.schemas.schemas import SystemEventResponse

router = APIRouter()

@router.get("/events", response_model=List[SystemEventResponse])
def get_system_events(limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(SystemEvent).order_by(SystemEvent.created_at.desc()).limit(limit).all()
    return events
