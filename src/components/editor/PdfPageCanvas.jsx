import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { AlertTriangle, Move, Trash2 } from 'lucide-react';
import { FONT_OPTIONS } from '../../config/editorConfig';

const CUSTOM_PROPS = [
  'nexFontId',
  'nexFontSubstituted',
  'nexOriginalFont',
  'nexKind',
  'nexShapeType',
  'nexLockAspect',
  'pathOffset',
];

function sampleCanvasBgColor(canvas, left, top, width, height, scale) {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const dpr = canvas.width / (parseFloat(canvas.style.width) || canvas.width || 1);
    const sx = Math.max(1, Math.min(canvas.width - 2, Math.round((left - 2) * scale * dpr)));
    const sy = Math.max(1, Math.min(canvas.height - 2, Math.round((top + height / 2) * scale * dpr)));
    const sx2 = Math.max(1, Math.min(canvas.width - 2, Math.round((left + width + 2) * scale * dpr)));
    const p1 = ctx.getImageData(sx, sy, 1, 1).data;
    const p2 = ctx.getImageData(sx2, sy, 1, 1).data;
    const r = Math.round((p1[0] + p2[0]) / 2);
    const g = Math.round((p1[1] + p2[1]) / 2);
    const b = Math.round((p1[2] + p2[2]) / 2);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#ffffff';
  }
}

