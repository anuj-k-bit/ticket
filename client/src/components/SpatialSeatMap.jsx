import React, { useState, useRef } from 'react';
import { Stage, Layer, Circle, Rect, Text, Group, Line } from 'react-konva';
import { ZoomIn, ZoomOut, RotateCcw, Armchair, Layers, Sparkles } from 'lucide-react';

export const SpatialSeatMap = ({
  seats,
  currentUserId,
  onHoldSeat,
  onReleaseSeat,
  holdingSeatId
}) => {
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: 40, y: 10 });
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [selectedSection, setSelectedSection] = useState('ALL');
  const stageRef = useRef(null);

  // Categories & Section Colors
  const categories = [...new Set(seats.map((s) => s.category))];
  const sectionColors = ['#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

  const STAGE_CX = 450;
  const STAGE_CY = 50;

  const getSeatColor = (seat) => {
    if (seat.status === 'BOOKED') return '#334155'; // Slate dark
    if (seat.status === 'HELD') {
      const isHeldByMe =
        String(seat.heldBy) === String(currentUserId) || String(seat.heldBy?._id) === String(currentUserId);
      return isHeldByMe ? '#f59e0b' : '#8b5cf6'; // Amber vs Purple
    }
    return '#10b981'; // Emerald Green
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.4, Math.min(2.5, newScale));

    setScale(clampedScale);
    setPosition({
      x: (stage.getPointerPosition().x / clampedScale - mousePointTo.x) * clampedScale,
      y: (stage.getPointerPosition().y / clampedScale - mousePointTo.y) * clampedScale
    });
  };

  const handleReset = () => {
    setScale(0.85);
    setPosition({ x: 40, y: 10 });
    setSelectedSection('ALL');
  };

  return (
    <div className="space-y-4">
      {/* SECTION FILTER BAR WITH PRICING BADGES */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Spatial (x, y) Stadium Map & Fixed Tiers
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset View
            </button>
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          <button
            onClick={() => setSelectedSection('ALL')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedSection === 'ALL'
                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider block">SHOW ALL</span>
            <span className="text-xs font-black text-indigo-300">Entire Arena</span>
          </button>

          {categories.map((cat, idx) => {
            const catSeats = seats.filter((s) => s.category === cat);
            const price = catSeats[0]?.price || 0;
            const isSelected = selectedSection === cat;
            const colorTag = sectionColors[idx % sectionColors.length];

            return (
              <button
                key={cat}
                onClick={() => setSelectedSection(cat)}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800 text-white border-indigo-500 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: colorTag }}></div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider block truncate text-slate-300 pl-1">
                  {cat}
                </span>
                <span className="text-xs font-black text-emerald-400 pl-1 font-mono">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SPATIAL (x, y) VECTOR MAP CANVAS VIEWPORT */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing shadow-2xl min-h-[580px]">
        {/* Availability Color Code Status Bar */}
        <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300 font-bold">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50"></span>
            <span className="text-amber-300 font-bold">Held by You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
            <span className="text-purple-300 font-bold">Held by Others</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-600 inline-block"></span>
            <span className="text-slate-400 font-bold">Booked</span>
          </div>
        </div>

        <Stage
          width={900}
          height={580}
          draggable
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
          ref={stageRef}
        >
          <Layer>
            {/* STAGE GRAPHICS */}
            <Group x={STAGE_CX} y={STAGE_CY}>
              <Rect
                x={-130}
                y={-30}
                width={260}
                height={55}
                fill="#f43f5e"
                cornerRadius={12}
                stroke="#fda4af"
                strokeWidth={2}
                shadowBlur={20}
                shadowColor="#f43f5e"
              />
              <Text
                text="MAIN PERFORMANCE STAGE"
                x={-130}
                y={-12}
                width={260}
                fontSize={13}
                fontStyle="black"
                fill="#ffffff"
                align="center"
                letterSpacing={2}
              />
              {/* Catwalk Runway */}
              <Rect x={-20} y={25} width={40} height={40} fill="#f43f5e" stroke="#fda4af" strokeWidth={2} />
              <Circle x={0} y={65} radius={22} fill="#f43f5e" stroke="#fda4af" strokeWidth={2} />
            </Group>

            {/* SEAT DOTS AT EXPLICIT (x, y) SPATIAL BLUEPRINT POSITIONS */}
            {seats.map((seat) => {
              const isFilteredOut = selectedSection !== 'ALL' && selectedSection !== seat.category;
              const isHeldByMe =
                seat.status === 'HELD' &&
                (String(seat.heldBy) === String(currentUserId) || String(seat.heldBy?._id) === String(currentUserId));
              const isPending = holdingSeatId === seat._id;

              const seatX = seat.x || 100;
              const seatY = seat.y || 100;

              return (
                <Group
                  key={seat._id}
                  x={seatX}
                  y={seatY}
                  opacity={isFilteredOut ? 0.15 : isPending ? 0.4 : 1}
                  onClick={() => {
                    if (seat.status === 'AVAILABLE') onHoldSeat(seat);
                    else if (isHeldByMe) onReleaseSeat(seat);
                  }}
                  onTap={() => {
                    if (seat.status === 'AVAILABLE') onHoldSeat(seat);
                    else if (isHeldByMe) onReleaseSeat(seat);
                  }}
                  onMouseEnter={() => setHoveredSeat(seat)}
                  onMouseLeave={() => setHoveredSeat(null)}
                >
                  <Circle
                    radius={12}
                    fill={getSeatColor(seat)}
                    stroke={isHeldByMe ? '#fbbf24' : '#1e293b'}
                    strokeWidth={isHeldByMe ? 2.5 : 1}
                    shadowBlur={isHeldByMe ? 12 : 0}
                    shadowColor="#f59e0b"
                  />
                  <Text
                    text={`${seat.row}${seat.number}`}
                    fontSize={8.5}
                    fontStyle="black"
                    fill="#ffffff"
                    align="center"
                    verticalAlign="middle"
                    offsetX={8}
                    offsetY={4}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>

        {/* Floating Tooltip */}
        {hoveredSeat && (
          <div className="absolute bottom-4 right-4 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl text-xs space-y-1 backdrop-blur-md pointer-events-none border-l-4 border-l-indigo-500">
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
    </div>
  );
};

export default SpatialSeatMap;
