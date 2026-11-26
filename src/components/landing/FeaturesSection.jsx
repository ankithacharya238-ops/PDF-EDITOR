import React from 'react';
import { motion } from 'framer-motion';
import {
  FileEdit,
  ImagePlus,
  Layers,
  PenTool,
  Shapes,
  Sparkles,
} from 'lucide-react';
import TiltCard3D from '../../animations/TiltCard3D';

const FEATURES = [
  {
    icon: FileEdit,
    title: 'Genuine Text Replacement',
    desc: 'Click existing PDF text to edit words, font families, sizes, colors, spacing, or delete content directly at the PDF stream level.',
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    icon: ImagePlus,
    title: 'Smart Image Control',
    desc: 'Select and remove embedded PDF images, or insert PNG, JPG, and WebP assets with aspect-locked resize, rotation, and opacity.',
    accent: 'from-cyan-500 to-blue-500',
  },
  {
    icon: PenTool,
    title: 'Signatures & Annotations',
    desc: 'Draw smooth freehand ink, type styled signatures, highlight clauses, underline lines, or add custom vector shapes.',
    accent: 'from-fuchsia-500 to-violet-500',
  },
  {
    icon: Layers,
    title: 'Full Page Orchestration',
    desc: 'Add blank pages, duplicate existing layouts, rotate 90°, reorder pages, and delete unwanted sheets with instant thumbnail sync.',
    accent: 'from-emerald-500 to-cyan-500',
  },
  {
    icon: Shapes,
    title: '72-DPI Precision Engine',
    desc: 'Every Fabric.js object lives in canonical PDF point coordinates so zoomed editing exports with razor-sharp alignment.',
    accent: 'from-amber-500 to-rose-500',
  },
  {
    icon: Sparkles,
    title: 'Instant Offline Privacy',
    desc: 'Zero cloud uploads. Powered locally by PDF.js, pdf-lib, and IndexedDB project saving with Undo/Redo history.',
    accent: 'from-sky-500 to-indigo-500',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Capabilities
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-2">
            Engineered for real document control
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Every tool in the workspace executes genuine edits and exports a standards-compliant PDF document.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
            >
              <TiltCard3D className="glass-card p-6 h-full border border-white/10">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.accent} p-[1px] mb-4 shadow-lg`}
                >
                  <div className="w-full h-full rounded-[11px] bg-[#090d1f] flex items-center justify-center">
                    <feat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-300/80 leading-relaxed">{feat.desc}</p>
              </TiltCard3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
