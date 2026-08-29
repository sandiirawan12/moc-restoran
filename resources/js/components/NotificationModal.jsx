import React from 'react';
import { X } from 'lucide-react';

export default function NotificationModal({ isOpen, notification, onClose }) {
  if (!isOpen || !notification) return null;

  const { title, message, type } = notification;

  let btnBg = 'bg-blue-600 hover:bg-blue-700 text-white';
  let defaultTitle = 'Informasi';
  let titleColor = 'text-slate-900';

  if (type === 'success') {
    btnBg = 'bg-emerald-600 hover:bg-emerald-700 text-white';
    defaultTitle = 'Berhasil!';
    titleColor = 'text-emerald-700';
  } else if (type === 'error') {
    btnBg = 'bg-rose-600 hover:bg-rose-700 text-white';
    defaultTitle = 'Perhatian!';
    titleColor = 'text-rose-700';
  } else if (type === 'warning') {
    btnBg = 'bg-amber-600 hover:bg-amber-700 text-white';
    defaultTitle = 'Informasi Antrean';
    titleColor = 'text-amber-700';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div className="modal-dialog w-full max-w-sm rounded-2xl p-6 space-y-4 text-center relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pt-2">
          <h3 className={`text-lg font-extrabold tracking-tight ${titleColor}`}>
            {title || defaultTitle}
          </h3>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed px-2">
          {message}
        </p>

        <div className="pt-2">
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-lg font-bold text-xs transition cursor-pointer active:scale-95 ${btnBg}`}
            data-testid="notification-modal-ok-btn"
          >
            OK, Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
