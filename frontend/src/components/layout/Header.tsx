import React, { useState, useEffect } from 'react';
import {
  Search, Bell, Play, Pause, FastForward, CheckCircle2,
  Clock, Shield, Radio, X, Sparkles
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { api } from '../../services/api';
import { TinyFishIntelligenceModal } from '../common/TinyFishIntelligenceModal';

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Regional Airspace Overview', subtitle: 'Live telemetry, depot docking bays, and spatial risk matrix across Delhi NCR' },
  telemetry: { title: 'Live Telemetry & Flight Stream', subtitle: 'Real-time kinematic coordinates, heading vectors, altitude, and battery drain rates' },
  airspace: { title: 'Airspace Intelligence & Obstacles', subtitle: 'Predictive risk scoring, DGCA restricted buffers, bird activity, and flight corridors' },
  fleet: { title: 'Autonomous Drone Fleet', subtitle: 'Aircraft specifications, payload limits, flight logs, and station assignments' },
  depots: { title: 'Depot & Docking Bay Management', subtitle: 'Autonomous hub operations, 16 docking stations, charging status, and maintenance' },
  swarms: { title: 'Cooperative Swarm Management', subtitle: 'AIRSWARM ALPHA & BRAVO survey sweeps, sensor blips, and area reconnaissance' },
  missions: { title: 'Missions & Predictive Route Planning', subtitle: 'Energy feasibility validation, obstacle avoidance, corridor generation, and dispatch' },
  battery: { title: 'Battery Health & Charging Grid', subtitle: 'State of Charge (SoC), reserve threshold monitoring, and bay power delivery' },
  analytics: { title: 'Operations Analytics & Performance', subtitle: 'Fleet utilization, flight hours trend, depot efficiency, and risk breakdown' },
  settings: { title: 'System Settings & Simulation Controls', subtitle: 'Telemetry refresh rates, safety reserve thresholds, and pristine demo data reset' }
};

export const Header: React.FC = () => {
  const {
    activeTab,
    isConnected,
    simulationRunning,
    simulationPaused,
    simulationSpeed,
    events,
    searchQuery,
    setSearchQuery
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isSpeedUpdating, setIsSpeedUpdating] = useState<boolean>(false);
  const [isTinyFishOpen, setIsTinyFishOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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
    setIsSpeedUpdating(true);
    try {
      await api.setSimulationSpeed(speed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSpeedUpdating(false);
    }
  };

  const pageInfo = TAB_TITLES[activeTab] || { title: 'AeroSentinel Command', subtitle: 'Autonomous Drone Operations' };

  return (
    <header className="h-16 bg-white border-b border-aeroborder fixed top-0 left-64 right-0 z-20 px-6 flex items-center justify-between shadow-xs">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col">
        <h2 className="text-sm font-bold text-navy tracking-tight flex items-center gap-2">
          {pageInfo.title}
        </h2>
        <p className="text-[11px] text-aerotext-secondary hidden md:block">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Center Global Search */}
      <div className="relative w-72 max-w-xs hidden lg:block">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search drones, hubs, missions, hazards..."
          className="w-full bg-slate-50 border border-aeroborder rounded-lg pl-8 pr-3 py-1.5 text-xs text-aerotext-primary focus:outline-none focus:ring-1 focus:ring-aeroblue focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Right Controls: Sim Controller, Connection Badge, Time, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Simulation Speed & Play/Pause Controller */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button
            onClick={handleToggleSimulation}
            title={simulationPaused ? 'Resume Simulation' : 'Pause Simulation'}
            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
              simulationPaused
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-emerald-600 text-white shadow-xs'
            }`}
          >
            {simulationPaused ? (
              <Play className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current" />
            )}
          </button>
          
          <div className="flex items-center px-1 gap-1 text-[11px] font-mono font-semibold text-slate-600">
            {[1.0, 2.0, 5.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  simulationSpeed === s
                    ? 'bg-white text-navy font-bold shadow-xs'
                    : 'text-slate-500 hover:text-navy'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* WebSocket Connection Status Pill */}
        <div
          title={isConnected ? 'Live WebSocket Connected' : 'Connecting to Telemetry Stream...'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="font-mono text-[10px]">
            {isConnected ? 'LIVE WS' : 'CONNECTING'}
          </span>
        </div>

        {/* TinyFish.ai Airspace Sentinel Button */}
        <button
          onClick={() => setIsTinyFishOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-cyan-500/20 transition-all border border-cyan-400/30"
          title="Open TinyFish.ai Regulatory & Airspace Intelligence"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
          <span className="hidden sm:inline">TinyFish AI</span>
        </button>

        {/* Delhi Time Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-aeroborder rounded-lg text-xs font-mono text-aerotext-secondary">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || '12:00:00 IST'}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors relative"
            title="System Events & Alerts"
          >
            <Bell className="w-4 h-4" />
            {events.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-critical" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-aeroborder p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-aeroborder mb-2">
                <span className="text-xs font-semibold text-navy">
                  Recent System Events ({events.length})
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {events.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No recent events logged</p>
                ) : (
                  events.slice(0, 6).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-600">{ev.event_type}</span>
                        <span>{new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-medium text-aerotext-primary text-xs">{ev.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{ev.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-aeroborder">
          <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center ring-2 ring-slate-100">
            FC
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-navy leading-none">Flight Commander</p>
            <p className="text-[10px] text-tealaccent leading-none mt-1">Delhi Sector Control</p>
          </div>
        </div>
      </div>

      {/* TinyFish Intelligence Modal */}
      <TinyFishIntelligenceModal
        isOpen={isTinyFishOpen}
        onClose={() => setIsTinyFishOpen(false)}
      />
    </header>
  );
};
