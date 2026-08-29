import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';

export default function TableCard({ table, onForceComplete, onDropQueueCustomer, onRefresh }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState(false);

  const activeSession = table.active_session;
  const isAvailable = table.status === 'available';

  // Determine status color accent & badge
  let statusText = 'Tersedia';
  let statusBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  let accentClass = 'bg-emerald-500';

  if (!isAvailable && activeSession) {
    if (activeSession.color_status === 'red' || activeSession.remaining_seconds <= 300) {
      statusText = 'Hampir Selesai';
      statusBadgeBg = 'bg-rose-50 text-rose-700 border-rose-200/80';
      accentClass = 'bg-rose-500';
    } else if (activeSession.color_status === 'blue') {
      statusText = 'Baru Duduk';
      statusBadgeBg = 'bg-blue-50 text-blue-700 border-blue-200/80';
      accentClass = 'bg-blue-500';
    } else {
      statusText = 'Terisi';
      statusBadgeBg = 'bg-amber-50 text-amber-700 border-amber-200/80';
      accentClass = 'bg-amber-500';
    }
  }

  // Render physical capsule table node inspired by physical floor plan design with rich gradient colors
  const renderTableNodeGraphic = () => {
    const capacity = table.capacity;
    const seatsTop = Math.ceil(capacity / 2);

    const activePartyCount = !isAvailable && activeSession ? Math.min(activeSession.party_size, capacity) : 0;
    const seatStates = Array.from({ length: capacity }, (_, idx) => idx < activePartyCount);

    const seatsTopStates = seatStates.slice(0, seatsTop);
    const seatsBottomStates = seatStates.slice(seatsTop);

    // Rich modern color gradients based on status
    let tableBg = 'bg-gradient-to-b from-emerald-100 to-emerald-200/90 border-emerald-400/80 text-emerald-950';
    let seatActiveBg = 'bg-emerald-500 shadow-2xs';

    if (!isAvailable && activeSession) {
      if (activeSession.color_status === 'red' || activeSession.remaining_seconds <= 300) {
        tableBg = 'bg-gradient-to-b from-rose-100 to-rose-200/90 border-rose-400/80 text-rose-950';
        seatActiveBg = 'bg-rose-500 shadow-2xs';
      } else if (activeSession.color_status === 'blue') {
        tableBg = 'bg-gradient-to-b from-sky-100 to-blue-200/90 border-blue-400/80 text-blue-950';
        seatActiveBg = 'bg-blue-600 shadow-2xs';
      } else {
        tableBg = 'bg-gradient-to-b from-amber-100 to-amber-200/90 border-amber-400/80 text-amber-950';
        seatActiveBg = 'bg-amber-500 shadow-2xs';
      }
    }

    return (
      <div className="flex flex-col items-center justify-center my-2 w-full">
        {/* Top Chair Capsules */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          {seatsTopStates.map((isSeatActive, i) => (
            <div
              key={`top-${i}`}
              className={`w-7 h-2.5 rounded-full transition-all duration-300 ${
                isSeatActive ? seatActiveBg : 'bg-slate-200/80 border border-slate-300/60'
              }`}
              title={isSeatActive ? 'Kursi Terisi' : 'Kursi Kosong'}
            />
          ))}
        </div>

        {/* Central Physical Table Top (Capsule / Squircle shape) */}
        <div
          className={`w-34 min-h-[84px] rounded-3xl border-2 flex flex-col items-center justify-center p-2.5 shadow-xs transition-all duration-200 hover:scale-102 ${tableBg}`}
        >
          <span className="font-black text-slate-900 text-lg tracking-tight">
            Meja {table.code}
          </span>

          <div className="flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-2xs text-xs font-extrabold text-slate-800">
            <span className="text-[10px]">👤</span>
            <span>
              {isAvailable ? `${table.capacity}` : `${activeSession?.party_size} / ${table.capacity}`}
            </span>
          </div>
        </div>

        {/* Bottom Chair Capsules */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          {seatsBottomStates.map((isSeatActive, i) => (
            <div
              key={`bottom-${i}`}
              className={`w-7 h-2.5 rounded-full transition-all duration-300 ${
                isSeatActive ? seatActiveBg : 'bg-slate-200/80 border border-slate-300/60'
              }`}
              title={isSeatActive ? 'Kursi Terisi' : 'Kursi Kosong'}
            />
          ))}
        </div>
      </div>
    );
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDragError(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragError(false);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const queueCustomer = JSON.parse(rawData);

      if (queueCustomer.party_size > table.capacity || !isAvailable) {
        setDragError(true);
        setTimeout(() => setDragError(false), 2000);
        if (onDropQueueCustomer) onDropQueueCustomer(queueCustomer, table, false);
        return;
      }

      if (onDropQueueCustomer) onDropQueueCustomer(queueCustomer, table, true);
    } catch (err) {
      console.error('Failed to handle drop', err);
    }
  };

  return (
    <div
      data-testid={`table-card-${table.code}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white border border-slate-200/90 rounded-2xl p-5 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-sm ${
        isDragOver ? 'drop-target-active' : ''
      } ${dragError ? 'drop-target-invalid' : ''}`}
    >
      {/* Top Status Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentClass}`} />

      {/* Header Row */}
      <div className="flex items-center justify-between mt-1">
        <span className="font-extrabold text-slate-900 text-sm">
          Meja {table.code} ({table.capacity} Kursi)
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeBg}`}>
          {statusText}
        </span>
      </div>

      {/* Physical Floor Plan Graphic */}
      {renderTableNodeGraphic()}

      {/* Details & Action Footer */}
      {isAvailable ? (
        <div className="text-center py-1 border-t border-slate-100 mt-1">
          <p className="text-[11px] text-slate-400 font-medium">Geser antrean ke sini untuk menempatkan</p>
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span className="truncate max-w-[130px]">{activeSession?.customer_name}</span>
            {activeSession?.expected_finish_at && (
              <CountdownTimer expectedFinishAt={activeSession.expected_finish_at} onExpire={onRefresh} />
            )}
          </div>

          <button
            onClick={() => onForceComplete(table.id)}
            className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-98"
            data-testid={`force-complete-btn-${table.code}`}
          >
            Force Complete
          </button>
        </div>
      )}
    </div>
  );
}
