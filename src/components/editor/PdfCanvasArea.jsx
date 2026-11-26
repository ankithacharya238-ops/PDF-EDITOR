import React, { useEffect } from 'react';
import PdfPageCanvas from './PdfPageCanvas';
import { TOOLS } from '../../config/editorConfig';

export default function PdfCanvasArea({
  pagesState,
  pdfjsDoc,
  pdfjsPagesMap,
  pageMetadataMap,
  zoom,
  activeTool,
  activeShapeType,
  drawSettings,
  activePageId,
  onFocusPage,
  onSelectTool,
  onCommitPageUpdate,
  onSelectObject,
  registerPageApi,
  onToast,
  containerRef,
}) {
  const toolMeta = TOOLS.find((t) => t.id === activeTool);

  // Keep activePageId synced automatically as user scrolls through pages
  useEffect(() => {
    const root = containerRef?.current;
    if (!root || pagesState.length <= 1) return;

    const handleScroll = () => {
      const rootRect = root.getBoundingClientRect();
      const midY = rootRect.top + rootRect.height * 0.42;
      let closestId = null;
      let closestDist = Infinity;

      for (const p of pagesState) {
        const el = document.getElementById(`pdf-page-${p.id}`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - midY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = p.id;
        }
      }
      if (closestId && closestId !== activePageId) {
        onFocusPage(closestId);
      }
    };

    root.addEventListener('scroll', handleScroll, { passive: true });
    return () => root.removeEventListener('scroll', handleScroll);
  }, [containerRef, pagesState, activePageId, onFocusPage]);

  return (
    <main
      ref={containerRef}
      className="flex-1 overflow-auto bg-[#070a15] relative flex flex-col items-center py-10 px-4 sm:px-8 gap-12"
    >
      <div className="sticky top-2 z-20 pointer-events-none">
        <div className="glass-panel px-3.5 py-1.5 rounded-full border border-white/15 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-white">{toolMeta?.label}:</span>
          <span className="hidden sm:inline text-slate-300">{toolMeta?.description}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-12 pb-24">
        {pagesState.map((pageSpec, idx) => {
          const pdfjsPage = pageSpec.isBlank ? null : pdfjsPagesMap[pageSpec.sourcePageIndex];
          const metadata = pageSpec.isBlank ? null : pageMetadataMap[pageSpec.sourcePageIndex];
          return (
            <PdfPageCanvas
              key={pageSpec.id}
              pageSpec={pageSpec}
              pageIndex={idx}
              pdfjsDoc={pdfjsDoc}
              pdfjsPage={pdfjsPage}
              metadata={metadata}
              zoom={zoom}
              activeTool={activeTool}
              activeShapeType={activeShapeType}
              drawSettings={drawSettings}
              isActivePage={pageSpec.id === activePageId}
              onFocusPage={onFocusPage}
              onSelectTool={onSelectTool}
              onCommitPageUpdate={onCommitPageUpdate}
              onSelectObject={onSelectObject}
              registerPageApi={registerPageApi}
              onToast={onToast}
            />
          );
        })}
      </div>
    </main>
  );
}
