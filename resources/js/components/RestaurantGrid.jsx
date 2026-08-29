import React from 'react';
import TableCard from './TableCard';

export default function RestaurantGrid({ tables = [], onForceComplete, onDropQueueCustomer, onRefresh }) {
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const freeCount = tables.filter((t) => t.status === 'available').length;
  const occupancyPercentage = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 floor-plan-bg flex flex-col justify-between h-full">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Denah Meja Restoran</h2>
            <p className="text-xs text-slate-500 font-medium">Status 4 Meja Utama Real-Time</p>
          </div>

          <div className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 rounded-lg">
            Total {totalTables} Meja
          </div>
        </div>

        {/* 4 Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2" data-testid="restaurant-grid">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onForceComplete={onForceComplete}
              onDropQueueCustomer={onDropQueueCustomer}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      </div>

      {/* Bottom Seats Legend & Occupancy Progress Bar */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-slate-700 font-bold">Kapasitas Kursi:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Tersedia ({freeCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Terisi ({occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Baru Duduk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span>Hampir Selesai</span>
          </div>
        </div>

        {/* Occupancy Progress */}
        <div className="flex items-center gap-3 w-44">
          <span className="text-slate-900 font-bold">Terisi {occupancyPercentage}%</span>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
