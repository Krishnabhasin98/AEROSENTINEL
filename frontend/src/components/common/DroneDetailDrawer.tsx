import React from 'react';
import {
  X, Plane, Battery, Gauge, Compass, Activity, Navigation,
  Zap, Clock, ShieldCheck, MapPin
} from 'lucide-react';
import { Drone, Depot } from '../../types';
import { StatusBadge } from './StatusBadge';
import { api } from '../../services/api';
import { useAppStore } from '../../stores/useAppStore';

interface DroneDetailDrawerProps {
  drone: Drone | null;
  onClose: () => void;
}

export const DroneDetailDrawer: React.FC<DroneDetailDrawerProps> = ({ drone, onClose }) => {
  const { depots, refreshFleet, refreshDepots } = useAppStore();

  if (!drone) return null;

  const currentDepot = depots.find((d) => d.id === drone.current_depot_id);

  const handleStartCharging = async () => {
    try {
      await api.startCharging(drone.id);
      await Promise.all([refreshFleet(), refreshDepots()]);
    } catch (e: any) {
      alert(e.message || 'Failed to start charging');
    }
  };

  const handleStopCharging = async () => {
    try {
      await api.stopCharging(drone.id);
      await Promise.all([refreshFleet(), refreshDepots()]);
    } catch (e: any) {
      alert(e.message || 'Failed to stop charging');
    }
  };

  const handleReleaseBay = async () => {
    try {
      await api.releaseStation(drone.id);
      await Promise.all([refreshFleet(), refreshDepots()]);
    } catch (e: any) {
      alert(e.message || 'Failed to release bay');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-white border-l border-aeroborder shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-aeroborder bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-aeroblue">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-navy font-mono">{drone.drone_code}</h3>
              <StatusBadge status={drone.status} size="sm" />
            </div>
            <p className="text-xs text-aerotext-secondary">{drone.model}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Battery & Health Gauge */}
        <div className="p-4 rounded-xl border border-aeroborder bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-aerotext-secondary flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-emerald-600" />
              State of Charge (SoC)
            </span>
            <span className="font-mono font-bold text-sm text-navy">{Math.round(drone.battery_pct)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                drone.battery_pct > 50
                  ? 'bg-emerald-500'
                  : drone.battery_pct > 25
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, drone.battery_pct))}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-tealaccent" />
              Hardware Avionics Health
            </span>
            <span className="font-mono font-bold text-emerald-700">{drone.health_pct}%</span>
          </div>
        </div>

        {/* Live Kinematic Telemetry */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-aerotext-secondary mb-2.5">
            Real-Time Kinematics
          </h4>
          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="p-3 bg-white rounded-lg border border-aeroborder">
              <span className="text-[10px] text-slate-400 block font-sans">Altitude AGL</span>
              <span className="font-bold text-navy text-sm">{Math.round(drone.altitude_m)} m</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-aeroborder">
              <span className="text-[10px] text-slate-400 block font-sans">Ground Speed</span>
              <span className="font-bold text-navy text-sm">{Math.round(drone.speed_kmh)} km/h</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-aeroborder">
              <span className="text-[10px] text-slate-400 block font-sans">Vector Heading</span>
              <span className="font-bold text-navy text-sm">{Math.round(drone.heading_deg)}°</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-aeroborder">
              <span className="text-[10px] text-slate-400 block font-sans">Max Operational Range</span>
              <span className="font-bold text-navy text-sm">{drone.max_range_km} km</span>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="p-3 bg-slate-50 rounded-lg border border-aeroborder text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 mb-1">
            <MapPin className="w-3.5 h-3.5 text-tealaccent" />
            <span className="font-semibold">Current GPS Location</span>
          </div>
          <p className="font-mono text-slate-800 text-[11px]">
            {drone.latitude.toFixed(5)}, {drone.longitude.toFixed(5)}
          </p>
          {currentDepot && (
            <p className="mt-1 text-[11px] text-slate-500">
              Docked at: <span className="font-semibold text-navy">{currentDepot.name}</span>
            </p>
          )}
        </div>

        {/* Operational Aircraft Specs */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-aerotext-secondary mb-2.5">
            Aircraft Configuration
          </h4>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Serial Number</span>
              <span className="font-mono font-medium text-slate-800">{drone.serial_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Battery Pack Capacity</span>
              <span className="font-mono font-medium text-slate-800">{drone.battery_capacity_kwh} kWh</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Energy Consumption</span>
              <span className="font-mono font-medium text-slate-800">{drone.consumption_rate_kwh_per_km} kWh/km</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Payload Capacity</span>
              <span className="font-mono font-medium text-slate-800">{drone.max_payload_kg} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Quick Actions */}
      <div className="p-4 border-t border-aeroborder bg-slate-50/70 space-y-2">
        {drone.current_station_id ? (
          <div className="grid grid-cols-2 gap-2">
            {drone.status === 'CHARGING' ? (
              <button
                onClick={handleStopCharging}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                Stop Charging
              </button>
            ) : (
              <button
                onClick={handleStartCharging}
                className="w-full py-2 px-3 rounded-lg bg-tealaccent hover:bg-tealaccent-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                Start Fast Charge
              </button>
            )}

            <button
              onClick={handleReleaseBay}
              className="w-full py-2 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              Undock Drone
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 text-center py-1">
            Drone is currently in flight or unassigned to a docking station.
          </p>
        )}
      </div>
    </div>
  );
};
