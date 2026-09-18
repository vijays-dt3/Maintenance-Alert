import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  AlertTriangle,
  Wrench,
  Package,
  History,
  ShieldAlert,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, role, switchPersona, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Equipment', path: '/equipment', icon: Cpu },
    { name: 'Log Readings', path: '/readings', icon: Activity },
    { name: 'Maintenance Alerts', path: '/alerts', icon: AlertTriangle },
    { name: 'Work Orders', path: '/work-orders', icon: Wrench },
    { name: 'Spare Parts', path: '/spare-parts', icon: Package },
    { name: 'Service History', path: '/history', icon: History },
  ];

  return (
    <aside className="w-64 bg-industrial-950 border-r border-industrial-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Plant branding logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-industrial-800/80 bg-industrial-950/90">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block leading-tight">
              PRED-MAINT
            </span>
            <span className="text-[10px] uppercase font-semibold text-blue-400 tracking-wider">
              Plant Alert & WO
            </span>
          </div>
        </div>

        {/* Persona quick badge */}
        <div className="px-4 py-3 m-3 rounded-xl bg-industrial-900/90 border border-industrial-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Active Persona
            </span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              {role === 'MAINTENANCE_ENGINEER' ? 'Engineer' : 'Plant Manager'}
            </span>
          </div>
          <button
            onClick={() =>
              switchPersona(
                role === 'MAINTENANCE_ENGINEER' ? 'PLANT_MANAGER' : 'MAINTENANCE_ENGINEER'
              )
            }
            title="Toggle between Maintenance Engineer and Plant Manager roles"
            className="px-2 py-1 text-[11px] font-medium bg-industrial-800 hover:bg-industrial-700 text-blue-300 border border-industrial-700 rounded-md transition-colors"
          >
            Switch
          </button>
        </div>

        {/* Navigation items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-industrial-900/60 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer user profile & logout */}
      <div className="p-3 border-t border-industrial-800/80 bg-industrial-900/40">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-industrial-800 border border-industrial-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-industrial-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
