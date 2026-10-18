import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers, Eye, Navigation, ShieldAlert, Zap, Radio,
  Building2, Plane, AlertTriangle, Bird
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Drone, Depot, AirspaceObservation, Mission } from '../../types';

// Fix Leaflet's default marker icons in Vite/bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface DelhiMapProps {
  height?: string;
  selectedDroneId?: number | null;
  onSelectDrone?: (drone: Drone) => void;
  onSelectDepot?: (depot: Depot) => void;
  onSelectObservation?: (obs: AirspaceObservation) => void;
}

export const DelhiOperationsMap: React.FC<DelhiMapProps> = ({
  height = '560px',
  onSelectDrone,
  onSelectDepot,
  onSelectObservation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layers feature groups
  const droneLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const depotLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const obstacleLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const birdLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const restrictedLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  const {
    drones,
    depots,
    missions,
    observations,
    layers,
    toggleLayer,
    setSelectedDrone,
    setSelectedDepot,
    setSelectedObservation
  } = useAppStore();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Delhi NCR: Latitude 28.6139, Longitude 77.2090
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Zoom controls in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Attach layer groups
    droneLayerRef.current.addTo(map);
    depotLayerRef.current.addTo(map);
    routeLayerRef.current.addTo(map);
    obstacleLayerRef.current.addTo(map);
    birdLayerRef.current.addTo(map);
    restrictedLayerRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Depots Layer
  useEffect(() => {
    const layer = depotLayerRef.current;
    layer.clearLayers();
    if (!layers.depots) return;

    depots.forEach((depot) => {
      const availCount = depot.available_stations_count ?? depot.stations.filter(s => s.status === 'AVAILABLE').length;
      const totalCount = depot.total_capacity;

      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            <div class="w-10 h-10 rounded-xl bg-navy border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
              <span class="font-mono text-xs font-bold text-tealaccent">DEP</span>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded bg-navy text-white text-[10px] font-bold shadow-md whitespace-nowrap border border-slate-700 flex items-center gap-1">
              <span>${depot.name.split(' ')[0]}</span>
              <span class="px-1 rounded bg-tealaccent text-white font-mono text-[9px]">${availCount}/${totalCount}</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
      });

      const marker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon });
      marker.on('click', () => {
        setSelectedDepot(depot);
        if (onSelectDepot) onSelectDepot(depot);
      });

      marker.bindTooltip(
        `<div class="p-1">
          <p class="font-bold text-xs text-navy">${depot.name}</p>
          <p class="text-[10px] text-slate-500">${depot.address || ''}</p>
          <p class="text-[10px] font-semibold text-tealaccent mt-1">Available Bays: ${availCount} of ${totalCount}</p>
        </div>`,
        { direction: 'top', offset: [0, -20] }
      );

      layer.addLayer(marker);
    });
  }, [depots, layers.depots, onSelectDepot, setSelectedDepot]);

  // Update Drones Layer dynamically
  useEffect(() => {
    const layer = droneLayerRef.current;
    layer.clearLayers();
    if (!layers.drones) return;

    drones.forEach((drone) => {
      let statusColor = '#15803D'; // Green for AVAILABLE
      if (drone.status === 'IN_FLIGHT') statusColor = '#2563EB'; // Blue
      else if (drone.status === 'CHARGING') statusColor = '#008C95'; // Teal
      else if (drone.status === 'MAINTENANCE') statusColor = '#D97706'; // Amber
      else if (drone.status === 'OFFLINE') statusColor = '#64748B';

      const isFlying = drone.status === 'IN_FLIGHT';
      const isCharging = drone.status === 'CHARGING';

      const droneIcon = L.divIcon({
        className: 'custom-drone-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -50%);">
            ${isFlying ? `<div class="absolute -inset-1 rounded-full bg-blue-500 opacity-30 animate-ping"></div>` : ''}
            <div class="w-8 h-8 rounded-full bg-white border-2 shadow-md flex items-center justify-center transition-transform group-hover:scale-125" style="border-color: ${statusColor};">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${statusColor}" style="transform: rotate(${drone.heading_deg}deg); transition: transform 0.5s ease;">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            <div class="mt-1 px-1.5 py-0.5 rounded-full bg-white/95 text-slate-800 text-[9px] font-mono font-bold shadow border border-slate-200 whitespace-nowrap flex items-center gap-1">
              <span>${drone.drone_code}</span>
              <span style="color: ${drone.battery_pct < 25 ? '#DC2626' : statusColor}">${Math.round(drone.battery_pct)}%</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
      });

      const marker = L.marker([drone.latitude, drone.longitude], { icon: droneIcon });
      marker.on('click', () => {
        setSelectedDrone(drone);
        if (onSelectDrone) onSelectDrone(drone);
      });

      marker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-xs text-navy">${drone.drone_code}</span>
            <span class="text-[10px] font-mono px-1 rounded bg-slate-100">${drone.status}</span>
          </div>
          <p class="text-[10px] text-slate-500">${drone.model}</p>
          <div class="mt-1 text-[10px] grid grid-cols-2 gap-x-2 text-slate-600 font-mono">
            <span>Alt: ${Math.round(drone.altitude_m)}m</span>
            <span>Spd: ${Math.round(drone.speed_kmh)}km/h</span>
            <span>Bat: ${Math.round(drone.battery_pct)}%</span>
            <span>Hdg: ${Math.round(drone.heading_deg)}°</span>
          </div>
        </div>`,
        { direction: 'top', offset: [0, -18] }
      );

      layer.addLayer(marker);
    });
  }, [drones, layers.drones, onSelectDrone, setSelectedDrone]);

  // Update Active Routes Layer
  useEffect(() => {
    const layer = routeLayerRef.current;
    layer.clearLayers();
    if (!layers.routes) return;

    missions.forEach((mission) => {
      if (mission.status === 'IN_PROGRESS' || mission.status === 'PENDING') {
        try {
          const wps: [number, number][] = JSON.parse(mission.route_geometry_geojson);
          if (wps && wps.length > 1) {
            // Main flight corridor line
            const isProgress = mission.status === 'IN_PROGRESS';
            const polyline = L.polyline(wps, {
              color: isProgress ? '#2563EB' : '#94A3B8',
              weight: isProgress ? 4 : 2,
              opacity: 0.85,
              dashArray: isProgress ? '6, 8' : '4, 4',
            });

            polyline.bindTooltip(
              `<div class="p-1 font-sans">
                <span class="font-bold text-xs text-navy">${mission.mission_code}</span>
                <p class="text-[10px] text-slate-600">${mission.name}</p>
                <p class="text-[10px] font-mono text-blue-600">Progress: ${mission.current_progress_pct}% (${mission.distance_km} km)</p>
              </div>`,
              { sticky: true }
            );

            layer.addLayer(polyline);
          }
        } catch {
          // ignore parsing error
        }
      }
    });
  }, [missions, layers.routes]);

  // Update Airspace Obstacles Layer
  useEffect(() => {
    const layer = obstacleLayerRef.current;
    layer.clearLayers();
    if (!layers.obstacles) return;

    observations
      .filter((obs) => obs.category === 'OBSTACLE')
      .forEach((obs) => {
        const obsIcon = L.divIcon({
          className: 'custom-obstacle-marker',
          html: `
            <div class="relative flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -50%);">
              <div class="w-7 h-7 rounded-lg bg-amber-500 border border-white shadow-md flex items-center justify-center text-white transition-transform group-hover:scale-125">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </div>
          `,
          iconSize: [28, 28],
        });

        const marker = L.marker([obs.latitude, obs.longitude], { icon: obsIcon });
        marker.on('click', () => {
          setSelectedObservation(obs);
          if (onSelectObservation) onSelectObservation(obs);
        });

        // Radius buffer circle
        const circle = L.circle([obs.latitude, obs.longitude], {
          radius: obs.radius_m,
          color: '#D97706',
          fillColor: '#F59E0B',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '3, 4'
        });

        marker.bindTooltip(
          `<div class="p-1 font-sans">
            <span class="font-bold text-xs text-amber-900">${obs.name}</span>
            <p class="text-[10px] text-slate-600">Height: ${obs.altitude_max_m}m AGL | Severity: ${obs.severity}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">${obs.details || ''}</p>
          </div>`,
          { direction: 'top', offset: [0, -14] }
        );

        layer.addLayer(marker);
        layer.addLayer(circle);
      });
  }, [observations, layers.obstacles, onSelectObservation, setSelectedObservation]);

  // Update Bird Hotspots Layer
  useEffect(() => {
    const layer = birdLayerRef.current;
    layer.clearLayers();
    if (!layers.birds) return;

    observations
      .filter((obs) => obs.category === 'BIRD_HOTSPOT')
      .forEach((obs) => {
        const circle = L.circle([obs.latitude, obs.longitude], {
          radius: obs.radius_m,
          color: '#008C95',
          fillColor: '#008C95',
          fillOpacity: 0.18,
          weight: 2,
        });

        circle.on('click', () => {
          setSelectedObservation(obs);
          if (onSelectObservation) onSelectObservation(obs);
        });

        circle.bindTooltip(
          `<div class="p-1 font-sans">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-xs text-tealaccent">Avian Activity Hotspot</span>
              <span class="text-[9px] px-1 rounded bg-tealaccent/10 text-tealaccent font-mono">${obs.verified ? 'Verified' : 'Unverified'}</span>
            </div>
            <p class="text-xs font-semibold text-slate-800 mt-0.5">${obs.name}</p>
            <p class="text-[10px] text-slate-500">${obs.details || ''}</p>
          </div>`
        );

        layer.addLayer(circle);
      });
  }, [observations, layers.birds, onSelectObservation, setSelectedObservation]);

  // Update Restricted DGCA Zones Layer
  useEffect(() => {
    const layer = restrictedLayerRef.current;
    layer.clearLayers();
    if (!layers.restricted) return;

    observations
      .filter((obs) => obs.category === 'RESTRICTED_ZONE')
      .forEach((obs) => {
        const circle = L.circle([obs.latitude, obs.longitude], {
          radius: obs.radius_m,
          color: '#DC2626',
          fillColor: '#EF4444',
          fillOpacity: 0.22,
          weight: 2.5,
          dashArray: '6, 6'
        });

        circle.on('click', () => {
          setSelectedObservation(obs);
          if (onSelectObservation) onSelectObservation(obs);
        });

        circle.bindTooltip(
          `<div class="p-1 font-sans">
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">DGCA Red Zone</span>
              <span class="text-[10px] font-mono text-red-700">Strict Hard Constraint</span>
            </div>
            <p class="text-xs font-bold text-slate-900 mt-1">${obs.name}</p>
            <p class="text-[10px] text-slate-600">${obs.details || ''}</p>
          </div>`
        );

        layer.addLayer(circle);
      });
  }, [observations, layers.restricted, onSelectObservation, setSelectedObservation]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-aeroborder shadow-card bg-slate-100">
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Layer Visibility Control Floating Bar */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-xs p-2 rounded-xl shadow-panel border border-aeroborder flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 text-xs font-bold text-navy">
          <Layers className="w-3.5 h-3.5 text-tealaccent" />
          <span className="hidden sm:inline">Layers</span>
        </div>

        <button
          onClick={() => toggleLayer('drones')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layers.drones
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-400 hover:text-slate-700 bg-slate-50'
          }`}
        >
          <Plane className="w-3 h-3" />
          <span>Drones ({drones.length})</span>
        </button>

        <button
          onClick={() => toggleLayer('depots')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layers.depots
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-700 bg-slate-50'
          }`}
        >
          <Building2 className="w-3 h-3 text-tealaccent" />
          <span>Hubs ({depots.length})</span>
        </button>

        <button
          onClick={() => toggleLayer('routes')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layers.routes
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-400 hover:text-slate-700 bg-slate-50'
          }`}
        >
          <Navigation className="w-3 h-3" />
          <span>Routes</span>
        </button>

        <button
          onClick={() => toggleLayer('obstacles')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layers.obstacles
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'text-slate-400 hover:text-slate-700 bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Obstacles</span>
        </button>

        <button
          onClick={() => toggleLayer('birds')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layers.birds
              ? 'bg-teal-50 text-tealaccent-dark border border-teal-200'
              : 'text-slate-400 hover:text-slate-700 bg-slate-50'
          }`}
        >
          <Bird className="w-3 h-3" />
          <span>Bird Hotspots</span>
        </button>

        <button
          onClick={() => toggleLayer('restricted')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layers.restricted
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-slate-400 hover:text-slate-700 bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>DGCA Restricted</span>
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-xl shadow-panel border border-aeroborder text-xs text-slate-700 hidden sm:block">
        <p className="text-[10px] uppercase font-bold tracking-wider text-navy mb-1.5">
          AeroSentinel Delhi Map Legend
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Drone (In Flight)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Drone (Available)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-navy"></span>
            <span>Autonomous Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span>Tower Obstacle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tealaccent/40 border border-tealaccent"></span>
            <span>Bird Bio-Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-600"></span>
            <span>DGCA No-Fly Exclusion</span>
          </div>
        </div>
        <p className="mt-1.5 pt-1 border-t border-slate-200 text-[9px] text-slate-400">
          Telemetry: Simulated live kinematic loop | Legal zones illustrative
        </p>
      </div>
    </div>
  );
};
