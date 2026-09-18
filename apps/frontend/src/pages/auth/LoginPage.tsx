import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UserCheck, Wrench, Shield, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('engineer@plant.com');
  const [password, setPassword] = useState('Password123!');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email);
    navigate('/dashboard');
  };

  const handleQuickDemoLogin = async (role: 'MAINTENANCE_ENGINEER' | 'PLANT_MANAGER') => {
    const demoEmail = role === 'MAINTENANCE_ENGINEER' ? 'engineer@plant.com' : 'manager@plant.com';
    await login(demoEmail, role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-industrial-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30 ring-1 ring-blue-400/40 mb-2">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Predictive Maintenance Console
          </h1>
          <p className="text-xs text-slate-400">
            Plant Telemetry &bull; Threshold Alerts &bull; Work Order Execution
          </p>
        </div>

        {/* Demo Fast Login Cards */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
            One-Click Persona Login
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickDemoLogin('MAINTENANCE_ENGINEER')}
              type="button"
              className="p-3.5 rounded-xl bg-industrial-900 border border-industrial-700 hover:border-blue-500 hover:bg-industrial-800/80 text-left transition-all group"
            >
              <div className="p-2 w-fit rounded-lg bg-blue-600/20 text-blue-400 mb-2 group-hover:scale-105 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white block">Maintenance Engineer</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Full CRUD, logs, repair closure
              </span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('PLANT_MANAGER')}
              type="button"
              className="p-3.5 rounded-xl bg-industrial-900 border border-industrial-700 hover:border-purple-500 hover:bg-industrial-800/80 text-left transition-all group"
            >
              <div className="p-2 w-fit rounded-lg bg-purple-600/20 text-purple-400 mb-2 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white block">Plant Manager</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Supervisory oversight & KPIs
              </span>
            </button>
          </div>
        </div>

        {/* Standard Credentials Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Console
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
