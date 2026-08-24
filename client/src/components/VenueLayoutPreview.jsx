import React from 'react';
import { Armchair, Sparkles } from 'lucide-react';

export const VenueLayoutPreview = ({ sections }) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
        No sections defined yet. Add a section above to view the layout preview.
      </div>
    );
  }

  const totalSeats = sections.reduce(
    (acc, sec) => acc + (Number(sec.rows) || 0) * (Number(sec.seatsPerRow) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Seat Layout Preview
        </h4>
        <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
          Total Capacity: {totalSeats} Seats
        </span>
      </div>

      {/* Screen Indicator */}
      <div className="w-full text-center py-2 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent border-t-2 border-indigo-500/40 rounded-t-xl text-xs uppercase tracking-widest font-bold text-indigo-300 shadow-lg shadow-indigo-500/10">
        STAGE / SCREEN AREA
      </div>

      <div className="space-y-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {sections.map((sec, idx) => {
          const rowsCount = Number(sec.rows) || 0;
          const seatsPerRow = Number(sec.seatsPerRow) || 0;

          return (
            <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-400 uppercase tracking-wide">
                  Section: {sec.name || `Section ${idx + 1}`}
                </span>
                <span className="text-slate-400">
                  {rowsCount} Rows × {seatsPerRow} Seats ({rowsCount * seatsPerRow} total)
                </span>
              </div>

              <div className="space-y-1.5 overflow-x-auto pb-2">
                {Array.from({ length: Math.min(rowsCount, 8) }).map((_, rIdx) => {
                  const rowLabel = String.fromCharCode(65 + rIdx);
                  return (
                    <div key={rIdx} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-slate-500 font-mono text-[10px] text-right">
                        {rowLabel}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(seatsPerRow, 20) }).map((_, sIdx) => (
                          <div
                            key={sIdx}
                            title={`${sec.name} - Row ${rowLabel}, Seat ${sIdx + 1}`}
                            className="w-5 h-5 rounded-md bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-[9px] text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                          >
                            {sIdx + 1}
                          </div>
                        ))}
                        {seatsPerRow > 20 && (
                          <span className="text-[10px] text-slate-500 pl-1">
                            +{seatsPerRow - 20} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {rowsCount > 8 && (
                  <p className="text-[10px] text-slate-500 text-center py-1">
                    ...and {rowsCount - 8} more rows
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VenueLayoutPreview;
