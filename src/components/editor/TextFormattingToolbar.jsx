import React, { useState } from 'react';
import {
  AlertCircle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowUpToLine,
  Bold,
  Check,
  CheckCircle2,
  Eraser,
  Highlighter,
  Italic,
  Redo2,
  RotateCcw,
  SpellCheck2,
  Underline,
  Undo2,
  X,
} from 'lucide-react';
import { TEXT_HIGHLIGHT_SWATCHES } from '../../config/editorConfig';

export default function TextFormattingToolbar({
  selectedObject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onUpdateSelected,
  onMatchAbove,
  onTransformCase,
  onResetText,
  onApplyErrorFix,
  onIgnoreError,
  activeErrorPopup,
  onCloseErrorPopup,
}) {
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [proofingOpen, setProofingOpen] = useState(false);

  if (!selectedObject || selectedObject.kind !== 'text') return null;

  const selStart = selectedObject.selectionStart ?? 0;
  const selEnd = selectedObject.selectionEnd ?? 0;
  const hasSelection = selEnd > selStart;
  const issues = selectedObject.textIssues || [];
  const isBold =
    selectedObject.activeSelectionStyle?.fontWeight
      ? Number(selectedObject.activeSelectionStyle.fontWeight) >= 600 ||
        selectedObject.activeSelectionStyle.fontWeight === 'bold'
      : selectedObject.fontWeight === 'bold' || Number(selectedObject.fontWeight || 400) >= 600;
  const isItalic =
    (selectedObject.activeSelectionStyle?.fontStyle ?? selectedObject.fontStyle) === 'italic';
  const isUnderline = Boolean(
    selectedObject.activeSelectionStyle?.underline ?? selectedObject.underline
  );
  const activeColor = selectedObject.activeSelectionStyle?.fill || selectedObject.fill || '#0f172a';
  const activeSize = selectedObject.activeSelectionStyle?.fontSize || selectedObject.fontSize || 16;

  return (
    <div className="sticky top-2 z-30 w-full max-w-4xl mx-auto px-2 pointer-events-auto">
      <div className="glass-panel rounded-2xl border border-cyan-400/30 shadow-[0_12px_36px_rgba(0,0,0,0.65)] px-2.5 py-1.5 flex flex-wrap items-center justify-center gap-1.5 relative">
        {/* Selective Formatting Scope Pill */}
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide border ${
            hasSelection
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}
          title={
            hasSelection
              ? `Formatting applies only to the ${selEnd - selStart} selected characters`
              : 'Select text inside the box or inspector to format a single word/phrase'
          }
        >
          {hasSelection ? `Selection (${selEnd - selStart})` : 'Whole Block'}
        </span>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Bold / Italic / Underline */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onUpdateSelected({ fontWeight: isBold ? '400' : '700' })}
            title="Bold"
            className={`p-1.5 rounded-lg transition-colors ${
              isBold ? 'bg-violet-600/70 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateSelected({ fontStyle: isItalic ? 'normal' : 'italic' })}
            title="Italic"
            className={`p-1.5 rounded-lg transition-colors ${
              isItalic ? 'bg-violet-600/70 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateSelected({ underline: !isUnderline })}
            title="Underline"
            className={`p-1.5 rounded-lg transition-colors ${
              isUnderline ? 'bg-violet-600/70 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Font Size Quick Steppers */}
        <div className="flex items-center gap-1 bg-slate-900/70 border border-white/10 rounded-lg px-1 py-0.5">
          <button
            type="button"
            onClick={() => onUpdateSelected({ fontSize: Math.max(6, activeSize - 1) })}
            className="w-5 h-5 rounded hover:bg-white/10 text-xs text-slate-300 hover:text-white"
            title="Decrease font size"
          >
            -
          </button>
          <span className="font-mono text-[11px] text-cyan-200 px-1 min-w-[26px] text-center">
            {activeSize}
          </span>
          <button
            type="button"
            onClick={() => onUpdateSelected({ fontSize: Math.min(144, activeSize + 1) })}
            className="w-5 h-5 rounded hover:bg-white/10 text-xs text-slate-300 hover:text-white"
            title="Increase font size"
          >
            +
          </button>
        </div>

        {/* Text Color */}
        <label
          title="Text Color"
          className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-900/70 border border-white/10 cursor-pointer hover:border-cyan-400/50"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/40"
            style={{ backgroundColor: activeColor }}
          />
          <input
            type="color"
            value={activeColor.startsWith('#') ? activeColor : '#0f172a'}
            onChange={(e) => onUpdateSelected({ fill: e.target.value })}
            className="sr-only"
          />
        </label>

        <div className="h-4 w-px bg-white/10" />

        {/* Paragraph / Text Alignment */}
        <div className="flex items-center gap-0.5">
          {[
            { id: 'left', Icon: AlignLeft, label: 'Align Left' },
            { id: 'center', Icon: AlignCenter, label: 'Align Center' },
            { id: 'right', Icon: AlignRight, label: 'Align Right' },
            { id: 'justify', Icon: AlignJustify, label: 'Justify' },
          ].map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onUpdateSelected({ textAlign: id })}
              title={label}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedObject.textAlign === id
                  ? 'bg-cyan-500/35 text-cyan-200'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <button
            type="button"
            onClick={onMatchAbove}
            title="Align selected text to the exact starting position of the line above it"
            className="inline-flex items-center gap-1 px-2 py-1 ml-0.5 rounded-lg border border-white/10 bg-slate-900/70 text-[11px] font-medium text-slate-200 hover:text-cyan-200 hover:border-cyan-400/50 transition-colors"
          >
            <ArrowUpToLine className="w-3 h-3 text-cyan-300" />
            <span>Match Above</span>
          </button>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Capitalization */}
        <div className="flex items-center gap-0.5 bg-slate-900/70 border border-white/10 rounded-lg p-0.5">
          {[
            { mode: 'upper', label: 'AA', title: 'UPPERCASE' },
            { mode: 'lower', label: 'aa', title: 'lowercase' },
            { mode: 'title', label: 'Aa', title: 'Title Case' },
          ].map((c) => (
            <button
              key={c.mode}
              type="button"
              onClick={() => onTransformCase(c.mode)}
              title={`Convert ${hasSelection ? 'selected text' : 'text'} to ${c.title}`}
              className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-violet-500/35 transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Text Highlighting */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setHighlightOpen((v) => !v);
              setProofingOpen(false);
            }}
            title="Highlight selected text"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              highlightOpen
                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                : 'border-white/10 bg-slate-900/70 text-slate-200 hover:border-cyan-400/50'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          {highlightOpen && (
            <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-52 rounded-xl glass-card border border-cyan-400/35 p-2.5 shadow-2xl z-40">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Text Highlight Color
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TEXT_HIGHLIGHT_SWATCHES.map((sw) => (
                  <button
                    key={sw.color}
                    type="button"
                    title={sw.label}
                    onClick={() => {
                      onUpdateSelected({ textBackgroundColor: sw.color });
                      setHighlightOpen(false);
                    }}
                    style={{ backgroundColor: sw.color }}
                    className="w-6 h-6 rounded-full border border-white/40 hover:scale-110 transition-transform"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateSelected({ textBackgroundColor: '' });
                  setHighlightOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 text-[11px] text-slate-200 hover:text-rose-200 transition-colors"
              >
                <Eraser className="w-3 h-3" /> Remove Highlight
              </button>
            </div>
          )}
        </div>

        {/* Spelling & Grammar Error Detection */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProofingOpen((v) => !v);
              setHighlightOpen(false);
            }}
            title="Spelling & Grammar Check"
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
              issues.length > 0
                ? 'border-rose-400/50 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
            }`}
          >
            {issues.length > 0 ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{issues.length > 0 ? `${issues.length} ${issues.length === 1 ? 'Issue' : 'Issues'}` : 'Clean'}</span>
          </button>

          {(proofingOpen || activeErrorPopup) && (
            <div className="absolute right-0 top-full mt-2 w-72 max-w-[88vw] rounded-xl glass-card border border-rose-400/35 p-3 shadow-2xl z-40">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <SpellCheck2 className="w-4 h-4 text-cyan-300" />
                  Spelling & Grammar
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProofingOpen(false);
                    onCloseErrorPopup?.();
                  }}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {issues.length === 0 ? (
                <p className="text-xs text-emerald-300 py-2">
                  No spelling or grammar issues detected in this text block.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5">
                  {(activeErrorPopup ? [activeErrorPopup] : issues).map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-lg bg-slate-900/90 border border-white/10 p-2 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            issue.type === 'spelling'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {issue.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onIgnoreError(issue.key);
                            onCloseErrorPopup?.();
                          }}
                          className="text-[10px] text-slate-400 hover:text-white underline"
                        >
                          Ignore
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300">{issue.message}</p>
                      {issue.suggestions?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {issue.suggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                onApplyErrorFix(issue, sug);
                                onCloseErrorPopup?.();
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[11px] font-medium transition-colors"
                            >
                              <Check className="w-3 h-3" /> {sug}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">No automatic suggestions</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reset Formatting */}
        <button
          type="button"
          onClick={onResetText}
          title="Reset formatting to original/default"
          className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
