import React, { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import QRScannerModal from '../components/QRScannerModal';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Ticket,
  User,
  Clock,
  ShieldCheck,
  XCircle,
  Camera,
  Sparkles
} from 'lucide-react';

export const VerifyTicket = () => {
  const [bookingRef, setBookingRef] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const { addToast } = useToast();

  const handleLookup = async (e, customRef) => {
    if (e) e.preventDefault();
    const targetRef = (customRef || bookingRef).trim().toUpperCase();
    if (!targetRef) return;

    setError('');
    setSuccess('');
    setBooking(null);
    setLoading(true);

    try {
      const res = await api.get(`/bookings/verify/${targetRef}`);
      setBooking(res.data.booking);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Booking reference not found.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (customBooking) => {
    const targetBooking = customBooking || booking;
    if (!targetBooking || checkingIn) return;

    setError('');
    setSuccess('');
    setCheckingIn(true);

    try {
      const res = await api.post('/bookings/check-in', {
        bookingRef: targetBooking.bookingRef
      });

      setSuccess(res.data.message);
      addToast('🎉 Attendee checked in successfully!', 'success');
      setBooking(res.data.booking);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Check-in failed.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCameraScanSuccess = async (decodedText) => {
    setShowScanner(false);
    const cleanRef = decodedText.trim().toUpperCase();
    setBookingRef(cleanRef);
    addToast(`📸 QR Scanned: "${cleanRef}"`, 'info');

    // Auto-lookup & auto check-in
    try {
      setLoading(true);
      const res = await api.get(`/bookings/verify/${cleanRef}`);
      const foundBooking = res.data.booking;
      setBooking(foundBooking);

      if (foundBooking && foundBooking.checkInStatus !== 'CHECKED_IN') {
        await handleCheckIn(foundBooking);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Scanned reference not found.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Organiser / Admin Entrance Control
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Ticket Pass Verification</h1>
        <p className="text-slate-400 text-sm mt-1">Lookup booking references manually or scan ticket QR passes using live camera video stream.</p>
      </div>

      {/* Lookup & Scanner Action Card */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
        <form onSubmit={(e) => handleLookup(e)} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 text-indigo-400 absolute left-4 top-3.5" />
            <input
              type="text"
              required
              placeholder="Enter Booking Reference (e.g. BK-UJQNDC)..."
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-5 py-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4 text-indigo-400" />
              Scan with Camera
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-7 py-3 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Verify Pass
                </>
              )}
            </button>
          </div>
        </form>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Ticket Details Results */}
      {booking && (
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-6 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                REF: {booking.bookingRef}
              </span>
              <h2 className="text-2xl font-black text-white mt-2">{booking.show?.title}</h2>
              <p className="text-xs text-slate-400 uppercase font-semibold">{booking.show?.category}</p>
            </div>

            {/* Check-In Status Badge */}
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                  booking.checkInStatus === 'CHECKED_IN'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {booking.checkInStatus === 'CHECKED_IN' ? (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    CHECKED IN
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    VALID FOR ENTRY
                  </>
                )}
              </span>
              {booking.checkedInAt && (
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Checked in at {new Date(booking.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Attendee Name</span>
              <p className="font-extrabold text-white text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                {booking.user?.name || 'Attendee'}
              </p>
              <p className="text-slate-400 text-[11px]">{booking.user?.email}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Venue & Time</span>
              <p className="font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                {booking.show?.venue?.name}
              </p>
              <p className="text-slate-400 text-[11px]">
                {new Date(booking.show?.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Reserved Seats</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {booking.seats?.map((s) => (
                  <span key={s._id || s} className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    {s.row ? `${s.row}-${s.number}` : 'Seat'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Check-In Button */}
          <div className="pt-4 flex justify-end">
            {booking.checkInStatus === 'CHECKED_IN' ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 w-full justify-center">
                <XCircle className="w-5 h-5 text-rose-400" />
                Ticket has ALREADY been scanned and checked in. Entry denied.
              </div>
            ) : (
              <button
                onClick={() => handleCheckIn(booking)}
                disabled={checkingIn}
                className="w-full sm:w-auto btn-primary px-8 py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 disabled:opacity-50"
              >
                {checkingIn ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Confirm Check-In & Grant Entrance
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Camera Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onScanSuccess={handleCameraScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default VerifyTicket;
