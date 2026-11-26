import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  FilePlus2,
  RotateCw,
  Trash2,
} from 'lucide-react';

export default function PageThumbnails({
  pagesState,
  activePageId,
  pageThumbnailsMap,
  onSelectPage,
  onAddBlankPage,
  onDuplicatePage,
  onRotatePage,
  onDeletePage,
  onMovePage,
  inDrawer = false,
}) {
  return (
    <div
      className={
        inDrawer
          ? 'w-full flex flex-col h-full'
          : 'hidden lg:flex w-44 shrink-0 border-r border-white/10 bg-[#070b18]/90 flex-col z-10'
      }
    >
      <div className="p-2.5 border-b border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Pages ({pagesState.length})
        </span>
        <button
          type="button"
          onClick={onAddBlankPage}
          title="Add blank page"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/35 text-[11px] text-violet-200 transition-colors"
        >
          <FilePlus2 className="w-3 h-3" />
          Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {pagesState.map((page, index) => {
          const isActive = page.id === activePageId;
          const thumbUrl = page.isBlank ? null : pageThumbnailsMap[page.sourcePageIndex];

          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(page.id)}
              className={`group rounded-xl p-2 border transition-all cursor-pointer ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]'
                  : 'border-white/10 bg-slate-900/50 hover:border-white/25'
              }`}
            >
              <div className="aspect-[3/4] rounded-lg bg-white overflow-hidden relative flex items-center justify-center mb-2">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${index + 1}`}
                    style={{ transform: `rotate(${page.rotationDelta || 0}deg)` }}
                    className="w-full h-full object-contain transition-transform duration-200"
                  />
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Blank Page</span>
                )}
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-white">
                  {index + 1}
                </span>
              </div>

              <div
                className="flex items-center justify-between gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onMovePage(index, -1)}
                  disabled={index === 0}
                  title="Move page up"
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onMovePage(index, 1)}
                  disabled={index === pagesState.length - 1}
                  title="Move page down"
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onRotatePage(page.id)}
                  title="Rotate 90° clockwise"
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicatePage(page.id)}
                  title="Duplicate page"
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-violet-300"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePage(page.id)}
                  disabled={pagesState.length <= 1}
                  title="Delete page"
                  className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 disabled:opacity-25"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
