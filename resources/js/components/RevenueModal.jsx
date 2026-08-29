import React from 'react';

export default function RevenueModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto animate-fade-in">
      <div className="modal-dialog w-full max-w-2xl rounded-2xl p-6 md:p-8 space-y-6 relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          Tutup
        </button>

        {/* Header Modal */}
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-xl font-extrabold text-slate-900">
            Strategi Meja & Antrean Restoran
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Aturan penanganan tamu rombongan kecil di meja besar untuk menjaga omzet restoran.
          </p>
        </div>

        {/* Penjelasan Masalah */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
          <span className="font-bold text-slate-900 block">
            Masalah Utama:
          </span>
          <p>
            Misal ada rombongan 2 orang datang saat meja kapasitas 2 orang sedang penuh, tapi meja kapasitas 8 orang sedang kosong. Jika 2 orang tersebut langsung disuruh duduk di meja 8 orang, maka 6 kursi sisanya akan rugi kosong selama durasi makan (~45 menit). Jika tiba-tiba ada rombongan 8 orang datang, restoran akan kehilangan omzet besar.
          </p>
        </div>

        {/* Diagram Alur Sederhana */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Alur Keputusan Sistem
          </h4>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            {/* Langkah 1 */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-blue-700 block">1. Tamu Datang</span>
              <p className="text-slate-600 text-[11px] mt-0.5">Input nama tamu dan jumlah rombongan (misal 2 orang).</p>
            </div>

            {/* Langkah 2 */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block">2. Cek Meja Sesuai Kapasitas</span>
              <p className="text-slate-600 text-[11px] mt-0.5">Sistem mengutamakan meja yang kapasitasnya pas terlebih dahulu (Meja A / 2 orang).</p>
            </div>

            {/* Langkah 3 (Pilihan Keputusan) */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
              <span className="font-bold text-slate-900 block">3. Jika Meja Pas Penuh & Hanya Ada Meja 8 Orang:</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                <div className="p-3 bg-white border border-emerald-300 rounded-lg space-y-1">
                  <span className="font-bold text-emerald-700 block">Ada Meja 2 Orang Mau Selesai (&lt; 10 Mnt)</span>
                  <p className="text-slate-600">Tamu 2 orang diminta menunggu sebentar di antrean (maksimal 10 menit) supaya meja 8 orang tetap siap untuk rombongan besar.</p>
                </div>

                <div className="p-3 bg-white border border-blue-300 rounded-lg space-y-1">
                  <span className="font-bold text-blue-700 block">Tidak Ada Meja Mau Selesai / Sudah Tunggu 10 Mnt</span>
                  <p className="text-slate-600">Tamu 2 orang langsung didudukkan di meja 8 orang daripada mejanya dibiarkan kosong terlalu lama.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Hasil */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <span className="font-bold text-slate-900 block">
            Keuntungan Strategi Ini:
          </span>
          <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-1">
            <li><strong>Omzet Terjaga:</strong> Meja kapasitas besar tidak gampang terbuang untuk rombongan kecil.</li>
            <li><strong>Kepastian Tamu:</strong> Waktu tunggu tamu dibatasi maksimal 10 menit.</li>
            <li><strong>Meja Tetap Terisi:</strong> Jika tidak ada rombongan besar datang, meja besar tetap diisi tamu kecil.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
