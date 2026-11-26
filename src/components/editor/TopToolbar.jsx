import React from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  Maximize2,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Logo from '../common/Logo';
import MagneticButton from '../common/MagneticButton';
import { ZOOM_PRESETS } from '../../config/editorConfig';

export default function TopToolbar({
  docName,
  onDocNameChange,
  onBackHome,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onSaveProject,
  onExportPdf,
  isExporting,
  zoom,
  onZoomChange,
  onFitToScreen,
  currentPageNumber,
  totalPages,
  onPrevPage,
  onNextPage,
  onOpenShortcuts,
}) {
  return (
    <header className="h-14 shrink-0 glass-panel border-b border-white/10 px-3 sm:px-4 flex items-center justify-between gap-2 z-30">
      {/* Left: Back, Logo & Document Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBackHome}
          title="Back to Home"
          className="p-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="hidden md:block shrink-0">
          <Logo compact />
        </div>

        <input
          type="text"
          value={docName}
          onChange={(e) => onDocNameChange(e.target.value)}
          aria-label="Document filename"
          className="bg-slate-900/70 border border-white/10 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-medium text-white w-32 sm:w-48 lg:w-56 truncate focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Center: Undo/Redo, Page Nav & Zoom */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 bg-slate-900/70 border border-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Reset all changes"
            className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Page Navigation */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900/70 border border-white/10 rounded-xl px-2 py-1 text-xs">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPageNumber <= 1}
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-35"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-slate-200 whitespace-nowrap">
            {currentPageNumber} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPageNumber >= totalPages}
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-35"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/70 border border-white/10 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.4, +(zoom - 0.15).toFixed(2)))}
            title="Zoom out (-)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <select
            value={ZOOM_PRESETS.includes(zoom) ? zoom : 'custom'}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) onZoomChange(v);
            }}
            aria-label="Zoom level"
            className="bg-transparent text-slate-200 font-mono text-xs px-1 focus:outline-none cursor-pointer"
          >
            {!ZOOM_PRESETS.includes(zoom) && (
              <option value="custom" className="bg-slate-900">
                {Math.round(zoom * 100)}%
              </option>
            )}
            {ZOOM_PRESETS.map((z) => (
              <option key={z} value={z} className="bg-slate-900">
                {Math.round(z * 100)}%
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(2.5, +(zoom + 0.15).toFixed(2)))}
            title="Zoom in (+)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onFitToScreen}
            title="Fit page to screen"
            className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-white/10"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Shortcuts, Save Project & Export */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="hidden sm:inline-flex p-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSaveProject}
          title="Save Project Locally (Ctrl+S)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden lg:inline">Save</span>
        </button>

        <MagneticButton
          onClick={onExportPdf}
          disabled={isExporting}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </MagneticButton>
      </div>
    </header>
  );
}
