import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ShowCardSkeleton } from '../components/SkeletonLoaders';
import {
  Film,
  Calendar,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Music,
  Tv,
  Smile,
  Trophy,
  SlidersHorizontal
} from 'lucide-react';

export const BrowseShows = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchShows = async () => {
      try {
        setLoading(true);
        const res = await api.get('/shows');
        const list = Array.isArray(res.data) ? res.data : (res.data?.shows || []);
        setShows(list);
      } catch (err) {
        setError('Failed to fetch scheduled shows');
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, []);

  const filteredShows = (shows || []).filter((s) => {
    if (!s) return false;
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = (s.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (s.venue?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (s.venue?.city || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Indian Events', icon: Sparkles },
    { id: 'concert', label: 'Live Concerts', icon: Music },
    { id: 'movie', label: 'Movies', icon: Tv },
    { id: 'theater', label: 'Theater Plays', icon: Film },
    { id: 'standup', label: 'Standup Comedy', icon: Smile },
    { id: 'sports', label: 'IPL & Sports', icon: Trophy }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 p-8 md:p-12 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Ticket className="w-4 h-4 text-indigo-400" />
            Live High-Concurrency Ticketing India
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Book Concerts, IPL Matches & Premieres in India
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Real-time interactive seat maps with 10-minute hold protection, instant WebSocket updates, and automatic waitlist queue assignments across Mumbai, Delhi, Bengaluru, and Ahmedabad.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search events, cities, or venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Shows Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ShowCardSkeleton />
          <ShowCardSkeleton />
          <ShowCardSkeleton />
        </div>
      ) : filteredShows.length === 0 ? (
        /* FRIENDLY EMPTY STATE */
        <div className="glass-card rounded-3xl p-16 text-center border border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit mx-auto">
            <Film className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-extrabold text-white">No Shows Available Yet</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            There are no scheduled Indian events matching your current filter. Check back soon for upcoming stadium concerts, IPL matches, and movie premieres!
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-block"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((s) => (
            <div key={s._id} className="glass-card rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <img
                    src={s.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950/80 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                    {s.category}
                  </span>
                </div>

                <div className="px-6 space-y-3">
                  <h3 className="text-xl font-extrabold text-white leading-tight">{s.title}</h3>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{s.venue?.name ? `${s.venue.name}, ${s.venue.city}` : 'Venue Arena'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{new Date(s.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-slate-800/80 flex items-center justify-between mt-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tickets From</span>
                  <p className="text-lg font-black text-emerald-400">
                    ₹{s.pricing && s.pricing.length > 0 ? Math.min(...s.pricing.map((p) => p.price)).toLocaleString('en-IN') : '1,500'}
                  </p>
                </div>

                <Link
                  to={`/shows/${s._id}`}
                  className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/20"
                >
                  Select Seats
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseShows;
