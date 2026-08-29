import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function formatTime(seconds) {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculateRemainingSeconds(expectedFinishAtIso) {
  if (!expectedFinishAtIso) return 0;
  const targetTime = new Date(expectedFinishAtIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((targetTime - now) / 1000));
}

export default function CountdownTimer({ expectedFinishAt, onExpire }) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(expectedFinishAt)
  );

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(expectedFinishAt));

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(expectedFinishAt);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expectedFinishAt]);

  const isWarning = remainingSeconds > 0 && remainingSeconds <= 300; // <= 5 mins
  const isExpired = remainingSeconds === 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
        isExpired
          ? 'bg-red-950/80 text-red-400 border border-red-800/50 animate-pulse'
          : isWarning
          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
          : 'bg-slate-800/80 text-emerald-400 border border-slate-700'
      }`}
      data-testid="countdown-timer"
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{isExpired ? 'Waktu Habis!' : formatTime(remainingSeconds)}</span>
    </div>
  );
}
