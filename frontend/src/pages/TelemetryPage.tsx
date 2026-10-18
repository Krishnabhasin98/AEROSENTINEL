import React, { useState } from 'react';
import {
  Radio, Play, Pause, RotateCcw, FastForward, Gauge, Battery,
  Compass, Plane, MapPin, Activity, Filter, Clock
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';
import { DroneDetailDrawer } from '../components/common/DroneDetailDrawer';

export const TelemetryPage: React.FC = () => {
  const {
    drones,
    simulationRunning,
    simulationPaused,
    simulationSpeed,
    lastTelemetryPing,
    isConnected,
    selectedDrone,
    setSelectedDrone,
    refreshFleet
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredDrones = drones.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  const handleToggleSimulation = async () => {
    try {
      if (simulationPaused) {
        await api.resumeSimulation();
      } else {
        await api.pauseSimulation();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    try {
      await api.setSimulationSpeed(speed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetData = async () => {
    if (confirm('Reset demonstration fleet and telemetry to pristine baseline state?')) {
      try {
        await api.resetSimulationData();
        await refreshFleet();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Command Deck */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <Radio className="w-4 h-4 text-aeroblue animate-pulse" />
            Live Telemetry Engine & Simulator Controls
          </h3>
          <p className="text-xs text-aerotext-secondary mt-0.5">
            Streaming high-frequency GPS, heading, altitude, and battery drain vectors across Delhi NCR
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Play / Pause Toggle */}
          <button
            onClick={handleToggleSimulation}
            className={`px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition-all shadow-xs ${
              simulationPaused
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {simulationPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Telemetry
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause Simulation
              </>
            )}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            {[1.0, 2.0, 5.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  simulationSpeed === s
                    ? 'bg-white text-navy shadow-xs'
                    : 'text-slate-500 hover:text-navy'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset Baseline */}
          <button
            onClick={handleResetData}
            title="Reset to pristine seeded demo state"
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-navy hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Latency / Ping Pill */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-aeroborder text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Tick: 2.0s</span>
            <span className="text-slate-300">|</span>
            <span className={isConnected ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {isConnected ? 'LIVE WS' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'IN_FLIGHT', 'AVAILABLE', 'CHARGING', 'MAINTENANCE'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === st
                ? 'bg-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-aeroborder hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'All Aircraft' : st.replace('_', ' ')}
            <span className="ml-1.5 text-[10px] opacity-75 font-mono">
              ({st === 'ALL' ? drones.length : drones.filter((d) => d.status === st).length})
            </span>
          </button>
        ))}
      </div>

      {/* Dense Real-Time Telemetry Data Grid */}
      <div className="bg-white rounded-xl border border-aeroborder shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-aeroborder">
              <tr>
                <th className="py-3 px-4">Aircraft</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">GPS Coordinates</th>
                <th className="py-3 px-4">Altitude AGL</th>
                <th className="py-3 px-4">Ground Speed</th>
                <th className="py-3 px-4">Vector Heading</th>
                <th className="py-3 px-4">Battery SoC</th>
                <th className="py-3 px-4">Avionics Health</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredDrones.map((drone) => (
                <tr
                  key={drone.id}
                  onClick={() => setSelectedDrone(drone)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-aeroblue">
                        <Plane className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-navy font-mono text-xs">{drone.drone_code}</span>
                        <span className="text-[10px] font-sans text-slate-400 block">{drone.model}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={drone.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-700 text-[11px]">
                    {drone.latitude.toFixed(5)}, {drone.longitude.toFixed(5)}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-bold">
                    {Math.round(drone.altitude_m)} m
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-bold">
                    {Math.round(drone.speed_kmh)} km/h
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Compass className="w-3 h-3 text-slate-400" />
                      {Math.round(drone.heading_deg)}°
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            drone.battery_pct > 50
                              ? 'bg-emerald-500'
                              : drone.battery_pct > 25
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${drone.battery_pct}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800">{Math.round(drone.battery_pct)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">
                    {drone.health_pct}%
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrone(drone);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-navy text-xs font-semibold transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DroneDetailDrawer drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
    </div>
  );
};
