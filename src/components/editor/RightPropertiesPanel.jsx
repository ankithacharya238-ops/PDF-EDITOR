import React, { useRef } from 'react';
import {
  AlertTriangle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  Copy,
  FilePlus2,
  ImagePlus,
  Italic,
  Lock,
  RotateCw,
  Trash2,
  Underline,
  Unlock,
} from 'lucide-react';
import { COLOR_SWATCHES, FONT_OPTIONS, HIGHLIGHT_COLORS } from '../../config/editorConfig';

export default function RightPropertiesPanel({
  selectedObject,
  activeTool,
  drawSettings,
  onChangeDrawSettings,
  onUpdateSelected,
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

  return (
    <aside
      className={
        inDrawer
          ? 'w-full flex flex-col gap-5'
          : 'w-72 shrink-0 glass-panel border-l border-white/10 p-4 overflow-y-auto z-20 hidden md:flex flex-col gap-5'
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

      {/* TEXT PROPERTIES */}
      {selectedObject?.kind === 'text' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="font-display text-sm font-bold text-white">Text Properties</h3>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors"
              title="Delete text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {selectedObject.nexFontSubstituted && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-400/35 p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Embedded Font Substitution</span>
                Original PDF uses subset font{' '}
                <code className="font-mono text-amber-300">{selectedObject.nexOriginalFont || 'Embedded'}</code>.
                Export uses <strong className="text-white">{selectedObject.nexFontId}</strong>.
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Text Content</label>
            <textarea
              rows={3}
              value={selectedObject.text}
              onChange={(e) => onUpdateSelected({ text: e.target.value })}
              className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-y"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Font Family</label>
              <select
                value={selectedObject.nexFontId}
                onChange={(e) => onUpdateSelected({ fontFamilyId: e.target.value })}
                className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-900">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Size</label>
              <input
                type="number"
                min={6}
                max={144}
                value={selectedObject.fontSize}
                onChange={(e) => onUpdateSelected({ fontSize: Math.max(6, Number(e.target.value) || 12) })}
                className="w-full rounded-xl bg-slate-900/85 border border-white/10 px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Style & Alignment */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateSelected({
                    fontWeight: selectedObject.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`flex-1 py-1.5 rounded-lg flex justify-center transition-colors ${
                  selectedObject.fontWeight === 'bold'
                    ? 'bg-violet-500/35 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSelected({
                    fontStyle: selectedObject.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`flex-1 py-1.5 rounded-lg flex justify-center transition-colors ${
                  selectedObject.fontStyle === 'italic'
                    ? 'bg-violet-500/35 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateSelected({ underline: !selectedObject.underline })}
                className={`flex-1 py-1.5 rounded-lg flex justify-center transition-colors ${
                  selectedObject.underline
                    ? 'bg-violet-500/35 text-white'
                    : 'text-slate-400 hover:text-white'
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

          {/* Color */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-slate-400">Text Color</label>
              <input
                type="color"
                value={selectedObject.fill?.startsWith('#') ? selectedObject.fill : '#0f172a'}
                onChange={(e) => onUpdateSelected({ fill: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_SWATCHES.map((c) => (
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
      {!selectedObject && (activeTool === 'draw' || activeTool === 'highlight' || activeTool === 'shapes' || activeTool === 'underline') && (
        <div className="space-y-4 border-b border-white/10 pb-4">
          <h3 className="font-display text-sm font-bold text-white capitalize">
            {activeTool} Tool Settings
          </h3>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">Active Color</label>
            <div className="flex flex-wrap gap-1.5">
              {(activeTool === 'highlight' ? HIGHLIGHT_COLORS : COLOR_SWATCHES).map((c) => {
                const current = activeTool === 'highlight' ? drawSettings.highlightColor : drawSettings.color;
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
