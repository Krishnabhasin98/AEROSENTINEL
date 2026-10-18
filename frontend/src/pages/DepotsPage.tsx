import React, { useState } from 'react';
import {
  Building2, Plus, Zap, CheckCircle2, AlertTriangle, Radio,
  MapPin, Edit2, Play, Power, ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DepotDetailDrawer } from '../components/common/DepotDetailDrawer';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { Depot, DockingStation } from '../types';

export const DepotsPage: React.FC = () => {
  const {
    depots,
    drones,
    refreshDepots,
    refreshFleet,
    selectedDepot,
    setSelectedDepot
  } = useAppStore();

  const [isAddDepotOpen, setIsAddDepotOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<DockingStation | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // New Depot form
  const [depotName, setDepotName] = useState<string>('');
  const [depotCode, setDepotCode] = useState<string>('');
  const [depotLat, setDepotLat] = useState<number>(28.65);
  const [depotLng, setDepotLng] = useState<number>(77.22);
  const [depotAddress, setDepotAddress] = useState<string>('');
  const [depotCapacity, setDepotCapacity] = useState<number>(4);

  const availableDrones = drones.filter((d) => d.status === 'AVAILABLE' && !d.current_station_id);

  const handleCreateDepot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depotName || !depotCode) return;
    setIsActionLoading(true);
    try {
      await api.createDepot({
        name: depotName,
        code: depotCode.toUpperCase(),
        latitude: depotLat,
        longitude: depotLng,
        address: depotAddress,
        total_capacity: depotCapacity,
        status: 'OPERATIONAL'
      });
      await refreshDepots();
      setIsAddDepotOpen(false);
      setDepotName('');
      setDepotCode('');
    } catch (err: any) {
      alert(err.message || 'Failed to create depot');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignDroneToStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation || !selectedDroneId) return;
    setIsActionLoading(true);
    try {
      await api.assignStation(selectedDroneId, selectedStation.id);
      await Promise.all([refreshDepots(), refreshFleet()]);
      setIsAssignModalOpen(false);
      setSelectedStation(null);
      setSelectedDroneId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to assign station');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleQuickCharge = async (droneId: number) => {
    try {
      await api.startCharging(droneId);
      await Promise.all([refreshDepots(), refreshFleet()]);
    } catch (e: any) {
      alert(e.message || 'Failed to commence charging');
    }
  };

  const handleQuickStopCharge = async (droneId: number) => {
    try {
      await api.stopCharging(droneId);
      await Promise.all([refreshDepots(), refreshFleet()]);
    } catch (e: any) {
      alert(e.message || 'Failed to stop charging');
    }
  };

  const handleQuickRelease = async (droneId: number) => {
    try {
      await api.releaseStation(droneId);
      await Promise.all([refreshDepots(), refreshFleet()]);
    } catch (e: any) {
      alert(e.message || 'Failed to release bay');
    }
  };

  return (
    <div className="space-y-6">
      {/* Depots Overview Header */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <Building2 className="w-4 h-4 text-tealaccent" />
            Delhi NCR Autonomous Depot & Docking Station Grid
          </h3>
          <p className="text-xs text-aerotext-secondary mt-0.5">
            4 centralized operational hubs (Connaught Place, Dwarka Sec 12, Gurugram, Noida) with 16 automated bays
          </p>
        </div>

        <button
          onClick={() => setIsAddDepotOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-tealaccent" />
          Add Operational Hub
        </button>
      </div>

      {/* Depots Detailed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {depots.map((depot) => {
          const availCount = depot.available_stations_count ?? depot.stations.filter(s => s.status === 'AVAILABLE').length;
          const occCount = depot.occupied_stations_count ?? depot.stations.filter(s => s.status === 'OCCUPIED').length;
          const chgCount = depot.charging_stations_count ?? depot.stations.filter(s => s.status === 'CHARGING').length;

          return (
            <div
              key={depot.id}
              className="bg-white rounded-xl border border-aeroborder p-5 shadow-card flex flex-col justify-between space-y-4"
            >
              {/* Depot Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-tealaccent shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-navy">{depot.name}</h4>
                        <StatusBadge status={depot.status} size="sm" />
                      </div>
                      <p className="text-[11px] font-mono text-tealaccent font-semibold">{depot.code}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDepot(depot)}
                    className="text-xs font-semibold text-aeroblue hover:underline"
                  >
                    Manage Hub →
                  </button>
                </div>

                <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{depot.address || 'Delhi NCR Region'}</span>
                  <span className="font-mono text-[10px] text-slate-400 ml-1">
                    ({depot.latitude.toFixed(4)}, {depot.longitude.toFixed(4)})
                  </span>
                </div>

                {/* Capacity Summary Badge */}
                <div className="mt-3.5 grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Available</span>
                    <span className="text-base font-bold font-mono text-emerald-800">{availCount}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                    <span className="text-[10px] text-blue-700 font-semibold uppercase block">Occupied</span>
                    <span className="text-base font-bold font-mono text-blue-800">{occCount}</span>
                  </div>
                  <div className="bg-teal-50 border border-teal-200 p-2 rounded-lg">
                    <span className="text-[10px] text-teal-700 font-semibold uppercase block">Fast Charging</span>
                    <span className="text-base font-bold font-mono text-teal-800">{chgCount}</span>
                  </div>
                </div>
              </div>

              {/* Docking Station Bays List */}
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Docking Station Bays (4 Automated Slots)
                </h5>

                <div className="grid grid-cols-2 gap-2.5">
                  {depot.stations.map((st) => {
                    const dockedDrone = drones.find((d) => d.id === st.current_drone_id);

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          st.status === 'CHARGING'
                            ? 'bg-teal-50/60 border-teal-200'
                            : st.status === 'OCCUPIED'
                            ? 'bg-blue-50/50 border-blue-200'
                            : st.status === 'MAINTENANCE'
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-bold text-navy">Bay #{st.bay_number}</span>
                          <StatusBadge status={st.status} size="sm" showIcon={false} />
                        </div>

                        {dockedDrone ? (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-slate-800">{dockedDrone.drone_code}</span>
                              <span className="font-mono text-emerald-700 font-semibold">
                                {Math.round(dockedDrone.battery_pct)}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                              {st.status === 'CHARGING' ? (
                                <button
                                  onClick={() => handleQuickStopCharge(dockedDrone.id)}
                                  className="w-full py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold flex items-center justify-center gap-1 shadow-xs"
                                >
                                  <Power className="w-2.5 h-2.5" /> Stop
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleQuickCharge(dockedDrone.id)}
                                  className="w-full py-1 rounded bg-tealaccent hover:bg-tealaccent-dark text-white text-[10px] font-semibold flex items-center justify-center gap-1 shadow-xs"
                                >
                                  <Zap className="w-2.5 h-2.5" /> Charge
                                </button>
                              )}
                              <button
                                onClick={() => handleQuickRelease(dockedDrone.id)}
                                className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-medium"
                                title="Undock Drone"
                              >
                                Undock
                              </button>
                            </div>
                          </div>
                        ) : st.status === 'AVAILABLE' ? (
                          <div className="pt-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedStation(st);
                                setIsAssignModalOpen(true);
                              }}
                              className="w-full py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-aeroblue text-[11px] font-medium flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Dock Drone
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-700 italic pt-1">Bay undergoing maintenance</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Dock Drone to Station */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedStation(null);
        }}
        title={`Dock Drone at ${selectedStation?.station_code || 'Bay'}`}
        subtitle="Select an eligible available drone to assign to this docking station"
      >
        <form onSubmit={handleAssignDroneToStation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Eligible Available Aircraft</label>
            {availableDrones.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                No unassigned available drones in fleet. All drones are either currently in flight, charging, or in maintenance.
              </p>
            ) : (
              <select
                required
                value={selectedDroneId || ''}
                onChange={(e) => setSelectedDroneId(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-aeroblue focus:bg-white"
              >
                <option value="">Select an available aircraft...</option>
                {availableDrones.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drone_code} — {d.model} (Battery: {Math.round(d.battery_pct)}%)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDroneId || isActionLoading || availableDrones.length === 0}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isActionLoading ? 'Assigning...' : 'Confirm Bay Docking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Depot */}
      <Modal
        isOpen={isAddDepotOpen}
        onClose={() => setIsAddDepotOpen(false)}
        title="Provision New Operational Hub"
        subtitle="Register a new drone depot hub and automatically initialize its docking stations"
      >
        <form onSubmit={handleCreateDepot} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hub Name</label>
              <input
                type="text"
                required
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                placeholder="e.g. Okhla Industrial Hub"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hub Code</label>
              <input
                type="text"
                required
                value={depotCode}
                onChange={(e) => setDepotCode(e.target.value)}
                placeholder="e.g. DEPOT-OKH-05"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-aeroblue focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={depotLat}
                onChange={(e) => setDepotLat(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={depotLng}
                onChange={(e) => setDepotLng(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              value={depotAddress}
              onChange={(e) => setDepotAddress(e.target.value)}
              placeholder="e.g. Phase III, Okhla Industrial Area, New Delhi"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Docking Bays Capacity</label>
            <input
              type="number"
              min="2"
              max="8"
              value={depotCapacity}
              onChange={(e) => setDepotCapacity(parseInt(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddDepotOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isActionLoading ? 'Creating...' : 'Provision Hub'}
            </button>
          </div>
        </form>
      </Modal>

      <DepotDetailDrawer depot={selectedDepot} onClose={() => setSelectedDepot(null)} />
    </div>
  );
};
