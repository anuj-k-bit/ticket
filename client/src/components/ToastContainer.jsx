import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-slate-900/95 border-rose-500/50 text-rose-300 shadow-rose-500/10',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-slate-900/95 border-amber-500/50 text-amber-300 shadow-amber-500/10',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
        };
      default:
        return {
          bg: 'bg-slate-900/95 border-indigo-500/50 text-indigo-300 shadow-indigo-500/10',
          icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />
        };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-4 duration-300 ${style.bg}`}
          >
            <div className="flex items-center gap-3">
              {style.icon}
              <p className="text-xs font-semibold leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
