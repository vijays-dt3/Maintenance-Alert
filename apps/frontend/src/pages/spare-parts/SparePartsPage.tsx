import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { SparePart } from '@maintenance/shared';

export const SparePartsPage: React.FC = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [partNumber, setPartNumber] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('10');
  const [minLevel, setMinLevel] = useState('5');
  const [unit, setUnit] = useState('PCS');
  const [location, setLocation] = useState('Bin A-1');

  const { data: response, isLoading } = useQuery<{ data: SparePart[] }>({
    queryKey: ['spare-parts-list', search, lowStockOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (lowStockOnly) params.set('low_stock', 'true');
      return api.get(`/spare-parts?${params.toString()}`) as any;
    },
  });

  const parts = response?.data || [];

  const addPartMutation = useMutation({
    mutationFn: (newPart: any) => api.post('/spare-parts', newPart),
    onSuccess: () => {
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['spare-parts-list'] });
      setPartNumber('');
      setName('');
      setDescription('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPartMutation.mutate({
      part_number: partNumber,
      name,
      description,
      quantity_in_stock: parseInt(stock, 10),
      minimum_stock_level: parseInt(minLevel, 10),
      unit,
      storage_location: location,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Spare Parts Inventory</h2>
          <p className="text-xs text-slate-400">
            Monitor mechanical spares, minimum reorder thresholds, and warehouse bin locations.
          </p>
        </div>
        {role === 'MAINTENANCE_ENGINEER' && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Register Spare Part
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by part number or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded bg-industrial-900 border-industrial-700 text-blue-600 focus:ring-blue-500"
            />
            Show Low Stock Below Minimum Only
          </label>
        </div>
      </Card>

      {/* Parts Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-industrial-900/80 border-b border-industrial-800">
              <tr>
                <th className="px-5 py-3 font-medium">Part Code</th>
                <th className="px-5 py-3 font-medium">Component Name</th>
                <th className="px-5 py-3 font-medium">In Stock</th>
                <th className="px-5 py-3 font-medium">Min Level</th>
                <th className="px-5 py-3 font-medium">Stock Status</th>
                <th className="px-5 py-3 font-medium">Warehouse Bin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No spare parts found.
                  </td>
                </tr>
              ) : (
                parts.map((p) => {
                  const isLow = p.quantity_in_stock <= p.minimum_stock_level;
                  return (
                    <tr key={p.id} className="hover:bg-industrial-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-100">{p.part_number}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        {p.name}
                        {p.description && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {p.description}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white text-sm">
                        {p.quantity_in_stock} <span className="text-xs text-slate-400 font-normal">{p.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {p.minimum_stock_level} {p.unit}
                      </td>
                      <td className="px-5 py-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5" /> Reorder Alert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-mono">
                        {p.storage_location || 'Unassigned'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Spare Part Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Spare Part to Inventory"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Part Number / SKU"
            placeholder="e.g. BRG-6205-2RS, HYD-SEAL-50"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            required
          />
          <Input
            label="Component Name"
            placeholder="e.g. Deep Groove Ball Bearing 6205"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Description / Specs"
            placeholder="Sealed spindle bearing for CNC axes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Stock Qty"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
            <Input
              label="Min Reorder Level"
              type="number"
              min="0"
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value)}
              required
            />
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
          </div>

          <Input
            label="Warehouse Bin Location"
            placeholder="e.g. Bin A-14, Cabinet C-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-industrial-800">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addPartMutation.isPending}>
              Register Part
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
