import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { AlertTriangle, Move, Trash2 } from 'lucide-react';
import {
  DEFAULT_TEXT_STYLE,
  SHARPENING_PRESETS,
  resolveFontOption,
} from '../../config/editorConfig';
import { analyzeTextErrors } from '../../utils/textChecker';
import {
  applyCaseTransform,
  findNearestAboveLineStart,
  spliceFabricTextPreservingStyles,
} from '../../utils/textFormatting';

const CUSTOM_PROPS = [
  'nexFontId',
  'nexFontSubstituted',
  'nexOriginalFont',
  'nexOriginalFormat',
  'nexIgnoredErrors',
  'nexHighlightApplied',
  'nexKind',
  'nexShapeType',
  'nexLockAspect',
  'pathOffset',
  'objectCaching',
];

function rgbToHex(r, g, b) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function sampleCanvasBgAndFgColor(canvas, left, top, width, height, scale) {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const cssW = parseFloat(canvas.style.width) || canvas.width || 1;
    const dpr = canvas.width / cssW;
    const mult = scale * dpr;

    const sx = Math.max(1, Math.min(canvas.width - 2, Math.round((left - 2) * mult)));
    const syTop = Math.max(1, Math.min(canvas.height - 2, Math.round((top - 2) * mult)));
    const syBot = Math.max(1, Math.min(canvas.height - 2, Math.round((top + height + 2) * mult)));
    const sx2 = Math.max(1, Math.min(canvas.width - 2, Math.round((left + width + 2) * mult)));

    const samples = [
      ctx.getImageData(sx, syTop, 1, 1).data,
      ctx.getImageData(sx2, syTop, 1, 1).data,
      ctx.getImageData(sx, syBot, 1, 1).data,
      ctx.getImageData(sx2, syBot, 1, 1).data,
    ];
    // Prefer neutral near-white paper corner if present so adjacent yellow/colored borders never tint bgColor
    const whiteCorner = samples.find((s) => s[0] >= 240 && s[1] >= 240 && s[2] >= 240);
    const median = (idx) => samples.map((s) => s[idx]).sort((a, b) => a - b)[1];
    const bgR = whiteCorner ? whiteCorner[0] : median(0);
    const bgG = whiteCorner ? whiteCorner[1] : median(1);
    const bgB = whiteCorner ? whiteCorner[2] : median(2);
    const bgColor = rgbToHex(bgR, bgG, bgB);

    const xStart = Math.max(0, Math.floor(left * mult));
    const yStart = Math.max(0, Math.floor(top * mult));
    const xEnd = Math.min(canvas.width - 1, Math.ceil((left + Math.min(width, 160)) * mult));
    const yEnd = Math.min(canvas.height - 1, Math.ceil((top + height) * mult));
    const sampleW = Math.max(1, xEnd - xStart);
    const sampleH = Math.max(1, yEnd - yStart);
    const imgData = ctx.getImageData(xStart, yStart, sampleW, sampleH).data;

    let bestDist = 0;
    let fgR = 15;
    let fgG = 23;
    let fgB = 42;
    const step = Math.max(1, Math.floor((sampleW * sampleH) / 600));

    for (let idx = 0; idx < sampleW * sampleH; idx += step) {
      const i = idx * 4;
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
      if (dist > bestDist) {
        bestDist = dist;
        fgR = r;
        fgG = g;
        fgB = b;
      }
    }

    const fgColor = bestDist > 26 ? rgbToHex(fgR, fgG, fgB) : '#0f172a';
    return { bgColor, fgColor };
  } catch {
    return { bgColor: '#ffffff', fgColor: '#0f172a' };
  }
}

