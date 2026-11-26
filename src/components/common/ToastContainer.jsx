import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, onRemove }) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/35',
    error: 'border-rose-500/35',
    warning: 'border-amber-500/35',
    info: 'border-cyan-500/35',
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9990] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            className={`pointer-events-auto glass-panel rounded-xl px-4 py-3 flex items-center gap-3 border ${
              borders[toast.type] || borders.info
            }`}
          >
            {icons[toast.type] || icons.info}
            <p className="text-xs sm:text-sm text-slate-100 flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
