import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Building2,
  Film,
  Users,
  IndianRupee,
  Ticket,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOversight = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/oversight');
        setData(res.data.metrics);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin oversight metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchOversight();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin System Control
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Oversight Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">System-wide metrics across Indian venues, scheduled shows, ticket sales, and platform users.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/venues"
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Manage Venues & Templates
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm mt-3">Loading system metrics...</p>
        </div>
      ) : error ? (
        <div className="glass-card rounded-3xl p-8 text-center border border-slate-800 space-y-3">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* Main Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
                <IndianRupee className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Total Platform Revenue</p>
              <p className="text-3xl font-black text-white">₹{data?.totalPlatformRevenue?.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-emerald-400 font-medium">From {data?.totalConfirmedBookings?.toLocaleString('en-IN')} Confirmed Orders</p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Total Created Venues</p>
              <p className="text-3xl font-black text-white">{data?.totalVenues?.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-400">{data?.totalVenueCapacity?.toLocaleString('en-IN')} Total Seat Templates</p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
                <Film className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Scheduled Shows</p>
              <p className="text-3xl font-black text-white">{data?.totalShows?.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-amber-400 font-medium">Across Movies & Live Concerts</p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Registered Accounts</p>
              <p className="text-3xl font-black text-white">{data?.totalUsers?.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-400">{data?.userRoles?.customers} Customers • {data?.userRoles?.organisers} Organisers</p>
            </div>
          </div>

          {/* User Distribution & Management Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                User Account Distribution
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Customer Accounts</p>
                    <p className="text-xs text-slate-400">Ticket buyers and venue attendees</p>
                  </div>
                  <span className="text-xl font-black text-indigo-400">{data?.userRoles?.customers}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Event Organisers</p>
                    <p className="text-xs text-slate-400">Promoters creating shows & multi-tier pricing</p>
                  </div>
                  <span className="text-xl font-black text-amber-400">{data?.userRoles?.organisers}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Administrators</p>
                    <p className="text-xs text-slate-400">System managers & layout template creators</p>
                  </div>
                  <span className="text-xl font-black text-rose-400">{data?.userRoles?.admins}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-400" />
                  Quick Control Actions
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  As an Administrator, you can define new stadium venue layouts, review organiser event schedules, and monitor real-time platform metrics.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/admin/venues"
                  className="w-full btn-primary py-3 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                >
                  Open Venue Layout Manager
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shows"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-colors"
                >
                  Browse Public Shows & Seating Maps
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
