import React from 'react';
import {
  Plane, Play, CheckCircle2, Zap, Navigation, ShieldAlert,
  Battery, Layers, ArrowUpRight, AlertTriangle, Activity
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DelhiOperationsMap } from '../components/map/DelhiOperationsMap';
import { DroneDetailDrawer } from '../components/common/DroneDetailDrawer';
import { DepotDetailDrawer } from '../components/common/DepotDetailDrawer';

export const OverviewPage: React.FC = () => {
  const {
    dashboardSummary,
    drones,
    depots,
    swarms,
    missions,
    observations,
    events,
    selectedDrone,
    setSelectedDrone,
    selectedDepot,
    setSelectedDepot,
    setActiveTab
  } = useAppStore();

  const kpis = dashboardSummary?.kpis || {
    total_drones: drones.length,
    drones_flying: drones.filter((d) => d.status === 'IN_FLIGHT').length,
    drones_available: drones.filter((d) => d.status === 'AVAILABLE').length,
    drones_charging: drones.filter((d) => d.status === 'CHARGING').length,
    drones_maintenance: drones.filter((d) => d.status === 'MAINTENANCE').length,
    active_missions: missions.filter((m) => m.status === 'IN_PROGRESS').length,
    total_depots: depots.length,
    total_stations: 16,
    available_stations: 8,
    airspace_risk_level: 'NOMINAL',
    overall_fleet_health_avg: 97.4,
    active_swarms: 2,
  };

  return (
    <div className="space-y-6">
      {/* Top Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Fleet"
          value={kpis.total_drones}
          subtitle="Autonomous Drones"
          icon={Plane}
          variant="default"
          onClick={() => setActiveTab('fleet')}
        />
        <MetricCard
          title="In Flight"
          value={kpis.drones_flying}
          subtitle="Live Airborne"
          icon={Play}
          variant="primary"
          trend="+1 en route"
          trendPositive={true}
          onClick={() => setActiveTab('telemetry')}
        />
        <MetricCard
          title="Available"
          value={kpis.drones_available}
          subtitle="Ready for Dispatch"
          icon={CheckCircle2}
          variant="success"
          onClick={() => setActiveTab('fleet')}
        />
        <MetricCard
          title="Charging"
          value={kpis.drones_charging}
          subtitle="Fast DC Bays"
          icon={Zap}
          variant="teal"
          onClick={() => setActiveTab('battery')}
        />
        <MetricCard
          title="Active Missions"
          value={kpis.active_missions}
          subtitle="Airways Monitored"
          icon={Navigation}
          variant="default"
          onClick={() => setActiveTab('missions')}
        />
        <MetricCard
          title="Airspace Risk"
          value={kpis.airspace_risk_level}
          subtitle="Delhi NCR Grid"
          icon={ShieldAlert}
          variant={kpis.airspace_risk_level === 'NOMINAL' ? 'success' : 'warning'}
          onClick={() => setActiveTab('airspace')}
        />
      </div>

      {/* Main Central Delhi Operations Map */}
      <div className="bg-white rounded-xl border border-aeroborder p-4 shadow-card">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-bold text-navy tracking-tight flex items-center gap-2">
              Delhi NCR Autonomous Drone Operations Map
            </h3>
            <p className="text-[11px] text-aerotext-secondary">
              Real-time simulated movement across Connaught Place, Dwarka, Gurugram, and Noida
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Live Sensor Emulation
            </span>
          </div>
        </div>

        <DelhiOperationsMap height="540px" />
      </div>

      {/* Middle Operations Panels: Recent Missions & Airspace Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Missions Table */}
        <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-aeroborder mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                Recent Mission Activity
              </h4>
              <p className="text-[11px] text-slate-500">Autonomous corridor transport logs</p>
            </div>
            <button
              onClick={() => setActiveTab('missions')}
              className="text-xs text-aeroblue hover:underline font-medium inline-flex items-center gap-1"
            >
              All Missions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Mission</th>
                  <th className="py-2 px-3">Drone</th>
                  <th className="py-2 px-3">Route</th>
                  <th className="py-2 px-3">Progress</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {missions.slice(0, 5).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-navy block">{m.mission_code}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">{m.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                      {m.drone_code || 'Unassigned'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      <span>{m.origin_name?.split(' ')[0] || 'Origin'}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span>{m.destination_name?.split(' ')[0] || 'Dest'}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-aeroblue h-1.5 rounded-full"
                            style={{ width: `${m.current_progress_pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {Math.round(m.current_progress_pct)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Airspace Risk Alerts & Observations */}
        <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-aeroborder mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                Airspace Risk Matrix & Alerts
              </h4>
              <p className="text-[11px] text-slate-500">Infrastructure hazards and wildlife blips</p>
            </div>
            <button
              onClick={() => setActiveTab('airspace')}
              className="text-xs text-aeroblue hover:underline font-medium inline-flex items-center gap-1"
            >
              Intelligence View <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {observations.slice(0, 4).map((obs) => (
              <div
                key={obs.id}
                className="p-3 rounded-lg border border-aeroborder hover:border-slate-300 transition-colors bg-slate-50/50 flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy">{obs.name}</span>
                    <StatusBadge status={obs.severity} size="sm" />
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                      {obs.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{obs.details}</p>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400 pl-2">
                  <span>Radius: {obs.radius_m}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Swarms Summary & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Swarm Teams Status */}
        <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-aeroborder mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                Autonomous Reconnaissance Swarms
              </h4>
              <p className="text-[11px] text-slate-500">Cooperative perimeter survey units</p>
            </div>
            <button
              onClick={() => setActiveTab('swarms')}
              className="text-xs text-aeroblue hover:underline font-medium inline-flex items-center gap-1"
            >
              Manage Swarms <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {swarms.map((sw) => (
              <div key={sw.id} className="p-4 rounded-xl border border-aeroborder bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-navy font-mono">{sw.name}</span>
                  <StatusBadge status={sw.status} size="sm" />
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">{sw.mission_objective}</p>
                
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                    <span>Coverage Progress</span>
                    <span>{Math.round(sw.coverage_progress_pct)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-tealaccent h-1.5 rounded-full"
                      style={{ width: `${sw.coverage_progress_pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Assigned Drones: {sw.drones.length}</span>
                  <span>Hazards: {sw.detected_obstacles_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Events Stream */}
        <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-aeroborder mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                Operations Audit Log
              </h4>
              <p className="text-[11px] text-slate-500">Real-time system events</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Auto-Streaming
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {events.slice(0, 5).map((ev) => (
              <div key={ev.id} className="text-xs p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-700">{ev.title}</span>
                    <span className="font-mono">{new Date(ev.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{ev.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-out Drawers for Selected Entities */}
      <DroneDetailDrawer drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
      <DepotDetailDrawer depot={selectedDepot} onClose={() => setSelectedDepot(null)} />
    </div>
  );
};
