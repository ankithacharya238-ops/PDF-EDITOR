import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Eraser,
  Highlighter,
  ImagePlus,
  MousePointer2,
  PenLine,
  Pencil,
  Shapes,
  Trash2,
  Type,
  Underline,
  FileEdit,
} from 'lucide-react';
import { SHAPE_TYPES, TOOLS } from '../../config/editorConfig';

const TOOL_ICONS = {
  select: MousePointer2,
  editText: FileEdit,
  addText: Type,
  addImage: ImagePlus,
  deleteObject: Trash2,
  highlight: Highlighter,
  underline: Underline,
  draw: Pencil,
  shapes: Shapes,
  signature: PenLine,
  eraser: Eraser,
};

export default function LeftToolsSidebar({
  activeTool,
  onSelectTool,
  activeShapeType,
  onChangeShapeType,
  onUploadImageFile,
  onOpenSignatureModal,
}) {
  const imageInputRef = useRef(null);

  const handleToolClick = (toolId) => {
    if (toolId === 'addImage') {
      onSelectTool('addImage');
      imageInputRef.current?.click();
      return;
    }
    if (toolId === 'signature') {
      onSelectTool('signature');
      onOpenSignatureModal();
      return;
    }
    onSelectTool(toolId);
  };

  return (
    <aside className="w-16 sm:w-52 shrink-0 glass-panel border-r border-white/10 flex flex-col justify-between py-3 px-2 sm:px-3 overflow-y-auto z-20">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadImageFile(file);
          e.target.value = '';
        }}
      />

      <div className="space-y-1">
        <div className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 px-2.5 pb-2">
          PDF Studio Tools
        </div>

        {TOOLS.map((tool) => {
          const Icon = TOOL_ICONS[tool.id] || MousePointer2;
          const isActive = activeTool === tool.id;
          return (
            <div key={tool.id}>
              <button
                type="button"
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.label} (${tool.shortcut}) — ${tool.description}`}
                className={`relative w-full flex items-center justify-center sm:justify-between gap-2.5 px-2.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeToolHighlight"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/80 to-cyan-500/70 border border-cyan-300/40 shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline truncate">{tool.label}</span>
                </span>
                <span className="relative z-10 hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-slate-300">
                  {tool.shortcut}
                </span>
              </button>

              {/* Inline shape selector when Shapes tool is active */}
              {tool.id === 'shapes' && activeTool === 'shapes' && (
                <div className="hidden sm:grid grid-cols-2 gap-1 mt-1.5 mb-2 p-1.5 rounded-xl bg-slate-900/80 border border-white/10">
                  {SHAPE_TYPES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onChangeShapeType(st.id)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-left truncate ${
                        activeShapeType === st.id
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden sm:block mt-4 p-2.5 rounded-xl bg-slate-900/65 border border-white/10 text-[11px] text-slate-400 leading-relaxed">
        <span className="text-cyan-300 font-semibold block mb-0.5">Tip</span>
        Use <strong className="text-slate-200">Edit Text (E)</strong> to click and modify existing PDF text, or{' '}
        <strong className="text-slate-200">Select (V)</strong> to move & resize objects.
      </div>
    </aside>
  );
}
