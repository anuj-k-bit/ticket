import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../api/axios';
import {
  TrendingUp,
  IndianRupee,
  Armchair,
  X,
  BarChart2,
  PieChart
} from 'lucide-react';

export const OrganiserAnalyticsModal = ({ showId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/shows/${showId}/analytics`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load show analytics');
      } finally {
        setLoading(false);
      }
    };

    if (showId) fetchAnalytics();
  }, [showId]);

  if (!showId) return null;

  const chartData =
    data?.categories?.map((cat) => ({
      category: cat.category,
      Booked: cat.booked,
      Available: cat.available,
      Revenue: cat.revenue
    })) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card max-w-4xl w-full p-8 rounded-3xl border border-slate-800 space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-slate-400 text-sm mt-3">Loading sales & revenue analytics...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-rose-400 text-sm">{error}</p>
            <button onClick={onClose} className="btn-primary px-4 py-2 rounded-xl text-white text-xs">
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Organiser Analytics Report
              </span>
              <h2 className="text-2xl font-extrabold text-white pt-2">{data.show?.title}</h2>
              <p className="text-xs text-slate-400">{data.show?.category?.toUpperCase()} • {new Date(data.show?.startTime).toLocaleString()}</p>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span>Total Revenue</span>
                  <IndianRupee className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-white">₹{data.summary?.totalRevenue?.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-400">{data.summary?.confirmedBookingsCount} Confirmed Orders</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-bold">
                  <span>Occupancy Rate</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-white">{data.summary?.occupancyRate}%</p>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.summary?.occupancyRate}%` }}></div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs text-purple-400 font-bold">
                  <span>Tickets Sold</span>
                  <Armchair className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-white">{data.summary?.bookedSeats?.toLocaleString('en-IN')} / {data.summary?.totalSeats?.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-emerald-400">{data.summary?.availableSeats?.toLocaleString('en-IN')} Remaining</p>
              </div>
            </div>

            {/* RECHARTS BAR CHART: Seats Sold vs Available per Category Tier */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                Section Sales Chart (Seats Sold vs Available)
              </h3>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Booked" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Sales & Revenue Breakdown Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Category Section</th>
                    <th className="p-3.5">Ticket Price</th>
                    <th className="p-3.5">Seats Sold</th>
                    <th className="p-3.5">Available</th>
                    <th className="p-3.5 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {data.categories?.map((cat) => {
                    const percent = cat.total > 0 ? Math.round((cat.booked / cat.total) * 100) : 0;
                    return (
                      <tr key={cat.category} className="hover:bg-slate-900/50">
                        <td className="p-3.5 font-bold text-white uppercase">{cat.category}</td>
                        <td className="p-3.5 font-mono text-indigo-300">₹{cat.price?.toLocaleString('en-IN')}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-white">{cat.booked}</span> / {cat.total} ({percent}%)
                        </td>
                        <td className="p-3.5 text-emerald-400 font-semibold">{cat.available}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-300">₹{cat.revenue?.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={onClose} className="btn-primary px-6 py-2.5 rounded-xl text-white font-semibold text-xs">
                Close Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganiserAnalyticsModal;
