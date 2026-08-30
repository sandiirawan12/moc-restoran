import React from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return (
    d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

export default function HistoryTable({
  historyData = [],
  pagination = {},
  onSearchChange,
  onStatusFilterChange,
  onPartyFilterChange,
  onSortChange,
  onPageChange,
  searchValue = '',
  statusFilter = 'all',
  partyFilter = '',
  sortBy = 'completed_at',
  sortDir = 'desc',
  isLoading = false,
}) {
  const handleHeaderClick = (columnKey) => {
    if (sortBy === columnKey) {
      onSortChange(columnKey, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      const defaultAscCols = ['customer_name', 'table_id', 'status'];
      const initialDir = defaultAscCols.includes(columnKey) ? 'asc' : 'desc';
      onSortChange(columnKey, initialDir);
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 relative">
      {/* Loading Overlay Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 overflow-hidden rounded-t-2xl">
          <div className="h-full bg-blue-600 animate-pulse w-full"></div>
        </div>
      )}
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Riwayat Makan</h2>
          <p className="text-xs text-slate-500 font-medium">Pencarian, Filter, dan Multi-Column Sort</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pelanggan..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-medium"
              data-testid="history-search-input"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 transition cursor-pointer"
            data-testid="history-status-select"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Completed (Selesai Wajar)</option>
            <option value="force_completed">Force Completed</option>
          </select>

          {/* Party Size Filter */}
          <select
            value={partyFilter}
            onChange={(e) => onPartyFilterChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 transition cursor-pointer"
            data-testid="history-party-select"
          >
            <option value="">Semua Party</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
              <option key={size} value={size}>
                Party {size} org
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse" data-testid="history-table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-extrabold uppercase tracking-wider">
              <th
                onClick={() => handleHeaderClick('customer_name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition group select-none"
                data-testid="history-sort-customer_name"
              >
                <div className="flex items-center gap-1.5">
                  <span>Nama Pelanggan</span>
                  {renderSortIcon('customer_name')}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('party_size')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition group select-none"
                data-testid="history-sort-party_size"
              >
                <div className="flex items-center gap-1.5">
                  <span>Party Size</span>
                  {renderSortIcon('party_size')}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('table_id')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition group select-none"
                data-testid="history-sort-table_id"
              >
                <div className="flex items-center gap-1.5">
                  <span>Meja</span>
                  {renderSortIcon('table_id')}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('seated_at')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition group select-none"
                data-testid="history-sort-seated_at"
              >
                <div className="flex items-center gap-1.5">
                  <span>Waktu Seated</span>
                  {renderSortIcon('seated_at')}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('completed_at')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition group select-none"
                data-testid="history-sort-completed_at"
              >
                <div className="flex items-center gap-1.5">
                  <span>Waktu Selesai</span>
                  {renderSortIcon('completed_at')}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('duration_minutes')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition group select-none"
                data-testid="history-sort-duration_minutes"
              >
                <div className="flex items-center gap-1.5">
                  <span>Durasi</span>
                  {renderSortIcon('duration_minutes')}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('status')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition group select-none"
                data-testid="history-sort-status"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {historyData.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500 font-medium">
                  Tidak ada riwayat dining ditemukan.
                </td>
              </tr>
            ) : (
              historyData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.customer_name}</td>
                  <td className="py-3.5 px-4 text-blue-600 font-semibold">{row.party_size} org</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      Meja {row.table?.code || '-'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {formatDateTime(row.seated_at)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {formatDateTime(row.completed_at)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-mono font-bold">{row.duration_minutes} mnt</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        row.status === 'force_completed'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {row.status === 'force_completed' ? 'Force Complete' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
          <span>
            Halaman {pagination.current_page} dari {pagination.last_page} (Total: {pagination.total})
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.current_page === 1}
              onClick={() => onPageChange(pagination.current_page - 1)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              Sebelumnya
            </button>
            <button
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => onPageChange(pagination.current_page + 1)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
