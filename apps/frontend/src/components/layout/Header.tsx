import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC<{ title?: string }> = ({ title }) => {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="h-16 px-8 border-b border-industrial-800 bg-industrial-950/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-100 tracking-tight">
          {title || 'Plant Maintenance Console'}
        </h1>
        <p className="text-xs text-slate-400">
          Manufacturing Operations &bull; {role === 'MAINTENANCE_ENGINEER' ? 'Engineering Mode (Full Access)' : 'Manager Mode (Supervisory Read-Only)'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          title="Refresh operational telemetry"
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-industrial-800 rounded-lg border border-industrial-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-industrial-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          <span className="text-xs font-medium text-slate-300">Live Telemetry Active</span>
        </div>
      </div>
    </header>
  );
};
