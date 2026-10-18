import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.db.seed import seed_database
from app.models.depot import Depot
from app.models.station import DockingStation
from app.models.drone import Drone
from app.models.mission import Mission
from app.models.swarm import SwarmTeam
from app.services.route_service import evaluate_route_plan, haversine_distance_km
from app.services.charging_service import assign_drone_to_station, start_charging_session

# Use isolated test database
TEST_DB_URL = "sqlite:///./test_aerosentinel.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["system"] == "AEROSENTINEL"

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["total_depots"] >= 4
    assert data["kpis"]["total_stations"] >= 16
    assert data["kpis"]["total_drones"] >= 8
    assert "recent_missions" in data

def test_depots_and_stations():
    response = client.get("/api/depots")
    assert response.status_code == 200
    depots = response.json()
    assert len(depots) >= 4
    for d in depots:
        assert len(d["stations"]) >= 4

def test_station_occupancy_conflict_rejection():
    db = TestingSessionLocal()
    try:
        # Find an occupied station
        occ_station = db.query(DockingStation).filter(DockingStation.status == "OCCUPIED").first()
        assert occ_station is not None
        # Find another drone
        other_drone = db.query(Drone).filter(Drone.id != occ_station.current_drone_id).first()
        assert other_drone is not None

        # Attempt to assign other drone to the occupied station
        with pytest.raises(ValueError, match="already occupied"):
            assign_drone_to_station(db, other_drone.id, occ_station.id)
    finally:
        db.close()

def test_battery_feasibility_validation():
    db = TestingSessionLocal()
    try:
        depots = db.query(Depot).all()
        assert len(depots) >= 2
        d1 = depots[0]
        d2 = depots[1]

        # Drone with sufficient battery
        drone_good = db.query(Drone).filter(Drone.battery_pct > 80.0).first()
        assert drone_good is not None
        plan = evaluate_route_plan(db, d1.id, d2.id, drone_good.id)
        assert plan["feasible"] is True
        assert plan["distance_km"] > 0
        assert plan["battery_required_pct"] > 0

        # Create drone with critically low battery (e.g. 15%)
        low_drone = Drone(
            drone_code="TEST-LOW-BATT",
            model="Test Drone",
            serial_number="TEST-SN-001",
            latitude=d1.latitude,
            longitude=d1.longitude,
            battery_pct=15.0,
            status="AVAILABLE"
        )
        db.add(low_drone)
        db.commit()

        # Should be rejected due to reserve violation (20% reserve threshold)
        plan_low = evaluate_route_plan(db, d1.id, d2.id, low_drone.id)
        assert plan_low["feasible"] is False
        assert "Battery depletion risk" in plan_low["rejection_reason"]
    finally:
        db.close()

def test_mission_lifecycle_creation_and_dispatch():
    # 1. Plan mission
    db = TestingSessionLocal()
    depots = db.query(Depot).all()
    drone = db.query(Drone).filter(Drone.battery_pct > 80.0, Drone.status == "AVAILABLE").first()
    db.close()

    create_payload = {
        "name": "Rapid Vaccine Transit",
        "drone_id": drone.id,
        "origin_depot_id": depots[0].id,
        "destination_depot_id": depots[1].id
    }
    res = client.post("/api/missions", json=create_payload)
    assert res.status_code == 201
    mission_data = res.json()
    m_id = mission_data["id"]
    assert mission_data["status"] == "PENDING"

    # 2. Start mission
    start_res = client.post(f"/api/missions/{m_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # 3. Pause mission
    pause_res = client.post(f"/api/missions/{m_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "PAUSED"

    # 4. Cancel mission
    cancel_res = client.post(f"/api/missions/{m_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

def test_swarms_workflow():
    res = client.get("/api/swarms")
    assert res.status_code == 200
    swarms = res.json()
    assert len(swarms) >= 2
    team_alpha = next(s for s in swarms if "ALPHA" in s["name"])
    
    # Start survey
    survey_res = client.post(f"/api/swarms/{team_alpha['id']}/start-survey", json={
        "survey_area": "Connaught Place Air Corridor",
        "mission_objective": "Infrastructure LiDAR scan"
    })
    assert survey_res.status_code == 200
    assert survey_res.json()["status"] == "SURVEYING"

    # Stop survey
    stop_res = client.post(f"/api/swarms/{team_alpha['id']}/stop-survey")
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "IDLE"

def test_airspace_observations_and_verification():
    res = client.get("/api/airspace/observations")
    assert res.status_code == 200
    obs_list = res.json()
    assert len(obs_list) >= 5
    
    target_obs = obs_list[0]
    initial_ver = target_obs["verified"]
    
    # Toggle verification
    toggle_res = client.put(f"/api/airspace/observations/{target_obs['id']}/verify")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["verified"] == (not initial_ver)

def test_simulation_controls():
    # Test pause, resume, speed
    res = client.post("/api/simulation/pause")
    assert res.status_code == 200
    
    res = client.post("/api/simulation/resume")
    assert res.status_code == 200

    res = client.post("/api/simulation/speed", json={"action": "speed", "speed_multiplier": 2.0})
    assert res.status_code == 200
    assert res.json()["speed_multiplier"] == 2.0