export default function PdfPageCanvas({
  pageSpec,
  pageIndex,
  pdfjsPage,
  metadata,
  zoom,
  activeTool,
  activeShapeType,
  drawSettings,
  isActivePage,
  onFocusPage,
  onSelectTool,
  onCommitPageUpdate,
  onSelectObject,
  registerPageApi,
  onToast,
}) {
  const baseCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const fabricElRef = useRef(null);
  const fabricRef = useRef(null);
  const lastJsonRef = useRef('');
  const isInternalSyncRef = useRef(false);
  const toolRef = useRef(activeTool);
  const shapeTypeRef = useRef(activeShapeType);
  const drawSettingsRef = useRef(drawSettings);
  const dragDraftRef = useRef(null);

  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [hoveredImgId, setHoveredImgId] = useState(null);

  toolRef.current = activeTool;
  shapeTypeRef.current = activeShapeType;
  drawSettingsRef.current = drawSettings;

  const isRotated90 = (pageSpec.rotationDelta || 0) % 180 !== 0;
  const pageW = isRotated90
    ? (metadata?.height || pageSpec.height || 792)
    : (metadata?.width || pageSpec.width || 612);
  const pageH = isRotated90
    ? (metadata?.width || pageSpec.width || 612)
    : (metadata?.height || pageSpec.height || 792);

  // Transform text/image hitboxes when page has rotationDelta
  const visualMeta = useMemo(() => {
    if (!metadata) return null;
    if (!pageSpec.rotationDelta || !pdfjsPage) return metadata;

    const effRot = ((pdfjsPage.rotate || 0) + (pageSpec.rotationDelta || 0)) % 360;
    const vp = pdfjsPage.getViewport({ scale: 1, rotation: effRot });

    const textBlocks = (metadata.textBlocks || []).map((b) => {
      const pts = (b.rawItems || []).map((ri) => {
        const p = vp.convertToViewportPoint(ri.pdfX, ri.pdfY);
        return { x: p[0], y: p[1], w: ri.width, h: ri.height, fs: ri.fontSize };
      });
      if (pts.length === 0) return b;
      const first = pts[0];
      return {
        ...b,
        left: first.x,
        top: first.y - (b.fontSize || 12) * 0.88,
      };
    });

    const images = (metadata.images || []).map((img) => {
      const corners = [
        [img.pdfX, img.pdfY],
        [img.pdfX + img.pdfWidth, img.pdfY],
        [img.pdfX, img.pdfY + img.pdfHeight],
        [img.pdfX + img.pdfWidth, img.pdfY + img.pdfHeight],
      ].map(([px, py]) => vp.convertToViewportPoint(px, py));
      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      return {
        ...img,
        left: Math.min(...xs),
        top: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    });

    return { ...metadata, textBlocks, images };
  }, [metadata, pageSpec.rotationDelta, pdfjsPage]);

  const commitFabricChanges = (extraPatch = {}) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const json = fc.toJSON(CUSTOM_PROPS);
    const jsonStr = JSON.stringify(json);
    lastJsonRef.current = jsonStr;
    onCommitPageUpdate(pageSpec.id, {
      fabricJson: json,
      ...extraPatch,
    });
  };

  const notifySelection = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (!obj) {
      onSelectObject(null);
      return;
    }

    const kind =
      obj.nexKind ||
      (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text'
        ? 'text'
        : obj.type === 'image'
        ? 'image'
        : obj.type === 'path'
        ? 'draw'
        : 'shape');

    onSelectObject({
      pageId: pageSpec.id,
      kind,
      type: obj.type,
      shapeType: obj.nexShapeType || obj.type,
      text: obj.text ?? '',
      fontSize: Math.round((obj.fontSize || 16) * (obj.scaleY || 1)),
      nexFontId: obj.nexFontId || 'Helvetica',
      nexFontSubstituted: Boolean(obj.nexFontSubstituted),
      nexOriginalFont: obj.nexOriginalFont || '',
      fontWeight: obj.fontWeight || 'normal',
      fontStyle: obj.fontStyle || 'normal',
      underline: Boolean(obj.underline),
      fill: obj.fill || '#0f172a',
      stroke: obj.stroke || '#38bdf8',
      strokeWidth: obj.strokeWidth ?? 2,
      textAlign: obj.textAlign || 'left',
      lineHeight: obj.lineHeight ?? 1.2,
      charSpacing: obj.charSpacing ?? 0,
      opacity: obj.opacity ?? 1,
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round((obj.width || 100) * (obj.scaleX || 1)),
      height: Math.round((obj.height || 40) * (obj.scaleY || 1)),
      angle: Math.round(obj.angle || 0),
      lockAspect: obj.nexLockAspect !== false,
    });
  };

  // 1. Render base PDF.js page + live removal mask
  useEffect(() => {
    let cancelled = false;
    const baseCanvas = baseCanvasRef.current;
    if (!baseCanvas) return;

    const renderBase = async () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.floor(pageW * zoom);
      const cssH = Math.floor(pageH * zoom);

      if (pageSpec.isBlank || !pdfjsPage) {
        baseCanvas.width = Math.floor(cssW * dpr);
        baseCanvas.height = Math.floor(cssH * dpr);
        baseCanvas.style.width = `${cssW}px`;
        baseCanvas.style.height = `${cssH}px`;
        const ctx = baseCanvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
      } else {
        const effRot = ((pdfjsPage.rotate || 0) + (pageSpec.rotationDelta || 0)) % 360;
        const vp = pdfjsPage.getViewport({ scale: zoom, rotation: effRot });
        const renderVp = pdfjsPage.getViewport({ scale: zoom * dpr, rotation: effRot });

        baseCanvas.width = Math.floor(renderVp.width);
        baseCanvas.height = Math.floor(renderVp.height);
        baseCanvas.style.width = `${Math.floor(vp.width)}px`;
        baseCanvas.style.height = `${Math.floor(vp.height)}px`;

        const ctx = baseCanvas.getContext('2d', { willReadFrequently: true });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        try {
          await pdfjsPage.render({ canvasContext: ctx, viewport: renderVp }).promise;
        } catch (err) {
          if (!cancelled) console.warn('Render interrupted:', err);
        }
      }

      if (cancelled) return;

      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        maskCanvas.width = baseCanvas.width;
        maskCanvas.height = baseCanvas.height;
        maskCanvas.style.width = baseCanvas.style.width;
        maskCanvas.style.height = baseCanvas.style.height;
        const mCtx = maskCanvas.getContext('2d');
        mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

        const removedTxt = new Set(pageSpec.removedTextIds || []);
        const removedImg = new Set(pageSpec.removedImageIds || []);
        const scaleMult = baseCanvas.width / pageW;

        if (visualMeta && removedTxt.size > 0) {
          for (const block of visualMeta.textBlocks || []) {
            if (!removedTxt.has(block.id)) continue;
            const bg =
              block.bgSampleColor ||
              sampleCanvasBgColor(baseCanvas, block.left, block.top, block.width, block.height, zoom);
            block.bgSampleColor = bg;
            mCtx.fillStyle = bg;
            mCtx.fillRect(
              (block.left - 2) * scaleMult,
              (block.top - 2) * scaleMult,
              (block.width + 6) * scaleMult,
              (block.height + 5) * scaleMult
            );
          }
        }

        if (visualMeta && removedImg.size > 0) {
          for (const img of visualMeta.images || []) {
            if (!removedImg.has(img.id)) continue;
            const bg = sampleCanvasBgColor(baseCanvas, img.left, img.top, img.width, img.height, zoom);
            mCtx.fillStyle = bg;
            mCtx.fillRect(
              img.left * scaleMult,
              img.top * scaleMult,
              img.width * scaleMult,
              img.height * scaleMult
            );
          }
        }
      }
    };

    renderBase();
    return () => {
      cancelled = true;
    };
  }, [pdfjsPage, pageSpec.isBlank, pageSpec.rotationDelta, pageSpec.removedTextIds, pageSpec.removedImageIds, zoom, pageW, pageH, visualMeta]);

  // 2. Initialize Fabric.js canvas once per page
  useEffect(() => {
    const el = fabricElRef.current;
    if (!el) return;

    const fc = new fabric.Canvas(el, {
      width: pageW * zoom,
      height: pageH * zoom,
      preserveObjectStacking: true,
      selection: true,
    });
    fc.setZoom(zoom);
    fabricRef.current = fc;

    if (pageSpec.fabricJson) {
      isInternalSyncRef.current = true;
      fc.loadFromJSON(pageSpec.fabricJson, () => {
        fc.renderAll();
        lastJsonRef.current = JSON.stringify(fc.toJSON(CUSTOM_PROPS));
        isInternalSyncRef.current = false;
      });
    }

    const handleSelection = () => {
      onFocusPage(pageSpec.id);
      notifySelection();
    };

    const handleCleared = () => {
      onSelectObject(null);
    };

    const handleModified = () => {
      if (isInternalSyncRef.current) return;
      notifySelection();
      commitFabricChanges();
    };

    const handleTextChanged = () => {
      if (isInternalSyncRef.current) return;
      notifySelection();
      commitFabricChanges();
    };

    const handlePathCreated = () => {
      if (isInternalSyncRef.current) return;
      const objs = fc.getObjects();
      const last = objs[objs.length - 1];
      if (last) {
        last.set({ nexKind: 'draw' });
      }
      commitFabricChanges();
    };

    const createArrowPath = (x1, y1, x2, y2, stroke) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.max(20, Math.hypot(dx, dy));
      const ang = Math.atan2(dy, dx);
      const headLen = Math.min(16, len * 0.3);
      const hx1 = x2 - headLen * Math.cos(ang - Math.PI / 6);
      const hy1 = y2 - headLen * Math.sin(ang - Math.PI / 6);
      const hx2 = x2 - headLen * Math.cos(ang + Math.PI / 6);
      const hy2 = y2 - headLen * Math.sin(ang + Math.PI / 6);
      const d = `M ${x1} ${y1} L ${x2} ${y2} M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`;
      return new fabric.Path(d, {
        stroke,
        strokeWidth: 2.5,
        fill: 'transparent',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        nexKind: 'shape',
        nexShapeType: 'arrow',
        borderColor: '#22d3ee',
        cornerColor: '#8b5cf6',
        cornerStyle: 'circle',
        transparentCorners: false,
      });
    };

    const handleMouseDown = (opt) => {
      onFocusPage(pageSpec.id);
      const t = toolRef.current;
      const pointer = fc.getPointer(opt.e);

      if (t === 'eraser' || t === 'deleteObject') {
        if (opt.target) {
          fc.remove(opt.target);
          fc.discardActiveObject();
          fc.renderAll();
          onSelectObject(null);
          commitFabricChanges();
          return;
        }
      }

      if (opt.target) return;

      if (t === 'addText') {
        const tb = new fabric.Textbox('Type text here', {
          left: pointer.x,
          top: pointer.y - 10,
          width: 210,
          fontSize: 16,
          fill: '#0f172a',
          fontFamily: FONT_OPTIONS[0].cssFamily,
          nexFontId: 'Helvetica',
          nexKind: 'text',
          lineHeight: 1.2,
          charSpacing: 0,
          borderColor: '#22d3ee',
          cornerColor: '#8b5cf6',
          cornerStyle: 'circle',
          transparentCorners: false,
        });
        fc.add(tb);
        fc.setActiveObject(tb);
        tb.enterEditing();
        tb.selectAll();
        fc.renderAll();
        notifySelection();
        commitFabricChanges();
        onSelectTool?.('select');
        return;
      }

      // Drag-to-draw start for highlight, underline, and shapes
      if (t === 'highlight' || t === 'underline' || t === 'shapes') {
        fc.selection = false;
        const st = shapeTypeRef.current;
        const stroke = drawSettingsRef.current.color || '#3b82f6';
        let previewObj;

        if (t === 'highlight') {
          previewObj = new fabric.Rect({
            left: pointer.x,
            top: pointer.y - 8,
            width: 1,
            height: 20,
            fill: drawSettingsRef.current.highlightColor || '#facc15',
            opacity: 0.38,
            strokeWidth: 0,
            nexKind: 'highlight',
            nexShapeType: 'rect',
            borderColor: '#22d3ee',
            cornerColor: '#8b5cf6',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        } else if (t === 'underline') {
          previewObj = new fabric.Line([pointer.x, pointer.y, pointer.x + 1, pointer.y], {
            stroke: drawSettingsRef.current.color || '#ef4444',
            strokeWidth: 2.5,
            nexKind: 'underline',
            nexShapeType: 'line',
            borderColor: '#22d3ee',
            cornerColor: '#8b5cf6',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        } else if (st === 'line') {
          previewObj = new fabric.Line([pointer.x, pointer.y, pointer.x + 1, pointer.y], {
            stroke,
            strokeWidth: 2.5,
            nexKind: 'shape',
            nexShapeType: 'line',
            borderColor: '#22d3ee',
            cornerColor: '#8b5cf6',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        } else if (st === 'arrow') {
          previewObj = createArrowPath(pointer.x, pointer.y, pointer.x + 2, pointer.y, stroke);
        } else if (st === 'circle') {
          previewObj = new fabric.Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 1,
            ry: 1,
            stroke,
            strokeWidth: 2.5,
            fill: 'transparent',
            nexKind: 'shape',
            nexShapeType: 'circle',
            borderColor: '#22d3ee',
            cornerColor: '#8b5cf6',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        } else if (st === 'triangle') {
          previewObj = new fabric.Triangle({
            left: pointer.x,
            top: pointer.y,
            width: 2,
            height: 2,
            stroke,
            strokeWidth: 2.5,
            fill: 'transparent',
            nexKind: 'shape',
            nexShapeType: 'triangle',
            borderColor: '#22d3ee',
            cornerColor: '#8b5cf6',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        } else {
          previewObj = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 2,
            height: 2,
            rx: st === 'roundedRect' ? 14 : 0,
            ry: st === 'roundedRect' ? 14 : 0,
            stroke,
            strokeWidth: 2.5,
            fill: 'transparent',
            nexKind: 'shape',
            nexShapeType: st,
            borderColor: '#22d3ee',
            cornerColor: '#8b5cf6',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        }

        fc.add(previewObj);
        dragDraftRef.current = {
          tool: t,
          shapeType: st,
          startX: pointer.x,
          startY: pointer.y,
          obj: previewObj,
          stroke,
        };
      }
    };

    const handleMouseMove = (opt) => {
      const draft = dragDraftRef.current;
      if (!draft) return;
      const p = fc.getPointer(opt.e);
      const { tool, shapeType, startX, startY, obj, stroke } = draft;
      const minX = Math.min(startX, p.x);
      const minY = Math.min(startY, p.y);
      const w = Math.abs(p.x - startX);
      const h = Math.abs(p.y - startY);

      if (tool === 'highlight') {
        obj.set({ left: minX, top: minY, width: Math.max(6, w), height: Math.max(14, h) });
      } else if (tool === 'underline' || (tool === 'shapes' && shapeType === 'line')) {
        obj.set({ x1: startX, y1: startY, x2: p.x, y2: tool === 'underline' ? startY : p.y });
      } else if (tool === 'shapes' && shapeType === 'arrow') {
        fc.remove(obj);
        const nextArrow = createArrowPath(startX, startY, p.x, p.y, stroke);
        fc.add(nextArrow);
        draft.obj = nextArrow;
      } else if (tool === 'shapes' && shapeType === 'circle') {
        obj.set({ left: minX, top: minY, rx: Math.max(4, w / 2), ry: Math.max(4, h / 2) });
      } else {
        obj.set({ left: minX, top: minY, width: Math.max(4, w), height: Math.max(4, h) });
      }
      fc.renderAll();
    };

    const handleMouseUp = (opt) => {
      const draft = dragDraftRef.current;
      if (!draft) return;
      dragDraftRef.current = null;
      const p = fc.getPointer(opt.e);
      const dist = Math.hypot(p.x - draft.startX, p.y - draft.startY);
      let finalObj = draft.obj;

      // Single click fallback -> give a crisp default size
      if (dist < 6) {
        if (draft.tool === 'highlight') {
          finalObj.set({ left: draft.startX, top: draft.startY - 8, width: 150, height: 20 });
        } else if (draft.tool === 'underline') {
          finalObj.set({ x1: draft.startX, y1: draft.startY, x2: draft.startX + 160, y2: draft.startY });
        } else if (draft.shapeType === 'line') {
          finalObj.set({ x1: draft.startX, y1: draft.startY, x2: draft.startX + 140, y2: draft.startY });
        } else if (draft.shapeType === 'arrow') {
          fc.remove(finalObj);
          finalObj = createArrowPath(draft.startX, draft.startY, draft.startX + 130, draft.startY, draft.stroke);
          fc.add(finalObj);
        } else if (draft.shapeType === 'circle') {
          finalObj.set({ left: draft.startX, top: draft.startY, rx: 50, ry: 50 });
        } else if (draft.shapeType === 'triangle') {
          finalObj.set({ left: draft.startX, top: draft.startY, width: 100, height: 90 });
        } else {
          finalObj.set({ left: draft.startX, top: draft.startY, width: 130, height: 80 });
        }
      }

      finalObj.setCoords();
      fc.setActiveObject(finalObj);
      fc.selection = true;
      fc.renderAll();
      notifySelection();
      commitFabricChanges();
      if (draft.tool === 'shapes') {
        onSelectTool?.('select');
      }
    };

    fc.on('selection:created', handleSelection);
    fc.on('selection:updated', handleSelection);
    fc.on('selection:cleared', handleCleared);
    fc.on('object:modified', handleModified);
    fc.on('text:changed', handleTextChanged);
    fc.on('path:created', handlePathCreated);
    fc.on('mouse:down', handleMouseDown);
    fc.on('mouse:move', handleMouseMove);
    fc.on('mouse:up', handleMouseUp);

    registerPageApi(pageSpec.id, {
      insertImage: (dataUrl, opts = {}) => {
        fabric.Image.fromURL(
          dataUrl,
          (img) => {
            const maxW = opts.width || Math.min(240, pageW * 0.55);
            const natW = img.width || maxW;
            const natH = img.height || maxW;
            const scale = opts.width ? opts.width / natW : maxW / natW;
            const scaleY = opts.height ? opts.height / natH : scale;

            img.set({
              left: opts.left ?? (pageW - natW * scale) / 2,
              top: opts.top ?? (pageH - natH * scaleY) / 2,
              scaleX: scale,
              scaleY,
              nexKind: 'image',
              nexLockAspect: true,
              borderColor: '#22d3ee',
              cornerColor: '#8b5cf6',
              cornerStyle: 'circle',
              transparentCorners: false,
            });
            fc.add(img);
            fc.setActiveObject(img);
            fc.renderAll();
            notifySelection();
            commitFabricChanges(opts.extraPatch || {});
          },
          { crossOrigin: 'anonymous' }
        );
      },
      replaceSelectedImage: (dataUrl) => {
        const obj = fc.getActiveObject();
        if (!obj || obj.type !== 'image') return;
        const curW = (obj.width || 100) * (obj.scaleX || 1);
        const curH = (obj.height || 100) * (obj.scaleY || 1);
        obj.setSrc(
          dataUrl,
          () => {
            obj.set({
              scaleX: curW / (obj.width || curW),
              scaleY: curH / (obj.height || curH),
            });
            fc.renderAll();
            notifySelection();
            commitFabricChanges();
          },
          { crossOrigin: 'anonymous' }
        );
      },
      updateSelectedObject: (patch) => {
        const obj = fc.getActiveObject();
        if (!obj) return;

        if (patch.fontFamilyId) {
          const fOpt = FONT_OPTIONS.find((f) => f.id === patch.fontFamilyId) || FONT_OPTIONS[0];
          obj.set({ fontFamily: fOpt.cssFamily, nexFontId: fOpt.id });
          delete patch.fontFamilyId;
        }
        if (typeof patch.targetWidth === 'number') {
          obj.set({ scaleX: Math.max(8, patch.targetWidth) / (obj.width || 100) });
          delete patch.targetWidth;
        }
        if (typeof patch.targetHeight === 'number') {
          obj.set({ scaleY: Math.max(8, patch.targetHeight) / (obj.height || 100) });
          delete patch.targetHeight;
        }
        if (typeof patch.fontSize === 'number' && (obj.type === 'textbox' || obj.type === 'i-text')) {
          obj.set({ fontSize: patch.fontSize, scaleX: 1, scaleY: 1 });
          delete patch.fontSize;
        }
        if (typeof patch.lockAspect === 'boolean') {
          obj.set({ lockUniScaling: patch.lockAspect, nexLockAspect: patch.lockAspect });
          delete patch.lockAspect;
        }

        obj.set(patch);
        obj.setCoords();
        fc.renderAll();
        notifySelection();
        commitFabricChanges();
      },
      deleteSelectedObject: () => {
        const active = fc.getActiveObjects();
        if (!active || active.length === 0) return false;
        active.forEach((o) => fc.remove(o));
        fc.discardActiveObject();
        fc.renderAll();
        onSelectObject(null);
        commitFabricChanges();
        return true;
      },
      bringForward: () => {
        const obj = fc.getActiveObject();
        if (!obj) return;
        fc.bringForward(obj);
        fc.renderAll();
        commitFabricChanges();
      },
      sendBackward: () => {
        const obj = fc.getActiveObject();
        if (!obj) return;
        fc.sendBackwards(obj);
        fc.renderAll();
        commitFabricChanges();
      },
      clearSelection: () => {
        fc.discardActiveObject();
        fc.renderAll();
      },
    });

    return () => {
      registerPageApi(pageSpec.id, null);
      fc.dispose();
      fabricRef.current = null;
    };
  }, [pageSpec.id]);

  // 3. Keep Fabric zoom & dimensions synced
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.setDimensions({ width: Math.floor(pageW * zoom), height: Math.floor(pageH * zoom) });
    fc.setZoom(zoom);
    fc.renderAll();
  }, [zoom, pageW, pageH]);

  // 4. Sync Drawing mode & tool interactivity
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    if (activeTool === 'draw') {
      fc.isDrawingMode = true;
      const brush = new fabric.PencilBrush(fc);
      brush.color = drawSettings.color || '#38bdf8';
      brush.width = drawSettings.strokeWidth || 2.5;
      fc.freeDrawingBrush = brush;
      fc.discardActiveObject();
      fc.renderAll();
    } else {
      fc.isDrawingMode = false;
    }

    fc.selection = activeTool === 'select';
  }, [activeTool, drawSettings]);

  // 5. Apply Undo/Redo/Reset JSON changes from parent state
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const incomingStr = JSON.stringify(pageSpec.fabricJson || { version: '5.3.0', objects: [] });
    if (incomingStr === lastJsonRef.current) return;

    isInternalSyncRef.current = true;
    fc.loadFromJSON(pageSpec.fabricJson || { version: '5.3.0', objects: [] }, () => {
      fc.renderAll();
      lastJsonRef.current = incomingStr;
      isInternalSyncRef.current = false;
    });
  }, [pageSpec.fabricJson]);

  const handleEditExistingText = (block) => {
    const fc = fabricRef.current;
    const baseCanvas = baseCanvasRef.current;
    if (!fc) return;

    if (activeTool === 'deleteObject' || activeTool === 'eraser') {
      if (baseCanvas) {
        block.bgSampleColor = sampleCanvasBgColor(
          baseCanvas,
          block.left,
          block.top,
          block.width,
          block.height,
          zoom
        );
      }
      onCommitPageUpdate(pageSpec.id, {
        removedTextIds: [...(pageSpec.removedTextIds || []), block.id],
      });
      onToast('Original PDF text marked for stream removal', 'info');
      return;
    }

    if (activeTool !== 'editText' && activeTool !== 'select') return;

    if (baseCanvas) {
      block.bgSampleColor = sampleCanvasBgColor(
        baseCanvas,
        block.left,
        block.top,
        block.width,
        block.height,
        zoom
      );
    }

    const fontOpt = FONT_OPTIONS.find((f) => f.id === block.fontInfo.mappedFamily) || FONT_OPTIONS[0];
    const tb = new fabric.Textbox(block.text, {
      left: block.left,
      top: block.top,
      width: Math.max(block.width + 24, 90),
      fontSize: block.fontSize || 12,
      fontFamily: fontOpt.cssFamily,
      fontWeight: block.fontInfo.isBold ? 'bold' : 'normal',
      fontStyle: block.fontInfo.isItalic ? 'italic' : 'normal',
      fill: '#0f172a',
      nexFontId: fontOpt.id,
      nexFontSubstituted: block.fontInfo.isEmbeddedSubset,
      nexOriginalFont: block.fontInfo.rawFontName,
      nexKind: 'text',
      lineHeight: 1.18,
      charSpacing: 0,
      borderColor: '#22d3ee',
      cornerColor: '#8b5cf6',
      cornerStyle: 'circle',
      transparentCorners: false,
    });

    fc.add(tb);
    fc.setActiveObject(tb);
    tb.enterEditing();
    fc.renderAll();

    const json = fc.toJSON(CUSTOM_PROPS);
    lastJsonRef.current = JSON.stringify(json);
    onCommitPageUpdate(pageSpec.id, {
      removedTextIds: [...(pageSpec.removedTextIds || []), block.id],
      fabricJson: json,
    });
    notifySelection();
    onSelectTool?.('select');

    if (block.fontInfo.isEmbeddedSubset) {
      onToast(
        `Embedded font (${block.fontInfo.rawFontName}) detected — using ${fontOpt.id} substitution on export`,
        'warning',
        4200
      );
    }
  };

  const handleExistingImageAction = (img, mode = 'lift') => {
    const fc = fabricRef.current;
    if (!fc) return;

    if (mode === 'delete' || activeTool === 'deleteObject' || activeTool === 'eraser') {
      onCommitPageUpdate(pageSpec.id, {
        removedImageIds: [...(pageSpec.removedImageIds || []), img.id],
      });
      onToast('Embedded PDF image removed from page', 'info');
      return;
    }

    if (!img.dataUrl) {
      onToast('This image stream could not be decoded for lifting; you can delete or overlay it.', 'warning');
      return;
    }

    fabric.Image.fromURL(
      img.dataUrl,
      (fImg) => {
        fImg.set({
          left: img.left,
          top: img.top,
          scaleX: img.width / (fImg.width || img.width),
          scaleY: img.height / (fImg.height || img.height),
          nexKind: 'image',
          nexLockAspect: true,
          borderColor: '#22d3ee',
          cornerColor: '#8b5cf6',
          cornerStyle: 'circle',
          transparentCorners: false,
        });
        fc.add(fImg);
        fc.setActiveObject(fImg);
        fc.renderAll();

        const json = fc.toJSON(CUSTOM_PROPS);
        lastJsonRef.current = JSON.stringify(json);
        onCommitPageUpdate(pageSpec.id, {
          removedImageIds: [...(pageSpec.removedImageIds || []), img.id],
          fabricJson: json,
        });
        notifySelection();
        onToast('PDF image unlocked for moving, resizing & rotation', 'success');
      },
      { crossOrigin: 'anonymous' }
    );
  };

  const removedTxtSet = new Set(pageSpec.removedTextIds || []);
  const removedImgSet = new Set(pageSpec.removedImageIds || []);
  const showTextHitboxes =
    !pageSpec.isBlank &&
    (activeTool === 'editText' || activeTool === 'deleteObject' || activeTool === 'eraser');
  const showImageHitboxes =
    !pageSpec.isBlank &&
    (activeTool === 'select' || activeTool === 'deleteObject' || activeTool === 'eraser');

  return (
    <div
      id={`pdf-page-${pageSpec.id}`}
      data-page-id={pageSpec.id}
      onMouseDown={() => onFocusPage(pageSpec.id)}
      className={`relative mx-auto transition-shadow duration-200 rounded-sm overflow-visible ${
        isActivePage
          ? 'ring-2 ring-cyan-400/70 shadow-[0_20px_60px_rgba(0,0,0,0.75)]'
          : 'ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        width: `${Math.floor(pageW * zoom)}px`,
        height: `${Math.floor(pageH * zoom)}px`,
      }}
    >
      <div className="absolute -top-6 left-0 text-[11px] font-mono text-slate-400 flex items-center gap-2">
        <span>Page {pageIndex + 1}</span>
        {pageSpec.isBlank && <span className="text-violet-300">(Blank)</span>}
      </div>

      <div
        className={`pdf-interactive-surface tool-${activeTool} relative w-full h-full bg-white overflow-hidden`}
      >
        <canvas ref={baseCanvasRef} className="block pointer-events-none select-none" />
        <canvas ref={maskCanvasRef} className="absolute inset-0 pointer-events-none select-none" />

        <div className="absolute inset-0 z-10">
          <canvas ref={fabricElRef} />
        </div>

        {showTextHitboxes && visualMeta?.textBlocks && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            {visualMeta.textBlocks
              .filter((b) => !removedTxtSet.has(b.id))
              .map((block) => {
                const isHover = hoveredBlockId === block.id;
                const isDel = activeTool === 'deleteObject' || activeTool === 'eraser';
                return (
                  <button
                    key={block.id}
                    type="button"
                    onMouseEnter={() => setHoveredBlockId(block.id)}
                    onMouseLeave={() => setHoveredBlockId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditExistingText(block);
                    }}
                    title={
                      isDel
                        ? 'Click to delete original PDF text'
                        : `Click to edit: "${block.text}"`
                    }
                    style={{
                      left: `${block.left * zoom - 2}px`,
                      top: `${block.top * zoom - 2}px`,
                      width: `${Math.max(12, block.width * zoom + 4)}px`,
                      height: `${Math.max(10, block.height * zoom + 4)}px`,
                    }}
                    className={`pointer-events-auto absolute rounded-sm transition-all text-left ${
                      isHover
                        ? isDel
                          ? 'bg-rose-500/20 border border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                          : 'bg-cyan-400/15 border border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                        : 'border border-dashed border-violet-400/35 hover:border-cyan-400'
                    }`}
                  >
                    {isHover && block.fontInfo?.isEmbeddedSubset && !isDel && (
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-bold whitespace-nowrap flex items-center gap-1 shadow">
                        <AlertTriangle className="w-2.5 h-2.5" /> Embedded Font
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}

        {showImageHitboxes && visualMeta?.images && visualMeta.images.length > 0 && (
          <div className="absolute inset-0 z-[15] pointer-events-none">
            {visualMeta.images
              .filter((img) => !removedImgSet.has(img.id))
              .map((img) => {
                const isHover = hoveredImgId === img.id;
                const isDel = activeTool === 'deleteObject' || activeTool === 'eraser';
                return (
                  <div
                    key={img.id}
                    onMouseEnter={() => setHoveredImgId(img.id)}
                    onMouseLeave={() => setHoveredImgId(null)}
                    style={{
                      left: `${img.left * zoom}px`,
                      top: `${img.top * zoom}px`,
                      width: `${img.width * zoom}px`,
                      height: `${img.height * zoom}px`,
                    }}
                    className={`absolute transition-all ${
                      isHover
                        ? isDel
                          ? 'border-2 border-rose-400 bg-rose-500/15'
                          : 'border-2 border-dashed border-cyan-400 bg-cyan-400/10'
                        : 'border border-dashed border-transparent'
                    }`}
                  >
                    <div className="pointer-events-auto absolute top-1.5 right-1.5 flex items-center gap-1">
                      {!isDel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExistingImageAction(img, 'lift');
                          }}
                          title="Unlock embedded PDF image to move, resize, or rotate"
                          className="px-2 py-1 rounded-md bg-slate-950/85 hover:bg-cyan-500 text-white text-[10px] font-semibold flex items-center gap-1 shadow border border-cyan-400/40 transition-colors"
                        >
                          <Move className="w-2.5 h-2.5" /> Edit Image
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExistingImageAction(img, 'delete');
                        }}
                        title="Remove embedded PDF image"
                        className="p-1 rounded-md bg-slate-950/85 hover:bg-rose-500 text-rose-300 hover:text-white shadow border border-rose-400/40 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
