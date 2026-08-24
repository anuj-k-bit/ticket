import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { TableSkeleton } from '../components/SkeletonLoaders';
import { useToast } from '../context/ToastContext';
import {
  QrCode,
  Calendar,
  MapPin,
  Ticket,
  XCircle,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';

export const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedQrBooking, setSelectedQrBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const { addToast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      addToast('Failed to load your booking passes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Released seats will be offered to waitlisted customers.')) return;
    setCancellingId(bookingId);

    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      addToast(res.data.message || 'Booking cancelled successfully.', 'success');
      fetchBookings();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();

  const filteredBookings = bookings.filter((b) => {
    const showTime = b.show?.startTime ? new Date(b.show.startTime) : new Date();
    if (activeTab === 'upcoming') {
      return b.status === 'CONFIRMED' && showTime >= now;
    }
    if (activeTab === 'past') {
      return b.status === 'CONFIRMED' && showTime < now;
    }
    if (activeTab === 'cancelled') {
      return b.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <QrCode className="w-3.5 h-3.5" />
          Digital Pass Wallet
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Confirmed Bookings</h1>
        <p className="text-slate-400 text-sm mt-1">Access digital entry QR passes, review event details, and manage ticket cancellations.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Upcoming Events ({bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.show?.startTime || Date.now()) >= now).length})
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'past'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Past Events ({bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.show?.startTime || Date.now()) < now).length})
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cancelled'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Cancelled Tickets ({bookings.filter((b) => b.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <TableSkeleton />
      ) : filteredBookings.length === 0 ? (
        /* FRIENDLY EMPTY STATE */
        <div className="glass-card rounded-3xl p-16 text-center border border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mx-auto">
            <Ticket className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-extrabold text-white">No Bookings Found</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            You don't have any {activeTab} ticket passes in your wallet yet. Explore upcoming stadium concerts and IPL matches!
          </p>
          <Link to="/shows" className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-block">
            Browse Live Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => (
            <div key={b._id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {b.bookingRef}
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2 leading-tight">{b.show?.title}</h3>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{b.show?.venue?.name ? `${b.show.venue.name}, ${b.show.venue.city}` : 'Venue details'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{new Date(b.show?.startTime || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Seats List */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Reserved Seats</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {b.seats?.map((s) => (
                        <span key={s._id || s} className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                          {s.row ? `${s.row}-${s.number}` : 'Seat'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Paid</span>
                    <p className="font-mono font-black text-emerald-400 text-sm">₹{b.totalAmount?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedQrBooking(b)}
                  className="btn-primary py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 flex-1 shadow-lg shadow-indigo-500/20"
                >
                  <QrCode className="w-4 h-4" />
                  View QR Pass
                </button>

                {b.status === 'CONFIRMED' && activeTab === 'upcoming' && (
                  <button
                    onClick={() => handleCancelBooking(b._id)}
                    disabled={cancellingId === b._id}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-sm w-full p-8 rounded-3xl border border-slate-800 space-y-6 text-center relative">
            <button
              onClick={() => setSelectedQrBooking(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedQrBooking.bookingRef}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">{selectedQrBooking.show?.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Scan at venue entrance</p>
            </div>

            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-2xl">
              <img src={selectedQrBooking.qrCodeDataUrl} alt="Booking QR Pass" className="w-48 h-48" />
            </div>

            <p className="text-[11px] text-slate-400 font-mono">Reference: {selectedQrBooking.bookingRef}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
