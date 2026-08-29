import React, { useState } from 'react';
import { Search, GripVertical } from 'lucide-react';

export default function QueueList({ queue = [], onOpenArrivalModal, onCancelQueue }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQueue = queue.filter((item) =>
    item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e, customer) => {
    e.dataTransfer.setData('application/json', JSON.stringify(customer));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col h-full min-h-[540px]">
      {/* Sidebar Header & Search */}
      <div className="mb-4 space-y-3 pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Antrean Prioritas</h3>
            <p className="text-xs text-slate-500 font-medium">Urut Party Terbesar Dulu</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {queue.length} Antrean
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama antrean..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-medium"
          />
        </div>
      </div>

      {/* Queue List Content */}
      {filteredQueue.length === 0 ? (
        <div className="my-auto py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
          <p className="font-bold text-slate-700 text-sm">Tidak ada antrean saat ini</p>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Pelanggan baru akan otomatis duduk atau masuk ke antrean prioritas ini.
          </p>
          <button
            onClick={onOpenArrivalModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
          >
            + Tambah Antrean
          </button>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1" data-testid="queue-list">
          {filteredQueue.map((item, index) => {
            const isHighestPriority = index === 0;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing hover:shadow-xs ${isHighestPriority
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                data-testid={`queue-item-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    #{item.position || index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm tracking-tight">{item.customer_name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Waktu Datang:{' '}
                      {new Date(item.arrived_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {item.estimated_time_formatted ? (
                      <div className="mt-1 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-800">
                        <span>Est. Duduk: </span>
                        {item.estimated_remaining_minutes && (
                          <span className="text-[10px] font-medium text-emerald-600">
                            ~{item.estimated_remaining_minutes} mnt
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        Menunggu ketersediaan meja...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Party {item.party_size} org
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCancelQueue) onCancelQueue(item.id);
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition cursor-pointer"
                    title="Batalkan Antrean"
                    data-testid={`cancel-queue-btn-${item.id}`}
                  >
                    Batal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Add Button */}
      <div className="mt-auto pt-4 border-t border-slate-200">
        <button
          onClick={onOpenArrivalModal}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition flex items-center justify-center cursor-pointer active:scale-98"
          data-testid="add-customer-btn"
        >
          + Tambah Antrean
        </button>
      </div>
    </div>
  );
}
