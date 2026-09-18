import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Search, Filter, Cpu, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Equipment, MaintenanceHistory } from '@maintenance/shared';

export const MaintenanceHistoryPage: React.FC = () => {
  const [selectedEquip, setSelectedEquip] = useState('');

  // Equipment list for filter
  const { data: equipRes } = useQuery<{ data: Equipment[] }>({
    queryKey: ['equipment-dropdown'],
    queryFn: () => api.get('/equipment?limit=100') as any,
  });

  const equipmentList = equipRes?.data || [];

  // Service history query
  const { data: response, isLoading } = useQuery<{ data: MaintenanceHistory[] }>({
    queryKey: ['maintenance-history', selectedEquip],
    queryFn: () => {
      const q = selectedEquip ? `?equipment_id=${selectedEquip}` : '';
      return api.get(`/maintenance-history${q}`) as any;
    },
  });

  const history = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Plant Service History Log</h2>
        <p className="text-xs text-slate-400">
          Permanent immutable record of completed work orders, parts consumed, and technician repairs.
        </p>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="w-full sm:w-80">
          <Select
            label="Filter by Equipment"
            value={selectedEquip}
            onChange={(e) => setSelectedEquip(e.target.value)}
            options={[
              { value: '', label: 'All Equipment Assets' },
              ...equipmentList.map((eq) => ({
                value: eq.id,
                label: `${eq.equipment_id} — ${eq.name}`,
              })),
            ]}
          />
        </div>
      </Card>

      {/* History table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-industrial-900/80 border-b border-industrial-800">
              <tr>
                <th className="px-5 py-3 font-medium">Completion Date</th>
                <th className="px-5 py-3 font-medium">Equipment Asset</th>
                <th className="px-5 py-3 font-medium">Work Order #</th>
                <th className="px-5 py-3 font-medium">Issue Description</th>
                <th className="px-5 py-3 font-medium">Resolution Notes</th>
                <th className="px-5 py-3 font-medium">Parts Consumed</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Loading maintenance logs...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No completed service records found. Records populate automatically when work orders are closed.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-industrial-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {new Date(h.performed_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-200">
                      {h.equipment?.name || h.equipment_id}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-blue-400">
                      {h.work_order?.work_order_number || 'WO-COMPLETED'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 max-w-[200px] truncate">
                      {h.issue_description}
                    </td>
                    <td className="px-5 py-3.5 text-emerald-300 max-w-[240px]">
                      {h.resolution}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      {h.parts_used || 'None'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Closed & Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
