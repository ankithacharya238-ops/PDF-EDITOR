import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eraser,
  FilePlus2,
  Highlighter,
  ImagePlus,
  Italic,
  Lock,
  RotateCcw,
  RotateCw,
  Search,
  Sparkles,
  SpellCheck2,
  Trash2,
  Type,
  Underline,
  Unlock,
} from 'lucide-react';
import {
  COLOR_SWATCHES,
  FONT_CATEGORIES,
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  HIGHLIGHT_COLORS,
  SHARPENING_PRESETS,
  TEXT_HIGHLIGHT_SWATCHES,
  resolveFontOption,
} from '../../config/editorConfig';

export default function RightPropertiesPanel({
  selectedObject,
  activeTool,
  sharpeningLevel,
  onChangeSharpeningLevel,
  drawSettings,
  onChangeDrawSettings,
  onUpdateSelected,
  onMatchAbove,
  onTransformCase,
  onSetTextSelectionRange,
  onApplyErrorFix,
  onIgnoreError,
  onResetSelectedText,
  onReplaceSelectedImage,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  activePage,
  activePageIndex,
  totalPages,
  onAddBlankPage,
  onDuplicatePage,
  onRotatePage,
  onDeletePage,
  inDrawer = false,
}) {
  const replaceImgRef = useRef(null);
  const [fontCategory, setFontCategory] = useState('all');
  const [fontSearch, setFontSearch] = useState('');
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  const handleReplaceFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onReplaceSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredFonts = useMemo(() => {
    return FONT_OPTIONS.filter((f) => {
      const catMatch = fontCategory === 'all' || f.category === fontCategory;
      const q = fontSearch.trim().toLowerCase();
      const textMatch =
        !q ||
        f.label.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.tags.some((t) => t.includes(q));
      return catMatch && textMatch;
    });
  }, [fontCategory, fontSearch]);

  const selStart = selectedObject?.selectionStart ?? 0;
  const selEnd = selectedObject?.selectionEnd ?? 0;
  const hasSelection = selEnd > selStart;
  const selStyle = selectedObject?.activeSelectionStyle || {};
  const displayFontObj = useMemo(
    () =>
      resolveFontOption(
        selStyle.nexFontId || (selStyle.fontFamily ? selStyle.fontFamily : selectedObject?.nexFontId)
      ),
    [selStyle.nexFontId, selStyle.fontFamily, selectedObject?.nexFontId]
  );
  const displayFontSize = selStyle.fontSize ?? selectedObject?.fontSize ?? 16;
  const displayWeight = String(selStyle.fontWeight ?? selectedObject?.fontWeight ?? '400');
  const displayItalic = (selStyle.fontStyle ?? selectedObject?.fontStyle) === 'italic';
  const displayUnderline = Boolean(selStyle.underline ?? selectedObject?.underline);
  const displayColor = selStyle.fill ?? selectedObject?.fill ?? '#0f172a';
  const displayHighlight = selStyle.textBackgroundColor ?? selectedObject?.textBackgroundColor ?? '';
  const textIssues = selectedObject?.textIssues || [];

  const isBoldActive = displayWeight === 'bold' || Number(displayWeight) >= 600;

  return (
    <aside
      className={
        inDrawer
          ? 'w-full flex flex-col gap-5'
          : 'w-80 shrink-0 glass-panel border-l border-white/10 p-4 overflow-y-auto z-20 hidden md:flex flex-col gap-5'
      }
    >
      <input
        ref={replaceImgRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleReplaceFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* GLOBAL FONT SHARPENING CONTROL (always accessible) */}
      <div className="rounded-xl bg-slate-900/75 border border-cyan-400/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-cyan-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            Font Sharpening
          </span>
          <span className="text-[10px] font-mono text-emerald-300">
            {SHARPENING_PRESETS.find((s) => s.id === sharpeningLevel)?.label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-950/80 border border-white/10">
          {SHARPENING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChangeSharpeningLevel(preset.id)}
              title={preset.desc}
              className={`py-1 px-1.5 rounded-md text-[10px] font-semibold transition-all ${
                sharpeningLevel === preset.id
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          {SHARPENING_PRESETS.find((s) => s.id === sharpeningLevel)?.desc} — prevents blurry canvas text.
        </p>
      </div>

      {/* TEXT PROPERTIES */}
      {selectedObject?.kind === 'text' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              <Type className="w-4 h-4 text-cyan-300" />
              Text & Font Studio
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onResetSelectedText}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-cyan-300 transition-colors"
                title={
                  selectedObject.hasOriginalFormat
                    ? 'Reset formatting to original PDF style'
                    : 'Reset formatting to default'
                }
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                type="button"
                onClick={onDeleteSelected}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
                title="Delete text"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Typography Preview */}
          <div className="rounded-xl bg-white p-3 border border-cyan-400/40 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                Live Preview {hasSelection ? `(Selection ${selEnd - selStart})` : ''}
              </span>
              <span className="font-mono text-slate-500">
                {displayFontObj.label} • {displayFontSize}pt • w{displayWeight}
              </span>
            </div>
            <div
              style={{
                fontFamily: displayFontObj.cssFamily,
                fontSize: `${Math.min(26, Math.max(12, displayFontSize))}px`,
                fontWeight: displayWeight,
                fontStyle: displayItalic ? 'italic' : 'normal',
                textDecoration: displayUnderline ? 'underline' : 'none',
                color: displayColor,
                backgroundColor: displayHighlight || 'rgba(241, 245, 249, 0.7)',
                textAlign: selectedObject.textAlign || 'left',
                letterSpacing: `${(selectedObject.charSpacing || 0) / 1000}em`,
                lineHeight: selectedObject.lineHeight || 1.2,
                WebkitFontSmoothing: 'antialiased',
                textRendering: 'geometricPrecision',
              }}
              className="truncate py-1 rounded px-1.5"
            >
              {(hasSelection
                ? selectedObject.text?.slice(selStart, selEnd)
                : selectedObject.text?.trim()) || 'Aa Bb Cc — Sample Preview 123'}
            </div>
          </div>

          {selectedObject.nexFontSubstituted && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-400/35 p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Embedded Font Preserved Visually</span>
                PDF subset{' '}
                <code className="font-mono text-amber-300">{selectedObject.nexOriginalFont || 'Embedded'}</code>{' '}
                kept size/weight/color; exports with <strong className="text-white">{displayFontObj.label}</strong>.
              </div>
            </div>
          )}

          {/* Text Content (highlighting text here enables Selective Formatting on desktop & mobile!) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400">Text Content</label>
              <span className="text-[10px] text-cyan-300/80">
                {hasSelection ? `${selEnd - selStart} chars selected` : 'Drag to select word'}
              </span>
            </div>
            <textarea
              rows={2}
              value={selectedObject.text}
              onSelect={(e) => {
                onSetTextSelectionRange?.(e.target.selectionStart, e.target.selectionEnd);
              }}
              onChange={(e) => onUpdateSelected({ text: e.target.value })}
              className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-y"
            />
          </div>

          {/* Categorized Font Family Selector with Preview */}
          <div className="space-y-1.5 relative">
            <label className="block text-[11px] text-slate-400">
              Font Family ({FONT_OPTIONS.length} families)
            </label>
            <button
              type="button"
              onClick={() => setFontPickerOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-slate-900/90 border border-white/15 hover:border-cyan-400/60 px-3 py-2 text-left transition-colors"
            >
              <div className="min-w-0">
                <div
                  style={{ fontFamily: displayFontObj.cssFamily }}
                  className="text-sm text-white truncate"
                >
                  {displayFontObj.label}
                </div>
                <div className="text-[10px] text-cyan-300/80 capitalize">{displayFontObj.category}</div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  fontPickerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {fontPickerOpen && (
              <div className="rounded-xl bg-[#090e24] border border-cyan-400/35 shadow-2xl p-2 space-y-2 z-30">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="Search serif, cursive, Roboto..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {FONT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFontCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        fontCategory === cat.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {filteredFonts.map((f) => {
                    const selected = f.id === displayFontObj.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          onUpdateSelected({ fontFamilyId: f.id });
                          setFontPickerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          selected
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-white'
                            : 'hover:bg-white/5 text-slate-200 border border-transparent'
                        }`}
                      >
                        <span style={{ fontFamily: f.cssFamily }} className="text-sm truncate">
                          {f.label}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 shrink-0 ml-2">
                          {f.category}
                        </span>
                      </button>
                    );
                  })}
                  {filteredFonts.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-3">No matching fonts</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Font Size Slider + Numeric Input */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Font Size</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSelected({ fontSize: Math.max(6, displayFontSize - 1) })
                  }
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs"
                >
                  -
                </button>
                <input
                  type="number"
                  min={6}
                  max={144}
                  value={displayFontSize}
                  onChange={(e) =>
                    onUpdateSelected({ fontSize: Math.max(6, Number(e.target.value) || 12) })
                  }
                  className="w-14 rounded-lg bg-slate-900/85 border border-white/10 px-1.5 py-0.5 text-xs text-center text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSelected({ fontSize: Math.min(144, displayFontSize + 1) })
                  }
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min={8}
              max={96}
              step={1}
              value={Math.min(96, displayFontSize)}
              onChange={(e) => onUpdateSelected({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Font Weight Selector + Capitalization */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Weight</label>
              <select
                value={displayWeight}
                onChange={(e) => onUpdateSelected({ fontWeight: e.target.value })}
                className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {FONT_WEIGHT_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value} className="bg-slate-900">
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Capitalization</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900/85 border border-white/10 rounded-xl p-1">
                {[
                  { mode: 'upper', label: 'AA', title: 'UPPERCASE' },
                  { mode: 'lower', label: 'aa', title: 'lowercase' },
                  { mode: 'title', label: 'Aa', title: 'Title Case' },
                ].map((c) => (
                  <button
                    key={c.mode}
                    type="button"
                    onClick={() => onTransformCase?.(c.mode)}
                    title={c.title}
                    className="py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-violet-500/35 transition-colors"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bold / Italic / Underline & Alignment */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateSelected({
                    fontWeight: isBoldActive ? '400' : '700',
                  })
                }
                className={`flex-1 py-1.5 rounded-lg flex justify-center transition-colors ${
                  isBoldActive ? 'bg-violet-500/35 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Bold (700)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSelected({
                    fontStyle: displayItalic ? 'normal' : 'italic',
                  })
                }
                className={`flex-1 py-1.5 rounded-lg flex justify-center transition-colors ${
                  displayItalic ? 'bg-violet-500/35 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateSelected({ underline: !displayUnderline })}
                className={`flex-1 py-1.5 rounded-lg flex justify-center transition-colors ${
                  displayUnderline ? 'bg-violet-500/35 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-xl p-1">
              {[
                { id: 'left', Icon: AlignLeft },
                { id: 'center', Icon: AlignCenter },
                { id: 'right', Icon: AlignRight },
                { id: 'justify', Icon: AlignJustify },
              ].map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onUpdateSelected({ textAlign: id })}
                  className={`flex-1 py-1.5 rounded-lg flex justify-center transition-colors ${
                    selectedObject.textAlign === id
                      ? 'bg-cyan-500/35 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Align ${id}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onMatchAbove}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-xs font-medium text-slate-200 hover:text-cyan-200 transition-colors"
            title="Align selected text to the exact starting position of the line above it"
          >
            <ArrowUpToLine className="w-3.5 h-3.5 text-cyan-300" />
            Match Above Alignment
          </button>

          {/* Color Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-slate-400">Text Color</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-300 uppercase">
                  {displayColor}
                </span>
                <input
                  type="color"
                  value={displayColor?.startsWith('#') ? displayColor : '#0f172a'}
                  onChange={(e) => onUpdateSelected({ fill: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateSelected({ fill: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border ${
                    displayColor?.toLowerCase() === c ? 'border-cyan-400 scale-110' : 'border-white/25'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Text Highlighting */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <Highlighter className="w-3 h-3 text-yellow-300" /> Text Highlight
              </label>
              <button
                type="button"
                onClick={() => onUpdateSelected({ textBackgroundColor: '' })}
                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-300"
              >
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_HIGHLIGHT_SWATCHES.map((sw) => (
                <button
                  key={sw.color}
                  type="button"
                  title={sw.label}
                  onClick={() => onUpdateSelected({ textBackgroundColor: sw.color })}
                  style={{ backgroundColor: sw.color }}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    displayHighlight === sw.color ? 'border-cyan-400 scale-110' : 'border-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Line & Letter Spacing */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Line Spacing</span>
                <span className="font-mono text-cyan-300">{Number(selectedObject.lineHeight).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={2.4}
                step={0.05}
                value={selectedObject.lineHeight}
                onChange={(e) => onUpdateSelected({ lineHeight: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Letter Spacing</span>
                <span className="font-mono text-cyan-300">{selectedObject.charSpacing}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={500}
                step={10}
                value={selectedObject.charSpacing}
                onChange={(e) => onUpdateSelected({ charSpacing: parseInt(e.target.value, 10) })}
                className="w-full accent-violet-400"
              />
            </div>
          </div>

          {/* Spelling & Grammar Error Detection Card */}
          <div className="rounded-xl bg-slate-900/80 border border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                <SpellCheck2 className="w-3.5 h-3.5 text-cyan-300" />
                Proofing & Grammar
              </span>
              {textIssues.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300">
                  <AlertCircle className="w-3 h-3" /> {textIssues.length}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> Clean
                </span>
              )}
            </div>

            {textIssues.length === 0 ? (
              <p className="text-[11px] text-slate-400">No spelling or grammar issues found.</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                {textIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-lg bg-slate-950/80 border border-rose-500/25 p-2 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-rose-300 font-semibold capitalize">{issue.type}</span>
                      <button
                        type="button"
                        onClick={() => onIgnoreError?.(issue.key)}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Ignore
                      </button>
                    </div>
                    <p className="text-slate-300">{issue.message}</p>
                    {issue.suggestions?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {issue.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => onApplyErrorFix?.(issue, sug)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[10px] font-medium"
                          >
                            <Check className="w-2.5 h-2.5" /> {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* IMAGE PROPERTIES */}
      {selectedObject?.kind === 'image' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="font-display text-sm font-bold text-white">Image Properties</h3>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => replaceImgRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/35 text-xs font-medium text-violet-200 transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-xs font-medium text-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400">Dimensions (pt)</span>
              <button
                type="button"
                onClick={() => onUpdateSelected({ lockAspect: !selectedObject.lockAspect })}
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${
                  selectedObject.lockAspect
                    ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10'
                    : 'border-white/10 text-slate-400'
                }`}
              >
                {selectedObject.lockAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                Aspect
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500">Width</label>
                <input
                  type="number"
                  value={selectedObject.width}
                  onChange={(e) => {
                    const nw = Math.max(10, Number(e.target.value) || 10);
                    if (selectedObject.lockAspect && selectedObject.width > 0) {
                      const ratio = selectedObject.height / selectedObject.width;
                      onUpdateSelected({ targetWidth: nw, targetHeight: Math.round(nw * ratio) });
                    } else {
                      onUpdateSelected({ targetWidth: nw });
                    }
                  }}
                  className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Height</label>
                <input
                  type="number"
                  value={selectedObject.height}
                  onChange={(e) => {
                    const nh = Math.max(10, Number(e.target.value) || 10);
                    if (selectedObject.lockAspect && selectedObject.height > 0) {
                      const ratio = selectedObject.width / selectedObject.height;
                      onUpdateSelected({ targetHeight: nh, targetWidth: Math.round(nh * ratio) });
                    } else {
                      onUpdateSelected({ targetHeight: nh });
                    }
                  }}
                  className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500">Pos X</label>
              <input
                type="number"
                value={selectedObject.left}
                onChange={(e) => onUpdateSelected({ left: Number(e.target.value) || 0 })}
                className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Pos Y</label>
              <input
                type="number"
                value={selectedObject.top}
                onChange={(e) => onUpdateSelected({ top: Number(e.target.value) || 0 })}
                className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Rotation</span>
              <span className="font-mono text-cyan-300">{selectedObject.angle}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={selectedObject.angle}
              onChange={(e) => onUpdateSelected({ angle: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400"
            />
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => onUpdateSelected({ angle: (selectedObject.angle - 90) % 360 })}
                className="py-1 rounded-lg bg-slate-900/80 border border-white/10 text-[11px] text-slate-300 hover:text-white"
              >
                -90°
              </button>
              <button
                type="button"
                onClick={() => onUpdateSelected({ angle: (selectedObject.angle + 90) % 360 })}
                className="py-1 rounded-lg bg-slate-900/80 border border-white/10 text-[11px] text-slate-300 hover:text-white"
              >
                +90°
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Opacity</span>
              <span className="font-mono text-cyan-300">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selectedObject.opacity ?? 1}
              onChange={(e) => onUpdateSelected({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-violet-400"
            />
          </div>
        </div>
      )}

      {/* SHAPE / HIGHLIGHT / UNDERLINE / DRAW PROPERTIES */}
      {selectedObject && selectedObject.kind !== 'text' && selectedObject.kind !== 'image' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="font-display text-sm font-bold text-white capitalize">
              {selectedObject.kind} Properties
            </h3>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
              title="Delete object"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-slate-400">Border / Stroke Color</label>
              <input
                type="color"
                value={selectedObject.stroke?.startsWith('#') ? selectedObject.stroke : '#3b82f6'}
                onChange={(e) => onUpdateSelected({ stroke: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateSelected({ stroke: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border ${
                    selectedObject.stroke === c ? 'border-cyan-400 scale-110' : 'border-white/25'
                  }`}
                />
              ))}
            </div>
          </div>

          {selectedObject.kind !== 'draw' && selectedObject.kind !== 'underline' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-slate-400">Fill Color</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSelected({ fill: 'transparent' })}
                    className={`px-2 py-0.5 rounded text-[10px] border ${
                      selectedObject.fill === 'transparent'
                        ? 'border-cyan-400 text-cyan-300 bg-cyan-500/15'
                        : 'border-white/10 text-slate-400'
                    }`}
                  >
                    None
                  </button>
                  <input
                    type="color"
                    value={selectedObject.fill?.startsWith('#') ? selectedObject.fill : '#3b82f6'}
                    onChange={(e) => onUpdateSelected({ fill: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedObject.kind === 'highlight' ? HIGHLIGHT_COLORS : COLOR_SWATCHES).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdateSelected({ fill: c })}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border ${
                      selectedObject.fill === c ? 'border-cyan-400 scale-110' : 'border-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Border Thickness</span>
              <span className="font-mono text-cyan-300">{selectedObject.strokeWidth}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              step={0.5}
              value={selectedObject.strokeWidth}
              onChange={(e) => onUpdateSelected({ strokeWidth: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Transparency / Opacity</span>
              <span className="font-mono text-cyan-300">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selectedObject.opacity ?? 1}
              onChange={(e) => onUpdateSelected({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-violet-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onBringForward}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 hover:text-white"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" /> Forward
            </button>
            <button
              type="button"
              onClick={onSendBackward}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 hover:text-white"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Backward
            </button>
          </div>
        </div>
      )}

      {/* BRUSH / HIGHLIGHT TOOL SETTINGS WHEN NOTHING SELECTED */}
      {!selectedObject &&
        (activeTool === 'draw' || activeTool === 'highlight' || activeTool === 'shapes' || activeTool === 'underline') && (
          <div className="space-y-4 border-b border-white/10 pb-4">
            <h3 className="font-display text-sm font-bold text-white capitalize">
              {activeTool} Tool Settings
            </h3>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">Active Color</label>
              <div className="flex flex-wrap gap-1.5">
                {(activeTool === 'highlight' ? HIGHLIGHT_COLORS : COLOR_SWATCHES).map((c) => {
                  const current =
                    activeTool === 'highlight' ? drawSettings.highlightColor : drawSettings.color;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        onChangeDrawSettings(
                          activeTool === 'highlight' ? { highlightColor: c } : { color: c }
                        )
                      }
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border ${
                        current === c ? 'border-cyan-400 scale-110' : 'border-white/25'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {activeTool === 'draw' && (
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Brush Width</span>
                  <span className="font-mono text-cyan-300">{drawSettings.strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={14}
                  step={0.5}
                  value={drawSettings.strokeWidth}
                  onChange={(e) => onChangeDrawSettings({ strokeWidth: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
            )}
          </div>
        )}

      {/* PAGE INSPECTOR & MANAGEMENT */}
      {!selectedObject && activePage && (
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold text-white">Page Inspector</h3>
          <div className="rounded-xl bg-slate-900/75 border border-white/10 p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Page</span>
              <span className="font-mono text-white">
                {activePageIndex + 1} of {totalPages}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Size (pt)</span>
              <span className="font-mono text-cyan-300">
                {Math.round(activePage.width)} × {Math.round(activePage.height)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rotation</span>
              <span className="font-mono text-slate-200">{activePage.rotationDelta || 0}°</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onAddBlankPage}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-cyan-300" /> Add Blank Page
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onRotatePage(activePage.id)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 text-xs text-slate-200"
              >
                <RotateCw className="w-3.5 h-3.5 text-violet-300" /> Rotate
              </button>
              <button
                type="button"
                onClick={() => onDuplicatePage(activePage.id)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 text-xs text-slate-200"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-300" /> Duplicate
              </button>
            </div>
            <button
              type="button"
              onClick={() => onDeletePage(activePage.id)}
              disabled={totalPages <= 1}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs text-rose-300 disabled:opacity-35 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Page
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
