import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileCheck2, Layers, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import Hero3DScene from '../../animations/Hero3DScene';
import MagneticButton from '../common/MagneticButton';
import { fadeUp } from '../../animations/variants';

export default function HeroSection({ onStartEditing, onLoadSample }) {
  return (
    <section id="home" className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6 relative z-10">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan-400/30 text-xs font-medium text-cyan-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Next-Gen 3D Browser PDF Studio — Zero Server Uploads
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.08}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]"
            >
              Edit PDFs at{' '}
              <span className="gradient-text">Stream Level</span>
              <br />
              Preserve Every Pixel.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.16}
              className="text-base sm:text-lg text-slate-300/90 max-w-xl leading-relaxed"
            >
              Upload any multi-page PDF, genuinely edit existing text & fonts, move or replace embedded images, draw vector signatures, manage pages, and export clean PDFs—with 100% original layout fidelity.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.24}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <MagneticButton onClick={onStartEditing} className="px-6 py-3.5 text-sm sm:text-base">
                Start Editing PDF
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>

              <MagneticButton
                variant="secondary"
                onClick={onLoadSample}
                className="px-5 py-3.5 text-sm sm:text-base"
              >
                <Wand2 className="w-4 h-4 text-cyan-300" />
                Try Interactive Sample PDF
              </MagneticButton>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.32}
              className="grid grid-cols-3 gap-3 pt-4 max-w-lg"
            >
              {[
                { icon: Layers, label: 'Stream-Level Edits', sub: 'Real text & XObjects' },
                { icon: FileCheck2, label: 'Layout Preserved', sub: '72-DPI canonical sync' },
                { icon: ShieldCheck, label: '100% Local', sub: 'Runs in your browser' },
              ].map((item) => (
                <div key={item.label} className="glass-panel rounded-xl p-3 border border-white/10">
                  <item.icon className="w-4 h-4 text-cyan-300 mb-1.5" />
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[11px] text-slate-400">{item.sub}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right 3D Floating Document Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative rounded-3xl glass-card glow-border p-2 sm:p-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 via-transparent to-cyan-500/10 pointer-events-none" />
              <Hero3DScene />

              {/* Floating live telemetry badges */}
              <div className="hidden sm:flex items-center gap-2.5 absolute top-5 left-5 px-3 py-2 rounded-xl glass-panel border border-violet-400/30 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200 font-medium">PDF.js + pdf-lib Engine Ready</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 absolute bottom-5 right-5 px-3.5 py-2 rounded-xl glass-panel border border-cyan-400/30 text-xs text-cyan-200">
                Move cursor to tilt 3D preview
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
