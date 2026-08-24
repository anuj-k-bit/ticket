import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Text, Group, Path, Line, Circle } from 'react-konva';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Ticket, CheckCircle2, Armchair, ShieldCheck } from 'lucide-react';

export const CanvasSeatMap = ({
  seats,
  currentUserId,
  onHoldSeat,
  onReleaseSeat,
  holdingSeatId
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoveredSection, setHoveredSection] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const stageRef = useRef(null);

  // Group seats by Category Section
  const categories = [...new Set(seats.map((s) => s.category))];

  // Map category section metadata with fixed section pricing and layout geometry
  const STAGE_CX = 425;
  const STAGE_CY = 50;

  /**
   * Section Block Definitions matching BookMyShow Stadium Layout:
   * Fixed Section Fee, Color Palette, Coordinates, and Polygon Geometries.
   */
  const getSectionBlocks = () => {
    const blocks = [];
    const colors = [
      { fill: '#f43f5e', border: '#fda4af', glow: '#f43f5e' }, // Fan Pit / VIP - Rose
      { fill: '#f59e0b', border: '#fcd34d', glow: '#f59e0b' }, // Gold - Amber
      { fill: '#3b82f6', border: '#93c5fd', glow: '#3b82f6' }, // Silver - Blue
      { fill: '#8b5cf6', border: '#c4b5fd', glow: '#8b5cf6' }, // Lounge - Purple
      { fill: '#10b981', border: '#6ee7b7', glow: '#10b981' }, // Premium - Emerald
      { fill: '#ec4899', border: '#fbcfe8', glow: '#ec4899' }  // Box - Pink
    ];

    categories.forEach((catName, idx) => {
      const catSeats = seats.filter((s) => s.category === catName);
      const fixedFee = catSeats[0]?.price || 0;
      const availableSeats = catSeats.filter((s) => s.status === 'AVAILABLE');
      const bookedSeats = catSeats.filter((s) => s.status === 'BOOKED');
      const heldSeats = catSeats.filter((s) => s.status === 'HELD');
      const colorScheme = colors[idx % colors.length];

      const lower = catName.toLowerCase();

      // Geometry placement for STAGE FRONT / FAN PIT / VIP
      if (lower.includes('vip') || lower.includes('pit') || lower.includes('ringside') || lower.includes('box')) {
        blocks.push({
          category: catName,
          fixedFee,
          seats: catSeats,
          availableSeats,
          bookedSeats,
          heldSeats,
          colorScheme,
          shape: 'rect',
          x: STAGE_CX - 140,
          y: 135,
          width: 280,
          height: 90,
          label: `${catName.toUpperCase()} - FAN PIT`,
          subtitle: `Fixed Fee: ₹${fixedFee.toLocaleString('en-IN')}`
        });
      }
      // LOUNGE / FLANKING WINGS
      else if (lower.includes('lounge') || lower.includes('pavilion') || lower.includes('premium')) {
        const isLeft = idx % 2 === 0;
        blocks.push({
          category: catName,
          fixedFee,
          seats: catSeats,
          availableSeats,
          bookedSeats,
          heldSeats,
          colorScheme,
          shape: 'rect',
          x: isLeft ? STAGE_CX - 360 : STAGE_CX + 110,
          y: 155,
          width: 250,
          height: 100,
          label: catName.toUpperCase(),
          subtitle: `Fixed Fee: ₹${fixedFee.toLocaleString('en-IN')}`
        });
      }
      // GOLD STAND ARC BLOCKS
      else if (lower.includes('gold') || idx === 0) {
        const isLeft = idx % 2 === 0;
        blocks.push({
          category: catName,
          fixedFee,
          seats: catSeats,
          availableSeats,
          bookedSeats,
          heldSeats,
          colorScheme,
          shape: 'rect',
          x: isLeft ? STAGE_CX - 370 : STAGE_CX + 20,
          y: 275,
          width: 350,
          height: 110,
          label: `${catName.toUpperCase()} STAND`,
          subtitle: `Fixed Fee: ₹${fixedFee.toLocaleString('en-IN')}`
        });
      }
      // SILVER STAND ARC BLOCKS
      else {
        const isLeft = idx % 2 === 0;
        blocks.push({
          category: catName,
          fixedFee,
          seats: catSeats,
          availableSeats,
          bookedSeats,
          heldSeats,
          colorScheme,
          shape: 'rect',
          x: isLeft ? STAGE_CX - 380 : STAGE_CX + 30,
          y: 405,
          width: 350,
          height: 110,
          label: `${catName.toUpperCase()} STAND`,
          subtitle: `Fixed Fee: ₹${fixedFee.toLocaleString('en-IN')}`
        });
      }
    });

    return blocks;
  };

  const sectionBlocks = getSectionBlocks();
  const activeSection = selectedSection
    ? sectionBlocks.find((b) => b.category === selectedSection) || sectionBlocks[0]
    : sectionBlocks[0];

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
    const clampedScale = Math.max(0.6, Math.min(2, newScale));

    setScale(clampedScale);
    setPosition({
      x: (stage.getPointerPosition().x / clampedScale - mousePointTo.x) * clampedScale,
      y: (stage.getPointerPosition().y / clampedScale - mousePointTo.y) * clampedScale
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSelectedSection(null);
  };

  return (
    <div className="space-y-6">
      {/* SECTION TIER SELECTOR BAR WITH FIXED FEES */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Arena Stadium Section Map & Fixed Ticket Fees
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.min(2, s + 0.15))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
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

        {/* Section Cards Bar (Fan Pit ₹15,000, Gold ₹8,000, Silver ₹3,500) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {sectionBlocks.map((block) => {
            const isSelected = selectedSection === block.category;
            return (
              <button
                key={block.category}
                onClick={() => setSelectedSection(block.category)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-500 text-white shadow-xl ring-2 ring-indigo-500/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[11px] font-black uppercase tracking-wider block text-white">
                    {block.category} SECTION
                  </span>
                  <p className="text-xs text-slate-400 font-semibold">
                    {block.availableSeats.length} seats available
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fixed Fee</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    ₹{block.fixedFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CLEAN SECTION BLOCK CANVAS VIEWPORT (BookMyShow Concert Map Style) */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing shadow-2xl min-h-[560px]">
        <Stage
          width={850}
          height={560}
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
            {/* 1. MAIN STAGE & CATWALK RUNWAY */}
            <Group x={STAGE_CX} y={STAGE_CY}>
              <Rect
                x={-120}
                y={-30}
                width={240}
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
                x={-120}
                y={-12}
                width={240}
                fontSize={13}
                fontStyle="black"
                fill="#ffffff"
                align="center"
                letterSpacing={2}
              />
              {/* Runway */}
              <Rect x={-20} y={25} width={40} height={40} fill="#f43f5e" stroke="#fda4af" strokeWidth={2} />
              <Circle x={0} y={65} radius={22} fill="#f43f5e" stroke="#fda4af" strokeWidth={2} />
            </Group>

            {/* 2. RENDER CLEAN CONCERT SECTION BLOCKS */}
            {sectionBlocks.map((block) => {
              const isHovered = hoveredSection === block.category;
              const isSelected = selectedSection === block.category;

              return (
                <Group
                  key={block.category}
                  x={block.x}
                  y={block.y}
                  onClick={() => setSelectedSection(block.category)}
                  onTap={() => setSelectedSection(block.category)}
                  onMouseEnter={() => setHoveredSection(block.category)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  {/* Outer Section Block Container Box */}
                  <Rect
                    width={block.width}
                    height={block.height}
                    fill={isSelected ? block.colorScheme.fill : '#0f172a'}
                    opacity={isSelected ? 0.9 : isHovered ? 0.8 : 0.65}
                    cornerRadius={16}
                    stroke={isSelected ? '#ffffff' : block.colorScheme.border}
                    strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                    shadowBlur={isSelected || isHovered ? 20 : 0}
                    shadowColor={block.colorScheme.glow}
                  />

                  {/* Section Label */}
                  <Text
                    text={block.label}
                    x={0}
                    y={18}
                    width={block.width}
                    fontSize={14}
                    fontStyle="black"
                    fill="#ffffff"
                    align="center"
                    letterSpacing={1}
                  />

                  {/* Fixed Fee Banner Badge */}
                  <Rect
                    x={block.width / 2 - 75}
                    y={42}
                    width={150}
                    height={26}
                    fill="#10b981"
                    cornerRadius={12}
                  />
                  <Text
                    text={`FIXED FEE: ₹${block.fixedFee.toLocaleString('en-IN')}`}
                    x={0}
                    y={49}
                    width={block.width}
                    fontSize={11}
                    fontStyle="black"
                    fill="#ffffff"
                    align="center"
                  />

                  {/* Availability Counter */}
                  <Text
                    text={`${block.availableSeats.length} Seats Available`}
                    x={0}
                    y={75}
                    width={block.width}
                    fontSize={10}
                    fontStyle="bold"
                    fill="#94a3b8"
                    align="center"
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* INTERACTIVE SEAT SELECTION PANEL FOR SELECTED SECTION BLOCK */}
      {activeSection && (
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SELECTED ARENA SECTION
              </span>
              <h3 className="text-xl font-black text-white mt-1">{activeSection.category} SECTION</h3>
              <p className="text-xs text-slate-400">All seats in this section have a fixed ticket fee of <strong className="text-emerald-400 font-mono">₹{activeSection.fixedFee.toLocaleString('en-IN')}</strong></p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Section Fixed Fee</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">₹{activeSection.fixedFee.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Clean Seat Badges List for Active Section */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase">Select Available Seat in {activeSection.category}:</p>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 rounded-2xl bg-slate-900 border border-slate-800">
              {activeSection.seats.map((seat) => {
                const isHeldByMe =
                  seat.status === 'HELD' &&
                  (String(seat.heldBy) === String(currentUserId) || String(seat.heldBy?._id) === String(currentUserId));
                const isBooked = seat.status === 'BOOKED';
                const isHeldByOther = seat.status === 'HELD' && !isHeldByMe;

                return (
                  <button
                    key={seat._id}
                    disabled={isBooked || isHeldByOther || holdingSeatId === seat._id}
                    onClick={() => {
                      if (seat.status === 'AVAILABLE') onHoldSeat(seat);
                      else if (isHeldByMe) onReleaseSeat(seat);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                      isBooked
                        ? 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed line-through'
                        : isHeldByOther
                        ? 'bg-purple-950/60 text-purple-400 border border-purple-800 cursor-not-allowed'
                        : isHeldByMe
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/40 border border-amber-400 animate-pulse'
                        : 'bg-slate-800 hover:bg-indigo-600 text-white border border-slate-700 hover:border-indigo-500 shadow-md'
                    }`}
                  >
                    <span>{seat.row}-{seat.number}</span>
                    {isHeldByMe && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasSeatMap;
