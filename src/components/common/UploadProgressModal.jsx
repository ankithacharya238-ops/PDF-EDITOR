import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles } from 'lucide-react';

export default function UploadProgressModal({ visible, progress = 0, statusText = 'Parsing PDF structure...', fileName = '' }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card glow-border rounded-2xl w-full max-w-md p-6 text-center"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-500/25 border border-cyan-400/35 flex items-center justify-center relative">
          <FileText className="w-7 h-7 text-cyan-300 animate-pulse" />
          <Sparkles className="w-4 h-4 text-violet-300 absolute -top-1.5 -right-1.5 animate-bounce" />
        </div>

        <h3 className="font-display text-lg font-bold text-white mb-1">Opening Document</h3>
        {fileName && <p className="text-xs text-cyan-300/90 truncate mb-4">{fileName}</p>}

        <div className="w-full h-2.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
            transition={{ ease: 'easeOut', duration: 0.25 }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{statusText}</span>
          <span className="font-mono text-cyan-300">{Math.round(progress)}%</span>
        </div>
      </motion.div>
    </div>
  );
}
