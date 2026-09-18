import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Cpu } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EquipmentCriticality, ThresholdDirection } from '@maintenance/shared';

interface NewParamRow {
  name: string;
  unit: string;
  threshold_value: number;
  direction: ThresholdDirection;
  service_interval?: number;
}

export const AddEquipmentPage: React.FC = () => {
  const navigate = useNavigate();

  const [equipmentId, setEquipmentId] = useState('CNC-03');
  const [name, setName] = useState('CNC Machine 03');
  const [location, setLocation] = useState('Bay 1 - High Precision Cell');
  const [criticality, setCriticality] = useState<EquipmentCriticality>('HIGH');
  const [typeId, setTypeId] = useState('11111111-1111-1111-1111-111111111101');

  // Initial parameters (defaults to Temperature and Vibration matching Acceptance Test step 1-3)
  const [parameters, setParameters] = useState<NewParamRow[]>([
    {
      name: 'Temperature',
      unit: '°C',
      threshold_value: 80,
      direction: 'UPPER',
      service_interval: 500,
    },
    {
      name: 'Vibration',
      unit: 'mm/s',
      threshold_value: 7,
      direction: 'UPPER',
      service_interval: 500,
    },
  ]);

  const addParamRow = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        unit: '°C',
        threshold_value: 80,
        direction: 'UPPER',
        service_interval: 500,
      },
    ]);
  };

  const removeParamRow = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParamRow = (index: number, field: keyof NewParamRow, val: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: val };
    setParameters(updated);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create equipment
      const eqRes: any = await api.post('/equipment', {
        equipment_id: equipmentId,
        name,
        location,
        type_id: typeId,
        criticality,
      });

      const newId = eqRes.data.id;

      // 2. Create parameters
      for (const p of parameters) {
        if (p.name.trim()) {
          await api.post(`/equipment/${newId}/parameters`, {
            name: p.name,
            unit: p.unit,
            threshold_value: Number(p.threshold_value),
            direction: p.direction,
            service_interval: p.service_interval ? Number(p.service_interval) : null,
          });
        }
      }

      return newId;
    },
    onSuccess: (newId) => {
      navigate(`/equipment/${newId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          to="/equipment"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Equipment
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight mt-2">
          Register New Equipment Asset
        </h2>
        <p className="text-xs text-slate-400">
          Set up machine specifications, plant location, and telemetric threshold rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details */}
        <Card>
          <CardHeader
            title="Asset Identification"
            subtitle="Plant inventory code and operating environment"
            icon={<Cpu className="w-4 h-4" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Machine Identifier / Code"
              placeholder="e.g. CNC-03, PUMP-12"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              required
            />
            <Input
              label="Asset Name"
              placeholder="e.g. CNC Machine 03"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Physical Location"
              placeholder="e.g. Bay 1 - Machining Wing"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <Select
              label="Criticality Level"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as any)}
              options={[
                { value: 'CRITICAL', label: 'CRITICAL - Direct plant stoppage impact' },
                { value: 'HIGH', label: 'HIGH - Major line efficiency impact' },
                { value: 'MEDIUM', label: 'MEDIUM - Standard auxiliary machine' },
                { value: 'LOW', label: 'LOW - Non-essential utility' },
              ]}
            />
          </div>
        </Card>

        {/* Dynamic Parameter Rows */}
        <Card>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-industrial-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Telemetry Parameters</h3>
              <p className="text-xs text-slate-400">Configure monitored thresholds for automated breach alerts</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={addParamRow}
            >
              Add Parameter Row
            </Button>
          </div>

          <div className="space-y-3">
            {parameters.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-industrial-900/90 border border-industrial-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-3">
                  <Input
                    label="Parameter"
                    placeholder="Temperature"
                    value={p.name}
                    onChange={(e) => updateParamRow(idx, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Unit"
                    placeholder="°C"
                    value={p.unit}
                    onChange={(e) => updateParamRow(idx, 'unit', e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <Select
                    label="Direction"
                    value={p.direction}
                    onChange={(e) => updateParamRow(idx, 'direction', e.target.value)}
                    options={[
                      { value: 'UPPER', label: 'UPPER (Max)' },
                      { value: 'LOWER', label: 'LOWER (Min)' },
                    ]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Threshold"
                    type="number"
                    step="any"
                    value={p.threshold_value}
                    onChange={(e) =>
                      updateParamRow(idx, 'threshold_value', parseFloat(e.target.value))
                    }
                    required
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => removeParamRow(idx)}
                    disabled={parameters.length <= 1}
                    className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to="/equipment">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
            Register Machine & Save Rules
          </Button>
        </div>
      </form>
    </div>
  );
};
