import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu,
  Activity,
  AlertTriangle,
  Wrench,
  History,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  EquipmentStatusBadge,
  CriticalityBadge,
  PriorityBadge,
  WorkOrderStatusBadge,
} from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Equipment, EquipmentParameter } from '@maintenance/shared';

export const EquipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [isAddParamOpen, setIsAddParamOpen] = useState(false);
  const [paramName, setParamName] = useState('');
  const [paramUnit, setParamUnit] = useState('°C');
  const [paramThreshold, setParamThreshold] = useState('80');
  const [paramDirection, setParamDirection] = useState<'UPPER' | 'LOWER'>('UPPER');
  const [paramInterval, setParamInterval] = useState('500');

  const { data: response, isLoading } = useQuery<{ data: Equipment }>({
    queryKey: ['equipment-detail', id],
    queryFn: () => api.get(`/equipment/${id}`) as any,
    enabled: !!id,
  });

  const eq = response?.data;

  // Add parameter mutation
  const addParamMutation = useMutation({
    mutationFn: (newParam: any) => api.post(`/equipment/${id}/parameters`, newParam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-detail', id] });
      setIsAddParamOpen(false);
      setParamName('');
    },
  });

  const handleAddParameter = (e: React.FormEvent) => {
    e.preventDefault();
    addParamMutation.mutate({
      name: paramName,
      unit: paramUnit,
      threshold_value: parseFloat(paramThreshold),
      direction: paramDirection,
      service_interval: parseFloat(paramInterval) || null,
    });
  };

  if (isLoading || !eq) {
    return (
      <div className="py-12 text-center text-slate-400">
        Loading asset information...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/equipment"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Equipment Fleet
        </Link>
        <Link to={`/readings?equipment_id=${eq.id}`}>
          <Button variant="primary" size="sm" icon={<Activity className="w-3.5 h-3.5" />}>
            Log Live Reading
          </Button>
        </Link>
      </div>

      {/* Overview Info Header Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">{eq.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-industrial-800 border border-industrial-700 font-mono text-slate-300">
                  {eq.equipment_id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Location: <span className="text-slate-200">{eq.location}</span> &bull; Type:{' '}
                <span className="text-slate-200">{eq.type?.name || 'Industrial Machine'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Criticality
              </span>
              <CriticalityBadge criticality={eq.criticality} />
            </div>
            <div className="text-right pl-3 border-l border-industrial-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Condition
              </span>
              <EquipmentStatusBadge status={eq.status} />
            </div>
          </div>
        </div>
      </Card>

      {/* Monitored Parameters */}
      <Card>
        <CardHeader
          title="Monitored Parameters & Operational Thresholds"
          subtitle="Telemetric boundaries evaluated on every sensor reading"
          icon={<Activity className="w-4 h-4" />}
          action={
            role === 'MAINTENANCE_ENGINEER' && (
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddParamOpen(true)}
              >
                Add Parameter
              </Button>
            )
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-industrial-900/60 border-b border-industrial-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Parameter</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Threshold Direction</th>
                <th className="px-4 py-2.5 font-medium">Threshold Value</th>
                <th className="px-4 py-2.5 font-medium">Service Interval</th>
                <th className="px-4 py-2.5 font-medium text-right">Quick Reading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {eq.parameters && eq.parameters.length > 0 ? (
                eq.parameters.map((p) => (
                  <tr key={p.id} className="hover:bg-industrial-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{p.unit}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.direction === 'UPPER'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                        }`}
                      >
                        {p.direction === 'UPPER' ? 'UPPER (Max Ceiling)' : 'LOWER (Min Floor)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-200">
                      {p.threshold_value} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.service_interval ? `${p.service_interval} hrs / cycles` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/readings?equipment_id=${eq.id}&parameter_id=${p.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Record Reading &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No parameters configured yet. Click "Add Parameter" to configure thresholds.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Active Alerts & Open Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader
            title="Active Maintenance Alerts"
            subtitle="Breaches currently requiring response"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <div className="space-y-3">
            {eq.active_alerts && eq.active_alerts.length > 0 ? (
              eq.active_alerts.map((a: any) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl bg-industrial-900/80 border border-industrial-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/alerts/${a.id}`} className="font-bold text-slate-100 hover:text-blue-400">
                        {a.alert_id}
                      </Link>
                      <PriorityBadge priority={a.priority} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {a.parameter?.name}: {a.current_value} {a.parameter?.unit} (Threshold: {a.threshold_value}) &bull; +{a.breach_percentage}%
                    </p>
                  </div>
                  <Link to={`/alerts/${a.id}`}>
                    <Button variant="secondary" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                No active threshold alerts for this machine.
              </p>
            )}
          </div>
        </Card>

        {/* Active Work Orders */}
        <Card>
          <CardHeader
            title="Associated Work Orders"
            subtitle="Corrective maintenance underway"
            icon={<Wrench className="w-4 h-4" />}
          />
          <div className="space-y-3">
            {eq.active_work_orders && eq.active_work_orders.length > 0 ? (
              eq.active_work_orders.map((w: any) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-xl bg-industrial-900/80 border border-industrial-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/work-orders/${w.id}`} className="font-bold text-slate-100 hover:text-blue-400">
                        {w.work_order_number}
                      </Link>
                      <WorkOrderStatusBadge status={w.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-[240px]">
                      {w.fault_description}
                    </p>
                  </div>
                  <Link to={`/work-orders/${w.id}`}>
                    <Button variant="secondary" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                No active work orders open for this machine.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Add Parameter Modal */}
      <Modal
        isOpen={isAddParamOpen}
        onClose={() => setIsAddParamOpen(false)}
        title="Add Monitored Parameter"
      >
        <form onSubmit={handleAddParameter} className="space-y-4">
          <Input
            label="Parameter Name"
            placeholder="e.g. Spindle Temperature, Bearing Vibration"
            value={paramName}
            onChange={(e) => setParamName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Engineering Unit"
              placeholder="°C, mm/s, bar, A"
              value={paramUnit}
              onChange={(e) => setParamUnit(e.target.value)}
              required
            />
            <Input
              label="Threshold Value"
              type="number"
              step="any"
              placeholder="e.g. 80"
              value={paramThreshold}
              onChange={(e) => setParamThreshold(e.target.value)}
              required
            />
          </div>
          <Select
            label="Threshold Direction"
            value={paramDirection}
            onChange={(e) => setParamDirection(e.target.value as any)}
            options={[
              { value: 'UPPER', label: 'UPPER (Breaches when reading EXCEEDS threshold)' },
              { value: 'LOWER', label: 'LOWER (Breaches when reading FALLS BELOW threshold)' },
            ]}
          />
          <Input
            label="Preventive Service Interval (Hours or Cycles)"
            type="number"
            placeholder="500"
            value={paramInterval}
            onChange={(e) => setParamInterval(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddParamOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addParamMutation.isPending}>
              Save Parameter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
