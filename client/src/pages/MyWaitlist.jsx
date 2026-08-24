import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { TableSkeleton } from '../components/SkeletonLoaders';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  Calendar,
  MapPin,
  Ticket,
  XCircle,
  Sparkles,
  UserCheck
} from 'lucide-react';

export const MyWaitlist = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const { addToast } = useToast();

  const fetchWaitlistEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/waitlist/my-entries');
      setEntries(res.data.entries || []);
    } catch (err) {
      addToast('Failed to fetch waitlist entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlistEntries();
  }, []);

  const handleCancelWaitlist = async (entryId) => {
    if (!window.confirm('Are you sure you want to leave this waitlist queue?')) return;
    setCancellingId(entryId);

    try {
      await api.delete(`/waitlist/${entryId}`);
      addToast('Removed from waitlist queue.', 'info');
      fetchWaitlistEntries();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to leave waitlist', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Clock className="w-3.5 h-3.5" />
          Auto-Assignment Queue
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Waitlist Priority Queue</h1>
        <p className="text-slate-400 text-sm mt-1">Track your priority position for sold-out section categories. Offers are dispatched automatically on ticket cancellation.</p>
      </div>

      {/* Waitlist Entries List */}
      {loading ? (
        <TableSkeleton />
      ) : entries.length === 0 ? (
        /* FRIENDLY EMPTY STATE */
        <div className="glass-card rounded-3xl p-16 text-center border border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mx-auto">
            <Clock className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Your Waitlist is Empty</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            You haven't joined any waitlist queues yet. If a section tier for a concert or premiere is sold out, click "Join Waitlist" on the show page to claim cancelled tickets!
          </p>
          <Link to="/shows" className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-block">
            Browse Live Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((e) => (
            <div key={e._id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {e.category} Section
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2 leading-tight">{e.show?.title}</h3>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    e.status === 'OFFERED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
                      : e.status === 'WAITING'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {e.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{e.show?.venue?.name ? `${e.show.venue.name}, ${e.show.venue.city}` : 'Venue Arena'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{new Date(e.show?.startTime || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Queue Info Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Queue Position</span>
                    <p className="font-extrabold text-amber-400 text-sm">#{e.position || 1} in line</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Joined On</span>
                    <p className="text-slate-300 text-xs">{new Date(e.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                {e.status === 'OFFERED' && e.offeredSeat ? (
                  <Link
                    to={`/shows/${e.show?._id || e.show}?offerSeatId=${e.offeredSeat._id || e.offeredSeat}`}
                    className="btn-primary py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 flex-1 shadow-lg shadow-indigo-500/20"
                  >
                    <UserCheck className="w-4 h-4" />
                    Claim Offered Ticket
                  </Link>
                ) : (
                  <Link
                    to={`/shows/${e.show?._id || e.show}`}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-800 flex-1 transition-colors"
                  >
                    View Event
                  </Link>
                )}

                <button
                  onClick={() => handleCancelWaitlist(e._id)}
                  disabled={cancellingId === e._id}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyWaitlist;
