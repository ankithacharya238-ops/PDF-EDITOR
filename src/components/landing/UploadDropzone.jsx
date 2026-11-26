import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FilePlus2, FileUp, Sparkles, UploadCloud } from 'lucide-react';
import MagneticButton from '../common/MagneticButton';

export default function UploadDropzone({ onFileSelected, onCreateBlank, onLoadSample }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return;
    }
    onFileSelected(file);
  };

  return (
    <section id="upload" className="relative py-12 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          className={`relative rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 glass-card glow-border ${
            dragging
              ? 'border-cyan-400 scale-[1.01] shadow-[0_0_50px_rgba(34,211,238,0.35)]'
              : 'hover:border-violet-400/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-500/25 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <UploadCloud className="w-8 h-8 text-cyan-300" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
            Drop your PDF here to launch workspace
          </h2>
          <p className="text-sm text-slate-300/80 max-w-xl mx-auto mb-6">
            Supports multi-page documents, embedded images, custom typography, annotations, and digital signatures—processed directly in your browser.
          </p>

          <div
            className="flex flex-wrap items-center justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <MagneticButton onClick={() => inputRef.current?.click()} className="px-6 py-3 text-sm">
              <FileUp className="w-4 h-4" />
              Upload PDF Document
            </MagneticButton>

            <MagneticButton
              variant="secondary"
              onClick={onLoadSample}
              className="px-5 py-3 text-sm"
            >
              <Sparkles className="w-4 h-4 text-violet-300" />
              Load Sample Multi-Page PDF
            </MagneticButton>

            <MagneticButton
              variant="secondary"
              onClick={onCreateBlank}
              className="px-5 py-3 text-sm"
            >
              <FilePlus2 className="w-4 h-4 text-cyan-300" />
              New Blank PDF
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
