import React, { useState } from 'react';
import {
  Layers, Play, Square, Plus, Trash2, Plane, ShieldAlert,
  Bird, CheckCircle2, MapPin, Activity, Compass
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { SwarmTeam, Drone } from '../types';

export const SwarmsPage: React.FC = () => {
  const {
    swarms,
    drones,
    observations,
    refreshSwarms,
    refreshFleet
  } = useAppStore();

  const [activeSwarmForAssign, setActiveSwarmForAssign] = useState<SwarmTeam | null>(null);
  const [selectedDroneIdToAssign, setSelectedDroneIdToAssign] = useState<number | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState<boolean>(false);
  const [targetSwarmForSurvey, setTargetSwarmForSurvey] = useState<SwarmTeam | null>(null);
  const [surveyArea, setSurveyArea] = useState<string>('Yamuna Biodiversity River Corridor');
  const [surveyObjective, setSurveyObjective] = useState<string>('LiDAR structural tower mapping & bird nest thermal scan');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const unassignedDrones = drones.filter((d) => !d.assigned_swarm_id);

  const handleAssignDrone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSwarmForAssign || !selectedDroneIdToAssign) return;
    setIsLoading(true);
    try {
      await api.assignDroneToSwarm(activeSwarmForAssign.id, selectedDroneIdToAssign, 'assign');
      await Promise.all([refreshSwarms(), refreshFleet()]);
      setActiveSwarmForAssign(null);
      setSelectedDroneIdToAssign(null);
    } catch (e: any) {
      alert(e.message || 'Failed to assign drone to swarm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDrone = async (swarmId: number, droneId: number) => {
    if (confirm('Detach this drone from swarm unit?')) {
      try {
        await api.assignDroneToSwarm(swarmId, droneId, 'remove');
        await Promise.all([refreshSwarms(), refreshFleet()]);
      } catch (e: any) {
        alert(e.message || 'Failed to detach drone');
      }
    }
  };

  const handleLaunchSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSwarmForSurvey) return;
    setIsLoading(true);
    try {
      await api.startSwarmSurvey(targetSwarmForSurvey.id, surveyArea, surveyObjective);
      await refreshSwarms();
      setIsSurveyModalOpen(false);
      setTargetSwarmForSurvey(null);
    } catch (e: any) {
      alert(e.message || 'Failed to launch swarm survey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHaltSurvey = async (swarmId: number) => {
    try {
      await api.stopSwarmSurvey(swarmId);
      await refreshSwarms();
    } catch (e: any) {
      alert(e.message || 'Failed to stop survey');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <Layers className="w-4 h-4 text-tealaccent" />
            Cooperative Swarm Reconnaissance Units
          </h3>
          <p className="text-xs text-aerotext-secondary mt-0.5">
            Decentralized multi-aircraft perimeter surveys, structural hazard detection, and wildlife monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-teal-50 text-tealaccent-dark border border-teal-200 font-semibold">
            Swarm Protocol v2.4 Active
          </span>
        </div>
      </div>

      {/* Two Swarm Teams Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {swarms.map((swarm) => {
          const isSurveying = swarm.status === 'SURVEYING';

          return (
            <div
              key={swarm.id}
              className="bg-white rounded-xl border border-aeroborder p-6 shadow-card space-y-5"
            >
              {/* Swarm Unit Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-base font-bold text-navy font-mono tracking-tight">
                      {swarm.name}
                    </h4>
                    <StatusBadge status={swarm.status} size="sm" />
                  </div>
                  <p className="text-xs text-tealaccent font-mono font-semibold mt-0.5">
                    Code: {swarm.code}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isSurveying ? (
                    <button
                      onClick={() => handleHaltSurvey(swarm.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Conclude Sweep
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTargetSwarmForSurvey(swarm);
                        setIsSurveyModalOpen(true);
                      }}
                      disabled={swarm.drones.length === 0}
                      className="px-3.5 py-1.5 rounded-lg bg-navy hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-tealaccent fill-current" />
                      Launch Autonomous Sweep
                    </button>
                  )}
                </div>
              </div>

              {/* Sector & Objective Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Target Air Corridor</span>
                  <span className="font-mono font-bold text-navy">{swarm.survey_area}</span>
                </div>
                <div className="flex items-start justify-between pt-1 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-500 shrink-0">Mission Objective</span>
                  <span className="text-slate-700 text-right text-[11px] pl-3">{swarm.mission_objective}</span>
                </div>
              </div>

              {/* Coverage Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-500 font-sans font-semibold">Grid Coverage Progress</span>
                  <span className="font-bold text-navy">{Math.round(swarm.coverage_progress_pct)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSurveying ? 'bg-tealaccent' : 'bg-slate-400'
                    }`}
                    style={{ width: `${swarm.coverage_progress_pct}%` }}
                  />
                </div>
              </div>

              {/* Statistical Metrics: Obstacles & Avian Observations */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Mapped Obstacles
                  </div>
                  <span className="text-xl font-bold font-mono text-amber-900 mt-1 block">
                    {swarm.detected_obstacles_count}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200">
                  <div className="flex items-center gap-1.5 text-tealaccent-dark text-[11px] font-semibold">
                    <Bird className="w-3.5 h-3.5 text-tealaccent" />
                    Avian Blips Logged
                  </div>
                  <span className="text-xl font-bold font-mono text-tealaccent-dark mt-1 block">
                    {swarm.bird_observations_count}
                  </span>
                </div>
              </div>

              {/* Assigned Aircraft Fleet */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Assigned Drones ({swarm.drones.length})
                  </h5>
                  <button
                    onClick={() => setActiveSwarmForAssign(swarm)}
                    className="text-xs text-aeroblue hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Attach Drone
                  </button>
                </div>

                {swarm.drones.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No drones attached. Attach an aircraft to launch cooperative surveys.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {swarm.drones.map((d) => (
                      <div
                        key={d.id}
                        className="p-2.5 rounded-lg border border-aeroborder bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="font-mono font-bold text-navy">{d.drone_code}</span>
                            <span className="text-[10px] text-slate-400 font-sans block">{d.model}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-600 text-[11px]">
                            SoC: {Math.round(d.battery_pct)}%
                          </span>
                          <StatusBadge status={d.status} size="sm" showIcon={false} />
                          <button
                            onClick={() => handleRemoveDrone(swarm.id, d.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Detach Drone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Attach Drone to Swarm */}
      <Modal
        isOpen={Boolean(activeSwarmForAssign)}
        onClose={() => setActiveSwarmForAssign(null)}
        title={`Attach Aircraft to ${activeSwarmForAssign?.name || 'Swarm'}`}
        subtitle="Select an unassigned drone to incorporate into cooperative swarm sweep formations"
      >
        <form onSubmit={handleAssignDrone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Available Fleet Aircraft</label>
            {unassignedDrones.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                All aircraft are currently assigned to swarms.
              </p>
            ) : (
              <select
                required
                value={selectedDroneIdToAssign || ''}
                onChange={(e) => setSelectedDroneIdToAssign(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-aeroblue focus:bg-white"
              >
                <option value="">Select an available drone...</option>
                {unassignedDrones.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drone_code} ({d.model}) — {d.status} (Battery: {Math.round(d.battery_pct)}%)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveSwarmForAssign(null)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDroneIdToAssign || isLoading || unassignedDrones.length === 0}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Attaching...' : 'Attach Drone to Swarm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Launch Swarm Survey */}
      <Modal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        title={`Initiate Survey Sweep: ${targetSwarmForSurvey?.name || 'Swarm'}`}
        subtitle="Configure geographic scan polygon parameters and sensor reconnaissance payload"
      >
        <form onSubmit={handleLaunchSurvey} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Air Corridor / Region</label>
            <input
              type="text"
              required
              value={surveyArea}
              onChange={(e) => setSurveyArea(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reconnaissance Objective</label>
            <textarea
              rows={3}
              required
              value={surveyObjective}
              onChange={(e) => setSurveyObjective(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSurveyModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Deploying...' : 'Deploy Swarm Formation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
