import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wrench, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PriorityBadge } from '../../components/ui/StatusBadge';
import { AlertPriority, Equipment, SparePart } from '@maintenance/shared';

export const CreateWorkOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alertId = searchParams.get('alert_id');

  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [faultDesc, setFaultDesc] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<AlertPriority>('HIGH');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [parts, setParts] = useState<{ spare_part_id: string; quantity_required: number }[]>([]);

  // Fetch equipment list
  const { data: equipRes } = useQuery<{ data: Equipment[] }>({
    queryKey: ['equipment-dropdown'],
    queryFn: () => api.get('/equipment?limit=100') as any,
  });

  const equipmentList = equipRes?.data || [];

  // Fetch spare parts catalog
  const { data: sparePartsRes } = useQuery<{ data: SparePart[] }>({
    queryKey: ['spare-parts-dropdown'],
    queryFn: () => api.get('/spare-parts?limit=100') as any,
  });

  const catalog = sparePartsRes?.data || [];

  useEffect(() => {
    if (!selectedEquipId && equipmentList.length > 0) {
      setSelectedEquipId(equipmentList[0].id);
    }
  }, [selectedEquipId, equipmentList]);

  // If alertId passed, fetch alert to pre-fill
  useQuery({
    queryKey: ['alert-prefill', alertId],
    queryFn: async () => {
      const res: any = await api.get(`/alerts/${alertId}`);
      if (res.data) {
        setSelectedEquipId(res.data.equipment_id);
        setPriority(res.data.priority);
        setFaultDesc(
          `Threshold breach on ${res.data.parameter?.name}: Measured ${res.data.current_value} vs threshold ${res.data.threshold_value} (+${res.data.breach_percentage}%)`
        );
        setDescription(res.data.suggested_action || '');
      }
      return res.data;
    },
    enabled: !!alertId,
  });

  const createWOMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post('/work-orders', {
        equipment_id: selectedEquipId,
        alert_id: alertId || null,
        fault_description: faultDesc,
        description,
        priority,
        due_date: dueDate,
        parts: parts.length > 0 ? parts : undefined,
      });
      return res.data;
    },
    onSuccess: (newWO) => {
      navigate(`/work-orders/${newWO.id}`);
    },
  });

  const addPartRow = () => {
    if (catalog.length > 0) {
      setParts([...parts, { spare_part_id: catalog[0].id, quantity_required: 1 }]);
    }
  };

  const removePartRow = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePartRow = (index: number, field: string, val: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: val };
    setParts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWOMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          to="/work-orders"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Work Orders
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight mt-2">
          Create Maintenance Work Order
        </h2>
        <p className="text-xs text-slate-400">
          Issue maintenance assignment, schedule target completion, and allocate required spare parts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader
            title="Work Order Scope"
            subtitle="Machine assignment and fault details"
            icon={<Wrench className="w-4 h-4" />}
          />

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Target Equipment"
                value={selectedEquipId}
                onChange={(e) => setSelectedEquipId(e.target.value)}
                options={equipmentList.map((eq) => ({
                  value: eq.id,
                  label: `${eq.equipment_id} — ${eq.name} (${eq.location})`,
                }))}
                required
              />

              <Select
                label="Priority Classification"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                options={[
                  { value: 'CRITICAL', label: 'CRITICAL' },
                  { value: 'HIGH', label: 'HIGH' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                ]}
              />
            </div>

            <Input
              label="Fault Summary / Symptom"
              placeholder="e.g. Spindle bearing vibration breach (+18.75% over threshold)"
              value={faultDesc}
              onChange={(e) => setFaultDesc(e.target.value)}
              required
            />

            <div className="w-full">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Detailed Work Instructions
              </label>
              <textarea
                className="w-full bg-industrial-900/90 border border-industrial-700 rounded-lg p-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Scope of repairs, safety precautions, lockout-tagout instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Spare parts allocation */}
        <Card>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-industrial-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Attach Spare Parts</h3>
              <p className="text-xs text-slate-400">Pre-allocate required items from inventory</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={addPartRow}
            >
              Add Part
            </Button>
          </div>

          <div className="space-y-3">
            {parts.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-industrial-900/90 border border-industrial-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-8">
                  <Select
                    label="Part"
                    value={p.spare_part_id}
                    onChange={(e) => updatePartRow(idx, 'spare_part_id', e.target.value)}
                    options={catalog.map((sp) => ({
                      value: sp.id,
                      label: `${sp.part_number} — ${sp.name} (Stock: ${sp.quantity_in_stock} ${sp.unit})`,
                    }))}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    value={p.quantity_required}
                    onChange={(e) =>
                      updatePartRow(idx, 'quantity_required', parseInt(e.target.value, 10) || 1)
                    }
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => removePartRow(idx)}
                    className="p-2 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/work-orders">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" isLoading={createWOMutation.isPending}>
            Issue Work Order
          </Button>
        </div>
      </form>
    </div>
  );
};
