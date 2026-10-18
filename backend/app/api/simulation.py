from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.simulation.simulator import simulator
from app.schemas.schemas import SimulationStatusResponse, SimulationControlRequest
from app.models.mission import Mission
from app.models.drone import Drone
from app.db.seed import seed_database
from app.db.database import Base, engine

router = APIRouter()

@router.get("/simulation/status", response_model=SimulationStatusResponse)
def get_simulation_status(db: Session = Depends(get_db)):
    active_missions = db.query(Mission).filter(Mission.status == "IN_PROGRESS").count()
    flying = db.query(Drone).filter(Drone.status == "IN_FLIGHT").count()
    charging = db.query(Drone).filter(Drone.status == "CHARGING").count()

    return {
        "is_running": simulator.is_running,
        "is_paused": simulator.is_paused,
        "tick_rate_seconds": simulator.tick_rate,
        "active_simulated_missions": active_missions,
        "drones_in_flight": flying,
        "drones_charging": charging
    }

@router.post("/simulation/start")
async def start_sim():
    await simulator.start()
    return {"status": "SUCCESS", "message": "Telemetry simulation started"}

@router.post("/simulation/stop")
async def stop_sim():
    await simulator.stop()
    return {"status": "SUCCESS", "message": "Telemetry simulation stopped"}

@router.post("/simulation/pause")
async def pause_sim():
    await simulator.pause()
    return {"status": "SUCCESS", "message": "Telemetry simulation paused"}

@router.post("/simulation/resume")
async def resume_sim():
    await simulator.resume()
    return {"status": "SUCCESS", "message": "Telemetry simulation resumed"}

@router.post("/simulation/speed")
def adjust_sim_speed(req: SimulationControlRequest):
    if req.speed_multiplier:
        simulator.set_speed(req.speed_multiplier)
    return {"status": "SUCCESS", "speed_multiplier": simulator.speed_multiplier}

@router.post("/simulation/reset")
async def reset_simulation_data():
    await simulator.stop()
    # Reset tables and reseed default demonstration state
    Base.metadata.drop_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    await simulator.start()
    return {"status": "SUCCESS", "message": "Demonstration environment reset to pristine baseline state"}
