import React, { useState, useEffect } from 'react';
import {
  Sparkles, ShieldCheck, CloudRain, Navigation, Send,
  AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Bot, Info, Globe, Key
} from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../../services/api';
import { DGCARule, WeatherAdvisory, AirspaceTrafficAnalysis, TinyFishStatus } from '../../types';

interface TinyFishIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TinyFishIntelligenceModal: React.FC<TinyFishIntelligenceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dgca' | 'weather' | 'traffic' | 'ask'>('dgca');
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<TinyFishStatus | null>(null);
  const [rules, setRules] = useState<DGCARule[]>([]);
  const [weather, setWeather] = useState<WeatherAdvisory[]>([]);
  const [traffic, setTraffic] = useState<AirspaceTrafficAnalysis | null>(null);

  // API Key management state
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [keySaving, setKeySaving] = useState<boolean>(false);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);

  // Ask TinyFish State
  const [prompt, setPrompt] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<{
    sender: 'user' | 'tinyfish';
    text: string;
    citations?: string[];
    category?: string;
  }[]>([
    {
      sender: 'tinyfish',
      text: 'Greetings Commander! I am the TinyFish Airspace Agent. Ask me anything about DGCA DigitalSky 2024 compliance, Delhi NCR weather warnings, or drone traffic restrictions.',
      citations: ['DGCA DigitalSky Engine', 'IMD NCR Weather Radar']
    }
  ]);

  const fetchTinyFishData = async () => {
    setLoading(true);
    try {
      const [statusRes, rulesRes, weatherRes, trafficRes] = await Promise.all([
        api.getTinyFishStatus().catch(() => null),
        api.getTinyFishDGCARules().catch(() => ({ rules: [] })),
        api.getTinyFishWeather().catch(() => ({ advisories: [] })),
        api.getTinyFishTraffic().catch(() => null)
      ]);

      if (statusRes) setStatus(statusRes);
      if (rulesRes && rulesRes.rules) setRules(rulesRes.rules);
      if (weatherRes && weatherRes.advisories) setWeather(weatherRes.advisories);
      if (trafficRes) setTraffic(trafficRes);
    } catch (e) {
      console.error('Failed to load TinyFish intelligence', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTinyFishData();
    }
  }, [isOpen]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setKeySaving(true);
    setKeySuccess(null);
    try {
      const res = await api.updateTinyFishApiKey(apiKeyInput.trim());
      setKeySuccess(`Key configured! Mode switched to ${res.mode}`);
      setShowKeyInput(false);
      setApiKeyInput('');
      await fetchTinyFishData();
      setTimeout(() => setKeySuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update TinyFish API Key');
    } finally {
      setKeySaving(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAsking) return;

    const userMsg = prompt.trim();
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setPrompt('');
    setIsAsking(true);

    try {
      const resp = await api.queryTinyFishAgent(userMsg);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'tinyfish',
          text: resp.answer,
          citations: resp.citations,
          category: resp.category
        }
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'tinyfish',
          text: 'Encountered temporary query resolution latency. Please check backend connection or verify query details.'
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="TinyFish.ai — Autonomous Airspace & Regulatory Intelligence"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Status header banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-navy text-white rounded-xl border border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">TINYFISH AIRSPACE SENTINEL</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {status?.mode || 'VERIFIED_FEED'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Live Web Infrastructure for DGCA DigitalSky, Weather Radars & NCR Corridor Congestion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                status?.has_live_key
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
              }`}
              title="Configure your TinyFish API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{status?.has_live_key ? 'Key: Active' : 'Enter API Key'}</span>
            </button>

            <button
              onClick={fetchTinyFishData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Feeds
            </button>
          </div>
        </div>

        {/* API Key Input Form Drawer */}
        {showKeyInput && (
          <form
            onSubmit={handleSaveApiKey}
            className="p-3 bg-slate-900 border border-cyan-500/40 rounded-xl text-white space-y-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> TinyFish.ai API Key Setup
              </span>
              <span className="text-[10px] text-slate-400">
                Key status: <strong className="text-white">{status?.api_key_masked || 'None'}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Paste your TinyFish API key below or save it in <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">backend/.env</code> as <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">TINYFISH_API_KEY</code>.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste your tinyfish_... api key here"
                className="flex-1 px-3 py-1.5 bg-black/50 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
              />
              <button
                type="submit"
                disabled={keySaving || !apiKeyInput.trim()}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all"
              >
                {keySaving ? 'Saving...' : 'Save Key'}
              </button>
              <button
                type="button"
                onClick={() => setShowKeyInput(false)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Success toast notification */}
        {keySuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{keySuccess}</span>
          </div>
        )}


        {/* Tab navigation */}
        <div className="flex border-b border-aeroborder gap-2">
          <button
            onClick={() => setActiveTab('dgca')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'dgca'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            DGCA Rules & Zoning ({rules.length})
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'weather'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudRain className="w-4 h-4" />
            IMD Weather Warnings ({weather.length})
          </button>

          <button
            onClick={() => setActiveTab('traffic')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'traffic'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Drone Traffic & NOTAMs
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'ask'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-600" />
            Ask TinyFish Agent
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
            <span className="text-xs">Querying TinyFish web infrastructure & DGCA nodes...</span>
          </div>
        ) : (
          <div className="min-h-[320px] max-h-[460px] overflow-y-auto pr-1">
            {/* 1. DGCA Rules Tab */}
            {activeTab === 'dgca' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">DigitalSky Airspace Framework Active:</span> All missions within Delhi NCR depots automatically cross-reference DGCA Green (0-120m AGL), Yellow (airport transit), and Red restricted zones prior to dispatch.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3.5 bg-white border border-aeroborder rounded-xl shadow-xs hover:border-cyan-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {rule.id}
                            </span>
                            <span className="font-bold text-xs text-navy">{rule.title}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {rule.summary}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded shrink-0 ${
                            rule.impact_level === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : rule.impact_level === 'HIGH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {rule.impact_level} IMPACT
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                        <span>Ceiling: <strong className="text-slate-600">{rule.max_altitude_m}m AGL</strong></span>
                        <span className="font-mono text-cyan-700 font-medium">{rule.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Weather Advisories Tab */}
            {activeTab === 'weather' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Live IMD Telemetry Watch:</span> Wind conditions updated continuously. Recommended wind limit for AeroSentinel heavy survey platforms is 35 km/h.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {weather.map((adv) => (
                    <div
                      key={adv.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        adv.severity === 'WARNING'
                          ? 'bg-amber-50/40 border-amber-300'
                          : 'bg-white border-aeroborder'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CloudRain className={`w-4 h-4 ${adv.severity === 'WARNING' ? 'text-amber-600' : 'text-blue-500'}`} />
                          <span className="font-bold text-xs text-navy">{adv.headline}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {adv.station}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {adv.details}
                      </p>

                      <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                        <span className="font-semibold text-cyan-800">Operational Directive:</span> {adv.recommended_action}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>Valid: {adv.valid_until}</span>
                        <span className={`font-semibold ${adv.grounding_recommended ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {adv.grounding_recommended ? 'GROUNDING ACTIVE' : 'NOMINAL FLIGHT CLEARANCE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Traffic & NOTAMs Tab */}
            {activeTab === 'traffic' && traffic && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-aeroborder rounded-xl">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block">NCR Congestion Index</span>
                    <span className="text-lg font-bold font-mono text-navy">{traffic.delhi_ncr_congestion_index} / 100</span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">● Nominal Corridor Flow</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-aeroborder rounded-xl">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block">Active Logistics Lanes</span>
                    <span className="text-lg font-bold font-mono text-cyan-700">{traffic.active_commercial_corridors} Lanes</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Automated Tracking</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-aeroborder rounded-xl">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block">Airspace Status</span>
                    <span className="text-sm font-bold text-amber-700 mt-1 block">{traffic.airspace_status.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-500 block">Delhi NCR Envelope</span>
                  </div>
                </div>

                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-900">
                  <span className="font-bold">TinyFish Fleet Recommendation: </span>
                  {traffic.recommendation}
                </div>

                <div className="space-y-2 mt-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Active NOTAM Advisories
                  </span>
                  {traffic.notam_alerts.map((notam) => (
                    <div key={notam.code} className="p-3 bg-white border border-aeroborder rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-navy">{notam.code} — {notam.corridor}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          notam.status === 'RESTRICTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {notam.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5">{notam.restriction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Ask TinyFish Agent Tab */}
            {activeTab === 'ask' && (
              <div className="flex flex-col h-[380px]">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-xl border border-aeroborder mb-3">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'tinyfish' && (
                        <div className="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-cyan-700 text-white rounded-br-none'
                            : 'bg-white border border-aeroborder text-slate-800 rounded-bl-none shadow-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex flex-wrap gap-1">
                            <span className="font-medium text-slate-500">Sources:</span>
                            {msg.citations.map((cite, cIdx) => (
                              <span key={cIdx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {cite}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="flex gap-2.5 items-center text-slate-400 text-xs pl-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                      <span>TinyFish agent querying live DGCA & weather registry...</span>
                    </div>
                  )}
                </div>

                {/* Query Input */}
                <form onSubmit={handleAsk} className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask about DGCA rules, wind advisories, or depot routing..."
                    className="flex-1 px-3 py-2 text-xs border border-aeroborder rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !prompt.trim()}
                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Query
                  </button>
                </form>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">Try:</span>
                  {[
                    "Can we fly micro drones in Connaught Place green zone?",
                    "What are the wind warnings in Dwarka depot?",
                    "Are there any active NOTAMs near IGI Airport?"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
