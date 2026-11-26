import React from 'react';
import { motion } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../../config/editorConfig';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card glow-border rounded-2xl w-full max-w-lg p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">
          <Keyboard className="w-4 h-4" /> Productivity
        </div>
        <h3 className="font-display text-xl font-bold text-white mb-4">Keyboard Shortcuts</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {KEYBOARD_SHORTCUTS.map((sc) => (
            <div
              key={sc.action}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/75 border border-white/10 text-xs"
            >
              <span className="text-slate-300">{sc.action}</span>
              <div className="flex items-center gap-1 shrink-0">
                {sc.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/15 font-mono text-[11px] text-cyan-300"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
