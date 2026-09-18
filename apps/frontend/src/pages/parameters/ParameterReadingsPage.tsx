import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PriorityBadge, EquipmentStatusBadge } from '../../components/ui/StatusBadge';
import {
  Equipment,
  EquipmentParameter,
  ReadingProcessingResult,
} from '@maintenance/shared';

export const ParameterReadingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const preselectedEquipId = searchParams.get('equipment_id') || '';
  const preselectedParamId = searchParams.get('parameter_id') || '';

  const [selectedEquipId, setSelectedEquipId] = useState(preselectedEquipId);
  const [selectedParamId, setSelectedParamId] = useState(preselectedParamId);
  const [readingValue, setReadingValue] = useState('');
  const [notes, setNotes] = useState('');

  const [lastResult, setLastResult] = useState<ReadingProcessingResult | null>(null);

  // 1. Fetch equipment list
  const { data: equipRes } = useQuery<{ data: Equipment[] }>({
    queryKey: ['equipment-dropdown'],
    queryFn: () => api.get('/equipment?limit=100') as any,
  });

  const equipmentList = equipRes?.data || [];

  // If no equipment selected, default to first in list
  useEffect(() => {
    if (!selectedEquipId && equipmentList.length > 0) {
      setSelectedEquipId(equipmentList[0].id);
    }
  }, [selectedEquipId, equipmentList]);

  // 2. Fetch parameters for selected equipment
  const { data: paramRes } = useQuery<{ data: EquipmentParameter[] }>({
    queryKey: ['equipment-params', selectedEquipId],
    queryFn: () => api.get(`/equipment/${selectedEquipId}/parameters`) as any,
    enabled: !!selectedEquipId,
  });

  const parameters = paramRes?.data || [];

  // Update selected parameter when parameter list changes
  useEffect(() => {
    if (parameters.length > 0) {
      const match = parameters.find((p) => p.id === preselectedParamId);
      setSelectedParamId(match ? match.id : parameters[0].id);
    } else {
      setSelectedParamId('');
    }
  }, [parameters, preselectedParamId]);

  const activeParameter = parameters.find((p) => p.id === selectedParamId);

  // 3. Mutation to log reading
  const logReadingMutation = useMutation({
    mutationFn: (payload: any) => api.post('/readings', payload),
    onSuccess: (res: any) => {
      setLastResult(res.data);
      setReadingValue('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['readings-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipId || !selectedParamId || !readingValue) return;

    logReadingMutation.mutate({
      equipment_id: selectedEquipId,
      parameter_id: selectedParamId,
      value: parseFloat(readingValue),
      unit: activeParameter?.unit || '',
      notes: notes || undefined,
    });
  };

  // 4. Fetch recent readings history
  const { data: readingsHistoryRes } = useQuery<{ data: any[] }>({
    queryKey: ['readings-history', selectedEquipId],
    queryFn: () => {
      const q = selectedEquipId ? `?equipment_id=${selectedEquipId}&limit=15` : '?limit=15';
      return api.get(`/readings${q}`) as any;
    },
  });

  const history = readingsHistoryRes?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Sensor & Manual Telemetry Log
        </h2>
        <p className="text-xs text-slate-400">
          Enter operational measurements to run immediate automated threshold breach evaluation.
        </p>
      </div>

      {/* Real-time Feedback Banner */}
      {lastResult && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            lastResult.breached
              ? 'bg-red-950/80 border-red-800 text-red-100 shadow-xl shadow-red-950/30 ring-1 ring-red-500/30'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-100 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl ${
                  lastResult.breached ? 'bg-red-900/60 text-red-300' : 'bg-emerald-900/60 text-emerald-300'
                }`}
              >
                {lastResult.breached ? (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold">
                  {lastResult.breached ? 'Threshold Breach Detected!' : 'Normal Operating Reading'}
                </h4>
                <p className="text-xs mt-1 text-slate-200">{lastResult.message}</p>

                {lastResult.breached && lastResult.alert && (
                  <div className="mt-3.5 p-3 rounded-lg bg-black/40 border border-red-900/50 space-y-1.5 text-xs">
                    <div className="flex items-center gap-3">
                      <span>
                        Alert ID: <strong className="text-white font-mono">{lastResult.alert.alert_id}</strong>
                      </span>
                      &bull;
                      <span>
                        Calculated Priority: <PriorityBadge priority={lastResult.alert.priority} />
                      </span>
                      &bull;
                      <span>
                        Equipment Condition:{' '}
                        <EquipmentStatusBadge status={lastResult.equipmentStatus} />
                      </span>
                    </div>
                    <div className="text-amber-300 font-medium pt-1">
                      Action Required: {lastResult.alert.suggested_action}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {lastResult.breached && lastResult.alert && (
              <Link to={`/alerts/${lastResult.alert.id}`}>
                <Button variant="danger" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                  Inspect Alert
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Input form card */}
      <Card>
        <CardHeader
          title="Record Parameter Measurement"
          subtitle="Select asset and telemetry channel"
          icon={<Activity className="w-4 h-4" />}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Equipment Asset"
              value={selectedEquipId}
              onChange={(e) => setSelectedEquipId(e.target.value)}
              options={equipmentList.map((eq) => ({
                value: eq.id,
                label: `${eq.equipment_id} — ${eq.name} (${eq.location})`,
              }))}
            />

            <Select
              label="Monitored Parameter"
              value={selectedParamId}
              onChange={(e) => setSelectedParamId(e.target.value)}
              options={parameters.map((p) => ({
                value: p.id,
                label: `${p.name} [Threshold: ${p.direction} ${p.threshold_value} ${p.unit}]`,
              }))}
            />
          </div>

          {activeParameter && (
            <div className="p-3.5 rounded-xl bg-industrial-900/90 border border-industrial-800 text-xs flex flex-wrap items-center gap-4 text-slate-400">
              <span>
                Target Unit: <strong className="text-slate-200 font-mono">{activeParameter.unit}</strong>
              </span>
              &bull;
              <span>
                Threshold Direction:{' '}
                <strong className="text-amber-400 font-semibold">{activeParameter.direction}</strong>
              </span>
              &bull;
              <span>
                Threshold Boundary:{' '}
                <strong className="text-slate-200 font-bold">
                  {activeParameter.threshold_value} {activeParameter.unit}
                </strong>
              </span>
              &bull;
              <span className="text-slate-500 italic">
                {activeParameter.direction === 'UPPER'
                  ? 'Safe <= threshold; Breaches when > threshold'
                  : 'Safe >= threshold; Breaches when < threshold'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Measured Value (${activeParameter?.unit || 'Value'})`}
              type="number"
              step="any"
              placeholder="e.g. 95 (Breach) or 65 (Safe)"
              value={readingValue}
              onChange={(e) => setReadingValue(e.target.value)}
              required
            />
            <Input
              label="Operator Notes / Sensor Batch"
              placeholder="Shift inspection or automated probe reading..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={logReadingMutation.isPending}
              icon={<Send className="w-4 h-4" />}
            >
              Submit & Run Evaluation
            </Button>
          </div>
        </form>
      </Card>

      {/* Historical readings table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-industrial-800 bg-industrial-900/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Historical Telemetry Log</h3>
          <span className="text-xs text-slate-500">Live feed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-industrial-900/40 border-b border-industrial-800">
              <tr>
                <th className="px-5 py-2.5 font-medium">Timestamp</th>
                <th className="px-5 py-2.5 font-medium">Machine</th>
                <th className="px-5 py-2.5 font-medium">Parameter</th>
                <th className="px-5 py-2.5 font-medium">Value Recorded</th>
                <th className="px-5 py-2.5 font-medium">Threshold</th>
                <th className="px-5 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {history.length > 0 ? (
                history.map((r: any) => (
                  <tr key={r.id} className="hover:bg-industrial-800/40">
                    <td className="px-5 py-3 text-slate-400 font-mono">
                      {new Date(r.recorded_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-200">
                      {r.equipment?.name || r.equipment_id}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{r.parameter?.name}</td>
                    <td className="px-5 py-3 font-bold text-white">
                      {r.value} {r.unit}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {r.parameter?.direction} {r.parameter?.threshold_value} {r.parameter?.unit}
                    </td>
                    <td className="px-5 py-3 text-slate-400 truncate max-w-[200px]">{r.notes || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                    No readings recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
