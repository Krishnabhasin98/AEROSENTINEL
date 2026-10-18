export type DroneStatus = 'AVAILABLE' | 'IN_FLIGHT' | 'CHARGING' | 'MAINTENANCE' | 'OFFLINE';
export type StationStatus = 'AVAILABLE' | 'OCCUPIED' | 'CHARGING' | 'MAINTENANCE';
export type MissionStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type SwarmStatus = 'IDLE' | 'ACTIVE' | 'SURVEYING' | 'RETURNING';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO' | 'SUCCESS' | 'WARNING';
export type ObservationCategory = 'OBSTACLE' | 'BIRD_HOTSPOT' | 'RESTRICTED_ZONE' | 'WEATHER_ALERT';

export interface DockingStation {
  id: number;
  depot_id: number;
  station_code: string;
  bay_number: number;
  status: StationStatus;
  power_output_kw: number;
  current_drone_id?: number | null;
  last_service_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Depot {
  id: number;
  code: string;
  name: string;
  latitude: float;
  longitude: float;
  address?: string;
  status: string;
  total_capacity: number;
  stations: DockingStation[];
  available_stations_count?: number;
  occupied_stations_count?: number;
  charging_stations_count?: number;
  created_at: string;
  updated_at: string;
}

type float = number;

export interface Drone {
  id: number;
  drone_code: string;
  model: string;
  serial_number: string;
  latitude: number;
  longitude: number;
  altitude_m: number;
  speed_kmh: number;
  heading_deg: number;
  battery_pct: number;
  health_pct: number;
  status: DroneStatus;
  max_range_km: number;
  battery_capacity_kwh: number;
  consumption_rate_kwh_per_km: number;
  max_payload_kg: number;
  current_depot_id?: number | null;
  current_station_id?: number | null;
  assigned_mission_id?: number | null;
  assigned_swarm_id?: number | null;
  last_telemetry_at: string;
  created_at: string;
  updated_at: string;
}

export interface SwarmTeam {
  id: number;
  name: string;
  code: string;
  status: SwarmStatus;
  survey_area: string;
  mission_objective: string;
  coverage_progress_pct: number;
  detected_obstacles_count: number;
  bird_observations_count: number;
  last_report_at: string;
  drones: Drone[];
}

export interface RouteFactor {
  category: string;
  description: string;
  severity: SeverityLevel;
  impact_pct: number;
}

export interface Mission {
  id: number;
  mission_code: string;
  name: string;
  drone_id?: number | null;
  origin_depot_id: number;
  destination_depot_id: number;
  status: MissionStatus;
  distance_km: number;
  estimated_duration_min: number;
  battery_required_pct: number;
  current_progress_pct: number;
  current_waypoint_index: number;
  risk_score: number;
  risk_level: string;
  risk_factors_json: string;
  route_geometry_geojson: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  drone_code?: string;
  origin_name?: string;
  destination_name?: string;
}

export interface AirspaceObservation {
  id: number;
  category: ObservationCategory;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  altitude_min_m: number;
  altitude_max_m: number;
  severity: SeverityLevel;
  confidence_pct: number;
  verified: boolean;
  is_hard_constraint: boolean;
  details?: string;
  reported_by_swarm_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SystemEvent {
  id: number;
  event_type: string;
  severity: SeverityLevel;
  title: string;
  message: string;
  entity_id?: string | null;
  created_at: string;
}

export interface DashboardKPIs {
  total_drones: number;
  drones_flying: number;
  drones_available: number;
  drones_charging: number;
  drones_maintenance: number;
  active_missions: number;
  total_depots: number;
  total_stations: number;
  available_stations: number;
  airspace_risk_level: string;
  overall_fleet_health_avg: number;
  active_swarms: number;
}

export interface DashboardSummary {
  kpis: DashboardKPIs;
  recent_missions: Mission[];
  recent_events: SystemEvent[];
  risk_alerts: AirspaceObservation[];
}

export interface RoutePlanResponse {
  origin_depot_id: number;
  destination_depot_id: number;
  drone_id: number;
  distance_km: number;
  estimated_duration_min: number;
  battery_required_pct: number;
  current_drone_battery_pct: number;
  remaining_battery_pct: number;
  feasible: boolean;
  rejection_reason?: string | null;
  risk_score: number;
  risk_level: string;
  risk_factors: RouteFactor[];
  route_waypoints: [number, number][];
}

export interface AnalyticsSummary {
  fleet_distribution: { name: string; value: number; color: string }[];
  flight_trend: { day: string; flightHours: number; energyKwh: number; missions: number }[];
  depot_utilization: { name: string; utilizationPct: number; totalStations: number; occupiedStations: number }[];
  risk_breakdown: { category: string; count: number; color: string }[];
  battery_health_data: { drone: string; health: number; battery: number; model: string }[];
  total_missions_executed: number;
  total_fleet_size: number;
}

export interface DGCARule {
  id: string;
  title: string;
  category: string;
  status: string;
  summary: string;
  effective_date: string;
  source: string;
  max_altitude_m: number;
  impact_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface WeatherAdvisory {
  id: string;
  station: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  alert_type: string;
  headline: string;
  details: string;
  recommended_action: string;
  valid_until: string;
  grounding_recommended: boolean;
}

export interface AirspaceTrafficAnalysis {
  airspace_status: string;
  active_commercial_corridors: number;
  delhi_ncr_congestion_index: number;
  notam_alerts: {
    code: string;
    corridor: string;
    restriction: string;
    status: string;
  }[];
  recommendation: string;
}

export interface TinyFishStatus {
  status: string;
  service: string;
  has_live_key: boolean;
  api_key_masked?: string;
  mode: string;
  coverage: string;
}


export interface TinyFishQueryResponse {
  query: string;
  answer: string;
  category: string;
  citations: string[];
  is_live_tinyfish: boolean;
  status: string;
}
