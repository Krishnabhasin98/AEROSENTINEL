import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

# Station Schemas
class StationBase(BaseModel):
    station_code: str
    bay_number: int
    status: str = "AVAILABLE"
    power_output_kw: float = 3.3

class StationCreate(StationBase):
    depot_id: int

class StationUpdate(BaseModel):
    status: Optional[str] = None
    power_output_kw: Optional[float] = None
    current_drone_id: Optional[int] = None

class StationResponse(StationBase):
    id: int
    depot_id: int
    current_drone_id: Optional[int] = None
    last_service_date: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Depot Schemas
class DepotBase(BaseModel):
    code: str
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    status: str = "OPERATIONAL"
    total_capacity: int = 4

class DepotCreate(DepotBase):
    pass

class DepotUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    status: Optional[str] = None
    total_capacity: Optional[int] = None

class DepotResponse(DepotBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    stations: List[StationResponse] = []
    available_stations_count: Optional[int] = 0
    occupied_stations_count: Optional[int] = 0
    charging_stations_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# Drone Schemas
class DroneBase(BaseModel):
    drone_code: str
    model: str
    serial_number: str
    latitude: float
    longitude: float
    altitude_m: float = 0.0
    speed_kmh: float = 0.0
    heading_deg: float = 0.0
    battery_pct: float = 100.0
    health_pct: float = 98.0
    status: str = "AVAILABLE"
    max_range_km: float = 45.0
    battery_capacity_kwh: float = 1.8
    consumption_rate_kwh_per_km: float = 0.035
    max_payload_kg: float = 5.0

class DroneCreate(DroneBase):
    current_depot_id: Optional[int] = None
    current_station_id: Optional[int] = None

class DroneUpdate(BaseModel):
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude_m: Optional[float] = None
    speed_kmh: Optional[float] = None
    heading_deg: Optional[float] = None
    battery_pct: Optional[float] = None
    health_pct: Optional[float] = None
    current_depot_id: Optional[int] = None
    current_station_id: Optional[int] = None
    assigned_mission_id: Optional[int] = None
    assigned_swarm_id: Optional[int] = None

class DroneResponse(DroneBase):
    id: int
    current_depot_id: Optional[int] = None
    current_station_id: Optional[int] = None
    assigned_mission_id: Optional[int] = None
    assigned_swarm_id: Optional[int] = None
    last_telemetry_at: datetime.datetime
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Dock / Undock Actions
class AssignStationRequest(BaseModel):
    drone_id: int
    station_id: int

class ChargingActionRequest(BaseModel):
    drone_id: int
    target_pct: float = 100.0

# Swarm Schemas
class SwarmBase(BaseModel):
    name: str
    code: str
    status: str = "IDLE"
    survey_area: str = "Delhi Central Air Corridor"
    mission_objective: str = "Perimeter reconnaissance and obstacle scanning"
    coverage_progress_pct: float = 0.0
    detected_obstacles_count: int = 0
    bird_observations_count: int = 0

class SwarmResponse(SwarmBase):
    id: int
    last_report_at: datetime.datetime
    created_at: datetime.datetime
    updated_at: datetime.datetime
    drones: List[DroneResponse] = []

    model_config = ConfigDict(from_attributes=True)

class SwarmDroneAssignmentRequest(BaseModel):
    drone_id: int
    action: str = Field(..., description="'assign' or 'remove'")

class SwarmStartSurveyRequest(BaseModel):
    survey_area: Optional[str] = None
    mission_objective: Optional[str] = None

# Mission Schemas
class RoutePlanRequest(BaseModel):
    origin_depot_id: int
    destination_depot_id: int
    drone_id: int

class RouteFactor(BaseModel):
    category: str
    description: str
    severity: str
    impact_pct: float

class RoutePlanResponse(BaseModel):
    origin_depot_id: int
    destination_depot_id: int
    drone_id: int
    distance_km: float
    estimated_duration_min: float
    battery_required_pct: float
    current_drone_battery_pct: float
    remaining_battery_pct: float
    feasible: bool
    rejection_reason: Optional[str] = None
    risk_score: float
    risk_level: str
    risk_factors: List[RouteFactor] = []
    route_waypoints: List[List[float]] = [] # [[lat, lng], ...]

class MissionCreate(BaseModel):
    name: str
    drone_id: int
    origin_depot_id: int
    destination_depot_id: int

class MissionResponse(BaseModel):
    id: int
    mission_code: str
    name: str
    drone_id: Optional[int] = None
    origin_depot_id: int
    destination_depot_id: int
    status: str
    distance_km: float
    estimated_duration_min: float
    battery_required_pct: float
    current_progress_pct: float
    current_waypoint_index: int
    risk_score: float
    risk_level: str
    risk_factors_json: str
    route_geometry_geojson: str
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    drone_code: Optional[str] = None
    origin_name: Optional[str] = None
    destination_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Airspace Observation Schemas
class AirspaceObservationBase(BaseModel):
    category: str # OBSTACLE, BIRD_HOTSPOT, RESTRICTED_ZONE, WEATHER_ALERT
    name: str
    latitude: float
    longitude: float
    radius_m: float = 200.0
    altitude_min_m: float = 0.0
    altitude_max_m: float = 300.0
    severity: str = "MEDIUM"
    confidence_pct: float = 85.0
    verified: bool = False
    is_hard_constraint: bool = False
    details: Optional[str] = None
    reported_by_swarm_id: Optional[int] = None

class AirspaceObservationCreate(AirspaceObservationBase):
    pass

class AirspaceObservationResponse(AirspaceObservationBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# System Event Schemas
class SystemEventResponse(BaseModel):
    id: int
    event_type: str
    severity: str
    title: str
    message: str
    entity_id: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Dashboard Summary
class DashboardKPIs(BaseModel):
    total_drones: int
    drones_flying: int
    drones_available: int
    drones_charging: int
    drones_maintenance: int
    active_missions: int
    total_depots: int
    total_stations: int
    available_stations: int
    airspace_risk_level: str
    overall_fleet_health_avg: float
    active_swarms: int

class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKPIs
    recent_missions: List[MissionResponse]
    recent_events: List[SystemEventResponse]
    risk_alerts: List[AirspaceObservationResponse]

# Simulation Control
class SimulationStatusResponse(BaseModel):
    is_running: bool
    is_paused: bool
    tick_rate_seconds: float
    active_simulated_missions: int
    drones_in_flight: int
    drones_charging: int

class SimulationControlRequest(BaseModel):
    action: str # "start", "stop", "pause", "resume", "reset"
    speed_multiplier: Optional[float] = 1.0
