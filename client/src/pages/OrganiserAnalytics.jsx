import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  DollarSign,
  Ticket,
  Users,
  Calendar,
  Sparkles,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const OrganiserAnalytics = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/organiser');
        setData(res.data);
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to load organiser analytics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
        <p className="text-sm font-semibold">Loading Revenue & Analytics Dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 glass-card rounded-3xl text-center border border-slate-800 space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">No Analytics Data Available</h2>
        <p className="text-xs text-slate-400">Make sure you are logged in as an Organiser or Admin.</p>
      </div>
    );
  }

  const { stats, categoryBreakdown, shows, recentBookings } = data;

  const categoryChartData = Object.entries(categoryBreakdown || {}).map(([name, info]) => ({
    name,
    booked: info.booked,
    revenue: info.revenue,
    total: info.total
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            Real-Time Organiser Intelligence
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-400" />
            Revenue & Sales Analytics
          </h1>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Active Events Managed: <strong>{stats.totalShowsCount}</strong></span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white font-mono">
            ₹{stats.totalRevenueINR?.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Direct Razorpay Collections
          </p>
        </div>

        {/* Tickets Sold */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tickets Sold</span>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {stats.totalTicketsSold?.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-indigo-300 font-semibold">
            Across {stats.totalBookingsCount} Confirmed Orders
          </p>
        </div>

        {/* Active Events */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Shows</span>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {stats.totalShowsCount}
          </p>
          <p className="text-[11px] text-amber-400 font-semibold">
            Live Booking Venues
          </p>
        </div>

        {/* Avg Revenue Per Show */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Avg Show Revenue</span>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white font-mono">
            ₹{stats.totalShowsCount > 0 ? Math.round(stats.totalRevenueINR / stats.totalShowsCount).toLocaleString('en-IN') : 0}
          </p>
          <p className="text-[11px] text-purple-300 font-semibold">
            Average per event
          </p>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Revenue Bar Chart */}
        <div className="lg:col-span-8 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Revenue & Seat Sales by Category
            </h3>
            <span className="text-xs text-slate-400">Amounts in ₹ INR</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `₹${value.toLocaleString('en-IN')}` : value,
                    name === 'revenue' ? 'Revenue (₹)' : 'Seats Sold'
                  ]}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} name="revenue" />
                <Bar dataKey="booked" fill="#10b981" radius={[8, 8, 0, 0]} name="booked" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Sales Breakdown
            </h3>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="booked"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            {categoryChartData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-300 font-semibold">{cat.name}</span>
                </div>
                <span className="text-white font-mono font-bold">{cat.booked} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganiserAnalytics;
