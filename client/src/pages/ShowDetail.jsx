import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SeatMapGrid from '../components/SeatMapGrid';
import { SeatMapSkeleton } from '../components/SkeletonLoaders';
import {
  Calendar,
  MapPin,
  Tag,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Armchair,
  Sparkles,
  AlertCircle,
  X,
  Ticket,
  CreditCard,
  UserPlus,
  ShieldCheck,
  Check
} from 'lucide-react';

export const ShowDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offerSeatId = searchParams.get('offerSeatId');

  const [show, setShow] = useState(null);
  const [stats, setStats] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [joiningWaitlistCategory, setJoiningWaitlistCategory] = useState(null);

  // Razorpay Sandbox Test Modal & Coupon State
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountINR, setDiscountINR] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !heldSeat) return;
    setApplyingCoupon(true);
    try {
      const res = await api.post('/coupons/apply', {
        code: couponInput.trim(),
        orderAmount: heldSeat.price
      });
      setAppliedCoupon(res.data.code);
      setDiscountINR(res.data.discountINR);
      addToast(res.data.message, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid coupon code', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Hold State
  const [heldSeat, setHeldSeat] = useState(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [holdingSeatId, setHoldingSeatId] = useState(null);
  const warned60sRef = useRef(false);

  const socketRef = useRef(null);

  // Dynamically load Razorpay SDK Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchShowData = async () => {
    try {
      setLoading(true);
      const [showRes, seatsRes] = await Promise.all([
        api.get(`/shows/${id}`),
        api.get(`/shows/${id}/seats`)
      ]);
      setShow(showRes.data.show);
      setStats(showRes.data.stats);

      const seatList = seatsRes.data.seats || [];
      setSeats(seatList);

      if (user) {
        let myHeld = seatList.find(
          (s) =>
            s.status === 'HELD' &&
            (String(s.heldBy) === String(user.id) || String(s.heldBy?._id) === String(user.id))
        );

        if (!myHeld && offerSeatId) {
          myHeld = seatList.find((s) => String(s._id) === String(offerSeatId));
        }

        if (myHeld) {
          setHeldSeat(myHeld);
          setHoldExpiresAt(myHeld.holdExpiresAt);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load show details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowData();

    const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
    let socketUrl = 'https://cinepass-backend.onrender.com';
    if (rawSocketUrl && rawSocketUrl !== 'undefined' && rawSocketUrl !== 'null' && rawSocketUrl.trim() !== '') {
      socketUrl = rawSocketUrl.trim();
    } else if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      socketUrl = 'http://localhost:5000';
    }

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_show', id);
      fetchShowData();
    });

    socket.on('seat_updated', (event) => {
      if (String(event.showId) === String(id)) {
        setSeats((prevSeats) =>
          prevSeats.map((s) => {
            if (String(s._id) === String(event.seatId)) {
              if (
                event.status === 'HELD' &&
                String(event.heldBy) !== String(user?.id)
              ) {
                addToast(`Seat ${s.row}-${s.number} was just taken by another user!`, 'info');
              }
              return {
                ...s,
                status: event.status,
                heldBy: event.heldBy,
                holdExpiresAt: event.holdExpiresAt || null
              };
            }
            return s;
          })
        );
      }
    });

    return () => {
      if (socket) {
        socket.emit('leave_show', id);
        socket.disconnect();
      }
    };
  }, [id, user?.id]);

  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeftSeconds(0);
      warned60sRef.current = false;
      return;
    }

    const updateTimer = () => {
      const remainingMs = new Date(holdExpiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeftSeconds(0);
        if (heldSeat) {
          addToast(`Your seat hold for ${heldSeat.row}-${heldSeat.number} has expired.`, 'warning');
          setSeats((prev) =>
            prev.map((s) =>
              String(s._id) === String(heldSeat._id)
                ? { ...s, status: 'AVAILABLE', heldBy: null, holdExpiresAt: null }
                : s
            )
          );
        }
        setHeldSeat(null);
        setHoldExpiresAt(null);
        warned60sRef.current = false;
      } else {
        const secs = Math.floor(remainingMs / 1000);
        setTimeLeftSeconds(secs);

        if (secs <= 60 && secs > 55 && !warned60sRef.current) {
          warned60sRef.current = true;
          addToast('⚠️ Warning: Your seat hold expires in 60 seconds! Confirm booking now.', 'warning', 6000);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, heldSeat]);

  const handleHoldSeat = async (seat) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (holdingSeatId) return;

    setHoldingSeatId(seat._id);

    const prevSeatState = { ...seat };
    setSeats((prev) =>
      prev.map((s) =>
        String(s._id) === String(seat._id)
          ? { ...s, status: 'HELD', heldBy: user.id }
          : s
      )
    );

    try {
      const res = await api.post(`/shows/${id}/seats/${seat._id}/hold`);
      if (res.data.success) {
        setHeldSeat(res.data.seat);
        setHoldExpiresAt(res.data.holdExpiresAt);
        addToast(`🎉 Seat ${seat.row}-${seat.number} held for 10 minutes!`, 'success');
      }
    } catch (err) {
      setSeats((prev) =>
        prev.map((s) => (String(s._id) === String(seat._id) ? prevSeatState : s))
      );

      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Seat is currently unavailable.';
      addToast(`Unable to hold seat: ${msg}`, 'error');
    } finally {
      setHoldingSeatId(null);
    }
  };

  const handleReleaseSeat = async (seat) => {
    if (!user || holdingSeatId) return;
    setHoldingSeatId(seat._id);

    try {
      await api.post(`/shows/${id}/seats/${seat._id}/release`);
      setHeldSeat(null);
      setHoldExpiresAt(null);
      addToast(`Seat ${seat.row}-${seat.number} hold released.`, 'info');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message;
      addToast(msg || 'Failed to release seat.', 'error');
    } finally {
      setHoldingSeatId(null);
    }
  };

  const handleConfirmBookingWithRazorpay = async () => {
    if (!heldSeat || !user || submittingBooking) return;
    setSubmittingBooking(true);

    try {
      const orderRes = await api.post('/payments/create-order', {
        showId: id,
        seatIds: [heldSeat._id]
      });

      const orderData = orderRes.data;

      // If in sandbox mode (mock order ID or test key), open internal Razorpay modal
      if (orderData.orderId.startsWith('order_mock_') || !orderData.key.startsWith('rzp_live_')) {
        setPaymentOrder(orderData);
        setSubmittingBooking(false);
        return;
      }

      // Live Production Razorpay SDK Popup
      if (window.Razorpay) {
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'CinePass Tickets',
          description: `${orderData.showTitle} - Seat ${heldSeat.row}-${heldSeat.number}`,
          order_id: orderData.orderId,
          handler: async function (response) {
            await executePaymentVerification(
              response.razorpay_order_id || orderData.orderId,
              response.razorpay_payment_id || `pay_${Date.now()}`,
              response.razorpay_signature || 'mock_sig_valid'
            );
          },
          prefill: {
            name: user.name || 'Valued Customer',
            email: user.email || 'customer@example.com'
          },
          theme: { color: '#6366f1' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          addToast(`Payment Failed: ${response.error?.description || 'Transaction cancelled'}`, 'error');
          setSubmittingBooking(false);
        });
        rzp.open();
      } else {
        setPaymentOrder(orderData);
        setSubmittingBooking(false);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message;
      addToast(msg || 'Failed to initialize payment.', 'error');
      setSubmittingBooking(false);
    }
  };

  const executePaymentVerification = async (orderId, paymentId, signature) => {
    setSubmittingBooking(true);
    try {
      const verifyRes = await api.post('/payments/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        showId: id,
        seatIds: [heldSeat._id]
      });

      if (verifyRes.data.booking) {
        addToast('🎉 Razorpay Payment Verified! Booking confirmed.', 'success');
        setPaymentOrder(null);
        navigate(`/bookings/confirmation/${verifyRes.data.booking._id}`);
      }
    } catch (vErr) {
      const msg = vErr.response?.data?.message || 'Payment verification failed.';
      addToast(msg, 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleJoinWaitlist = async (category) => {
    if (!user || joiningWaitlistCategory) return;
    setJoiningWaitlistCategory(category);

    try {
      const res = await api.post('/waitlist/join', {
        showId: id,
        category
      });
      addToast(`Joined waitlist for ${category}! Queue position: #${res.data.position}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message;
      addToast(msg || 'Failed to join waitlist.', 'error');
    } finally {
      setJoiningWaitlistCategory(null);
    }
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <SeatMapSkeleton />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 glass-card rounded-3xl text-center border border-slate-800 space-y-4">
        <h2 className="text-2xl font-bold text-white">Show Not Found</h2>
        <Link to="/shows" className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-white font-semibold text-xs">
          <ArrowLeft className="w-4 h-4" />
          Back to Browse Shows
        </Link>
      </div>
    );
  }

  const categoryStats = {};
  seats.forEach((s) => {
    if (!categoryStats[s.category]) {
      categoryStats[s.category] = { total: 0, available: 0, price: s.price };
    }
    categoryStats[s.category].total += 1;
    if (s.status === 'AVAILABLE') categoryStats[s.category].available += 1;
  });

  const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;
  const progressPercent = Math.max(0, Math.min(100, (timeLeftSeconds / 600) * 100));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <Link to="/shows" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to All Events
      </Link>

      {/* Offer Banner */}
      {offerSeatId && heldSeat && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-900/40 to-slate-900 border border-amber-500/40 flex items-center gap-4 text-amber-200">
          <Sparkles className="w-6 h-6 text-amber-400 shrink-0 animate-spin" />
          <div>
            <p className="font-extrabold text-sm text-white">Waitlist Ticket Offer Received!</p>
            <p className="text-xs text-amber-300">You received a 15-minute waitlist offer for Seat {heldSeat.row}-{heldSeat.number} ({heldSeat.category})!</p>
          </div>
        </div>
      )}

      {/* Active Seat Hold Bar with Live Ticking Countdown */}
      {heldSeat && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/80 via-purple-900/60 to-slate-900 border border-indigo-500/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-950">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeftSeconds <= 60 ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-indigo-600 text-white animate-pulse shadow-lg shadow-indigo-500/40">
              <Ticket className="w-7 h-7" />
            </div>
            <div>
              <p className="font-extrabold text-white text-lg">
                Holding Seat <span className="text-indigo-300">{heldSeat.row}-{heldSeat.number}</span> ({heldSeat.category})
              </p>
              <p className="text-xs text-slate-300">Ticket Price: <strong className="text-emerald-400">₹{heldSeat.price?.toLocaleString('en-IN')}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400 animate-spin" /> Hold Expires In
              </p>
              <p className={`text-3xl font-black font-mono ${timeLeftSeconds <= 60 ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
                {formatCountdown(timeLeftSeconds)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirmBookingWithRazorpay}
                disabled={submittingBooking}
                className="btn-primary px-6 py-3 rounded-xl text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {submittingBooking ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Razorpay Checkout (₹{heldSeat.price?.toLocaleString('en-IN')})
                  </>
                )}
              </button>

              <button
                onClick={() => handleReleaseSeat(heldSeat)}
                disabled={submittingBooking}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancel Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Availability & Waitlist Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(categoryStats).map(([catName, info]) => {
          const isSoldOut = info.available === 0;
          return (
            <div key={catName} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-indigo-300">{catName}</span>
                <span className="text-base font-black text-white">₹{info.price?.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{info.available} of {info.total} seats open</span>
                {isSoldOut ? (
                  <span className="text-rose-400 font-bold uppercase text-[10px]">Sold Out</span>
                ) : (
                  <span className="text-emerald-400 font-bold text-[10px]">Available</span>
                )}
              </div>

              {isSoldOut && (
                <button
                  onClick={() => handleJoinWaitlist(catName)}
                  disabled={joiningWaitlistCategory === catName}
                  className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {joiningWaitlistCategory === catName ? 'Joining...' : 'Join Waitlist'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Hero Banner Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 relative h-72 lg:h-auto min-h-[300px] bg-slate-900">
          <img
            src={show.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'}
            alt={show.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-600 text-white shadow-md">
              {show.category}
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white">{show.title}</h1>
          </div>
        </div>

        <div className="lg:col-span-5 p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Event & Location</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{show.description || 'Live Indian concert and premiere event with real-time seat hold selection.'}</p>

            <div className="space-y-3 text-xs text-slate-300 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">{show.venue?.name || 'Venue'}</p>
                  <p className="text-slate-400">{show.venue?.address}, {show.venue?.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Showtime Schedule</p>
                  <p className="text-slate-400">
                    {new Date(show.startTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Seats</p>
              <p className="text-xl font-black text-white">{seats.length.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-400 font-semibold">Available Now</p>
              <p className="text-xl font-black text-emerald-300">{availableCount.toLocaleString('en-IN')} Seats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rock-Solid Interactive Seating Layout */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Armchair className="w-6 h-6 text-indigo-400" />
              Interactive Seating Layout & Reservation
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select an available seat to lock it for 10 minutes. Real-time WebSockets push instant status updates.
            </p>
          </div>
        </div>

        <SeatMapGrid
          seats={seats}
          currentUserId={user?.id}
          onHoldSeat={handleHoldSeat}
          onReleaseSeat={handleReleaseSeat}
          holdingSeatId={holdingSeatId}
          holdExpiresAt={holdExpiresAt}
        />
      </div>

      {/* RAZORPAY PAYMENT CHECKOUT MODAL DIALOG */}
      {paymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs tracking-tighter">
                  RZP
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Razorpay Payment Checkout</h4>
                  <p className="text-[11px] text-slate-400">Order ID: {paymentOrder.orderId}</p>
                </div>
              </div>

              <button
                onClick={() => setPaymentOrder(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Amount Badge */}
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-300 font-semibold block">Total Amount Payable</span>
                  <span className="text-xs text-slate-400">Seat {heldSeat?.row}-{heldSeat?.number} ({heldSeat?.category})</span>
                </div>
                <div className="text-right">
                  {discountINR > 0 && (
                    <span className="text-xs text-slate-400 line-through block">
                      ₹{paymentOrder.totalAmountINR?.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ₹{(paymentOrder.totalAmountINR - discountINR)?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Promo Code Input Box */}
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. EARLYBIRD20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors disabled:opacity-50"
                >
                  {applyingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>

              {appliedCoupon && (
                <p className="text-[10px] text-amber-300 font-bold flex items-center gap-1 pt-1">
                  <Tag className="w-3 h-3 text-amber-400" />
                  Code {appliedCoupon} applied! Discount ₹{discountINR.toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Payment Method Options (UPI, NetBanking, Cards, Wallets) */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-300 uppercase">Select Payment Method:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'upi', label: 'UPI / Google Pay', sub: 'Paytm, PhonePe' },
                  { id: 'card', label: 'Cards', sub: 'Visa, MasterCard' },
                  { id: 'netbanking', label: 'NetBanking', sub: 'HDFC, ICICI, SBI' },
                  { id: 'wallet', label: 'Wallets', sub: 'Mobikwik, Amazon' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      selectedMethod === m.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{m.label}</span>
                    <span className="text-[10px] text-slate-400">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pay Button */}
            <button
              disabled={submittingBooking}
              onClick={() =>
                executePaymentVerification(
                  paymentOrder.orderId,
                  `pay_${Date.now()}`,
                  'mock_sig_valid'
                )
              }
              className="w-full btn-primary py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 disabled:opacity-50"
            >
              {submittingBooking ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Pay ₹{paymentOrder.totalAmountINR?.toLocaleString('en-IN')} & Confirm Ticket
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowDetail;
