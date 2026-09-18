import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  ArrowLeft,
  Calendar,
  User,
  Package,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Lock,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  PriorityBadge,
  WorkOrderStatusBadge,
  PartAvailabilityBadge,
  EquipmentStatusBadge,
} from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { SparePart, WorkOrder, WorkOrderStatus } from '@maintenance/shared';

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partNotes, setPartNotes] = useState('');

  // Close work order modal state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actualPartsUsage, setActualPartsUsage] = useState<Record<string, number>>({});
  const [closeError, setCloseError] = useState('');

  // 1. Fetch Work Order Detail
  const { data: response, isLoading } = useQuery<{ data: WorkOrder }>({
    queryKey: ['work-order-detail', id],
    queryFn: () => api.get(`/work-orders/${id}`) as any,
    enabled: !!id,
  });

  const wo = response?.data;

  // 2. Fetch spare parts catalog for adding parts
  const { data: sparePartsRes } = useQuery<{ data: SparePart[] }>({
    queryKey: ['spare-parts-dropdown'],
    queryFn: () => api.get('/spare-parts?limit=100') as any,
  });

  const catalog = sparePartsRes?.data || [];

  // Mutation: Transition status
  const transitionMutation = useMutation({
    mutationFn: (newStatus: WorkOrderStatus) =>
      api.put(`/work-orders/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  // Mutation: Add part to work order
  const addPartMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/work-orders/${id}/parts`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-detail', id] });
      setIsAddPartOpen(false);
      setPartQty('1');
      setPartNotes('');
    },
  });

  // Mutation: Remove part from work order
  const removePartMutation = useMutation({
    mutationFn: (partId: string) => api.delete(`/work-orders/${id}/parts/${partId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-detail', id] });
    },
  });

  // Mutation: Atomic Close Work Order (v2 atomic requirement)
  const closeMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/work-orders/${id}/close`, payload),
    onSuccess: () => {
      setIsCloseModalOpen(false);
      setCloseError('');
      queryClient.invalidateQueries({ queryKey: ['work-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onError: (err: any) => {
      setCloseError(err.message);
    },
  });

  const handleOpenCloseModal = () => {
    // Pre-fill actual parts usage with required quantities
    const initialUsage: Record<string, number> = {};
    if (wo?.parts) {
      wo.parts.forEach((p) => {
        initialUsage[p.spare_part_id] = p.quantity_required;
      });
    }
    setActualPartsUsage(initialUsage);
    setResolutionNotes(
      wo?.resolution_notes ||
        'Replaced worn mechanical elements, conducted thermal run test, and calibrated operational clearances. Machine verified within normal parameters.'
    );
    setCloseError('');
    setIsCloseModalOpen(true);
  };

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    const partsPayload = Object.entries(actualPartsUsage).map(([spare_part_id, quantity_used]) => ({
      spare_part_id,
      quantity_used: Number(quantity_used),
    }));

    closeMutation.mutate({
      resolution_notes: resolutionNotes,
      actual_parts: partsPayload,
    });
  };

  if (isLoading || !wo) {
    return <div className="py-12 text-center text-slate-400">Loading work order...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Work Orders
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: {wo.id}</span>
      </div>

      {/* Header Summary Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-white font-mono tracking-tight">
                  {wo.work_order_number}
                </h2>
                <WorkOrderStatusBadge status={wo.status} />
                <PriorityBadge priority={wo.priority} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Asset:{' '}
                <Link
                  to={`/equipment/${wo.equipment_id}`}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  {wo.equipment?.name || wo.equipment_id}
                </Link>{' '}
                &bull; Created: {new Date(wo.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action buttons based on lifecycle */}
          {role === 'MAINTENANCE_ENGINEER' && (
            <div className="flex items-center gap-2">
              {wo.status === 'OPEN' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => transitionMutation.mutate('ASSIGNED')}
                  isLoading={transitionMutation.isPending}
                >
                  Assign to Technician
                </Button>
              )}

              {wo.status === 'ASSIGNED' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => transitionMutation.mutate('IN_PROGRESS')}
                  isLoading={transitionMutation.isPending}
                >
                  Start Work (In Progress)
                </Button>
              )}

              {wo.status === 'IN_PROGRESS' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => transitionMutation.mutate('WAITING_FOR_PARTS')}
                    isLoading={transitionMutation.isPending}
                  >
                    Wait for Parts
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => transitionMutation.mutate('COMPLETED')}
                    isLoading={transitionMutation.isPending}
                  >
                    Complete Work
                  </Button>
                </>
              )}

              {wo.status === 'WAITING_FOR_PARTS' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => transitionMutation.mutate('IN_PROGRESS')}
                  isLoading={transitionMutation.isPending}
                >
                  Resume Work
                </Button>
              )}

              {wo.status === 'COMPLETED' && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Lock className="w-3.5 h-3.5" />}
                  onClick={handleOpenCloseModal}
                >
                  Close Work Order (Atomic)
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Closed status banner */}
      {wo.status === 'CLOSED' && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-emerald-300 font-bold block">
                Work Order Closed & Maintenance History Committed
              </span>
              <p className="text-slate-300 mt-0.5">
                Resolution: "{wo.resolution_notes}" &bull; Closed at{' '}
                {wo.closed_at ? new Date(wo.closed_at).toLocaleString() : 'recently'}
              </p>
            </div>
          </div>
          <Link to="/history" className="text-emerald-400 font-semibold hover:underline">
            View Service History &rarr;
          </Link>
        </div>
      )}

      {/* Associated Alert banner if origin is from alert */}
      {wo.alert && (
        <div className="p-3.5 rounded-xl bg-industrial-900/90 border border-industrial-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Originating Breach Alert:</span>
            <strong className="text-slate-200 font-mono">{wo.alert.alert_id}</strong>
          </div>
          <Link to={`/alerts/${wo.alert.id}`} className="text-blue-400 hover:underline font-semibold">
            View Alert &rarr;
          </Link>
        </div>
      )}

      {/* Fault & Execution Scope */}
      <Card>
        <CardHeader
          title="Maintenance Specification"
          subtitle="Reported fault symptoms and task guidelines"
        />
        <div className="space-y-4 text-xs">
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider block">
              Fault Description
            </span>
            <p className="text-sm font-semibold text-slate-100 mt-1 p-3 rounded-lg bg-industrial-900/80 border border-industrial-800">
              {wo.fault_description}
            </p>
          </div>

          {wo.description && (
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                Scope of Work
              </span>
              <p className="text-slate-300 mt-1 leading-relaxed">{wo.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-industrial-800">
            <div>
              <span className="text-slate-400 block">Assigned Technician:</span>
              <span className="font-semibold text-slate-200 mt-0.5 block">
                {wo.assignee?.full_name || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Due Date:</span>
              <span className="font-semibold text-slate-200 mt-0.5 block font-mono">
                {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : 'None specified'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Spare Parts Checklist */}
      <Card>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-industrial-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Spare Parts Allocation</h3>
            <p className="text-xs text-slate-400">
              Reserved inventory deducted atomically upon work order closure
            </p>
          </div>
          {role === 'MAINTENANCE_ENGINEER' && wo.status !== 'CLOSED' && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddPartOpen(true)}
            >
              Add Spare Part
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-industrial-900/60 border-b border-industrial-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Part Number</th>
                <th className="px-4 py-2.5 font-medium">Part Name</th>
                <th className="px-4 py-2.5 font-medium">Qty Required</th>
                <th className="px-4 py-2.5 font-medium">Qty Deducted</th>
                <th className="px-4 py-2.5 font-medium">Stock Status</th>
                {wo.status !== 'CLOSED' && role === 'MAINTENANCE_ENGINEER' && (
                  <th className="px-4 py-2.5 font-medium text-right">Remove</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {wo.parts && wo.parts.length > 0 ? (
                wo.parts.map((item) => (
                  <tr key={item.id} className="hover:bg-industrial-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                      {item.spare_part?.part_number || 'PART'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-300">
                      {item.spare_part?.name || 'Item'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-100">
                      {item.quantity_required} {item.spare_part?.unit || 'PCS'}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      {item.quantity_used || 0}
                    </td>
                    <td className="px-4 py-3">
                      <PartAvailabilityBadge status={item.availability_status} />
                    </td>
                    {wo.status !== 'CLOSED' && role === 'MAINTENANCE_ENGINEER' && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removePartMutation.mutate(item.id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500 italic"
                  >
                    No spare parts attached. Click "Add Spare Part" if replacement components are
                    needed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Spare Part Modal */}
      <Modal
        isOpen={isAddPartOpen}
        onClose={() => setIsAddPartOpen(false)}
        title="Add Required Spare Part"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedPartId) return;
            addPartMutation.mutate({
              spare_part_id: selectedPartId,
              quantity_required: parseInt(partQty, 10),
              notes: partNotes,
            });
          }}
          className="space-y-4"
        >
          <Select
            label="Select Spare Part from Catalog"
            value={selectedPartId}
            onChange={(e) => setSelectedPartId(e.target.value)}
            options={[
              { value: '', label: '-- Choose a spare part --' },
              ...catalog.map((sp) => ({
                value: sp.id,
                label: `${sp.part_number} — ${sp.name} (In stock: ${sp.quantity_in_stock} ${sp.unit})`,
              })),
            ]}
            required
          />

          <Input
            label="Quantity Required"
            type="number"
            min="1"
            value={partQty}
            onChange={(e) => setPartQty(e.target.value)}
            required
          />

          <Input
            label="Notes / Fitting Position"
            placeholder="e.g. Spindle bearing replacement"
            value={partNotes}
            onChange={(e) => setPartNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddPartOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addPartMutation.isPending}>
              Attach Part
            </Button>
          </div>
        </form>
      </Modal>

      {/* Atomic Work Order Closure Modal (v2 requirement) */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title={`Close Work Order — Atomic Commit (${wo.work_order_number})`}
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmClose} className="space-y-4">
          <div className="p-3 rounded-xl bg-industrial-950/90 border border-industrial-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-blue-400 block">Atomic RPC Execution:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-400">
              <li>Deducts actual spare parts inventory with row-level locks</li>
              <li>Updates equipment last service date to now</li>
              <li>Resolves linked alert (if any)</li>
              <li>Re-evaluates equipment health status across all active alerts</li>
              <li>Records immutable maintenance history & audit log</li>
            </ul>
          </div>

          {closeError && (
            <div className="p-3 rounded-lg bg-red-950 border border-red-800 text-red-200 text-xs font-semibold">
              Closure Failed: {closeError}
            </div>
          )}

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Resolution Notes (Required)
            </label>
            <textarea
              className="w-full bg-industrial-900/90 border border-industrial-700 rounded-lg p-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
            />
          </div>

          {/* Actual Parts Consumed Input */}
          {wo.parts && wo.parts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-industrial-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Verify Actual Spare Parts Used
              </span>
              {wo.parts.map((p) => (
                <div
                  key={p.spare_part_id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 text-xs"
                >
                  <span className="font-medium text-slate-200">
                    {p.spare_part?.name} ({p.spare_part?.part_number})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Qty Used:</span>
                    <input
                      type="number"
                      min="0"
                      className="w-16 bg-industrial-900 border border-industrial-700 rounded px-2 py-1 text-center font-bold text-white"
                      value={actualPartsUsage[p.spare_part_id] ?? p.quantity_required}
                      onChange={(e) =>
                        setActualPartsUsage({
                          ...actualPartsUsage,
                          [p.spare_part_id]: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-industrial-800">
            <Button type="button" variant="secondary" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={closeMutation.isPending}>
              Commit Atomic Closure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
