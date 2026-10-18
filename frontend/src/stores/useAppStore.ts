import { create } from 'zustand';
import {
  Drone, Depot, SwarmTeam, Mission, AirspaceObservation,
  SystemEvent, DashboardSummary, AnalyticsSummary
} from '../types';
import { api } from '../services/api';

export type NavigationTab =
  | 'overview'
  | 'telemetry'
  | 'airspace'
  | 'fleet'
  | 'depots'
  | 'swarms'
  | 'missions'
  | 'battery'
  | 'analytics'
  | 'settings';

interface MapLayers {
  drones: boolean;
  depots: boolean;
  routes: boolean;
  obstacles: boolean;
  birds: boolean;
  restricted: boolean;
}

interface AppStoreState {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Data
  drones: Drone[];
  depots: Depot[];
  swarms: SwarmTeam[];
  missions: Mission[];
  observations: AirspaceObservation[];
  events: SystemEvent[];
  dashboardSummary: DashboardSummary | null;
  analytics: AnalyticsSummary | null;
  isLoading: boolean;
  error: string | null;

  // Selection
  selectedDrone: Drone | null;
  setSelectedDrone: (drone: Drone | null) => void;
  selectedDepot: Depot | null;
  setSelectedDepot: (depot: Depot | null) => void;
  selectedObservation: AirspaceObservation | null;
  setSelectedObservation: (obs: AirspaceObservation | null) => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Map Controls
  layers: MapLayers;
  toggleLayer: (layer: keyof MapLayers) => void;

  // Simulation & WebSockets
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  simulationRunning: boolean;
  simulationPaused: boolean;
  simulationSpeed: number;
  lastTelemetryPing: string | null;

  // Async Actions
  fetchInitialData: () => Promise<void>;
  refreshFleet: () => Promise<void>;
  refreshMissions: () => Promise<void>;
  refreshDepots: () => Promise<void>;
  refreshObservations: () => Promise<void>;
  refreshSwarms: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  applyTelemetryUpdate: (data: any) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),

  drones: [],
  depots: [],
  swarms: [],
  missions: [],
  observations: [],
  events: [],
  dashboardSummary: null,
  analytics: null,
  isLoading: false,
  error: null,

  selectedDrone: null,
  setSelectedDrone: (drone) => set({ selectedDrone: drone }),
  selectedDepot: null,
  setSelectedDepot: (depot) => set({ selectedDepot: depot }),
  selectedObservation: null,
  setSelectedObservation: (obs) => set({ selectedObservation: obs }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  layers: {
    drones: true,
    depots: true,
    routes: true,
    obstacles: true,
    birds: true,
    restricted: true,
  },
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),
  simulationRunning: true,
  simulationPaused: false,
  simulationSpeed: 1.0,
  lastTelemetryPing: null,

  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [
        summary,
        depotsData,
        dronesData,
        missionsData,
        swarmsData,
        obsData,
        eventsData
      ] = await Promise.all([
        api.getDashboardSummary(),
        api.getDepots(),
        api.getDrones(),
        api.getMissions(),
        api.getSwarms(),
        api.getAirspaceObservations(),
        api.getSystemEvents(30)
      ]);

      set({
        dashboardSummary: summary,
        depots: depotsData,
        drones: dronesData,
        missions: missionsData,
        swarms: swarmsData,
        observations: obsData,
        events: eventsData,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to initialize operational data', isLoading: false });
    }
  },

  refreshFleet: async () => {
    try {
      const drones = await api.getDrones();
      set({ drones });
    } catch {
      // silent retry
    }
  },

  refreshMissions: async () => {
    try {
      const missions = await api.getMissions();
      set({ missions });
    } catch {
      // silent retry
    }
  },

  refreshDepots: async () => {
    try {
      const depots = await api.getDepots();
      set({ depots });
    } catch {
      // silent retry
    }
  },

  refreshObservations: async () => {
    try {
      const observations = await api.getAirspaceObservations();
      set({ observations });
    } catch {
      // silent retry
    }
  },

  refreshSwarms: async () => {
    try {
      const swarms = await api.getSwarms();
      set({ swarms });
    } catch {
      // silent retry
    }
  },

  refreshAnalytics: async () => {
    try {
      const analytics = await api.getAnalyticsSummary();
      set({ analytics });
    } catch {
      // silent retry
    }
  },

  applyTelemetryUpdate: (data: any) => {
    if (!data || !data.drones) return;

    set((state) => {
      // Merge updated drone telemetry into existing drones array
      const updatedDrones = state.drones.map((existingDrone) => {
        const update = data.drones.find((d: any) => d.id === existingDrone.id);
        if (update) {
          return {
            ...existingDrone,
            latitude: update.latitude,
            longitude: update.longitude,
            altitude_m: update.altitude_m,
            speed_kmh: update.speed_kmh,
            heading_deg: update.heading_deg,
            battery_pct: update.battery_pct,
            status: update.status,
            current_station_id: update.current_station_id,
            current_depot_id: update.current_depot_id,
            last_telemetry_at: update.last_telemetry_at
          };
        }
        return existingDrone;
      });

      // Update selectedDrone if currently open
      let newSelectedDrone = state.selectedDrone;
      if (newSelectedDrone) {
        const matched = updatedDrones.find((d) => d.id === newSelectedDrone?.id);
        if (matched) newSelectedDrone = matched;
      }

      // Update KPI card counts dynamically
      const flying = updatedDrones.filter((d) => d.status === 'IN_FLIGHT').length;
      const charging = updatedDrones.filter((d) => d.status === 'CHARGING').length;
      const available = updatedDrones.filter((d) => d.status === 'AVAILABLE').length;

      let newDashboardSummary = state.dashboardSummary;
      if (newDashboardSummary) {
        newDashboardSummary = {
          ...newDashboardSummary,
          kpis: {
            ...newDashboardSummary.kpis,
            drones_flying: flying,
            drones_charging: charging,
            drones_available: available
          }
        };
      }

      return {
        drones: updatedDrones,
        selectedDrone: newSelectedDrone,
        dashboardSummary: newDashboardSummary,
        lastTelemetryPing: data.timestamp,
        simulationRunning: data.simulation?.is_running ?? state.simulationRunning,
        simulationPaused: data.simulation?.is_paused ?? state.simulationPaused,
        simulationSpeed: data.simulation?.speed_multiplier ?? state.simulationSpeed
      };
    });
  }
}));
