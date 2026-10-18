import React, { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  BarChart3, TrendingUp, ShieldCheck, Zap, Activity,
  Plane, ArrowUpRight
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { MetricCard } from '../components/common/MetricCard';

export const AnalyticsPage: React.FC = () => {
  const { analytics, refreshAnalytics, drones, missions } = useAppStore();

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  const defaultFleetDistribution = [
    { name: 'Available', value: 4, color: '#15803D' },
    { name: 'In Flight', value: 1, color: '#2563EB' },
    { name: 'Charging', value: 2, color: '#008C95' },
    { name: 'Maintenance', value: 1, color: '#D97706' },
  ];

  const defaultFlightTrend = [
    { day: 'Mon', flightHours: 14.2, energyKwh: 48.5, missions: 12 },
    { day: 'Tue', flightHours: 18.5, energyKwh: 62.1, missions: 16 },
    { day: 'Wed', flightHours: 16.0, energyKwh: 54.0, missions: 14 },
    { day: 'Thu', flightHours: 22.4, energyKwh: 76.2, missions: 19 },
    { day: 'Fri', flightHours: 25.1, energyKwh: 85.8, missions: 23 },
    { day: 'Sat', flightHours: 19.8, energyKwh: 67.4, missions: 17 },
    { day: 'Sun', flightHours: 21.0, energyKwh: 71.3, missions: 18 },
  ];

  const defaultDepotUtilization = [
    { name: 'Connaught Place', utilizationPct: 75.0, totalStations: 4, occupiedStations: 3 },
    { name: 'Dwarka Sec 12', utilizationPct: 50.0, totalStations: 4, occupiedStations: 2 },
    { name: 'Gurugram', utilizationPct: 50.0, totalStations: 4, occupiedStations: 2 },
    { name: 'Noida Sec 62', utilizationPct: 75.0, totalStations: 4, occupiedStations: 3 },
  ];

  const defaultRiskBreakdown = [
    { category: 'Infrastructure Obstacles', count: 3, color: '#D97706' },
    { category: 'Bird Hotspots', count: 3, color: '#008C95' },
    { category: 'Restricted DGCA Zones', count: 2, color: '#DC2626' },
  ];

  const fleetDist = analytics?.fleet_distribution || defaultFleetDistribution;
  const flightTrend = analytics?.flight_trend || defaultFlightTrend;
  const depotUtil = analytics?.depot_utilization || defaultDepotUtilization;
  const riskBreak = analytics?.risk_breakdown || defaultRiskBreakdown;

  return (
    <div className="space-y-6">
      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Flights Logged"
          value="119"
          subtitle="Past 7 Days Transit"
          icon={TrendingUp}
          variant="primary"
          trend="+18.4%"
          trendPositive={true}
        />
        <MetricCard
          title="Fleet Health Index"
          value="97.8%"
          subtitle="Avionics & Actuators"
          icon={Activity}
          variant="success"
        />
        <MetricCard
          title="Grid Bay Utilization"
          value="62.5%"
          subtitle="10 of 16 Bays Active"
          icon={Zap}
          variant="teal"
        />
        <MetricCard
          title="DGCA Compliance"
          value="100%"
          subtitle="Zero Buffer Breaches"
          icon={ShieldCheck}
          variant="success"
        />
      </div>

      {/* Row 1: Flight Hours Trend & Fleet Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Flight Hours Bar/Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-aeroborder">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                Delhi NCR Flight Hours & Energy Consumption
              </h4>
              <p className="text-[11px] text-slate-500">Weekly airborne hours against battery kilowatt-hours expended</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">Past 7 Days</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flightTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="flightHours" name="Flight Hours (h)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="energyKwh" name="Energy Expended (kWh)" fill="#008C95" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Distribution Donut Chart */}
        <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
          <div className="pb-3 border-b border-aeroborder">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Fleet Operational Distribution
            </h4>
            <p className="text-[11px] text-slate-500">Current allocation across statuses</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {fleetDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {fleetDist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-mono font-bold text-slate-800 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Hub Utilization & Airspace Hazard Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depot Bay Utilization Bar Chart */}
        <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
          <div className="pb-3 border-b border-aeroborder">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Depot Bay Utilization Rates
            </h4>
            <p className="text-[11px] text-slate-500">Percentage of docking bays actively serving or charging aircraft</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depotUtil} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#1F2937' }} width={110} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Utilization']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="utilizationPct" fill="#17365D" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Category Breakdown */}
        <div className="bg-white rounded-xl border border-aeroborder p-5 shadow-card space-y-4">
          <div className="pb-3 border-b border-aeroborder">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Spatial Risk Matrix Categorization
            </h4>
            <p className="text-[11px] text-slate-500">Identified obstacles and restricted airspace objects in Delhi NCR</p>
          </div>

          <div className="space-y-3 pt-2">
            {riskBreak.map((rb, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-aeroborder bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: rb.color }} />
                    <span className="font-semibold text-slate-800">{rb.category}</span>
                  </div>
                  <span className="font-mono font-bold text-navy">{rb.count} Logged</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(rb.count / 8) * 100}%`,
                      backgroundColor: rb.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
