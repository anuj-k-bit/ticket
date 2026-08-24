import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Shield, Sparkles, AlertTriangle, CheckCircle2, Server, KeyRound, Ticket } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const testEndpoint = async (endpoint) => {
    setTestingEndpoint(true);
    setTestResult(null);
    try {
      const response = await api.get(`/auth/${endpoint}`);
      setTestResult({
        success: true,
        endpoint,
        status: response.status,
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        endpoint,
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Request failed'
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Logged In Session Active
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Hello, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Welcome to the Ticket Booking Platform control center. Your account role is{' '}
              <span className="text-indigo-400 font-semibold uppercase">{user?.role}</span>.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Role Privilege Level</p>
              <p className="text-lg font-bold text-white uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Tester Section */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            Role-Based Access Control (RBAC) Endpoint Verifier
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Test backend protected endpoints to verify authorization restrictions for your role (<span className="text-indigo-300 font-semibold">{user?.role}</span>).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => testEndpoint('customer-only')}
            disabled={testingEndpoint}
            className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 text-left space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Customer Route
              </span>
              <Server className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="font-semibold text-slate-200 text-sm">/api/auth/customer-only</p>
            <p className="text-xs text-slate-400">Accessible by Customer, Organiser, Admin</p>
          </button>

          <button
            onClick={() => testEndpoint('organiser-only')}
            disabled={testingEndpoint}
            className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 text-left space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Organiser Route
              </span>
              <Server className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <p className="font-semibold text-slate-200 text-sm">/api/auth/organiser-only</p>
            <p className="text-xs text-slate-400">Accessible by Organiser, Admin</p>
          </button>

          <button
            onClick={() => testEndpoint('admin-only')}
            disabled={testingEndpoint}
            className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 text-left space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                Admin Route
              </span>
              <Server className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
            </div>
            <p className="font-semibold text-slate-200 text-sm">/api/auth/admin-only</p>
            <p className="text-xs text-slate-400">Restricted strictly to Admin role</p>
          </button>
        </div>

        {/* Test Output Box */}
        {testResult && (
          <div
            className={`p-5 rounded-2xl border transition-all ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-2 font-semibold">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              <span>
                Endpoint test for <code className="bg-slate-900/60 px-2 py-0.5 rounded">{testResult.endpoint}</code> — Status {testResult.status}
              </span>
            </div>
            <pre className="bg-slate-950/80 p-4 rounded-xl text-xs font-mono overflow-x-auto text-slate-300 border border-slate-800">
              {JSON.stringify(testResult.data || { message: testResult.message }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
