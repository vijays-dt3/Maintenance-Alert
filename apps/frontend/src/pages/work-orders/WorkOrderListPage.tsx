import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Plus, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PriorityBadge, WorkOrderStatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder } from '@maintenance/shared';

export const WorkOrderListPage: React.FC = () => {
  const { role } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: response, isLoading } = useQuery<{ data: WorkOrder[] }>({
    queryKey: ['work-orders-list', statusFilter, priorityFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      return api.get(`/work-orders?${params.toString()}`) as any;
    },
  });

  const workOrders = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Maintenance Work Orders</h2>
          <p className="text-xs text-slate-400">
            Track corrective repairs, spare parts consumption, and technician assignments.
          </p>
        </div>
        {role === 'MAINTENANCE_ENGINEER' && (
          <Link to="/work-orders/new">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              Create Work Order
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search WO number or fault description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'OPEN', label: 'OPEN' },
              { value: 'ASSIGNED', label: 'ASSIGNED' },
              { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
              { value: 'WAITING_FOR_PARTS', label: 'WAITING FOR PARTS' },
              { value: 'COMPLETED', label: 'COMPLETED (Ready to Close)' },
              { value: 'CLOSED', label: 'CLOSED' },
            ]}
          />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'CRITICAL', label: 'CRITICAL' },
              { value: 'HIGH', label: 'HIGH' },
              { value: 'MEDIUM', label: 'MEDIUM' },
            ]}
          />
        </div>
      </Card>

      {/* Work Orders Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-industrial-900/80 border-b border-industrial-800">
              <tr>
                <th className="px-5 py-3 font-medium">WO Number</th>
                <th className="px-5 py-3 font-medium">Equipment</th>
                <th className="px-5 py-3 font-medium">Fault Summary</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Assignee</th>
                <th className="px-5 py-3 font-medium">Due Date</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Loading work orders...
                  </td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                workOrders.map((w: any) => (
                  <tr key={w.id} className="hover:bg-industrial-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-100">
                      {w.work_order_number}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-200">
                      {w.equipment?.name || 'Equipment'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 truncate max-w-[220px]">
                      {w.fault_description}
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={w.priority} />
                    </td>
                    <td className="px-5 py-3.5">
                      <WorkOrderStatusBadge status={w.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {w.assignee?.full_name || 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {w.due_date ? new Date(w.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/work-orders/${w.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Manage <ArrowRight className="w-3.5 h-3.5" />
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
