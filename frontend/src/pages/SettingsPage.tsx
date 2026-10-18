import React, { useState } from 'react';
import {
  Sliders, RotateCcw, ShieldAlert, Cpu, Database, Network,
  CheckCircle2, AlertTriangle, Zap, Server
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const {
    simulationSpeed,
    simulationPaused,
    isConnected,
    refreshFleet,
    refreshDepots,
    refreshMissions,
    refreshObservations,
    refreshSwarms
  } = useAppStore();

  const [tickRate, setTickRate] = useState<number>(2.0);
  const [reserveMargin, setReserveMargin] = useState<number>(20);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const handleSpeedChange = async (speed: number) => {
    try {
      await api.setSimulationSpeed(speed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to re-seed and reset demonstration state? This will restore pristine depots, docking stations, swarms, and fleet.')) {
      setIsResetting(true);
      try {
        await api.resetSimulationData();
        await Promise.all([
          refreshFleet(),
          refreshDepots(),
          refreshMissions(),
          refreshObservations(),
          refreshSwarms()
        ]);
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
      } catch (err: any) {
        alert(err.message || 'Failed to reset demonstration data');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Header */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card">
        <h3 className="text-sm font-bold text-navy flex items-center gap-2">
          <Sliders className="w-4 h-4 text-aeroblue" />
          AeroSentinel System Configuration & Demonstration Settings
        </h3>
        <p className="text-xs text-aerotext-secondary mt-0.5">
          Configure telemetry engine loop timing, safety reserve constraints, and restore pristine demonstration datasets
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Demonstration database reset successfully. 4 hubs, 16 docking bays, 2 swarms, and 8 drones re-seeded.</span>
        </div>
      )}

      {/* Simulation Engine Parameters */}
      <div className="bg-white rounded-xl border border-aeroborder p-6 shadow-card space-y-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy pb-2 border-b border-aeroborder">
          Telemetry & Kinematic Loop Engine
        </h4>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">Simulation Velocity Multiplier</p>
              <p className="text-[11px] text-slate-500">Accelerates drone movement along flight corridors and DC charging rates</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {[1.0, 2.0, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    simulationSpeed === s
                      ? 'bg-white text-navy shadow-xs'
                      : 'text-slate-600 hover:text-navy'
                  }`}
                >
                  {s}x Speed
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-800">Minimum Battery Safety Reserve Threshold</p>
              <p className="text-[11px] text-slate-500">
                Missions are rejected if estimated landing charge falls below this critical threshold
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="35"
                value={reserveMargin}
                onChange={(e) => setReserveMargin(parseInt(e.target.value) || 20)}
                className="w-20 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-center"
              />
              <span className="text-xs font-bold text-slate-600">% SoC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Reset Control */}
      <div className="bg-white rounded-xl border border-aeroborder p-6 shadow-card space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Demonstration Environment State Reset
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Restores the local SQLite database to pristine seeded state. Re-aligns the 4 Delhi depots, 16 docking stations,
              8 drones, sample missions, and spatial obstacle overlays.
            </p>
          </div>
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting Baseline...' : 'Reset Demo Data'}
          </button>
        </div>
      </div>

      {/* System Specifications & Architecture */}
      <div className="bg-white rounded-xl border border-aeroborder p-6 shadow-card space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy pb-2 border-b border-aeroborder">
          Platform Architecture & Prototype Boundary Notice
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-sans block">Frontend Core</span>
            <span className="font-bold text-navy">React + Vite + TypeScript</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-sans block">Backend Framework</span>
            <span className="font-bold text-navy">FastAPI + SQLite Engine</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-sans block">Real-Time Transport</span>
            <span className="font-bold text-navy">WebSockets /ws/telemetry</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Operational Integrity Statement:</p>
          <p className="text-[11px] leading-relaxed">
            All telemetry vectors and spatial waypoint movements are generated by the autonomous Python simulation engine.
            Airspace risk corridors and bird activity blips represent illustrative operational algorithms designed for hackathon demonstration.
          </p>
        </div>
      </div>
    </div>
  );
};
