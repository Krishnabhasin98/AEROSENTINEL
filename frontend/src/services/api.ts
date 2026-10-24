import {
  Depot, DockingStation, Drone, SwarmTeam, Mission,
  AirspaceObservation, SystemEvent, DashboardSummary,
  RoutePlanResponse, AnalyticsSummary
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://aerosentinel-ssot.vercel.app').replace(/\/$/, '') + '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = errorData.detail;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; system: string; version: string }>('/health'),

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),

  // Depots & Stations
  getDepots: () => request<Depot[]>('/depots'),
  createDepot: (data: Partial<Depot>) => request<Depot>('/depots', { method: 'POST', body: JSON.stringify(data) }),
  updateDepot: (id: number, data: Partial<Depot>) => request<Depot>(`/depots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getStations: (depotId?: number) => request<DockingStation[]>(depotId ? `/stations?depot_id=${depotId}` : '/stations'),
  assignStation: (droneId: number, stationId: number) => request<DockingStation>('/stations/assign', {
    method: 'POST',
    body: JSON.stringify({ drone_id: droneId, station_id: stationId })
  }),
  releaseStation: (droneId: number) => request<{ status: string; message: string }>('/stations/release', {
    method: 'POST',
    body: JSON.stringify({ drone_id: droneId })
  }),
  startCharging: (droneId: number) => request<{ status: string; message: string; battery_pct: number }>('/stations/charging/start', {
    method: 'POST',
    body: JSON.stringify({ drone_id: droneId })
  }),
  stopCharging: (droneId: number) => request<{ status: string; message: string; battery_pct: number }>('/stations/charging/stop', {
    method: 'POST',
    body: JSON.stringify({ drone_id: droneId })
  }),

  // Drone Fleet
  getDrones: (statusFilter?: string) => request<Drone[]>(statusFilter ? `/drones?status_filter=${statusFilter}` : '/drones'),
  getDrone: (id: number) => request<Drone>(`/drones/${id}`),
  createDrone: (data: Partial<Drone>) => request<Drone>('/drones', { method: 'POST', body: JSON.stringify(data) }),
  updateDrone: (id: number, data: Partial<Drone>) => request<Drone>(`/drones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Missions & Routing
  planRoute: (originDepotId: number, destinationDepotId: number, droneId: number) =>
    request<RoutePlanResponse>('/missions/plan', {
      method: 'POST',
      body: JSON.stringify({
        origin_depot_id: originDepotId,
        destination_depot_id: destinationDepotId,
        drone_id: droneId
      })
    }),
  getMissions: (statusFilter?: string) => request<Mission[]>(statusFilter ? `/missions?status_filter=${statusFilter}` : '/missions'),
  createMission: (data: { name: string; drone_id: number; origin_depot_id: number; destination_depot_id: number }) =>
    request<Mission>('/missions', { method: 'POST', body: JSON.stringify(data) }),
  startMission: (id: number) => request<Mission>(`/missions/${id}/start`, { method: 'POST' }),
  pauseMission: (id: number) => request<Mission>(`/missions/${id}/pause`, { method: 'POST' }),
  cancelMission: (id: number) => request<Mission>(`/missions/${id}/cancel`, { method: 'POST' }),

  // Swarm Management
  getSwarms: () => request<SwarmTeam[]>('/swarms'),
  assignDroneToSwarm: (swarmId: number, droneId: number, action: 'assign' | 'remove') =>
    request<SwarmTeam>(`/swarms/${swarmId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ drone_id: droneId, action })
    }),
  startSwarmSurvey: (swarmId: number, area?: string, objective?: string) =>
    request<SwarmTeam>(`/swarms/${swarmId}/start-survey`, {
      method: 'POST',
      body: JSON.stringify({ survey_area: area, mission_objective: objective })
    }),
  stopSwarmSurvey: (swarmId: number) =>
    request<SwarmTeam>(`/swarms/${swarmId}/stop-survey`, { method: 'POST' }),

  // Airspace Intelligence
  getAirspaceObservations: (category?: string) =>
    request<AirspaceObservation[]>(category ? `/airspace/observations?category=${category}` : '/airspace/observations'),
  createAirspaceObservation: (data: Partial<AirspaceObservation>) =>
    request<AirspaceObservation>('/airspace/observations', { method: 'POST', body: JSON.stringify(data) }),
  toggleVerifyObservation: (id: number) =>
    request<AirspaceObservation>(`/airspace/observations/${id}/verify`, { method: 'PUT' }),
  getCandidateCorridors: () => request<any[]>('/airspace/corridors'),

  // Simulation Control
  getSimulationStatus: () => request<{ is_running: boolean; is_paused: boolean; tick_rate_seconds: number }>('/simulation/status'),
  startSimulation: () => request<{ status: string; message: string }>('/simulation/start', { method: 'POST' }),
  stopSimulation: () => request<{ status: string; message: string }>('/simulation/stop', { method: 'POST' }),
  pauseSimulation: () => request<{ status: string; message: string }>('/simulation/pause', { method: 'POST' }),
  resumeSimulation: () => request<{ status: string; message: string }>('/simulation/resume', { method: 'POST' }),
  setSimulationSpeed: (multiplier: number) =>
    request<{ status: string; speed_multiplier: number }>('/simulation/speed', {
      method: 'POST',
      body: JSON.stringify({ action: 'speed', speed_multiplier: multiplier })
    }),
  resetSimulationData: () => request<{ status: string; message: string }>('/simulation/reset', { method: 'POST' }),

  // Analytics & Events
  getAnalyticsSummary: () => request<AnalyticsSummary>('/analytics/summary'),
  getSystemEvents: (limit: number = 50) => request<SystemEvent[]>(`/events?limit=${limit}`),

  // TinyFish.ai Intelligence Engine
  getTinyFishStatus: () => request<import('../types').TinyFishStatus>('/tinyfish/status'),
  getTinyFishDGCARules: () => request<{ count: number; source: string; rules: import('../types').DGCARule[] }>('/tinyfish/dgca-rules'),
  getTinyFishWeather: () => request<{ count: number; region: string; advisories: import('../types').WeatherAdvisory[] }>('/tinyfish/weather-advisories'),
  getTinyFishTraffic: () => request<import('../types').AirspaceTrafficAnalysis>('/tinyfish/traffic-analysis'),
  queryTinyFishAgent: (prompt: string) => request<import('../types').TinyFishQueryResponse>('/tinyfish/query', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  }),
  updateTinyFishApiKey: (apiKey: string) => request<{ status: string; message: string; has_live_key: boolean; mode: string }>('/tinyfish/api-key', {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey })
  })
};

