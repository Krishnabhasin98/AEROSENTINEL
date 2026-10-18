import React from 'react';
import {
  LayoutDashboard, Radio, ShieldCheck, Plane, Building2,
  Layers, Navigation, BatteryCharging, BarChart3, Sliders,
  Compass, Activity
} from 'lucide-react';
import { useAppStore, NavigationTab } from '../../stores/useAppStore';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: (store: any) => number | string | null;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  {
    id: 'telemetry',
    label: 'Live Telemetry',
    icon: Radio,
    badge: (store) => {
      const count = store.drones.filter((d: any) => d.status === 'IN_FLIGHT').length;
      return count > 0 ? `${count} Live` : null;
    }
  },
  {
    id: 'airspace',
    label: 'Airspace Intelligence',
    icon: ShieldCheck,
    badge: (store) => {
      const alerts = store.observations.filter((o: any) => o.severity === 'CRITICAL' || o.severity === 'HIGH').length;
      return alerts > 0 ? alerts : null;
    }
  },
  {
    id: 'fleet',
    label: 'Drone Fleet',
    icon: Plane,
    badge: (store) => store.drones.length
  },
  {
    id: 'depots',
    label: 'Depot Management',
    icon: Building2,
    badge: (store) => store.depots.length
  },
  {
    id: 'swarms',
    label: 'Swarm Management',
    icon: Layers,
    badge: (store) => store.swarms.length
  },
  {
    id: 'missions',
    label: 'Missions & Routes',
    icon: Navigation,
    badge: (store) => {
      const active = store.missions.filter((m: any) => m.status === 'IN_PROGRESS').length;
      return active > 0 ? active : null;
    }
  },
  {
    id: 'battery',
    label: 'Battery & Charging',
    icon: BatteryCharging,
    badge: (store) => {
      const chg = store.drones.filter((d: any) => d.status === 'CHARGING').length;
      return chg > 0 ? `${chg} Chg` : null;
    }
  },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const store = useAppStore();

  return (
    <aside className="w-64 bg-white border-r border-aeroborder flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-aeroborder flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center text-white shadow-sm">
            <Compass className="w-5 h-5 text-tealaccent" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-navy">
              AEROSENTINEL
            </h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-tealaccent">
              Delhi NCR Airspace Ops
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-aerotext-secondary">
          Operations Command
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badgeValue = item.badge ? item.badge(store) : null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-navy text-white shadow-sm font-semibold'
                  : 'text-aerotext-primary hover:bg-slate-100/80 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-tealaccent' : 'text-aerotext-secondary'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {badgeValue !== null && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                    isActive
                      ? 'bg-tealaccent text-white'
                      : typeof badgeValue === 'string' && badgeValue.includes('Live')
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-aeroborder bg-slate-50/70">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-aerotext-secondary text-[11px] font-medium">DGCA Geofence Grid</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
            SECURE
          </span>
        </div>
      </div>
    </aside>
  );
};
