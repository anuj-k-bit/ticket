import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import OrganiserAnalyticsModal from '../components/OrganiserAnalyticsModal';
import {
  Film,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Trash2,
  Edit,
  IndianRupee,
  Sparkles,
  BarChart2
} from 'lucide-react';

export const OrganiserShows = () => {
  const [shows, setShows] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [analyticsShowId, setAnalyticsShowId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('concert');
  const [venueId, setVenueId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [pricing, setPricing] = useState([]);

  const fetchShowsAndVenues = async () => {
    try {
      setLoading(true);
      const [showsRes, venuesRes] = await Promise.all([
        api.get('/shows/organiser/my-shows'),
        api.get('/venues')
      ]);
      setShows(showsRes.data.shows || []);
      setVenues(venuesRes.data.venues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organiser data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowsAndVenues();
  }, []);

  const handleVenueChange = (selectedId) => {
    setVenueId(selectedId);
    const selectedVenue = venues.find((v) => v._id === selectedId);
    if (selectedVenue && selectedVenue.seatMapTemplate) {
      const uniqueCategories = [
        ...new Set(selectedVenue.seatMapTemplate.map((s) => s.category))
      ];
      const initialPricing = uniqueCategories.map((catName) => {
        const lower = catName.toLowerCase();
        let defaultPrice = 2500;
        if (lower.includes('vip') || lower.includes('box')) defaultPrice = 12000;
        else if (lower.includes('premium') || lower.includes('platinum')) defaultPrice = 6500;
        else if (lower.includes('gold')) defaultPrice = 3500;
        else if (lower.includes('silver')) defaultPrice = 1800;
        else if (lower.includes('bronze')) defaultPrice = 950;
        return { category: catName, price: defaultPrice };
      });
      setPricing(initialPricing);
    }
  };

  const handlePriceChange = (categoryName, newPrice) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.category === categoryName ? { ...p, price: Number(newPrice) } : p
      )
    );
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/shows', {
        title,
        description,
        category,
        venueId,
        startTime,
        endTime,
        bannerUrl: bannerUrl || undefined,
        pricing
      });

      setSuccess(res.data.message || 'Show scheduled successfully!');
      setShowModal(false);
      fetchShowsAndVenues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create show');
    }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this show and all generated seats?')) return;
    try {
      await api.delete(`/shows/${id}`);
      setSuccess('Show deleted successfully');
      fetchShowsAndVenues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete show');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Film className="w-3.5 h-3.5" />
            Organiser Portal
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Indian Event Management</h1>
          <p className="text-slate-400 text-sm mt-1">Schedule concerts, movies, sports matches, and theater plays with INR (₹) section pricing.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Schedule New Indian Event
        </button>
      </div>

      {/* Shows List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm mt-3">Loading your events...</p>
        </div>
      ) : shows.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Shows Scheduled Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Click "Schedule New Indian Event" above to pick an Indian stadium/venue layout and launch your live show.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((s) => (
            <div key={s._id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {s.category}
                  </span>
                  <button
                    onClick={() => handleDeleteShow(s._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-extrabold text-white leading-tight">{s.title}</h3>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{s.venue?.name ? `${s.venue.name}, ${s.venue.city}` : 'Venue details'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{new Date(s.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setAnalyticsShowId(s._id)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  View Sales & Revenue Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Modal */}
      {analyticsShowId && (
        <OrganiserAnalyticsModal
          showId={analyticsShowId}
          onClose={() => setAnalyticsShowId(null)}
        />
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-xl w-full p-8 rounded-3xl border border-slate-800 space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold text-white">Schedule New Indian Concert / Event</h2>

            <form onSubmit={handleCreateShow} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Show Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A.R. Rahman Live in Mumbai"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Category / Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="concert">Live Concert</option>
                  <option value="movie">Movie Premiere</option>
                  <option value="theater">Theater Play</option>
                  <option value="standup">Standup Comedy</option>
                  <option value="sports">Sports Match / IPL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Select Venue Template</label>
                <select
                  required
                  value={venueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Venue --</option>
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.capacity?.toLocaleString('en-IN')} Seats, {v.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing breakdown per section category */}
              {pricing.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-amber-400 uppercase">Set Category Pricing (₹ INR)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {pricing.map((p) => (
                      <div key={p.category}>
                        <label className="text-[11px] text-slate-400 font-semibold">{p.category} Price (₹)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={p.price}
                          onChange={(e) => handlePriceChange(p.category, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl text-white text-xs font-extrabold">
                  Create Event & Generate Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganiserShows;
