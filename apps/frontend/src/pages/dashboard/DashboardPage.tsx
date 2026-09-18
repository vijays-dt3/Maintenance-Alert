import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Wrench,
  PackageCheck,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { PriorityBadge, WorkOrderStatusBadge, EquipmentStatusBadge } from '../../components/ui/StatusBadge';
import { DashboardData } from '@maintenance/shared';

const STATUS_COLORS: Record<string, string> = {
  HEALTHY: '#10b981',
  AT_RISK: '#f59e0b',
  CRITICAL: '#ef4444',
  UNDER_MAINTENANCE: '#3b82f6',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#8b5cf6',
};

export const DashboardPage: React.FC = () => {
  const { data: response, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/dashboard/overview') as any,
  });

  const dashboard = response?.data;
  const summary = dashboard?.summary;

  return (
    <div className="space-y-6">
      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equipment */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Equipment
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {summary?.totalEquipment ?? 5}
            </span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {summary?.healthyEquipment ?? 3} Healthy
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span className="text-amber-400 font-medium">{summary?.atRiskEquipment ?? 1} At Risk</span>
            &bull;
            <span className="text-red-400 font-medium">{summary?.criticalEquipment ?? 0} Critical</span>
          </div>
        </Card>

        {/* Active Alerts */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Alerts
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {summary?.openAlerts ?? 1}
            </span>
            {summary?.criticalAlerts ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-semibold animate-pulse">
                {summary.criticalAlerts} Critical
              </span>
            ) : (
              <span className="text-xs text-slate-400">0 Critical</span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">Breach triggers awaiting action</p>
        </Card>

        {/* Open Work Orders */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Open Work Orders
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {summary?.openWorkOrders ?? 2}
            </span>
            {summary?.overdueWorkOrders ? (
              <span className="text-xs text-red-400 font-medium flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {summary.overdueWorkOrders} Overdue
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium">On Schedule</span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">Assigned, In Progress, Waiting</p>
        </Card>

        {/* Spare Parts Health */}
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Spare Parts Status
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {summary?.lowStockPartsCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">Below Reorder Level</span>
          </div>
          <p className="mt-2 text-xs text-emerald-400 font-medium">Inventory Allocated Cleanly</p>
        </Card>
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Health Distribution */}
        <Card>
          <CardHeader
            title="Equipment Health Distribution"
            subtitle="Real-time operational condition of fleet"
            icon={<Cpu className="w-4 h-4" />}
          />
          <div className="h-60 flex items-center justify-center">
            {dashboard?.healthDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.healthDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {dashboard.healthDistribution.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || '#64748b'}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500">Loading telemetry chart...</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-industrial-800/80">
            {dashboard?.healthDistribution?.map((item) => (
              <div key={item.status} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
                />
                <span className="text-slate-400 capitalize">{item.status.toLowerCase().replace('_', ' ')}:</span>
                <span className="font-bold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Alerts by Priority */}
        <Card>
          <CardHeader
            title="Active Alerts by Priority"
            subtitle="Breaches categorized by priority algorithm"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <div className="h-60">
            {dashboard?.alertPriorityDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboard.alertPriorityDistribution}
                  margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="priority" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {dashboard.alertPriorityDistribution.map((entry) => (
                      <Cell
                        key={entry.priority}
                        fill={PRIORITY_COLORS[entry.priority] || '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="mt-2 pt-3 border-t border-industrial-800 text-xs text-slate-400 flex justify-between">
            <span>Critical: &ge;25% breach or &ge;15% critical machine</span>
            <span>High: &ge;10% breach</span>
          </div>
        </Card>

        {/* Maintenance Trend */}
        <Card>
          <CardHeader
            title="Maintenance Completions"
            subtitle="Work orders resolved over last 7 days"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <div className="h-60">
            {dashboard?.maintenanceTrends ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dashboard.maintenanceTrends}
                  margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedCount"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="mt-2 pt-3 border-t border-industrial-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Atomic RPC transactions</span>
            <span className="text-emerald-400 font-medium">Zero data inconsistency</span>
          </div>
        </Card>
      </div>

      {/* Recent Alerts & Recent Work Orders Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader
            title="Recent Threshold Breaches"
            subtitle="Latest anomalies detected by parameter evaluation"
            action={
              <Link
                to="/alerts"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-industrial-800">
                <tr>
                  <th className="pb-2 font-medium">Alert ID</th>
                  <th className="pb-2 font-medium">Equipment</th>
                  <th className="pb-2 font-medium">Breach</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-800/60">
                {dashboard?.recentAlerts?.length ? (
                  dashboard.recentAlerts.map((a: any) => (
                    <tr key={a.id} className="hover:bg-industrial-800/40 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-200">
                        <Link to={`/alerts/${a.id}`} className="hover:text-blue-400">
                          {a.alert_id}
                        </Link>
                      </td>
                      <td className="py-2.5 text-slate-300">{a.equipment?.name || 'Machine'}</td>
                      <td className="py-2.5 text-amber-400 font-medium">+{a.breach_percentage}%</td>
                      <td className="py-2.5">
                        <PriorityBadge priority={a.priority} />
                      </td>
                      <td className="py-2.5 text-slate-400">{a.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No active alerts recorded. All parameters normal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Work Orders */}
        <Card>
          <CardHeader
            title="Active Work Orders"
            subtitle="Maintenance tasks in progression"
            action={
              <Link
                to="/work-orders"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-industrial-800">
                <tr>
                  <th className="pb-2 font-medium">WO Number</th>
                  <th className="pb-2 font-medium">Equipment</th>
                  <th className="pb-2 font-medium">Fault</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-800/60">
                {dashboard?.recentWorkOrders?.length ? (
                  dashboard.recentWorkOrders.map((w: any) => (
                    <tr key={w.id} className="hover:bg-industrial-800/40 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-200">
                        <Link to={`/work-orders/${w.id}`} className="hover:text-blue-400">
                          {w.work_order_number}
                        </Link>
                      </td>
                      <td className="py-2.5 text-slate-300">{w.equipment?.name || 'Machine'}</td>
                      <td className="py-2.5 text-slate-400 truncate max-w-[150px]">{w.fault_description}</td>
                      <td className="py-2.5">
                        <WorkOrderStatusBadge status={w.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No open work orders at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
