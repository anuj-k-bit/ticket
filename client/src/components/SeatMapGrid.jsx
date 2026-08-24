import React, { useState } from 'react';
import { Armchair, Check, Clock, Lock, Sparkles, SlidersHorizontal, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const SeatMapGrid = ({
  seats = [],
  currentUserId,
  onHoldSeat,
  onReleaseSeat,
  holdingSeatId
}) => {
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Group seats by Category (Section) -> Row
  const seatsByCategory = {};
  seats.forEach((seat) => {
    if (!seatsByCategory[seat.category]) {
      seatsByCategory[seat.category] = {};
    }
    if (!seatsByCategory[seat.category][seat.row]) {
      seatsByCategory[seat.category][seat.row] = [];
    }
    seatsByCategory[seat.category][seat.row].push(seat);
  });

  // Sort seats by number within rows
  Object.keys(seatsByCategory).forEach((cat) => {
    Object.keys(seatsByCategory[cat]).forEach((row) => {
      seatsByCategory[cat][row].sort((a, b) => a.number - b.number);
    });
  });

  const categories = Object.keys(seatsByCategory);

  const getSeatConfig = (seat) => {
    const isMine =
      seat.status === 'HELD' &&
      (String(seat.heldBy) === String(currentUserId) ||
        String(seat.heldBy?._id) === String(currentUserId));

    if (isMine) {
      return {
        className:
          'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black rounded-xl border-2 border-amber-300 shadow-xl shadow-amber-500/50 ring-4 ring-amber-500/30 animate-pulse scale-110 z-10',
        icon: <Check className="w-3.5 h-3.5 stroke-[3]" />,
        label: 'Held by You'
      };
    }

    if (seat.status === 'HELD') {
      return {
        className:
          'bg-purple-950/80 text-purple-300 border border-purple-500/40 rounded-xl cursor-not-allowed opacity-85 shadow-sm shadow-purple-500/20',
        icon: <Clock className="w-3 h-3 text-purple-400" />,
        label: 'Held by Someone Else'
      };
    }

    if (seat.status === 'BOOKED') {
      return {
        className:
          'bg-slate-900/90 text-slate-600 border border-slate-800 rounded-lg cursor-not-allowed opacity-50',
        icon: <Lock className="w-3 h-3 text-slate-600" />,
        label: 'Booked / Unavailable'
      };
    }

    return {
      className:
        'bg-slate-900/90 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 border border-emerald-500/40 hover:border-emerald-400 rounded-full shadow-md hover:shadow-emerald-500/30 hover:scale-125 active:scale-95 transition-all duration-200 cursor-pointer',
      icon: <Armchair className="w-3.5 h-3.5 text-emerald-400 group-hover:text-slate-950 transition-colors" />,
      label: 'Available'
    };
  };

  const getSectionStyle = (categoryName) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('vip') || lower.includes('pit') || lower.includes('ringside')) {
      return {
        card: 'bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-950 border-rose-500/40 shadow-rose-500/10',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        text: 'text-rose-400'
      };
    }
    if (lower.includes('gold')) {
      return {
        card: 'bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-950 border-amber-500/40 shadow-amber-500/10',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        text: 'text-amber-400'
      };
    }
    if (lower.includes('lounge') || lower.includes('premium')) {
      return {
        card: 'bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-950 border-purple-500/40 shadow-purple-500/10',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        text: 'text-purple-400'
      };
    }
    return {
      card: 'bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 border-indigo-500/40 shadow-indigo-500/10',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      text: 'text-indigo-400'
    };
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="space-y-8 relative">
      {/* 1. SECTION FILTER PILLS BAR WITH ZOOM CONTROLS */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase text-slate-300 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            Filter Arena Seating Sections & Controls
          </span>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Zoom Stadium:</span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold text-indigo-300 w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedSection('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSection === 'ALL'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            Show All Sections ({seats.length})
          </button>

          {categories.map((catName) => {
            const catSeats = Object.values(seatsByCategory[catName]).flat();
            const openCount = catSeats.filter((s) => s.status === 'AVAILABLE').length;
            const price = catSeats[0]?.price || 0;
            const isSelected = selectedSection === catName;

            return (
              <button
                key={catName}
                onClick={() => setSelectedSection(catName)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{catName}</span>
                <span className="font-mono text-emerald-400">₹{price.toLocaleString('en-IN')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                  {openCount} open
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. GLOWING NEON STADIUM STAGE ARCH */}
      <div className="relative w-full max-w-2xl mx-auto py-4">
        <div className="w-full h-8 rounded-t-full bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-transparent border-t-4 border-indigo-500 shadow-[0_-10px_30px_rgba(99,102,241,0.3)] flex items-center justify-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            STADIUM PERFORMANCE STAGE / SCREEN AREA
          </span>
        </div>
      </div>

      {/* 3. ACCESSIBLE LEGEND: Shape AND Color Distinction */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold shadow-inner">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-900 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/30">
            <Armchair className="w-3.5 h-3.5" />
          </div>
          <span className="text-slate-200">Available (Circle)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/40">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-amber-300">Held by You (Badge)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Clock className="w-3 h-3" />
          </div>
          <span className="text-purple-300">Held by Others (Square)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
            <Lock className="w-3 h-3" />
          </div>
          <span className="text-slate-500">Booked (Flat Square)</span>
        </div>
      </div>

      {/* 4. RESPONSIVE STADIUM LAYOUT CONTAINER WITH ZOOM SCALE */}
      <div className="overflow-x-auto custom-scrollbar pb-6">
        <div
          className="min-w-[520px] space-y-8 transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {Object.entries(seatsByCategory).map(([categoryName, rows]) => {
            const isFilteredOut = selectedSection !== 'ALL' && selectedSection !== categoryName;
            if (isFilteredOut) return null;

            const sectionStyle = getSectionStyle(categoryName);
            const catSeats = Object.values(rows).flat();
            const price = catSeats[0]?.price || 0;
            const openCount = catSeats.filter((s) => s.status === 'AVAILABLE').length;

            return (
              <div
                key={categoryName}
                className={`p-6 rounded-3xl border shadow-xl transition-all duration-300 ${sectionStyle.card}`}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-xl border ${sectionStyle.badge}`}>
                      {categoryName} Section
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    <strong className="text-emerald-400">{openCount}</strong> / {catSeats.length} Seats Available
                  </span>
                </div>

                {/* Staggered Rows Grid */}
                <div className="space-y-3.5 pt-1">
                  {Object.entries(rows).map(([rowName, rowSeats], rIdx) => {
                    const isStaggered = rIdx % 2 === 1;

                    return (
                      <div key={rowName} className={`flex items-center gap-4 ${isStaggered ? 'pl-4' : 'pl-0'}`}>
                        <span className="w-12 text-xs font-extrabold text-slate-400 shrink-0 text-right font-mono">
                          Row {rowName}
                        </span>

                        <div className="flex items-center gap-2.5 flex-wrap flex-1">
                          {rowSeats.map((seat) => {
                            const config = getSeatConfig(seat);
                            const isMine =
                              seat.status === 'HELD' &&
                              (String(seat.heldBy) === String(currentUserId) ||
                                String(seat.heldBy?._id) === String(currentUserId));
                            const isAvailable = seat.status === 'AVAILABLE';
                            const isLoadingThis = holdingSeatId === seat._id;

                            return (
                              <button
                                key={seat._id}
                                disabled={!isAvailable && !isMine}
                                onClick={() => {
                                  if (isMine) onReleaseSeat(seat);
                                  else if (isAvailable) onHoldSeat(seat);
                                }}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                className={`group relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center font-bold text-xs ${config.className}`}
                              >
                                {isLoadingThis ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                                ) : (
                                  config.icon
                                )}
                                <span className="sr-only">{seat.row}-{seat.number}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. FLOATING HOVER TOOLTIP CARD */}
      {hoveredSeat && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl text-xs space-y-1 backdrop-blur-md pointer-events-none border-l-4 border-l-indigo-500 animate-in fade-in slide-in-from-bottom-2">
          <p className="font-extrabold text-white text-sm">
            Seat {hoveredSeat.row}-{hoveredSeat.number}
          </p>
          <p className="text-indigo-300 font-bold uppercase text-[10px]">{hoveredSeat.category} Section</p>
          <p className="text-slate-300 text-[11px] pt-1">
            Ticket Price: <strong className="text-emerald-400 font-mono text-xs">₹{hoveredSeat.price?.toLocaleString('en-IN')}</strong>
          </p>
          <p className="text-slate-400 text-[10px]">
            Status: <span className="uppercase text-amber-300 font-extrabold">{hoveredSeat.status}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SeatMapGrid;
