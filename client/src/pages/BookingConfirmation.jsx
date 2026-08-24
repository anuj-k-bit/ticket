import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import {
  CheckCircle2,
  QrCode,
  Calendar,
  MapPin,
  Ticket,
  Download,
  ArrowRight,
  Sparkles,
  Share2
} from 'lucide-react';

export const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data.booking);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleDownloadPass = () => {
    if (!booking?.qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = booking.qrCodeDataUrl;
    link.download = `TicketPass-${booking.bookingRef}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 glass-card rounded-3xl text-center border border-slate-800 space-y-4">
        <h2 className="text-2xl font-bold text-white">Booking Not Found</h2>
        <p className="text-slate-400 text-sm">{error}</p>
        <Link to="/my-bookings" className="btn-primary px-5 py-2.5 rounded-xl text-white font-bold text-xs inline-block">
          View My Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Booking Confirmed!</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Your payment has been processed and your seats are reserved. Scan your digital ticket stub at the venue entrance.
        </p>
      </div>

      {/* PERFORATED TICKET STUB DESIGN */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl ticket-stub grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90">
        {/* Left Main Stub */}
        <div className="lg:col-span-8 p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-dashed border-slate-800 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              OFFICIAL CONCERT PASS
            </span>
            <span className="font-mono text-xs text-amber-400 font-extrabold">
              REF: {booking.bookingRef}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white leading-tight">{booking.show?.title}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">{booking.show?.category}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Date & Showtime</span>
              <p className="font-bold text-white">
                {new Date(booking.show?.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Venue Location</span>
              <p className="font-bold text-white truncate">{booking.show?.venue?.name}</p>
              <p className="text-slate-400 text-[11px]">{booking.show?.venue?.city}</p>
            </div>
          </div>

          {/* Reserved Seats List */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Reserved Seats</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {booking.seats?.map((s) => (
                  <span key={s._id || s} className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-md">
                    {s.category} {s.row}-{s.number}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Paid</span>
              <p className="text-xl font-black font-mono text-emerald-400">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Right QR Code Stub */}
        <div className="lg:col-span-4 p-8 bg-slate-950/60 flex flex-col items-center justify-between gap-6 text-center">
          <div className="space-y-1">
            <p className="text-xs font-bold text-white">Digital Entry Pass</p>
            <p className="text-[10px] text-slate-400">Scan at Entrance</p>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-2xl">
            <img src={booking.qrCodeDataUrl} alt="Entry Pass QR" className="w-36 h-36" />
          </div>

          <p className="text-[10px] font-mono text-slate-400 uppercase">{booking.bookingRef}</p>

          <div className="w-full space-y-2">
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              Print & Download PDF Ticket
            </button>
            <button
              onClick={handleDownloadPass}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              Save QR Code Image
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Link
          to="/my-bookings"
          className="btn-primary px-6 py-3 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Ticket className="w-4 h-4" />
          View All My Tickets
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
