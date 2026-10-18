import React, { useState } from 'react';
import {
  X, Building2, Zap, CheckCircle2, AlertTriangle, Radio,
  Plus, Plane, MapPin
} from 'lucide-react';
import { Depot, Drone } from '../../types';
import { StatusBadge } from './StatusBadge';
import { useAppStore } from '../../stores/useAppStore';
import { api } from '../../services/api';

interface DepotDetailDrawerProps {
  depot: Depot | null;
  onClose: () => void;
}

export const DepotDetailDrawer: React.FC<DepotDetailDrawerProps> = ({ depot, onClose }) => {
  const { drones, refreshDepots, refreshFleet } = useAppStore();
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [selectedDroneToDock, setSelectedDroneToDock] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  if (!depot) return null;

  const availableDrones = drones.filter((d) => d.status === 'AVAILABLE' && !d.current_station_id);

  const handleDockDrone = async () => {
    if (!selectedStationId || !selectedDroneToDock) return;
    setIsAssigning(true);
    try {
      await api.assignStation(selectedDroneToDock, selectedStationId);
      await Promise.all([refreshDepots(), refreshFleet()]);
      setSelectedStationId(null);
      setSelectedDroneToDock(null);
    } catch (e: any) {
      alert(e.message || 'Failed to dock drone');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStartStationCharge = async (droneId: number) => {
    try {
      await api.startCharging(droneId);
      await Promise.all([refreshDepots(), refreshFleet()]);
    } catch (e: any) {
      alert(e.message || 'Failed to start charging');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-white border-l border-aeroborder shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-aeroborder bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-tealaccent shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-navy">{depot.name}</h3>
            </div>
            <p className="text-xs font-mono text-tealaccent font-semibold">{depot.code}</p>
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
        {/* Geographic location */}
        <div className="p-3 bg-slate-50 rounded-lg border border-aeroborder text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-tealaccent" />
            <span className="font-semibold">{depot.address || 'Delhi NCR Region'}</span>
          </div>
          <p className="font-mono text-slate-500 text-[11px]">
            GPS: {depot.latitude.toFixed(5)}, {depot.longitude.toFixed(5)}
          </p>
        </div>

        {/* Docking Bay Grid (4 Bays) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-aerotext-secondary">
              Docking Bays ({depot.stations.length})
            </h4>
            <span className="text-[11px] font-mono text-tealaccent font-semibold">
              {depot.stations.filter(s => s.status === 'AVAILABLE').length} Available
            </span>
          </div>

          <div className="space-y-2.5">
            {depot.stations.map((st) => {
              const dockedDrone = drones.find((d) => d.id === st.current_drone_id);

              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    st.status === 'CHARGING'
                      ? 'bg-teal-50/50 border-teal-200 shadow-xs'
                      : st.status === 'OCCUPIED'
                      ? 'bg-blue-50/40 border-blue-200'
                      : st.status === 'MAINTENANCE'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-aeroborder'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-navy">
                        Bay #{st.bay_number}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({st.power_output_kw} kW)
                      </span>
                    </div>
                    <StatusBadge status={st.status} size="sm" />
                  </div>

                  {dockedDrone ? (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-semibold text-slate-800">
                          {dockedDrone.drone_code}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          SoC: {Math.round(dockedDrone.battery_pct)}%
                        </span>
                      </div>

                      {st.status !== 'CHARGING' && (
                        <button
                          onClick={() => handleStartStationCharge(dockedDrone.id)}
                          className="px-2.5 py-1 rounded-md bg-tealaccent text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-tealaccent-dark transition-colors shadow-xs"
                        >
                          <Zap className="w-3 h-3" />
                          Charge
                        </button>
                      )}
                    </div>
                  ) : st.status === 'AVAILABLE' ? (
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => setSelectedStationId(st.id)}
                        className="text-[11px] text-aeroblue hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Dock Drone Here
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Dock Drone Modal / Selector */}
        {selectedStationId && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy">Assign Available Drone</span>
              <button
                onClick={() => setSelectedStationId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {availableDrones.length === 0 ? (
              <p className="text-xs text-slate-500">
                No unassigned available drones in fleet.
              </p>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedDroneToDock || ''}
                  onChange={(e) => setSelectedDroneToDock(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:outline-none"
                >
                  <option value="">Select a drone...</option>
                  {availableDrones.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.drone_code} - {d.model} ({Math.round(d.battery_pct)}% SoC)
                    </option>
                  ))}
                </select>

                <button
                  disabled={!selectedDroneToDock || isAssigning}
                  onClick={handleDockDrone}
                  className="w-full py-1.5 px-3 rounded-lg bg-aeroblue hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  {isAssigning ? 'Docking...' : 'Confirm Docking'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
