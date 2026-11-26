import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Cpu, Download, Upload } from 'lucide-react';
import MagneticButton from '../common/MagneticButton';

export default function AboutSection({ onStartEditing }) {
  const steps = [
    { icon: Upload, step: '01', title: 'Upload or Drop PDF', desc: 'Open any local PDF or test with our interactive multi-page sample.' },
    { icon: Cpu, step: '02', title: 'Parse & Edit Live', desc: 'PDF.js renders exact pages while Fabric.js & our stream parser handle text, images, and annotations.' },
    { icon: Download, step: '03', title: 'Export Preserved PDF', desc: 'pdf-lib surgically rewrites modified streams and compiles your updated PDF for download.' },
  ];

  return (
    <section id="about" className="relative py-20 border-t border-white/10 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-5"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              How NexPDF Works
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Original layout fidelity meets modern web power
            </h2>
            <p className="text-sm sm:text-base text-slate-300/85 leading-relaxed">
              Unlike superficial editors that blindly paint white rectangles over PDFs, NexPDF parses PDF content streams to remove or replace original text and XObject image operators when exporting—falling back gracefully with substitution warnings only when embedded subset fonts require it.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-200">
              {[
                'Preserves page dimensions, vector curves, and untouched content',
                'Clear embedded font substitution notices in the Inspector',
                'Full Undo / Redo & IndexedDB local project persistence',
              ].map((line) => (
                <li key={line} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <MagneticButton onClick={onStartEditing} className="px-6 py-3 text-sm">
                Launch PDF Workspace
              </MagneticButton>
            </div>
          </motion.div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-cyan-300 font-bold">STEP {s.step}</span>
                    <s.icon className="w-5 h-5 text-violet-300" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NexPDF Studio. Built with React, Three.js, PDF.js, Fabric.js & pdf-lib.</p>
          <p>All PDF processing executes locally in your browser.</p>
        </footer>
      </div>
    </section>
  );
}