function drawErrorUnderlinesForCanvas(fc) {
  const ctx = fc.contextContainer;
  if (!ctx) return;
  const retina = fc.getRetinaScaling ? fc.getRetinaScaling() : 1;
  const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0];

  for (const obj of fc.getObjects()) {
    if (obj.type !== 'textbox' && obj.type !== 'i-text' && obj.type !== 'text') continue;
    if (!obj.text || !obj._textLines || !obj.__charBounds) continue;

    const issues = analyzeTextErrors(obj.text, obj.nexIgnoredErrors || []);
    if (issues.length === 0) continue;

    const objMatrix = obj.calcTransformMatrix();
    const m = fabric.util.multiplyTransformMatrices(vpt, objMatrix);
    const leftBase = obj._getLeftOffset();
    const topBase = obj._getTopOffset();

    // Precompute cumulative line Y offsets
    const lineY = [];
    let accY = 0;
    for (let li = 0; li < obj._textLines.length; li++) {
      const h = obj.getHeightOfLine(li);
      const maxH = h / (obj.lineHeight || 1.16);
      lineY.push(topBase + accY + maxH * 0.94);
      accY += h;
    }

    ctx.save();
    ctx.setTransform(retina, 0, 0, retina, 0, 0);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.35;

    for (const issue of issues) {
      const startLoc = obj.get2DCursorLocation(issue.start, false);
      const endLoc = obj.get2DCursorLocation(Math.max(issue.start, issue.end - 1), false);

      for (let li = startLoc.lineIndex; li <= endLoc.lineIndex; li++) {
        const boundsArr = obj.__charBounds[li];
        const lineChars = obj._textLines[li];
        if (!boundsArr || !lineChars || lineChars.length === 0) continue;

        const cStart = li === startLoc.lineIndex ? startLoc.charIndex : 0;
        const cEnd = li === endLoc.lineIndex ? Math.min(endLoc.charIndex, boundsArr.length - 1) : boundsArr.length - 1;
        const firstBox = boundsArr[cStart];
        const lastBox = boundsArr[cEnd];
        if (!firstBox || !lastBox) continue;

        const lineLeftOff = obj._getLineLeftOffset(li);
        const x1Local = leftBase + lineLeftOff + firstBox.left;
        const x2Local = leftBase + lineLeftOff + lastBox.left + (lastBox.width || 4);
        const yLocal = lineY[li];

        const p1 = fabric.util.transformPoint(new fabric.Point(x1Local, yLocal), m);
        const p2 = fabric.util.transformPoint(new fabric.Point(x2Local, yLocal), m);

        // Draw crisp red wavy underline along [p1 -> p2]
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 2) continue;

        const ux = dx / dist;
        const uy = dy / dist;
        const nx = -uy;
        const ny = ux;
        const step = 3.5;
        const amp = 1.35;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        let dir = 1;
        for (let d = step; d <= dist; d += step) {
          const px = p1.x + ux * d + nx * amp * dir;
          const py = p1.y + uy * d + ny * amp * dir;
          ctx.lineTo(px, py);
          dir *= -1;
        }
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

export default function PdfPageCanvas({
  pageSpec,
  pageIndex,
  pdfjsPage,
  metadata,
  zoom,
  sharpeningLevel = 'ultra',
  activeTool,
  activeShapeType,
  drawSettings,
  isActivePage,
  onFocusPage,
  onSelectTool,
  onCommitPageUpdate,
  onSelectObject,
  onClickTextError,
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
  const sharpRef = useRef(sharpeningLevel);
  const dragDraftRef = useRef(null);
  const visualMetaRef = useRef(null);
  const removedTextIdsRef = useRef(pageSpec.removedTextIds || []);

  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [hoveredImgId, setHoveredImgId] = useState(null);

  toolRef.current = activeTool;
  shapeTypeRef.current = activeShapeType;
  drawSettingsRef.current = drawSettings;
  sharpRef.current = sharpeningLevel;

  const sharpPreset = useMemo(
    () => SHARPENING_PRESETS.find((s) => s.id === sharpeningLevel) || SHARPENING_PRESETS[2],
    [sharpeningLevel]
  );

  const isRotated90 = (pageSpec.rotationDelta || 0) % 180 !== 0;
  const pageW = isRotated90
    ? (metadata?.height || pageSpec.height || 792)
    : (metadata?.width || pageSpec.width || 612);
  const pageH = isRotated90
    ? (metadata?.width || pageSpec.width || 612)
    : (metadata?.height || pageSpec.height || 792);

  const visualMeta = useMemo(() => {
    if (!metadata) return null;
    if (!pageSpec.rotationDelta || !pdfjsPage) return metadata;

    const effRot = ((pdfjsPage.rotate || 0) + (pageSpec.rotationDelta || 0)) % 360;
    const vp = pdfjsPage.getViewport({ scale: 1, rotation: effRot });

    const textBlocks = (metadata.textBlocks || []).map((b) => {
      const pts = (b.rawItems || []).map((ri) => {
        const p = vp.convertToViewportPoint(ri.pdfX, ri.pdfY);
        return { x: p[0], y: p[1] };
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

  visualMetaRef.current = visualMeta;
  removedTextIdsRef.current = pageSpec.removedTextIds || [];

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

  const applySharpeningToCanvas = (fc, preset) => {
    if (!fc) return;
    const targetDpr = Math.min(3, Math.max(window.devicePixelRatio || 1, preset.scale));
    fabric.devicePixelRatio = targetDpr;
    fc.enableRetinaScaling = true;
    fc.setDimensions({ width: Math.floor(pageW * zoom), height: Math.floor(pageH * zoom) });
    fc.setZoom(zoom);

    if (fc.contextContainer) {
      fc.contextContainer.imageSmoothingEnabled = true;
      fc.contextContainer.imageSmoothingQuality = 'high';
      try {
        fc.contextContainer.textRendering = 'geometricPrecision';
      } catch {
        // ignore unsupported browsers
      }
    }

    fc.getObjects().forEach((obj) => {
      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
        obj.set({
          objectCaching: !preset.disableCache,
          noScaleCache: preset.disableCache,
          dirty: true,
        });
      }
    });
    fc.renderAll();
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

    const normalizedWeight =
      obj.fontWeight === 'bold'
        ? '700'
        : obj.fontWeight === 'normal' || !obj.fontWeight
        ? '400'
        : String(obj.fontWeight);

    const selStart = obj.isEditing ? (obj.selectionStart ?? 0) : (obj.nexSavedSelection?.start ?? 0);
    const selEnd = obj.isEditing ? (obj.selectionEnd ?? 0) : (obj.nexSavedSelection?.end ?? 0);
    let activeSelectionStyle = null;
    if (kind === 'text' && selEnd > selStart && obj.getSelectionStyles) {
      const stylesArr = obj.getSelectionStyles(selStart, selStart + 1);
      if (stylesArr?.[0]) activeSelectionStyle = stylesArr[0];
    }

    const textIssues =
      kind === 'text' ? analyzeTextErrors(obj.text || '', obj.nexIgnoredErrors || []) : [];

    onSelectObject({
      pageId: pageSpec.id,
      kind,
      type: obj.type,
      shapeType: obj.nexShapeType || obj.type,
      text: obj.text ?? '',
      selectionStart: selStart,
      selectionEnd: selEnd,
      activeSelectionStyle,
      textIssues,
      fontSize: Math.round((obj.fontSize || 16) * (obj.scaleY || 1)),
      nexFontId: obj.nexFontId || 'Helvetica',
      nexFontSubstituted: Boolean(obj.nexFontSubstituted),
      nexOriginalFont: obj.nexOriginalFont || '',
      hasOriginalFormat: Boolean(obj.nexOriginalFormat),
      fontWeight: normalizedWeight,
      fontStyle: obj.fontStyle || 'normal',
      underline: Boolean(obj.underline),
      fill: obj.fill || '#0f172a',
      textBackgroundColor: obj.textBackgroundColor || '',
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
      const dpr = Math.min(3, Math.max(window.devicePixelRatio || 1, sharpPreset.scale));
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
            const sampled = block.bgSampleColor
              ? { bgColor: block.bgSampleColor }
              : sampleCanvasBgAndFgColor(
                  baseCanvas,
                  block.left,
                  block.top,
                  block.width,
                  block.height,
                  zoom
                );
            block.bgSampleColor = sampled.bgColor;
            mCtx.fillStyle = sampled.bgColor;
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
            const { bgColor } = sampleCanvasBgAndFgColor(
              baseCanvas,
              img.left,
              img.top,
              img.width,
              img.height,
              zoom
            );
            mCtx.fillStyle = bgColor;
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
  }, [
    pdfjsPage,
    pageSpec.isBlank,
    pageSpec.rotationDelta,
    pageSpec.removedTextIds,
    pageSpec.removedImageIds,
    zoom,
    pageW,
    pageH,
    visualMeta,
    sharpPreset,
  ]);

  // 2. Initialize Fabric.js canvas once per page
  useEffect(() => {
    const el = fabricElRef.current;
    if (!el) return;

    const initPreset =
      SHARPENING_PRESETS.find((s) => s.id === sharpRef.current) || SHARPENING_PRESETS[2];
    fabric.devicePixelRatio = Math.min(3, Math.max(window.devicePixelRatio || 1, initPreset.scale));

    const fc = new fabric.Canvas(el, {
      width: pageW * zoom,
      height: pageH * zoom,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      selection: true,
    });
    fc.setZoom(zoom);
    fabricRef.current = fc;
    applySharpeningToCanvas(fc, initPreset);

    if (pageSpec.fabricJson) {
      isInternalSyncRef.current = true;
      fc.loadFromJSON(pageSpec.fabricJson, () => {
        applySharpeningToCanvas(fc, initPreset);
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

    const handleTextSelectionChanged = () => {
      notifySelection();
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

      // Detect click on a red-underlined spelling/grammar error inside a Textbox
      if (opt.target && (opt.target.type === 'textbox' || opt.target.type === 'i-text')) {
        const tb = opt.target;
        try {
          if (typeof tb.getSelectionStartFromPointer === 'function') {
            const charIdx = tb.getSelectionStartFromPointer(opt.e);
            const issues = analyzeTextErrors(tb.text || '', tb.nexIgnoredErrors || []);
            const hitIssue = issues.find((iss) => charIdx >= iss.start && charIdx <= iss.end);
            if (hitIssue) {
              onClickTextError?.(hitIssue);
            } else {
              onClickTextError?.(null);
            }
          }
        } catch {
          // ignore pointer check edge cases
        }
        return;
      }

      if (opt.target) return;
      onClickTextError?.(null);

      if (t === 'addText') {
        const curPreset =
          SHARPENING_PRESETS.find((s) => s.id === sharpRef.current) || SHARPENING_PRESETS[2];
        const fontOpt = resolveFontOption(DEFAULT_TEXT_STYLE.nexFontId);
        const tb = new fabric.Textbox('Type text here', {
          left: pointer.x,
          top: pointer.y - 10,
          width: 220,
          fontSize: DEFAULT_TEXT_STYLE.fontSize,
          fontWeight: DEFAULT_TEXT_STYLE.fontWeight,
          fontStyle: DEFAULT_TEXT_STYLE.fontStyle,
          fill: DEFAULT_TEXT_STYLE.fill,
          fontFamily: fontOpt.cssFamily,
          nexFontId: fontOpt.id,
          nexOriginalFormat: { ...DEFAULT_TEXT_STYLE },
          nexIgnoredErrors: [],
          nexKind: 'text',
          lineHeight: DEFAULT_TEXT_STYLE.lineHeight,
          charSpacing: DEFAULT_TEXT_STYLE.charSpacing,
          objectCaching: !curPreset.disableCache,
          noScaleCache: curPreset.disableCache,
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

      if (dist < 8) {
        // Prevent accidental single clicks in Highlight/Underline mode from dropping unwanted yellow boxes
        if (draft.tool === 'highlight' || draft.tool === 'underline') {
          fc.remove(finalObj);
          fc.selection = true;
          fc.renderAll();
          onToast(
            draft.tool === 'highlight'
              ? 'Drag across text to create a highlight box'
              : 'Drag across text to draw an underline',
            'info',
            2000
          );
          return;
        }
        if (draft.shapeType === 'line') {
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
      if (draft.tool === 'shapes' || draft.tool === 'highlight' || draft.tool === 'underline') {
        onSelectTool?.('select');
      }
    };

    const handleAfterRender = () => {
      drawErrorUnderlinesForCanvas(fc);
    };

    fc.on('selection:created', handleSelection);
    fc.on('selection:updated', handleSelection);
    fc.on('selection:cleared', handleCleared);
    fc.on('object:modified', handleModified);
    fc.on('text:changed', handleTextChanged);
    fc.on('text:selection:changed', handleTextSelectionChanged);
    fc.on('path:created', handlePathCreated);
    fc.on('mouse:down', handleMouseDown);
    fc.on('mouse:move', handleMouseMove);
    fc.on('mouse:up', handleMouseUp);
    fc.on('after:render', handleAfterRender);

    const getActiveSelectionRange = (obj) => {
      if (obj.isEditing && (obj.selectionEnd ?? 0) > (obj.selectionStart ?? 0)) {
        return { start: obj.selectionStart, end: obj.selectionEnd };
      }
      if (obj.nexSavedSelection && obj.nexSavedSelection.end > obj.nexSavedSelection.start) {
        return obj.nexSavedSelection;
      }
      return null;
    };

    registerPageApi(pageSpec.id, {
      setTextSelectionRange: (start, end) => {
        const obj = fc.getActiveObject();
        if (!obj || (obj.type !== 'textbox' && obj.type !== 'i-text')) return;
        obj.nexSavedSelection = end > start ? { start, end } : null;
        notifySelection();
      },
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

        const nextPatch = { ...patch };
        const isTextObj = obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';

        if (nextPatch.fontFamilyId) {
          const fOpt = resolveFontOption(nextPatch.fontFamilyId);
          nextPatch.fontFamily = fOpt.cssFamily;
          nextPatch.nexFontId = fOpt.id;
          delete nextPatch.fontFamilyId;
        }
        if (typeof nextPatch.targetWidth === 'number') {
          nextPatch.scaleX = Math.max(8, nextPatch.targetWidth) / (obj.width || 100);
          delete nextPatch.targetWidth;
        }
        if (typeof nextPatch.targetHeight === 'number') {
          nextPatch.scaleY = Math.max(8, nextPatch.targetHeight) / (obj.height || 100);
          delete nextPatch.targetHeight;
        }
        if (typeof nextPatch.lockAspect === 'boolean') {
          nextPatch.lockUniScaling = nextPatch.lockAspect;
          nextPatch.nexLockAspect = nextPatch.lockAspect;
          delete nextPatch.lockAspect;
        }

        // Selective Formatting for a sub-range [start, end)
        const selRange = isTextObj ? getActiveSelectionRange(obj) : null;
        const charStyleKeys = [
          'fontFamily',
          'nexFontId',
          'fontSize',
          'fontWeight',
          'fontStyle',
          'underline',
          'fill',
          'textBackgroundColor',
          'nexHighlightApplied',
        ];
        const selectivePatch = {};
        for (const k of charStyleKeys) {
          if (nextPatch[k] !== undefined) {
            selectivePatch[k] = nextPatch[k];
          }
        }
        if (selectivePatch.textBackgroundColor !== undefined) {
          selectivePatch.nexHighlightApplied = Boolean(selectivePatch.textBackgroundColor);
        }

        if (selRange && Object.keys(selectivePatch).length > 0 && nextPatch.text === undefined) {
          obj.setSelectionStyles(selectivePatch, selRange.start, selRange.end);
          for (const k of charStyleKeys) delete nextPatch[k];
          if (Object.keys(nextPatch).length > 0) {
            obj.set(nextPatch);
          }
          obj.set({ dirty: true });
          obj.setCoords();
          fc.renderAll();
          notifySelection();
          commitFabricChanges();
          return;
        }

        if (isTextObj) {
          if (nextPatch.textBackgroundColor !== undefined) {
            nextPatch.nexHighlightApplied = Boolean(nextPatch.textBackgroundColor);
          }
          // Ensure non-highlight text never inherits accidental backgroundColor CSS
          if (nextPatch.backgroundColor === undefined && obj.backgroundColor) {
            nextPatch.backgroundColor = '';
          }
          if (typeof nextPatch.fontSize === 'number') {
            const visWidth = Math.max(40, (obj.width || 120) * (obj.scaleX || 1));
            nextPatch.width = visWidth;
            nextPatch.scaleX = 1;
            nextPatch.scaleY = 1;
          }
          if (obj.styles && nextPatch.text === undefined) {
            const keysToClear = Object.keys(selectivePatch);
            if (keysToClear.length > 0) {
              for (const lineKey of Object.keys(obj.styles)) {
                const lineMap = obj.styles[lineKey];
                if (!lineMap) continue;
                for (const charKey of Object.keys(lineMap)) {
                  for (const propKey of keysToClear) {
                    delete lineMap[charKey][propKey];
                  }
                }
              }
            }
          }
          nextPatch.dirty = true;
        }

        obj.set(nextPatch);
        obj.setCoords();
        fc.renderAll();
        notifySelection();
        commitFabricChanges();
      },
      transformSelectedCase: (mode) => {
        const obj = fc.getActiveObject();
        if (!obj || (obj.type !== 'textbox' && obj.type !== 'i-text' && obj.type !== 'text')) return;
        const oldText = obj.text || '';
        const range = getActiveSelectionRange(obj);
        if (range) {
          const transformed = applyCaseTransform(oldText.slice(range.start, range.end), mode);
          spliceFabricTextPreservingStyles(obj, range.start, range.end, transformed);
        } else {
          const transformed = applyCaseTransform(oldText, mode);
          spliceFabricTextPreservingStyles(obj, 0, oldText.length, transformed);
        }
        obj.setCoords();
        fc.renderAll();
        notifySelection();
        commitFabricChanges();
      },
      matchAboveAlignment: () => {
        const obj = fc.getActiveObject();
        if (!obj || (obj.type !== 'textbox' && obj.type !== 'i-text' && obj.type !== 'text')) {
          return { matched: false, reason: 'no-text' };
        }

        // If cursor is on line 2+ inside a multi-line box, check if leading whitespace differs from line above
        if (obj.isEditing && obj._textLines && obj._textLines.length > 1) {
          const loc = obj.get2DCursorLocation(obj.selectionStart ?? 0, false);
          if (loc.lineIndex > 0) {
            const rawLines = (obj.text || '').split('\n');
            if (loc.lineIndex < rawLines.length) {
              const prevIndent = (rawLines[loc.lineIndex - 1].match(/^\s*/) || [''])[0];
              const curIndent = (rawLines[loc.lineIndex].match(/^\s*/) || [''])[0];
              if (prevIndent !== curIndent) {
                let lineStartFlat = 0;
                for (let k = 0; k < loc.lineIndex; k++) lineStartFlat += rawLines[k].length + 1;
                spliceFabricTextPreservingStyles(obj, lineStartFlat, lineStartFlat + curIndent.length, prevIndent);
                obj.setCoords();
                fc.renderAll();
                notifySelection();
                commitFabricChanges();
                return { matched: true, mode: 'indent', targetLeft: obj.left };
              }
            }
          }
        }

        // Collect all candidate lines above this text object (existing PDF lines + other Fabric text objects)
        const candidates = [];
        const removedSet = new Set(removedTextIdsRef.current || []);
        const vMeta = visualMetaRef.current;
        if (vMeta?.textBlocks) {
          for (const b of vMeta.textBlocks) {
            if (!removedSet.has(b.id)) {
              candidates.push({ left: b.left, top: b.top, text: b.text });
            }
          }
        }
        for (const other of fc.getObjects()) {
          if (other === obj) continue;
          if (other.type === 'textbox' || other.type === 'i-text' || other.type === 'text') {
            const lineOffset =
              typeof other._getLineLeftOffset === 'function' ? other._getLineLeftOffset(0) : 0;
            candidates.push({
              left: (other.left || 0) + Math.max(0, lineOffset),
              top: other.top || 0,
              text: other.text || '',
            });
          }
        }

        const match = findNearestAboveLineStart(
          { left: obj.left || 0, top: obj.top || 0 },
          candidates
        );
        if (!match) {
          return { matched: false, reason: 'none-above' };
        }

        obj.set({ left: match.targetLeft, textAlign: 'left', dirty: true });
        obj.setCoords();
        fc.renderAll();
        notifySelection();
        commitFabricChanges();
        return { matched: true, mode: 'block', targetLeft: match.targetLeft };
      },
      applyTextErrorFix: (issue, replacement) => {
        const obj = fc.getActiveObject();
        if (!obj || (obj.type !== 'textbox' && obj.type !== 'i-text' && obj.type !== 'text')) return;
        spliceFabricTextPreservingStyles(obj, issue.start, issue.end, replacement);
        obj.nexSavedSelection = null;
        obj.setCoords();
        fc.renderAll();
        notifySelection();
        commitFabricChanges();
      },
      ignoreTextError: (issueKey) => {
        const obj = fc.getActiveObject();
        if (!obj) return;
        const existing = obj.nexIgnoredErrors || [];
        if (!existing.includes(issueKey)) {
          obj.set({ nexIgnoredErrors: [...existing, issueKey], dirty: true });
        }
        fc.renderAll();
        notifySelection();
        commitFabricChanges();
      },
      resetSelectedTextToDefault: () => {
        const obj = fc.getActiveObject();
        if (!obj || (obj.type !== 'textbox' && obj.type !== 'i-text' && obj.type !== 'text')) return;
        const base = obj.nexOriginalFormat || DEFAULT_TEXT_STYLE;
        const fOpt = resolveFontOption(base.nexFontId);
        obj.styles = {};
        obj.set({
          fontFamily: fOpt.cssFamily,
          nexFontId: fOpt.id,
          fontSize: base.fontSize || 16,
          fontWeight: base.fontWeight || '400',
          fontStyle: base.fontStyle || 'normal',
          underline: Boolean(base.underline),
          fill: base.fill || '#0f172a',
          textBackgroundColor: '',
          textAlign: base.textAlign || 'left',
          lineHeight: base.lineHeight ?? 1.2,
          charSpacing: base.charSpacing ?? 0,
          scaleX: 1,
          scaleY: 1,
          dirty: true,
        });
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
        const active = fc.getActiveObject();
        if (active && active.isEditing && typeof active.exitEditing === 'function') {
          active.exitEditing();
        }
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

  // 3. Keep Fabric zoom, dimensions, and sharpening synced
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    applySharpeningToCanvas(fc, sharpPreset);
  }, [zoom, pageW, pageH, sharpPreset]);

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
      applySharpeningToCanvas(fc, sharpPreset);
      lastJsonRef.current = incomingStr;
      isInternalSyncRef.current = false;
    });
  }, [pageSpec.fabricJson]);

  const handleEditExistingText = (block) => {
    const fc = fabricRef.current;
    const baseCanvas = baseCanvasRef.current;
    if (!fc) return;

    const sampled = baseCanvas
      ? sampleCanvasBgAndFgColor(baseCanvas, block.left, block.top, block.width, block.height, zoom)
      : { bgColor: '#ffffff', fgColor: '#0f172a' };
    block.bgSampleColor = sampled.bgColor;

    if (activeTool === 'deleteObject' || activeTool === 'eraser') {
      onCommitPageUpdate(pageSpec.id, {
        removedTextIds: [...(pageSpec.removedTextIds || []), block.id],
      });
      onToast('Original PDF text marked for stream removal', 'info');
      return;
    }

    if (activeTool !== 'editText' && activeTool !== 'select') return;

    const fontOpt = resolveFontOption(block.fontInfo.mappedFamily);
    const preservedWeight = block.fontInfo.fontWeight || (block.fontInfo.isBold ? '700' : '400');
    const preservedStyle = block.fontInfo.isItalic ? 'italic' : 'normal';
    const preservedSize = block.fontSize || 12;
    const preservedColor = sampled.fgColor;

    const originalFormat = {
      nexFontId: fontOpt.id,
      fontSize: preservedSize,
      fontWeight: preservedWeight,
      fontStyle: preservedStyle,
      underline: false,
      fill: preservedColor,
      textAlign: 'left',
      lineHeight: 1.18,
      charSpacing: 0,
    };

    const tb = new fabric.Textbox(block.text, {
      left: block.left,
      top: block.top,
      width: Math.max(block.width + 24, 90),
      fontSize: preservedSize,
      fontFamily: fontOpt.cssFamily,
      fontWeight: preservedWeight,
      fontStyle: preservedStyle,
      fill: preservedColor,
      nexFontId: fontOpt.id,
      nexFontSubstituted: block.fontInfo.isEmbeddedSubset,
      nexOriginalFont: block.fontInfo.rawFontName,
      nexOriginalFormat: originalFormat,
      nexIgnoredErrors: [],
      nexKind: 'text',
      lineHeight: 1.18,
      charSpacing: 0,
      objectCaching: !sharpPreset.disableCache,
      noScaleCache: sharpPreset.disableCache,
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
        `Preserved size (${preservedSize}pt), weight (${preservedWeight}), & color (${preservedColor}). Embedded font "${block.fontInfo.rawFontName}" uses ${fontOpt.id} substitution on export.`,
        'warning',
        4500
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
                        : `Click to edit (preserves ${block.fontInfo.mappedFamily} ${block.fontSize}pt): "${block.text}"`
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
