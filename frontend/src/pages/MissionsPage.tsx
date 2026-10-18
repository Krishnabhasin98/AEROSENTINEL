import React, { useState, useEffect } from 'react';
import {
  Navigation, Play, Pause, XCircle, Plus, CheckCircle2,
  AlertTriangle, Battery, Clock, ArrowRight, ShieldAlert,
  Activity, Zap, Info
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../services/api';
import { RoutePlanResponse, Mission } from '../types';

export const MissionsPage: React.FC = () => {
  const {
    depots,
    drones,
    missions,
    refreshMissions,
    refreshFleet
  } = useAppStore();

  // Route Planning State
  const [originId, setOriginId] = useState<number | null>(depots[0]?.id || 1);
  const [destinationId, setDestinationId] = useState<number | null>(depots[1]?.id || 2);
  const [droneId, setDroneId] = useState<number | null>(null);
  const [missionName, setMissionName] = useState<string>('Express Transit');

  const [routePlan, setRoutePlan] = useState<RoutePlanResponse | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Filter available drones for selection
  const eligibleDrones = drones.filter((d) => d.status === 'AVAILABLE' || d.status === 'CHARGING');

  // Auto-select first eligible drone if not chosen
  useEffect(() => {
    if (!droneId && eligibleDrones.length > 0) {
      setDroneId(eligibleDrones[0].id);
    }
  }, [eligibleDrones, droneId]);

  // Evaluate candidate route when parameters change
  useEffect(() => {
    if (!originId || !destinationId || !droneId || originId === destinationId) {
      setRoutePlan(null);
      return;
    }

    let isMounted = true;
    const fetchPlan = async () => {
      setIsPlanning(true);
      setPlanError(null);
      try {
        const plan = await api.planRoute(originId, destinationId, droneId);
        if (isMounted) setRoutePlan(plan);
      } catch (err: any) {
        if (isMounted) {
          setPlanError(err.message || 'Error evaluating flight corridor');
          setRoutePlan(null);
        }
      } finally {
        if (isMounted) setIsPlanning(false);
      }
    };

    fetchPlan();
    return () => { isMounted = false; };
  }, [originId, destinationId, droneId]);

  const handleCreateAndDispatchMission = async () => {
    if (!originId || !destinationId || !droneId || !routePlan) return;
    if (!routePlan.feasible) {
      alert(`Cannot dispatch: ${routePlan.rejection_reason}`);
      return;
    }

    setIsDispatching(true);
    try {
      // 1. Create mission
      const newMission = await api.createMission({
        name: missionName || 'Logistics Transit Flight',
        drone_id: droneId,
        origin_depot_id: originId,
        destination_depot_id: destinationId
      });

      // 2. Immediately start mission
      await api.startMission(newMission.id);
      await Promise.all([refreshMissions(), refreshFleet()]);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch mission');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleStartMission = async (id: number) => {
    try {
      await api.startMission(id);
      await Promise.all([refreshMissions(), refreshFleet()]);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePauseMission = async (id: number) => {
    try {
      await api.pauseMission(id);
      await refreshMissions();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCancelMission = async (id: number) => {
    if (confirm('Abort and cancel this active flight mission?')) {
      try {
        await api.cancelMission(id);
        await Promise.all([refreshMissions(), refreshFleet()]);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <Navigation className="w-4 h-4 text-aeroblue" />
            Predictive Mission Planner & Flight Corridor Dispatch
          </h3>
          <p className="text-xs text-aerotext-secondary mt-0.5">
            Deterministic energy requirement modeling, battery reserve validation (20% reserve margin), and risk assessment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            DGCA Geofence Checked
          </span>
        </div>
      </div>

      {/* Interactive Mission Planner Box */}
      <div className="bg-white rounded-xl border border-aeroborder p-6 shadow-card space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-1">
            Configure Flight Itinerary
          </h4>
          <p className="text-xs text-slate-500">
            Select origin, destination hub, and assigned aircraft to trigger automated risk & energy feasibility evaluation
          </p>
        </div>

        {/* 4 Step Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Mission Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mission Title</label>
            <input
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="e.g. Critical Medical Cargo"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            />
          </div>

          {/* Origin Hub */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Origin Hub</label>
            <select
              value={originId || ''}
              onChange={(e) => setOriginId(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            >
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name.split(' ')[0]} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Hub */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Hub</label>
            <select
              value={destinationId || ''}
              onChange={(e) => setDestinationId(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            >
              {depots.map((d) => (
                <option key={d.id} value={d.id} disabled={d.id === originId}>
                  {d.name.split(' ')[0]} ({d.code}) {d.id === originId ? '(Same as origin)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Aircraft */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Aircraft</label>
            <select
              value={droneId || ''}
              onChange={(e) => setDroneId(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            >
              {eligibleDrones.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.drone_code} (SoC: {Math.round(d.battery_pct)}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Route Evaluation Results Box */}
        {isPlanning ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-aeroblue border-t-transparent mb-2"></div>
            <p className="text-xs text-slate-500 font-medium">Computing flight corridor and battery feasibility...</p>
          </div>
        ) : planError ? (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{planError}</span>
          </div>
        ) : routePlan ? (
          <div className="space-y-4 pt-2 border-t border-aeroborder">
            {/* Feasibility Alert */}
            {!routePlan.feasible ? (
              <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-xs uppercase tracking-wide">
                    Flight Dispatch Disqualified: Battery Reserve Violation
                  </h5>
                  <p className="text-xs">{routePlan.rejection_reason}</p>
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    Suggestion: Re-assign to an aircraft with &ge; 70% charge or dock current drone for fast DC charging.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Flight Plan Feasible</span>
                  <span className="text-emerald-700">
                    — Estimated remaining landing charge ({routePlan.remaining_battery_pct}%) safely satisfies the 20% reserve requirement.
                  </span>
                </div>
                <StatusBadge status={routePlan.risk_level} size="sm" />
              </div>
            )}

            {/* Calculations Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block">Corridor Distance</span>
                <span className="text-sm font-bold text-navy">{routePlan.distance_km} km</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block">Est. Flight Duration</span>
                <span className="text-sm font-bold text-navy">{routePlan.estimated_duration_min} min</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block">Est. Energy Consumption</span>
                <span className="text-sm font-bold text-navy">-{routePlan.battery_required_pct}% SoC</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-sans block">Est. Landing Battery</span>
                <span
                  className={`text-sm font-bold ${
                    routePlan.remaining_battery_pct >= 20 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {routePlan.remaining_battery_pct}%
                </span>
              </div>
            </div>

            {/* Risk Factors List */}
            {routePlan.risk_factors.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Detected Airspace Risk Factors ({routePlan.risk_factors.length})
                </h5>
                <div className="space-y-1">
                  {routePlan.risk_factors.map((rf, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-600">[{rf.category}]</span>
                        <span className="text-slate-700">{rf.description}</span>
                      </div>
                      <StatusBadge status={rf.severity} size="sm" showIcon={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dispatch Action Button */}
            <div className="pt-2 flex justify-end">
              <button
                disabled={!routePlan.feasible || isDispatching}
                onClick={handleCreateAndDispatchMission}
                className="px-6 py-2.5 rounded-xl bg-navy hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-tealaccent fill-current" />
                {isDispatching ? 'Dispatching Aircraft...' : 'Dispatch Flight Mission'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Operational Missions Table */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-aeroborder">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Autonomous Missions Log ({missions.length})
            </h4>
            <p className="text-[11px] text-slate-500">Active and historical flights across Delhi NCR</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold border-b border-aeroborder">
              <tr>
                <th className="py-2.5 px-3">Mission Code</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Aircraft</th>
                <th className="py-2.5 px-3">Route Corridor</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Flight Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {missions.map((m) => {
                const isProgress = m.status === 'IN_PROGRESS';
                const isPaused = m.status === 'PAUSED';
                const isPending = m.status === 'PENDING';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-navy">
                      {m.mission_code}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{m.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {m.drone_code || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      {m.origin_name?.split(' ')[0] || 'Origin'} → {m.destination_name?.split(' ')[0] || 'Dest'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {m.distance_km} km
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-aeroblue h-1.5 rounded-full"
                            style={{ width: `${m.current_progress_pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-600">
                          {Math.round(m.current_progress_pct)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={m.risk_level} size="sm" showIcon={false} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <button
                            onClick={() => handleStartMission(m.id)}
                            className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="Start Mission"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        {isProgress && (
                          <button
                            onClick={() => handlePauseMission(m.id)}
                            className="p-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white"
                            title="Pause Mission"
                          >
                            <Pause className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        {isPaused && (
                          <button
                            onClick={() => handleStartMission(m.id)}
                            className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="Resume Mission"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        {(isProgress || isPaused || isPending) && (
                          <button
                            onClick={() => handleCancelMission(m.id)}
                            className="p-1.5 rounded bg-slate-200 hover:bg-red-600 hover:text-white text-slate-600 transition-colors"
                            title="Abort / Cancel Mission"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
