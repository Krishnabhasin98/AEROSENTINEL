import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Bird, ShieldAlert, Plus, Check,
  Info, ExternalLink, MapPin, Eye, Filter, Sparkles
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DelhiOperationsMap } from '../components/map/DelhiOperationsMap';
import { Modal } from '../components/common/Modal';
import { TinyFishIntelligenceModal } from '../components/common/TinyFishIntelligenceModal';
import { api } from '../services/api';
import { AirspaceObservation } from '../types';

export const AirspacePage: React.FC = () => {
  const {
    observations,
    refreshObservations,
    selectedObservation,
    setSelectedObservation
  } = useAppStore();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTinyFishOpen, setIsTinyFishOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New observation form
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('OBSTACLE');
  const [formLat, setFormLat] = useState<number>(28.62);
  const [formLng, setFormLng] = useState<number>(77.25);
  const [formRadius, setFormRadius] = useState<number>(300);
  const [formMaxAlt, setFormMaxAlt] = useState<number>(150);
  const [formSeverity, setFormSeverity] = useState<string>('MEDIUM');
  const [formDetails, setFormDetails] = useState<string>('');

  const filteredObservations = observations.filter((obs) => {
    if (filterCategory === 'ALL') return true;
    return obs.category === filterCategory;
  });

  const handleToggleVerification = async (obsId: number) => {
    try {
      await api.toggleVerifyObservation(obsId);
      await refreshObservations();
    } catch (e: any) {
      alert(e.message || 'Failed to toggle verification');
    }
  };

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;
    setIsSubmitting(true);
    try {
      await api.createAirspaceObservation({
        name: formName,
        category: formCategory as any,
        latitude: formLat,
        longitude: formLng,
        radius_m: formRadius,
        altitude_min_m: 0,
        altitude_max_m: formMaxAlt,
        severity: formSeverity as any,
        confidence_pct: 85,
        verified: false,
        is_hard_constraint: formCategory === 'RESTRICTED_ZONE',
        details: formDetails || 'Operator logged field observation'
      });
      await refreshObservations();
      setIsModalOpen(false);
      // Reset form
      setFormName('');
      setFormDetails('');
    } catch (err: any) {
      alert(err.message || 'Failed to log observation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Map Display */}
      <div className="bg-white rounded-xl border border-aeroborder p-4 shadow-card">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-tealaccent" />
              Delhi Airspace Intelligence & Spatial Obstacle Matrix
            </h3>
            <p className="text-[11px] text-aerotext-secondary">
              Predictive risk layers, DGCA no-fly exclusion zones, bird migration corridors, and candidate airways
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTinyFishOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs border border-cyan-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              TinyFish DGCA & Met Feed
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-tealaccent" />
              Report Hazard / Observation
            </button>
          </div>
        </div>

        <DelhiOperationsMap height="460px" onSelectObservation={(obs) => setSelectedObservation(obs)} />
      </div>


      {/* Transparent Predictive Risk Model Heuristics Banner */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-aeroblue mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-navy">
              Transparent Heuristic Risk Engine & Hard Constraint Rules
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Airspace risk scores (0–100) are deterministically computed based on proximity offsets to physical structures,
              seasonal avian thermal corridors, and battery reserve margins.
              <span className="font-semibold text-red-700"> DGCA Red Zones (e.g. IGI Airport buffer) operate as strict hard constraints</span> and will instantly disqualify flight plans regardless of score.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 font-semibold">
            Heuristic Model v1.2
          </span>
        </div>
      </div>

      {/* Observations Management Panel */}
      <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-aeroborder">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Airspace Observations & Hazard Registry ({filteredObservations.length})
            </h4>
            <p className="text-[11px] text-slate-500">
              Review, verify, and monitor obstacles and wildlife activity blips across Delhi NCR
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'OBSTACLE', 'BIRD_HOTSPOT', 'RESTRICTED_ZONE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Hazards' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Observation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold border-b border-aeroborder">
              <tr>
                <th className="py-2.5 px-3">Hazard Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">GPS Location</th>
                <th className="py-2.5 px-3">Radius / Alt</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredObservations.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-navy text-xs block">{obs.name}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{obs.details}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {obs.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                    {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    <div>{obs.radius_m}m radius</div>
                    <div className="text-[10px] text-slate-400">up to {obs.altitude_max_m}m AGL</div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={obs.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                    {Math.round(obs.confidence_pct)}%
                  </td>
                  <td className="py-3 px-3">
                    {obs.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleVerification(obs.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        obs.verified
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          : 'bg-tealaccent hover:bg-tealaccent-dark text-white shadow-xs'
                      }`}
                    >
                      {obs.verified ? 'Mark Unverified' : 'Verify Hazard'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log New Observation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Airspace Observation"
        subtitle="Log newly detected obstacle, avian thermal cluster, or temporary flight restriction"
      >
        <form onSubmit={handleCreateObservation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hazard / Location Name</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Mayur Vihar Microwave Mast"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white focus:outline-none"
              >
                <option value="OBSTACLE">Infrastructure Obstacle</option>
                <option value="BIRD_HOTSPOT">Bird Activity Hotspot</option>
                <option value="RESTRICTED_ZONE">Restricted Airspace Zone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Level</label>
              <select
                value={formSeverity}
                onChange={(e) => setFormSeverity(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white focus:outline-none"
              >
                <option value="LOW">Low Advisory</option>
                <option value="MEDIUM">Medium Warning</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Hard Constraint</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formLat}
                onChange={(e) => setFormLat(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formLng}
                onChange={(e) => setFormLng(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exclusion Radius (m)</label>
              <input
                type="number"
                required
                value={formRadius}
                onChange={(e) => setFormRadius(parseInt(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Altitude AGL (m)</label>
              <input
                type="number"
                required
                value={formMaxAlt}
                onChange={(e) => setFormMaxAlt(parseInt(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Technical Description</label>
            <textarea
              rows={3}
              value={formDetails}
              onChange={(e) => setFormDetails(e.target.value)}
              placeholder="Structure height, Guy wire presence, bird species, time of peak thermal updrafts..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-aeroblue focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Submit Observation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TinyFish Intelligence Modal */}
      <TinyFishIntelligenceModal
        isOpen={isTinyFishOpen}
        onClose={() => setIsTinyFishOpen(false)}
      />
    </div>
  );
};
