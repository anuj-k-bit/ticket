import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import VenueLayoutPreview from '../components/VenueLayoutPreview';
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Users,
  Layers,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
  Zap
} from 'lucide-react';

export const AdminVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [sections, setSections] = useState([
    { name: 'VIP Front Stage', rows: 10, seatsPerRow: 30 },
    { name: 'Premium Orchestra', rows: 20, seatsPerRow: 45 },
    { name: 'Gold Balcony', rows: 30, seatsPerRow: 60 },
    { name: 'Silver Gallery', rows: 40, seatsPerRow: 70 }
  ]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/venues');
      setVenues(res.data.venues || []);
    } catch (err) {
      setError('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const loadStadiumPreset = () => {
    setName('Metropolis Super Concert Arena');
    setCity('New York');
    setAddress('100 Stadium Plaza, East Wing');
    setSections([
      { name: 'VIP Front Stage', rows: 10, seatsPerRow: 30 },    // 300 seats
      { name: 'Premium Orchestra', rows: 20, seatsPerRow: 45 },  // 900 seats
      { name: 'Gold Balcony', rows: 30, seatsPerRow: 60 },       // 1,800 seats
      { name: 'Silver Gallery', rows: 40, seatsPerRow: 70 }       // 2,800 seats -> Total 5,800 seats
    ]);
    setSuccess('Loaded 5,800-seat Concert Stadium Preset (VIP, Premium, Gold, Silver)!');
  };

  const handleAddSection = () => {
    setSections([...sections, { name: '', rows: 10, seatsPerRow: 20 }]);
  };

  const handleRemoveSection = (index) => {
    if (sections.length === 1) {
      setError('A venue must have at least one seating section.');
      return;
    }
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setCity('');
    setSections([
      { name: 'VIP Front Stage', rows: 10, seatsPerRow: 30 },
      { name: 'Premium Orchestra', rows: 20, seatsPerRow: 45 },
      { name: 'Gold Balcony', rows: 30, seatsPerRow: 60 },
      { name: 'Silver Gallery', rows: 40, seatsPerRow: 70 }
    ]);
    setError('');
  };

  const handleEdit = (venue) => {
    setEditingId(venue._id);
    setName(venue.name);
    setAddress(venue.address);
    setCity(venue.city);
    setSections(
      venue.sections && venue.sections.length > 0
        ? venue.sections.map((s) => ({ name: s.name, rows: s.rows, seatsPerRow: s.seatsPerRow }))
        : [{ name: 'Standard', rows: 5, seatsPerRow: 10 }]
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;
    try {
      await api.delete(`/venues/${id}`);
      setSuccess('Venue deleted successfully');
      fetchVenues();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting venue');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (sections.some((s) => !s.name.trim() || Number(s.rows) < 1 || Number(s.seatsPerRow) < 1)) {
      setError('Please provide valid section names, rows (>=1), and seats per row (>=1).');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      address,
      city,
      sections: sections.map((s) => ({
        name: s.name,
        rows: Number(s.rows),
        seatsPerRow: Number(s.seatsPerRow)
      }))
    };

    try {
      if (editingId) {
        await api.put(`/venues/${editingId}`, payload);
        setSuccess('Venue updated successfully!');
      } else {
        const res = await api.post('/venues', payload);
        setSuccess(`Venue created successfully with ${res.data.venue?.capacity || 0} seats layout!`);
      }
      resetForm();
      fetchVenues();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save venue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Admin Portal
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Venue & Concert Stadium Layout Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Configure multi-section stadium layouts (VIP, Premium, Gold, Silver) up to 10,000+ seats.</p>
        </div>

        <button
          onClick={loadStadiumPreset}
          className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Load 5,800-Seat Stadium Preset (VIP/Gold/Silver)
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create / Edit Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              {editingId ? 'Edit Venue' : 'Create New Venue Template'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Venue Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metropolis Concert Arena"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 100 Stadium Plaza"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Dynamic Sections Builder */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Seating Layout Sections (VIP, Gold, Silver, etc.)
                  </h4>
                  <p className="text-xs text-slate-400">Configure rows & seats per row for multi-tier sections</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Section
                </button>
              </div>

              <div className="space-y-3">
                {sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800"
                  >
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Section Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VIP / Premium / Gold / Silver"
                        value={sec.name}
                        onChange={(e) => handleSectionChange(idx, 'name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full md:w-28">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Rows
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        required
                        value={sec.rows}
                        onChange={(e) => handleSectionChange(idx, 'rows', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full md:w-32">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Seats / Row
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        required
                        value={sec.seatsPerRow}
                        onChange={(e) => handleSectionChange(idx, 'seatsPerRow', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-end justify-end md:self-end pb-0.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Remove section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : editingId ? (
                'Save Venue Changes'
              ) : (
                'Create Multi-Section Venue Template'
              )}
            </button>
          </form>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-slate-800">
          <VenueLayoutPreview sections={sections} />
        </div>
      </div>

      {/* Existing Venues List */}
      <div className="space-y-6 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Configured Venues & Arenas ({venues.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl border border-slate-800 text-slate-400">
            No venues created yet. Use the form above or click "Load 5,800-Seat Stadium Preset" to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((v) => (
              <div key={v._id} className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-white text-lg leading-tight">{v.name}</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold shrink-0">
                      {v.capacity?.toLocaleString()} Seats
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {v.address}, {v.city}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Seating Sections ({v.sections?.length || 0}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {v.sections?.map((sec, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {sec.name}: <strong className="text-indigo-400">{sec.rows}R × {sec.seatsPerRow}S</strong> ({sec.rows * sec.seatsPerRow})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => handleEdit(v)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v._id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVenues;
