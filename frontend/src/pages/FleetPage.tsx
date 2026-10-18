import React, { useState } from 'react';
import {
  Plane, Plus, Battery, Activity, Compass, Gauge,
  Clock, MapPin, Search, Filter, ShieldCheck, Zap
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DroneDetailDrawer } from '../components/common/DroneDetailDrawer';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { Drone } from '../types';

export const FleetPage: React.FC = () => {
  const {
    drones,
    depots,
    refreshFleet,
    selectedDrone,
    setSelectedDrone
  } = useAppStore();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New drone form fields
  const [droneCode, setDroneCode] = useState<string>('');
  const [model, setModel] = useState<string>('SkyRanger Pro');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [batteryCapacity, setBatteryCapacity] = useState<number>(1.8);
  const [maxRange, setMaxRange] = useState<number>(45.0);
  const [maxPayload, setMaxPayload] = useState<number>(5.0);
  const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null);

  const filteredDrones = drones.filter((d) => {
    const matchesStatus = filterStatus === 'ALL' || d.status === filterStatus;
    const matchesSearch =
      d.drone_code.toLowerCase().includes(search.toLowerCase()) ||
      d.model.toLowerCase().includes(search.toLowerCase()) ||
      d.serial_number.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleRegisterDrone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!droneCode || !serialNumber) return;
    setIsSubmitting(true);

    const depot = depots.find((dp) => dp.id === selectedDepotId) || depots[0];
    const initialLat = depot ? depot.latitude : 28.6328;
    const initialLng = depot ? depot.longitude : 77.2197;

    try {
      await api.createDrone({
        drone_code: droneCode.toUpperCase(),
        model,
        serial_number: serialNumber.toUpperCase(),
        latitude: initialLat,
        longitude: initialLng,
        battery_pct: 100.0,
        health_pct: 100.0,
        status: 'AVAILABLE',
        max_range_km: maxRange,
        battery_capacity_kwh: batteryCapacity,
        max_payload_kg: maxPayload,
        consumption_rate_kwh_per_km: 0.035,
        current_depot_id: depot ? depot.id : null
      });

      await refreshFleet();
      setIsRegisterOpen(false);
      // Reset form
      setDroneCode('');
      setSerialNumber('');
    } catch (err: any) {
      alert(err.message || 'Failed to register drone');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <Plane className="w-4 h-4 text-aeroblue" />
            Autonomous Drone Fleet Registry ({drones.length} Aircraft)
          </h3>
          <p className="text-xs text-aerotext-secondary mt-0.5">
            Operational status, state of charge, payload configuration, and depot base assignments
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, model, serial..."
              className="w-full text-xs bg-slate-50 border border-aeroborder rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-aeroblue focus:bg-white"
            />
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-tealaccent" />
            Register Aircraft
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'AVAILABLE', 'IN_FLIGHT', 'CHARGING', 'MAINTENANCE', 'OFFLINE'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === st
                ? 'bg-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-aeroborder hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'Entire Fleet' : st.replace('_', ' ')}
            <span className="ml-1.5 text-[10px] opacity-75 font-mono">
              ({st === 'ALL' ? drones.length : drones.filter((d) => d.status === st).length})
            </span>
          </button>
        ))}
      </div>

      {/* Drone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredDrones.map((drone) => {
          const depot = depots.find((d) => d.id === drone.current_depot_id);

          return (
            <div
              key={drone.id}
              onClick={() => setSelectedDrone(drone)}
              className="bg-white rounded-xl border border-aeroborder p-5 shadow-card hover:shadow-panel hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-aeroblue">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-sm text-navy">{drone.drone_code}</h4>
                      <p className="text-[10px] text-slate-400 font-sans">{drone.model}</p>
                    </div>
                  </div>
                  <StatusBadge status={drone.status} size="sm" />
                </div>

                {/* Battery Bar */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-600" />
                      State of Charge
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round(drone.battery_pct)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
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
                </div>

                {/* Specifications Metrics */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-sans">Max Range</span>
                    <span className="font-bold text-slate-800">{drone.max_range_km} km</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-sans">Max Payload</span>
                    <span className="font-bold text-slate-800">{drone.max_payload_kg} kg</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Location / Depot */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[170px]">
                  <MapPin className="w-3 h-3 text-tealaccent shrink-0" />
                  {depot ? depot.name.split(' ')[0] : 'In Transit'}
                </span>
                <span className="font-mono font-semibold text-aeroblue text-[11px] hover:underline">
                  Inspect →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register Drone */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Fleet Drone"
        subtitle="Provision an autonomous aircraft with avionics telemetry and base depot assignment"
      >
        <form onSubmit={handleRegisterDrone} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aircraft Call-Sign</label>
              <input
                type="text"
                required
                value={droneCode}
                onChange={(e) => setDroneCode(e.target.value)}
                placeholder="e.g. AERO-X3"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-aeroblue focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SR-PRO-2026-905"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-aeroblue focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Airframe Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            >
              <option value="SkyRanger Pro">SkyRanger Pro (Standard High-Speed Multi-Rotor)</option>
              <option value="Valkyrie VTOL Long-Range">Valkyrie VTOL Long-Range (Inter-City Fixed-Wing)</option>
              <option value="Sentinel Reconnaissance Mk IV">Sentinel Reconnaissance Mk IV (Surveillance Swarm)</option>
              <option value="HeavyLifter Cargo Carrier">HeavyLifter Cargo Carrier (Heavy Medical Payload)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Battery (kWh)</label>
              <input
                type="number"
                step="0.1"
                required
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Range (km)</label>
              <input
                type="number"
                step="1"
                required
                value={maxRange}
                onChange={(e) => setMaxRange(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payload (kg)</label>
              <input
                type="number"
                step="0.5"
                required
                value={maxPayload}
                onChange={(e) => setMaxPayload(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Home Base Depot Hub</label>
            <select
              value={selectedDepotId || ''}
              onChange={(e) => setSelectedDepotId(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white"
            >
              <option value="">Select home depot hub...</option>
              {depots.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name} ({dep.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </Modal>

      <DroneDetailDrawer drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
    </div>
  );
};
