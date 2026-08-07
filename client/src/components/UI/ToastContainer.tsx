import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl shadow-lg border transition-all duration-200 text-[#0F172A] bg-[#FFFFFF] ${
            toast.type === 'success'
              ? 'border-[#10B981]'
              : toast.type === 'error'
              ? 'border-[#EF4444]'
              : 'border-[#2563EB]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#2563EB] shrink-0" />}
            <p className="text-xs font-semibold leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors p-0.5 shrink-0 rounded hover:bg-[#F1F5F9] cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
