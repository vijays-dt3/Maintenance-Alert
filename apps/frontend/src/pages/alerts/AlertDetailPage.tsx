import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Wrench,
  Cpu,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PriorityBadge, AlertStatusBadge, WorkOrderStatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { MaintenanceAlert } from '@maintenance/shared';

export const AlertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isWOModalOpen, setIsWOModalOpen] = useState(false);
  const [woFaultDesc, setWoFaultDesc] = useState('');
  const [woDesc, setWoDesc] = useState('');
  const [woDueDate, setWoDueDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  // 1. Fetch alert detail (includes linked work_order via join in v2)
  const { data: response, isLoading } = useQuery<{ data: MaintenanceAlert }>({
    queryKey: ['alert-detail', id],
    queryFn: () => api.get(`/alerts/${id}`) as any,
    enabled: !!id,
  });

  const alert = response?.data;

  // Acknowledge mutation
  const ackMutation = useMutation({
    mutationFn: () => api.put(`/alerts/${id}/acknowledge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  // Direct resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (notes: string) => api.put(`/alerts/${id}/resolve`, { resolution_notes: notes }),
    onSuccess: () => {
      setIsResolveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['alert-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  // Create Work Order from alert mutation (v2 atomic transition)
  const createWOMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post('/work-orders', payload);
      return res.data;
    },
    onSuccess: (newWO: any) => {
      setIsWOModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['alert-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      // Redirect to newly created work order detail
      navigate(`/work-orders/${newWO.id}`);
    },
  });

  const handleOpenWOModal = () => {
    if (!alert) return;
    setWoFaultDesc(
      `Threshold breach on ${alert.parameter?.name || 'Parameter'}: Measured ${alert.current_value} ${alert.parameter?.unit} vs threshold ${alert.threshold_value} (+${alert.breach_percentage}%)`
    );
    setWoDesc(alert.suggested_action || 'Inspect machine and replace worn components.');
    setIsWOModalOpen(true);
  };

  const handleCreateWO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alert) return;

    createWOMutation.mutate({
      equipment_id: alert.equipment_id,
      alert_id: alert.id,
      fault_description: woFaultDesc,
      description: woDesc,
      priority: alert.priority,
      due_date: woDueDate,
    });
  };

  if (isLoading || !alert) {
    return <div className="py-12 text-center text-slate-400">Loading alert details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/alerts"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Alerts Queue
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: {alert.id}</span>
      </div>

      {/* Alert Header Summary */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-white tracking-tight font-mono">
                  {alert.alert_id}
                </h2>
                <PriorityBadge priority={alert.priority} />
                <AlertStatusBadge status={alert.status} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Triggered on{' '}
                <span className="text-slate-200">{new Date(alert.created_at).toLocaleString()}</span>{' '}
                &bull; Equipment:{' '}
                <Link
                  to={`/equipment/${alert.equipment_id}`}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  {alert.equipment?.name || alert.equipment_id}
                </Link>
              </p>
            </div>
          </div>

          {/* State-dependent action buttons (v2 requirement) */}
          {role === 'MAINTENANCE_ENGINEER' && (
            <div className="flex items-center gap-2">
              {/* If OPEN -> Acknowledge button */}
              {alert.status === 'OPEN' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => ackMutation.mutate()}
                  isLoading={ackMutation.isPending}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Acknowledge Alert
                </Button>
              )}

              {/* If ACKNOWLEDGED -> Create Work Order & Resolve buttons */}
              {alert.status === 'ACKNOWLEDGED' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResolveModalOpen(true)}
                  >
                    Resolve Directly
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Wrench className="w-4 h-4" />}
                    onClick={handleOpenWOModal}
                  >
                    Create Work Order
                  </Button>
                </>
              )}

              {/* If CONVERTED_TO_WORK_ORDER -> View Work Order */}
              {alert.status === 'CONVERTED_TO_WORK_ORDER' && alert.work_order && (
                <Link to={`/work-orders/${alert.work_order.id}`}>
                  <Button variant="secondary" size="sm" icon={<Wrench className="w-4 h-4" />}>
                    View Work Order ({alert.work_order.work_order_number})
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Linked Work Order Banner if converted */}
      {alert.work_order && (
        <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-900/80 text-purple-300">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block">Work Order Generated:</span>
              <strong className="text-white font-mono text-sm">
                {alert.work_order.work_order_number}
              </strong>
            </div>
            <div className="pl-3 border-l border-purple-800">
              <WorkOrderStatusBadge status={alert.work_order.status} />
            </div>
          </div>
          <Link
            to={`/work-orders/${alert.work_order.id}`}
            className="font-semibold text-purple-300 hover:text-white flex items-center gap-1"
          >
            Open Work Order <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Threshold Breach Diagnostics Card */}
      <Card>
        <CardHeader
          title="Threshold Breach Telemetry"
          subtitle="Mathematical analysis of detected parameter breach"
          icon={<Activity className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-industrial-900/80 border border-industrial-800">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Parameter Tested
            </span>
            <span className="text-base font-bold text-white mt-1 block">
              {alert.parameter?.name || 'Parameter'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Direction: {alert.parameter?.direction || 'UPPER'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Boundary vs Measured
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold text-red-400 font-mono">
                {alert.current_value} {alert.parameter?.unit}
              </span>
              <span className="text-xs text-slate-400">
                (Limit: {alert.threshold_value} {alert.parameter?.unit})
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Breach Magnitude
            </span>
            <span className="text-base font-extrabold text-amber-400 mt-1 block">
              +{alert.breach_percentage}%
            </span>
            <span className="text-[11px] text-slate-500">Above acceptable limit</span>
          </div>
        </div>

        {/* Suggested Corrective Action */}
        <div className="mt-4 p-4 rounded-xl bg-blue-950/40 border border-blue-900/60">
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1">
            Predictive Recommendation:
          </span>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {alert.suggested_action || 'Inspect equipment condition and evaluate component wear.'}
          </p>
        </div>
      </Card>

      {/* Modal: Create Work Order from Alert */}
      <Modal
        isOpen={isWOModalOpen}
        onClose={() => setIsWOModalOpen(false)}
        title={`Generate Work Order from Alert ${alert.alert_id}`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateWO} className="space-y-4">
          <div className="p-3 rounded-lg bg-industrial-950/80 border border-industrial-800 text-xs text-slate-400">
            Alert status will atomically transition to{' '}
            <strong className="text-purple-300">CONVERTED_TO_WORK_ORDER</strong> upon submission.
          </div>

          <Input
            label="Fault Description"
            value={woFaultDesc}
            onChange={(e) => setWoFaultDesc(e.target.value)}
            required
          />

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Work Instructions / Scope
            </label>
            <textarea
              className="w-full bg-industrial-900/90 border border-industrial-700 rounded-lg p-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              rows={3}
              value={woDesc}
              onChange={(e) => setWoDesc(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Priority (Inherited)
              </span>
              <PriorityBadge priority={alert.priority} />
            </div>
            <Input
              label="Target Due Date"
              type="date"
              value={woDueDate}
              onChange={(e) => setWoDueDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-industrial-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsWOModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createWOMutation.isPending}>
              Create & Convert Alert
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Direct Resolve */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Direct Alert Resolution"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resolveMutation.mutate(resolveNotes);
          }}
          className="space-y-4"
        >
          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Resolution Notes (Required)
            </label>
            <textarea
              className="w-full bg-industrial-900/90 border border-industrial-700 rounded-lg p-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="e.g. False alarm during calibration test; normal operation resumed."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsResolveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="success" isLoading={resolveMutation.isPending}>
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
