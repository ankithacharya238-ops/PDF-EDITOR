import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, SlidersHorizontal, X } from 'lucide-react';
import TopToolbar from '../components/editor/TopToolbar';
import LeftToolsSidebar from '../components/editor/LeftToolsSidebar';
import PageThumbnails from '../components/editor/PageThumbnails';
import PdfCanvasArea from '../components/editor/PdfCanvasArea';
import RightPropertiesPanel from '../components/editor/RightPropertiesPanel';
import SignatureModal from '../components/editor/SignatureModal';
import ShortcutsModal from '../components/editor/ShortcutsModal';
import ParallaxBackground from '../animations/ParallaxBackground';
import { useHistory } from '../hooks/useHistory';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { extractPageMetadata, renderPdfPageToCanvas } from '../pdf/pdfParser';
import { exportEditedPdf } from '../pdf/pdfExporter';

export default function EditorPage({
  docSession,
  onBackHome,
  onSaveToRecent,
  onToast,
}) {
  const {
    id: initialDocId,
    name: initialDocName,
    pdfBytes,
    pdfjsDoc,
    initialPagesState,
  } = docSession;

  const [docId, setDocId] = useState(initialDocId || null);
  const [docName, setDocName] = useState(initialDocName || 'Document.pdf');
  const [zoom, setZoom] = useState(1.0);
  const [sharpeningLevel, setSharpeningLevel] = useState('ultra');
  const [activeTool, setActiveTool] = useState('select');
  const [activeShapeType, setActiveShapeType] = useState('rect');
  const [drawSettings, setDrawSettings] = useState({
    color: '#3b82f6',
    highlightColor: '#facc15',
    strokeWidth: 2.5,
  });

  const [pdfjsPagesMap, setPdfjsPagesMap] = useState({});
  const [pageMetadataMap, setPageMetadataMap] = useState({});
  const [pageThumbnailsMap, setPageThumbnailsMap] = useState({});
  const [selectedObject, setSelectedObject] = useState(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
  const [mobilePagesOpen, setMobilePagesOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const pageApisRef = useRef({});
  const canvasContainerRef = useRef(null);

  const {
    state: pagesState,
    pushState: pushPagesState,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  } = useHistory(initialPagesState);

  const [activePageId, setActivePageId] = useState(initialPagesState[0]?.id || null);

  // Load all PDF.js pages, thumbnails, and metadata (text blocks + image XObjects)
  useEffect(() => {
    let cancelled = false;
    const loadAllPages = async () => {
      const pagesMap = {};
      const metaMap = {};
      const thumbsMap = {};

      for (let i = 0; i < pdfjsDoc.numPages; i++) {
        if (cancelled) return;
        const page = await pdfjsDoc.getPage(i + 1);
        pagesMap[i] = page;

        const meta = await extractPageMetadata(page, i);
        metaMap[i] = meta;

        // Render compact thumbnail
        const tCanvas = document.createElement('canvas');
        await renderPdfPageToCanvas(page, tCanvas, 0.28);
        thumbsMap[i] = tCanvas.toDataURL('image/png');
      }

      if (cancelled) return;
      setPdfjsPagesMap(pagesMap);
      setPageMetadataMap(metaMap);
      setPageThumbnailsMap(thumbsMap);

      // Sync canonical dimensions into initial pages if needed
      resetHistory(
        initialPagesState.map((p) => {
          if (p.isBlank || !metaMap[p.sourcePageIndex]) return p;
          return {
            ...p,
            width: metaMap[p.sourcePageIndex].width,
            height: metaMap[p.sourcePageIndex].height,
          };
        })
      );
    };

    loadAllPages();
    return () => {
      cancelled = true;
    };
  }, [pdfjsDoc]);

  const registerPageApi = useCallback((pageId, api) => {
    if (api) {
      pageApisRef.current[pageId] = api;
    } else {
      delete pageApisRef.current[pageId];
    }
  }, []);

  const handleCommitPageUpdate = useCallback(
    (pageId, patch) => {
      pushPagesState((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, ...patch } : p))
      );
    },
    [pushPagesState]
  );

  // Active page helpers
  const activePageIndex = Math.max(
    0,
    pagesState.findIndex((p) => p.id === activePageId)
  );
  const activePage = pagesState[activePageIndex] || pagesState[0];

  const scrollToPage = useCallback((pageId) => {
    setActivePageId(pageId);
    const el = document.getElementById(`pdf-page-${pageId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Page management operations
  const handleAddBlankPage = () => {
    const refPage = activePage || { width: 612, height: 792 };
    const newId = `blank-${Date.now()}`;
    const newPage = {
      id: newId,
      isBlank: true,
      sourcePageIndex: -1,
      width: refPage.width || 612,
      height: refPage.height || 792,
      rotationDelta: 0,
      removedTextIds: [],
      removedImageIds: [],
      fabricJson: { version: '5.3.0', objects: [] },
    };
    pushPagesState((prev) => {
      const copy = [...prev];
      copy.splice(activePageIndex + 1, 0, newPage);
      return copy;
    });
    setTimeout(() => scrollToPage(newId), 80);
    onToast('Blank page added', 'success');
  };

  const handleDuplicatePage = (pageId) => {
    const idx = pagesState.findIndex((p) => p.id === pageId);
    if (idx === -1) return;
    const src = pagesState[idx];
    const dupId = `dup-${Date.now()}`;
    const cloned = {
      ...JSON.parse(JSON.stringify(src)),
      id: dupId,
    };
    pushPagesState((prev) => {
      const copy = [...prev];
      copy.splice(idx + 1, 0, cloned);
      return copy;
    });
    setTimeout(() => scrollToPage(dupId), 80);
    onToast('Page duplicated', 'success');
  };

  const handleRotatePage = (pageId) => {
    pushPagesState((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, rotationDelta: ((p.rotationDelta || 0) + 90) % 360 } : p
      )
    );
    onToast('Page rotated 90°', 'info');
  };

  const handleDeletePage = (pageId) => {
    if (pagesState.length <= 1) return;
    const idx = pagesState.findIndex((p) => p.id === pageId);
    const remaining = pagesState.filter((p) => p.id !== pageId);
    pushPagesState(remaining);
    if (activePageId === pageId) {
      const nextActive = remaining[Math.max(0, idx - 1)]?.id;
      setActivePageId(nextActive);
    }
    setSelectedObject(null);
    onToast('Page deleted', 'info');
  };

  const handleMovePage = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= pagesState.length) return;
    pushPagesState((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  // Object actions routed to active Fabric page
  const getSelectedApi = () => {
    const targetPageId = selectedObject?.pageId || activePage?.id;
    return targetPageId ? pageApisRef.current[targetPageId] : null;
  };

  const handleUpdateSelected = (patch) => {
    getSelectedApi()?.updateSelectedObject(patch);
  };

  const handleResetSelectedText = () => {
    getSelectedApi()?.resetSelectedTextToDefault();
    onToast('Text formatting reset to original/default style', 'info');
  };

  const handleReplaceSelectedImage = (dataUrl) => {
    getSelectedApi()?.replaceSelectedImage(dataUrl);
    onToast('Image replaced', 'success');
  };

  const handleDeleteSelected = () => {
    const deleted = getSelectedApi()?.deleteSelectedObject();
    if (deleted) {
      onToast('Object deleted', 'info');
    }
  };

  const handleUploadImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const targetId = activePage?.id;
      if (targetId && pageApisRef.current[targetId]) {
        pageApisRef.current[targetId].insertImage(reader.result);
        setActiveTool('select');
        onToast(`Inserted image "${file.name}"`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInsertSignature = (dataUrl) => {
    const targetId = activePage?.id;
    if (targetId && pageApisRef.current[targetId]) {
      pageApisRef.current[targetId].insertImage(dataUrl, { width: 170 });
      setActiveTool('select');
      onToast('Signature placed on page — drag or resize as needed', 'success');
    }
  };

  const handleFitToScreen = () => {
    const container = canvasContainerRef.current;
    if (!container || !activePage) return;
    const availW = Math.max(320, container.clientWidth - 64);
    const fitted = Math.min(2.2, Math.max(0.45, Number((availW / (activePage.width || 612)).toFixed(2))));
    setZoom(fitted);
  };

  const handleReset = () => {
    const fresh = Array.from({ length: pdfjsDoc.numPages }, (_, idx) => {
      const meta = pageMetadataMap[idx];
      return {
        id: `page-${idx}-${Date.now()}`,
        isBlank: false,
        sourcePageIndex: idx,
        width: meta?.width || 612,
        height: meta?.height || 792,
        rotationDelta: 0,
        removedTextIds: [],
        removedImageIds: [],
        fabricJson: { version: '5.3.0', objects: [] },
      };
    });
    resetHistory(fresh);
    setActivePageId(fresh[0]?.id || null);
    setSelectedObject(null);
    onToast('Document reset to original PDF state', 'info');
  };

  const handleSaveProject = async () => {
    try {
      const savedId = await onSaveToRecent({
        id: docId,
        name: docName,
        pdfBytes,
        pageCount: pagesState.length,
        fileSize: pdfBytes.byteLength,
        projectState: pagesState,
        thumbnailDataUrl: pageThumbnailsMap[0] || null,
      });
      setDocId(savedId);
      onToast('Project saved locally to Recent Documents', 'success');
    } catch (err) {
      console.error(err);
      onToast('Failed to save project locally', 'error');
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const { bytes, stats } = await exportEditedPdf({
        originalPdfBytes: pdfBytes,
        pagesState,
        pageMetadataMap,
      });

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const cleanBase = (docName || 'document').replace(/\.pdf$/i, '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanBase}_edited.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      onToast(
        `Exported PDF (${stats.totalPages} pages, ${stats.streamRemovedText} stream text edits, ${stats.drawnObjects} objects)`,
        'success',
        4500
      );
    } catch (err) {
      console.error('Export failed:', err);
      onToast(`Export error: ${err.message || 'Could not compile PDF'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  useKeyboardShortcuts({
    enabled: !signatureOpen && !shortcutsOpen,
    onSelectTool: (t) => {
      if (t === 'signature') {
        setActiveTool('signature');
        setSignatureOpen(true);
      } else {
        setActiveTool(t);
      }
    },
    onUndo: () => {
      if (canUndo) {
        undo();
        onToast('Undid last change', 'info', 1600);
      }
    },
    onRedo: () => {
      if (canRedo) {
        redo();
        onToast('Redid change', 'info', 1600);
      }
    },
    onDeleteSelected: handleDeleteSelected,
    onZoomIn: () => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2))),
    onZoomOut: () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2))),
    onSaveProject: handleSaveProject,
    onExportPdf: handleExportPdf,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen overflow-hidden flex flex-col bg-[#050711] text-slate-100 relative"
    >
      <ParallaxBackground subtle />

      <TopToolbar
        docName={docName}
        onDocNameChange={setDocName}
        onBackHome={onBackHome}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onReset={handleReset}
        onSaveProject={handleSaveProject}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToScreen={handleFitToScreen}
        currentPageNumber={activePageIndex + 1}
        totalPages={pagesState.length}
        onPrevPage={() => {
          const prev = pagesState[Math.max(0, activePageIndex - 1)];
          if (prev) scrollToPage(prev.id);
        }}
        onNextPage={() => {
          const next = pagesState[Math.min(pagesState.length - 1, activePageIndex + 1)];
          if (next) scrollToPage(next.id);
        }}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <div className="flex-1 min-h-0 flex relative z-10">
        <LeftToolsSidebar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          activeShapeType={activeShapeType}
          onChangeShapeType={setActiveShapeType}
          onUploadImageFile={handleUploadImageFile}
          onOpenSignatureModal={() => setSignatureOpen(true)}
        />

        <PageThumbnails
          pagesState={pagesState}
          activePageId={activePage?.id}
          pageThumbnailsMap={pageThumbnailsMap}
          onSelectPage={scrollToPage}
          onAddBlankPage={handleAddBlankPage}
          onDuplicatePage={handleDuplicatePage}
          onRotatePage={handleRotatePage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
        />

        <PdfCanvasArea
          containerRef={canvasContainerRef}
          pagesState={pagesState}
          pdfjsDoc={pdfjsDoc}
          pdfjsPagesMap={pdfjsPagesMap}
          pageMetadataMap={pageMetadataMap}
          zoom={zoom}
          sharpeningLevel={sharpeningLevel}
          activeTool={activeTool}
          activeShapeType={activeShapeType}
          drawSettings={drawSettings}
          activePageId={activePage?.id}
          onFocusPage={setActivePageId}
          onSelectTool={setActiveTool}
          onCommitPageUpdate={handleCommitPageUpdate}
          onSelectObject={setSelectedObject}
          registerPageApi={registerPageApi}
          onToast={onToast}
        />

        <RightPropertiesPanel
          selectedObject={selectedObject}
          activeTool={activeTool}
          sharpeningLevel={sharpeningLevel}
          onChangeSharpeningLevel={(lvl) => {
            setSharpeningLevel(lvl);
            onToast(`Font sharpening set to ${lvl.toUpperCase()}`, 'info', 1800);
          }}
          drawSettings={drawSettings}
          onChangeDrawSettings={(patch) => setDrawSettings((d) => ({ ...d, ...patch }))}
          onUpdateSelected={handleUpdateSelected}
          onResetSelectedText={handleResetSelectedText}
          onReplaceSelectedImage={handleReplaceSelectedImage}
          onDeleteSelected={handleDeleteSelected}
          onBringForward={() => getSelectedApi()?.bringForward()}
          onSendBackward={() => getSelectedApi()?.sendBackward()}
          activePage={activePage}
          activePageIndex={activePageIndex}
          totalPages={pagesState.length}
          onAddBlankPage={handleAddBlankPage}
          onDuplicatePage={handleDuplicatePage}
          onRotatePage={handleRotatePage}
          onDeletePage={handleDeletePage}
        />
      </div>

      {/* Mobile Floating Controls */}
      <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobilePagesOpen(true)}
          className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full glass-panel border border-cyan-400/40 text-cyan-200 text-xs font-semibold shadow-lg"
        >
          <Layers className="w-3.5 h-3.5" />
          Pages ({pagesState.length})
        </button>

        <button
          type="button"
          onClick={() => setMobilePropsOpen(true)}
          className="md:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-semibold shadow-lg"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Inspector
        </button>
      </div>

      {/* Mobile Pages Drawer */}
      {mobilePagesOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start"
          onClick={() => setMobilePagesOpen(false)}
        >
          <div
            className="w-64 max-w-full h-full bg-[#090d1f] border-r border-white/10 p-3 pt-10 overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMobilePagesOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <PageThumbnails
              inDrawer
              pagesState={pagesState}
              activePageId={activePage?.id}
              pageThumbnailsMap={pageThumbnailsMap}
              onSelectPage={(id) => {
                scrollToPage(id);
                setMobilePagesOpen(false);
              }}
              onAddBlankPage={handleAddBlankPage}
              onDuplicatePage={handleDuplicatePage}
              onRotatePage={handleRotatePage}
              onDeletePage={handleDeletePage}
              onMovePage={handleMovePage}
            />
          </div>
        </div>
      )}

      {/* Mobile Properties Drawer */}
      {mobilePropsOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
          onClick={() => setMobilePropsOpen(false)}
        >
          <div
            className="w-80 max-w-full h-full bg-[#090d1f] border-l border-white/10 p-4 overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMobilePropsOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pt-6">
              <RightPropertiesPanel
                inDrawer
                selectedObject={selectedObject}
                activeTool={activeTool}
                sharpeningLevel={sharpeningLevel}
                onChangeSharpeningLevel={(lvl) => {
                  setSharpeningLevel(lvl);
                  onToast(`Font sharpening set to ${lvl.toUpperCase()}`, 'info', 1800);
                }}
                drawSettings={drawSettings}
                onChangeDrawSettings={(patch) => setDrawSettings((d) => ({ ...d, ...patch }))}
                onUpdateSelected={handleUpdateSelected}
                onResetSelectedText={handleResetSelectedText}
                onReplaceSelectedImage={handleReplaceSelectedImage}
                onDeleteSelected={handleDeleteSelected}
                onBringForward={() => getSelectedApi()?.bringForward()}
                onSendBackward={() => getSelectedApi()?.sendBackward()}
                activePage={activePage}
                activePageIndex={activePageIndex}
                totalPages={pagesState.length}
                onAddBlankPage={handleAddBlankPage}
                onDuplicatePage={handleDuplicatePage}
                onRotatePage={handleRotatePage}
                onDeletePage={handleDeletePage}
              />
            </div>
          </div>
        </div>
      )}

      <SignatureModal
        isOpen={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onInsertSignature={handleInsertSignature}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </motion.div>
  );
}
