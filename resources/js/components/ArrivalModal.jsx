import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ArrivalModal({ isOpen, onClose, onSubmit }) {
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Nama pelanggan wajib diisi.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSubmit({ customer_name: customerName.trim(), party_size: partySize });
      setCustomerName('');
      setPartySize(2);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mendaftarkan kedatangan pelanggan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div className="modal-dialog w-full max-w-md rounded-2xl p-6 space-y-6 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Kedatangan Pelanggan Baru</h3>
          <p className="text-xs text-slate-500 font-medium">Pilih jumlah orang & masukkan nama pelanggan</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="arrival-form">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Nama Pelanggan / Rombongan</label>
            <input
              type="text"
              placeholder="Contoh: Budi & Keluarga"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-medium"
              data-testid="customer-name-input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Jumlah Orang (Party Size)</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPartySize(size)}
                  className={`py-2 rounded-lg font-bold text-xs border transition cursor-pointer ${
                    partySize === size
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  data-testid={`party-size-btn-${size}`}
                >
                  {size} Org
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-blue-700 block mb-1">Aturan Penempatan Otomatis:</span>
            <p className="font-medium text-[11px]">
              Sistem akan otomatis memilih meja dengan kapasitas paling mendekati. Jika semua meja terisi, pelanggan masuk ke Antrean Prioritas.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
              data-testid="submit-arrival-btn"
            >
              {isSubmitting ? 'Memproses...' : 'Proses Kedatangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
