import React, { useState } from 'react';
import {
  BatteryCharging, Zap, Battery, AlertTriangle, ShieldCheck,
  Clock, Gauge, Info, Power, Activity
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';
import { DroneDetailDrawer } from '../components/common/DroneDetailDrawer';

export const BatteryPage: React.FC = () => {
  const {
    drones,
    depots,
    refreshFleet,
    refreshDepots,
    selectedDrone,
    setSelectedDrone
  } = useAppStore();

  const [reserveThreshold, setReserveThreshold] = useState<number>(20);

  const chargingDrones = drones.filter((d) => d.status === 'CHARGING');
  const lowBatteryDrones = drones.filter((d) => d.battery_pct < 30);

  const handleStartCharging = async (droneId: number) => {
    try {
      await api.startCharging(droneId);
      await Promise.all([refreshFleet(), refreshDepots()]);
    } catch (e: any) {
      alert(e.message || 'Failed to start charging');
    }
  };

  const handleStopCharging = async (droneId: number) => {
    try {
      await api.stopCharging(droneId);
      await Promise.all([refreshFleet(), refreshDepots()]);
    } catch (e: any) {
      alert(e.message || 'Failed to stop charging');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-tealaccent" />
            Battery Health & Automated Docking Bay Charging Grid
          </h3>
          <p className="text-xs text-aerotext-secondary mt-0.5">
            Real-time state of charge (SoC), safety reserve thresholds, and deterministic energy modeling
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-aeroborder rounded-lg text-xs font-mono">
            <span className="text-slate-500 font-sans">Min Reserve:</span>
            <span className="font-bold text-navy">{reserveThreshold}%</span>
          </div>
        </div>
      </div>

      {/* Deterministic Baseline Model Info Banner */}
      <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-tealaccent shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <h4 className="font-bold text-navy">
            Deterministic Baseline Energy Consumption Model
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Energy required is deterministically computed as: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">E = (Distance &times; Consumption Rate / Pack Capacity) &times; 100 &times; 1.20 Safety Margin</code>.
            If the projected landing SoC breaches the configured reserve threshold (<span className="font-semibold text-red-600">{reserveThreshold}%</span>), flight dispatch is automatically blocked to prevent in-flight power exhaustion.
          </p>
          <p className="text-[10px] text-slate-400 italic">
            * Note: This is an explainable deterministic baseline model for prototype operations; physical battery predictions require live sensor-calibrated hardware telemetry.
          </p>
        </div>
      </div>

      {/* Charging Bay Active Sessions */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-aeroborder">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Active Docking Bay Charging Sessions ({chargingDrones.length})
            </h4>
            <p className="text-[11px] text-slate-500">Fast charging bays delivering 3.3 kW to 7.4 kW DC power</p>
          </div>
        </div>

        {chargingDrones.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400">No aircraft currently plugged into charging bays.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chargingDrones.map((drone) => {
              const depot = depots.find((d) => d.id === drone.current_depot_id);
              const estMinsRemaining = Math.max(1, Math.round((100 - drone.battery_pct) * 0.4));

              return (
                <div
                  key={drone.id}
                  className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-tealaccent" />
                      <span className="font-mono font-bold text-navy text-sm">{drone.drone_code}</span>
                    </div>
                    <StatusBadge status="CHARGING" size="sm" />
                  </div>

                  {/* Charging Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-sans">Current SoC</span>
                      <span className="font-bold text-tealaccent-dark">{Math.round(drone.battery_pct)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-tealaccent h-full rounded-full transition-all duration-300 animate-pulse"
                        style={{ width: `${drone.battery_pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 font-mono pt-2 border-t border-teal-100">
                    <div className="flex justify-between">
                      <span className="font-sans">Docked At:</span>
                      <span className="font-semibold text-navy">{depot?.name.split(' ')[0] || 'Hub'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans">Est. Time to Full:</span>
                      <span className="font-semibold text-tealaccent-dark">~{estMinsRemaining} min</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStopCharging(drone.id)}
                    className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Terminate Charging
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fleet-Wide Battery State Table */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-aeroborder">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Fleet-Wide State of Charge (SoC) Registry
            </h4>
            <p className="text-[11px] text-slate-500">Live monitoring of all registered aircraft</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold border-b border-aeroborder">
              <tr>
                <th className="py-2.5 px-3">Call-Sign</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Pack Capacity</th>
                <th className="py-2.5 px-3">Current SoC</th>
                <th className="py-2.5 px-3">Avionics Health</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reserve Margin Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {drones.map((drone) => {
                const violatesReserve = drone.battery_pct < reserveThreshold;

                return (
                  <tr key={drone.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-navy">
                      {drone.drone_code}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {drone.model}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {drone.battery_capacity_kwh} kWh
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-1.5">
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
                        <span className="font-mono font-bold text-slate-800">
                          {Math.round(drone.battery_pct)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {drone.health_pct}%
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={drone.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      {violatesReserve ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Reserve Violated (&lt;20%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Nominal Reserve
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {drone.status === 'CHARGING' ? (
                        <button
                          onClick={() => handleStopCharging(drone.id)}
                          className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-semibold transition-colors"
                        >
                          Stop Charge
                        </button>
                      ) : drone.current_station_id ? (
                        <button
                          onClick={() => handleStartCharging(drone.id)}
                          className="px-2.5 py-1 rounded bg-tealaccent hover:bg-tealaccent-dark text-white text-[11px] font-semibold transition-colors shadow-xs"
                        >
                          Fast Charge
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedDrone(drone)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DroneDetailDrawer drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
    </div>
  );
};
