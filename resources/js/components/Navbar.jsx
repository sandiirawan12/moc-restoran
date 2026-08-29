import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function Navbar({ onOpenArrivalModal, onOpenRevenueModal, onRefresh, isRefreshing }) {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      setTimeString(now.toLocaleDateString('id-ID', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base">
            M
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              MOC RESTORAN
            </h1>
            <p className="text-xs text-slate-500 font-medium">Manajemen Antrean & Meja</p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Tanggal & Waktu */}
          <div className="hidden sm:block text-xs font-medium text-slate-600 px-3 py-1.5 bg-slate-100 rounded-lg">
            {timeString}
          </div>

          {/* Tombol Refresh Status */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
            title="Muat Ulang Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Tombol Optimasi Revenue */}
          <button
            onClick={onOpenRevenueModal}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
          >
            Optimasi Revenue
          </button>

          {/* Tombol Tambah Antrean */}
          <button
            onClick={onOpenArrivalModal}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer active:scale-95"
            data-testid="nav-arrival-btn"
          >
            + Tambah Antrean
          </button>
        </div>
      </div>
    </header>
  );
}
