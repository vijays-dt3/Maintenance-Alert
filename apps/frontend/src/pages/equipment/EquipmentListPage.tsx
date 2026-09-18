import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Cpu, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EquipmentStatusBadge, CriticalityBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Equipment } from '@maintenance/shared';

export const EquipmentListPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');

  const { data: response, isLoading } = useQuery<{ data: Equipment[] }>({
    queryKey: ['equipment-list', search, statusFilter, criticalityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (criticalityFilter) params.set('criticality', criticalityFilter);
      return api.get(`/equipment?${params.toString()}`) as any;
    },
  });

  const equipmentList = response?.data || [];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Plant Equipment Fleet</h2>
          <p className="text-xs text-slate-400">
            Monitor asset health, configured telemetry parameters, and service intervals.
          </p>
        </div>
        {role === 'MAINTENANCE_ENGINEER' && (
          <Link to="/equipment/new">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              Register Equipment
            </Button>
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by equipment ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Equipment Statuses' },
              { value: 'HEALTHY', label: 'Healthy' },
              { value: 'AT_RISK', label: 'At Risk' },
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
            ]}
          />
          <Select
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
            options={[
              { value: '', label: 'All Criticality Levels' },
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'HIGH', label: 'High' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'LOW', label: 'Low' },
            ]}
          />
        </div>
      </Card>

      {/* Equipment Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-industrial-900/80 border-b border-industrial-800">
              <tr>
                <th className="px-5 py-3 font-medium">Machine Code</th>
                <th className="px-5 py-3 font-medium">Asset Name</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Criticality</th>
                <th className="px-5 py-3 font-medium">Operational Status</th>
                <th className="px-5 py-3 font-medium">Last Service</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Loading equipment registry...
                  </td>
                </tr>
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No equipment matched the filters.
                  </td>
                </tr>
              ) : (
                equipmentList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-industrial-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-100">{eq.equipment_id}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-200">{eq.name}</td>
                    <td className="px-5 py-3.5 text-slate-400">{eq.location}</td>
                    <td className="px-5 py-3.5">
                      <CriticalityBadge criticality={eq.criticality} />
                    </td>
                    <td className="px-5 py-3.5">
                      <EquipmentStatusBadge status={eq.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {eq.last_service_date
                        ? new Date(eq.last_service_date).toLocaleDateString()
                        : 'Not yet serviced'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        to={`/equipment/${eq.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
