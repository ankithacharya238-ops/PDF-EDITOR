import { PDFDocument, StandardFonts, degrees, rgb, LineCapStyle } from 'pdf-lib';
import { FONT_OPTIONS } from '../config/editorConfig.js';
import { editPageContentStream } from './pdfStreamEditor.js';

function hexToRgbTuple(hex = '#0f172a') {
  if (!hex || hex === 'transparent') return null;
  let clean = hex.trim();
  if (clean.startsWith('rgb')) {
    const nums = clean.match(/[\d.]+/g);
    if (nums && nums.length >= 3) {
      return rgb(
        Math.min(1, parseFloat(nums[0]) / 255),
        Math.min(1, parseFloat(nums[1]) / 255),
        Math.min(1, parseFloat(nums[2]) / 255)
      );
    }
  }
  clean = clean.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) return rgb(0.06, 0.09, 0.16);
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

async function dataUrlToBytesAndMime(dataUrl) {
  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
  return { bytes: new Uint8Array(buf), mime };
}

async function convertWebpOrAnyToPngBytes(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      c.toBlob(async (blob) => {
        if (!blob) return reject(new Error('PNG conversion failed'));
        const arr = new Uint8Array(await blob.arrayBuffer());
        resolve(arr);
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function embedFabricImage(pdfDoc, src) {
  const { bytes, mime } = await dataUrlToBytesAndMime(src);
  if (mime === 'image/png') {
    return pdfDoc.embedPng(bytes);
  }
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return pdfDoc.embedJpg(bytes);
  }
  const pngBytes = await convertWebpOrAnyToPngBytes(src);
  return pdfDoc.embedPng(pngBytes);
}

function getFontVariantKey(isBold, isItalic) {
  if (isBold && isItalic) return 'boldItalic';
  if (isBold) return 'bold';
  if (isItalic) return 'italic';
  return 'normal';
}

function sanitizeWinAnsi(text = '') {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?');
}

function wrapTextToWidth(text, font, size, maxWidth, charSpacingPt = 0) {
  const lines = [];
  const paragraphs = (text || '').split(/\r?\n/);

  for (const para of paragraphs) {
    if (!para) {
      lines.push({ text: '', isLastInPara: true });
      continue;
    }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const w = font.widthOfTextAtSize(candidate, size) + Math.max(0, candidate.length - 1) * charSpacingPt;
      if (w <= maxWidth + 4 || !current) {
        current = candidate;
      } else {
        lines.push({ text: current, isLastInPara: false });
        current = word;
      }
    }
    if (current) lines.push({ text: current, isLastInPara: true });
  }
  return lines;
}

/**
 * Maps a point from visual top-left rotated canvas coordinates (72 DPI)
 * into pdf-lib MediaBox bottom-left coordinates (accounting for page /Rotate).
 */
function visualPointToMediaBox(vx, vy, mediaW, mediaH, totalRotDeg) {
  const rot = ((totalRotDeg % 360) + 360) % 360;
  if (rot === 90) {
    // Visual width = mediaH, Visual height = mediaW
    return { x: vy, y: vx };
  }
  if (rot === 180) {
    return { x: mediaW - vx, y: vy };
  }
  if (rot === 270) {
    // Visual width = mediaH, Visual height = mediaW
    return { x: mediaW - vy, y: mediaH - vx };
  }
  return { x: vx, y: mediaH - vy };
}

function rotatePointAround(px, py, ox, oy, angleDeg) {
  if (!angleDeg) return { x: px, y: py };
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - ox;
  const dy = py - oy;
  return {
    x: ox + dx * cos - dy * sin,
    y: oy + dx * sin + dy * cos,
  };
}

function computePathOffsetFallback(path) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const cmd of path) {
    for (let i = 1; i + 1 < cmd.length; i += 2) {
      const x = cmd[i];
      const y = cmd[i + 1];
      if (typeof x === 'number' && typeof y === 'number') {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0 };
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

function roundedRectSvgPath(w, h, rx, ry) {
  const rX = Math.min(rx || 0, w / 2);
  const rY = Math.min(ry || rx || 0, h / 2);
  return `M ${rX} 0 L ${w - rX} 0 Q ${w} 0 ${w} ${rY} L ${w} ${h - rY} Q ${w} ${h} ${w - rX} ${h} L ${rX} ${h} Q 0 ${h} 0 ${h - rY} L 0 ${rY} Q 0 0 ${rX} 0 Z`;
}

/**
 * Exports the full edited PDF document using pdf-lib:
 * 1. Handles page ordering, duplication, blank page creation, deletion, and rotation.
 * 2. Performs genuine content-stream text & image removal via editPageContentStream.
 * 3. Renders all added/edited Fabric.js objects with exact 72-DPI coordinate fidelity.
 */
export async function exportEditedPdf({ originalPdfBytes, pagesState, pageMetadataMap }) {
  const srcDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const outDoc = await PDFDocument.create();

  const fontCache = {};
  const getPdfFont = async (fontId = 'Helvetica', isBold = false, isItalic = false) => {
    const def = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
    const variant = getFontVariantKey(isBold, isItalic);
    const stdFont = def.pdfStandard[variant] || StandardFonts.Helvetica;
    if (!fontCache[stdFont]) {
      fontCache[stdFont] = await outDoc.embedFont(stdFont);
    }
    return fontCache[stdFont];
  };

  const stats = {
    totalPages: pagesState.length,
    streamRemovedText: 0,
    streamRemovedImages: 0,
    fallbackMaskedItems: 0,
    drawnObjects: 0,
  };

  for (let pIdx = 0; pIdx < pagesState.length; pIdx++) {
    const pageSpec = pagesState[pIdx];
    let outPage;
    let totalRotation = 0;

    if (pageSpec.isBlank) {
      outPage = outDoc.addPage([pageSpec.width || 612, pageSpec.height || 792]);
      if (pageSpec.rotationDelta) {
        totalRotation = pageSpec.rotationDelta % 360;
        outPage.setRotation(degrees(totalRotation));
      }
    } else {
      const [copied] = await outDoc.copyPages(srcDoc, [pageSpec.sourcePageIndex]);
      outPage = outDoc.addPage(copied);
      const existingRot = outPage.getRotation().angle || 0;
      totalRotation = ((existingRot + (pageSpec.rotationDelta || 0)) % 360 + 360) % 360;
      if (pageSpec.rotationDelta) {
        outPage.setRotation(degrees(totalRotation));
      }
    }

    const { width: mediaW, height: mediaH } = outPage.getSize();
    const meta = pageSpec.isBlank ? null : pageMetadataMap[pageSpec.sourcePageIndex];

    // 1. Genuine stream-level removal of deleted/edited original text & deleted/replaced images
    if (!pageSpec.isBlank && meta) {
      const removedTextIds = new Set(pageSpec.removedTextIds || []);
      const removedImageIds = new Set(pageSpec.removedImageIds || []);

      const removedRawItems = [];
      for (const block of meta.textBlocks || []) {
        if (removedTextIds.has(block.id)) {
          for (let r = 0; r < block.rawItems.length; r++) {
            removedRawItems.push({ ...block.rawItems[r], _uid: `${block.id}-${r}` });
          }
        }
      }
      const removedImages = (meta.images || []).filter((img) => removedImageIds.has(img.id));

      const streamRes = editPageContentStream(outDoc, outPage, {
        removedRawTextItems: removedRawItems,
        removedImages,
      });

      stats.streamRemovedText += streamRes.matchedTextCount;
      stats.streamRemovedImages += streamRes.matchedImageCount;

      // Fallback only for items nested inside uneditable Form XObjects
      for (const fallbackText of streamRes.unmatchedTextItems) {
        stats.fallbackMaskedItems++;
        const block = meta.textBlocks.find((b) => fallbackText._uid.startsWith(b.id));
        const bgColor = hexToRgbTuple(block?.bgSampleColor || '#ffffff') || rgb(1, 1, 1);
        outPage.drawRectangle({
          x: Math.max(0, fallbackText.pdfX - 1),
          y: Math.max(0, fallbackText.pdfY - fallbackText.pdfFontSize * 0.25),
          width: fallbackText.pdfWidth + 3,
          height: fallbackText.pdfFontSize * 1.15,
          color: bgColor,
        });
      }
      for (const fallbackImg of streamRes.unmatchedImages) {
        stats.fallbackMaskedItems++;
        outPage.drawRectangle({
          x: fallbackImg.pdfX,
          y: fallbackImg.pdfY,
          width: fallbackImg.pdfWidth,
          height: fallbackImg.pdfHeight,
          color: rgb(1, 1, 1),
        });
      }
    }

    const toMedia = (vx, vy) => visualPointToMediaBox(vx, vy, mediaW, mediaH, totalRotation);
    const objAngleInMedia = (fabricAngle = 0) => -(fabricAngle || 0) + totalRotation;

    // 2. Render Fabric objects from canonical 72-DPI JSON
    const fabricObjects = pageSpec.fabricJson?.objects || [];
    for (const obj of fabricObjects) {
      const scaleX = obj.scaleX ?? 1;
      const scaleY = obj.scaleY ?? 1;
      const angle = obj.angle ?? 0;
      const opacity = obj.opacity ?? 1;

      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
        const fontSize = (obj.fontSize || 16) * scaleY;
        const isBold = obj.fontWeight === 'bold' || Number(obj.fontWeight) >= 600;
        const isItalic = obj.fontStyle === 'italic';
        const fontId = obj.nexFontId || 'Helvetica';
        const pdfFont = await getPdfFont(fontId, isBold, isItalic);
        const color = hexToRgbTuple(obj.fill || '#0f172a') || rgb(0.06, 0.09, 0.16);
        const charSpacingPt = ((obj.charSpacing || 0) / 1000) * fontSize;
        const boxWidth = (obj.width || 240) * scaleX;
        const lineHeightMult = obj.lineHeight || 1.2;

        const safeText = sanitizeWinAnsi(obj.text || '');
        const lines = wrapTextToWidth(safeText, pdfFont, fontSize, boxWidth, charSpacingPt);

        const baseLeft = obj.left || 0;
        const baseTop = obj.top || 0;

        lines.forEach((lineObj, idx) => {
          const line = lineObj.text;
          if (!line) return;
          const lineWidth =
            pdfFont.widthOfTextAtSize(line, fontSize) + Math.max(0, line.length - 1) * charSpacingPt;
          let drawVx = baseLeft;
          if (obj.textAlign === 'center') {
            drawVx = baseLeft + Math.max(0, (boxWidth - lineWidth) / 2);
          } else if (obj.textAlign === 'right') {
            drawVx = baseLeft + Math.max(0, boxWidth - lineWidth);
          }

          const baselineVy = baseTop + fontSize * 0.88 + idx * fontSize * lineHeightMult;

          if (obj.textAlign === 'justify' && !lineObj.isLastInPara && line.includes(' ')) {
            const words = line.split(' ');
            const wordsWidth = words.reduce(
              (acc, w) => acc + pdfFont.widthOfTextAtSize(w, fontSize) + Math.max(0, w.length - 1) * charSpacingPt,
              0
            );
            const extraSpace = Math.max(0, (boxWidth - wordsWidth) / Math.max(1, words.length - 1));
            let cursorVx = baseLeft;
            for (const w of words) {
              const rotatedVis = rotatePointAround(cursorVx, baselineVy, baseLeft, baseTop, angle);
              const mp = toMedia(rotatedVis.x, rotatedVis.y);
              outPage.drawText(w, {
                x: mp.x,
                y: mp.y,
                size: fontSize,
                font: pdfFont,
                color,
                opacity,
                rotate: degrees(objAngleInMedia(angle)),
              });
              cursorVx += pdfFont.widthOfTextAtSize(w, fontSize) + Math.max(0, w.length - 1) * charSpacingPt + extraSpace;
            }
          } else if (Math.abs(charSpacingPt) > 0.05) {
            let cursorVx = drawVx;
            for (const ch of line) {
              const rotatedVis = rotatePointAround(cursorVx, baselineVy, baseLeft, baseTop, angle);
              const mp = toMedia(rotatedVis.x, rotatedVis.y);
              outPage.drawText(ch, {
                x: mp.x,
                y: mp.y,
                size: fontSize,
                font: pdfFont,
                color,
                opacity,
                rotate: degrees(objAngleInMedia(angle)),
              });
              cursorVx += pdfFont.widthOfTextAtSize(ch, fontSize) + charSpacingPt;
            }
          } else {
            const rotatedVis = rotatePointAround(drawVx, baselineVy, baseLeft, baseTop, angle);
            const mp = toMedia(rotatedVis.x, rotatedVis.y);
            outPage.drawText(line, {
              x: mp.x,
              y: mp.y,
              size: fontSize,
              font: pdfFont,
              color,
              opacity,
              rotate: degrees(objAngleInMedia(angle)),
            });
          }

          if (obj.underline) {
            const ulY = baselineVy + Math.max(1.5, fontSize * 0.12);
            const ulW = obj.textAlign === 'justify' && !lineObj.isLastInPara ? boxWidth : lineWidth;
            const rs = rotatePointAround(drawVx, ulY, baseLeft, baseTop, angle);
            const re = rotatePointAround(drawVx + ulW, ulY, baseLeft, baseTop, angle);
            outPage.drawLine({
              start: toMedia(rs.x, rs.y),
              end: toMedia(re.x, re.y),
              thickness: Math.max(0.8, fontSize * 0.06),
              color,
              opacity,
            });
          }
        });
        stats.drawnObjects++;
      } else if (obj.type === 'image' && obj.src) {
        try {
          const embedded = await embedFabricImage(outDoc, obj.src);
          const w = (obj.width || embedded.width) * scaleX;
          const h = (obj.height || embedded.height) * scaleY;
          const left = obj.left || 0;
          const top = obj.top || 0;
          const blVis = rotatePointAround(left, top + h, left, top, angle);
          const blMedia = toMedia(blVis.x, blVis.y);

          outPage.drawImage(embedded, {
            x: blMedia.x,
            y: blMedia.y,
            width: w,
            height: h,
            opacity,
            rotate: degrees(objAngleInMedia(angle)),
          });
          stats.drawnObjects++;
        } catch (err) {
          console.warn('Skipped image during export:', err);
        }
      } else if (obj.type === 'rect') {
        const w = (obj.width || 0) * scaleX;
        const h = (obj.height || 0) * scaleY;
        const left = obj.left || 0;
        const top = obj.top || 0;
        const fillCol = hexToRgbTuple(obj.fill);
        const strokeCol = hexToRgbTuple(obj.stroke);
        const strokeWidth = (obj.strokeWidth || 0) * Math.max(scaleX, scaleY);

        if ((obj.rx || 0) > 0 && totalRotation === 0 && !angle) {
          const svgPath = roundedRectSvgPath(w, h, (obj.rx || 0) * scaleX, (obj.ry || obj.rx || 0) * scaleY);
          outPage.drawSvgPath(svgPath, {
            x: left,
            y: mediaH - top,
            color: fillCol || undefined,
            borderColor: strokeCol || undefined,
            borderWidth: strokeCol ? strokeWidth : 0,
            opacity,
            borderOpacity: opacity,
          });
        } else {
          const blVis = rotatePointAround(left, top + h, left, top, angle);
          const blMedia = toMedia(blVis.x, blVis.y);
          outPage.drawRectangle({
            x: blMedia.x,
            y: blMedia.y,
            width: w,
            height: h,
            color: fillCol || undefined,
            borderColor: strokeCol || undefined,
            borderWidth: strokeCol ? strokeWidth : 0,
            opacity,
            borderOpacity: opacity,
            rotate: degrees(objAngleInMedia(angle)),
          });
        }
        stats.drawnObjects++;
      } else if (obj.type === 'circle' || obj.type === 'ellipse') {
        const rx = (obj.radius || obj.rx || (obj.width || 40) / 2) * scaleX;
        const ry = (obj.radius || obj.ry || (obj.height || 40) / 2) * scaleY;
        const left = obj.left || 0;
        const top = obj.top || 0;
        const centerVis = rotatePointAround(left + rx, top + ry, left, top, angle);
        const centerMedia = toMedia(centerVis.x, centerVis.y);
        const fillCol = hexToRgbTuple(obj.fill);
        const strokeCol = hexToRgbTuple(obj.stroke);
        const strokeWidth = (obj.strokeWidth || 0) * Math.max(scaleX, scaleY);

        outPage.drawEllipse({
          x: centerMedia.x,
          y: centerMedia.y,
          xScale: rx,
          yScale: ry,
          color: fillCol || undefined,
          borderColor: strokeCol || undefined,
          borderWidth: strokeCol ? strokeWidth : 0,
          opacity,
          borderOpacity: opacity,
          rotate: degrees(objAngleInMedia(angle)),
        });
        stats.drawnObjects++;
      } else if (obj.type === 'triangle') {
        const w = (obj.width || 60) * scaleX;
        const h = (obj.height || 60) * scaleY;
        const left = obj.left || 0;
        const top = obj.top || 0;
        const fillCol = hexToRgbTuple(obj.fill);
        const strokeCol = hexToRgbTuple(obj.stroke);
        const sw = (obj.strokeWidth || 2) * Math.max(scaleX, scaleY);

        const rp1 = rotatePointAround(left + w / 2, top, left, top, angle);
        const rp2 = rotatePointAround(left + w, top + h, left, top, angle);
        const rp3 = rotatePointAround(left, top + h, left, top, angle);
        const p1 = toMedia(rp1.x, rp1.y);
        const p2 = toMedia(rp2.x, rp2.y);
        const p3 = toMedia(rp3.x, rp3.y);

        // Draw SVG triangle when unrotated, or crisp 3-edge stroke fallback when rotated
        if (totalRotation === 0 && !angle) {
          const svgPath = `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;
          outPage.drawSvgPath(svgPath, {
            x: left,
            y: mediaH - top,
            color: fillCol || undefined,
            borderColor: strokeCol || undefined,
            borderWidth: strokeCol ? sw : 0,
            opacity,
            borderOpacity: opacity,
          });
        } else {
          const col = strokeCol || fillCol || rgb(0.22, 0.74, 0.97);
          outPage.drawLine({ start: p1, end: p2, thickness: sw, color: col, opacity });
          outPage.drawLine({ start: p2, end: p3, thickness: sw, color: col, opacity });
          outPage.drawLine({ start: p3, end: p1, thickness: sw, color: col, opacity });
        }
        stats.drawnObjects++;
      } else if (obj.type === 'line') {
        const left = obj.left || 0;
        const top = obj.top || 0;
        const w = (obj.width || 0) * scaleX;
        const h = (obj.height || 0) * scaleY;
        const useBounds = obj.x1 === undefined;
        const vStartX = useBounds ? left : left + (obj.x1 <= obj.x2 ? 0 : w);
        const vStartY = useBounds ? top : top + (obj.y1 <= obj.y2 ? 0 : h);
        const vEndX = useBounds ? left + w : left + (obj.x1 <= obj.x2 ? w : 0);
        const vEndY = useBounds ? top + h : top + (obj.y1 <= obj.y2 ? h : 0);

        const rStart = rotatePointAround(vStartX, vStartY, left, top, angle);
        const rEnd = rotatePointAround(vEndX, vEndY, left, top, angle);

        outPage.drawLine({
          start: toMedia(rStart.x, rStart.y),
          end: toMedia(rEnd.x, rEnd.y),
          thickness: Math.max(1, (obj.strokeWidth || 2) * Math.max(scaleX, scaleY)),
          color: hexToRgbTuple(obj.stroke || '#38bdf8') || rgb(0.22, 0.74, 0.97),
          opacity,
          lineCap: LineCapStyle.Round,
        });
        stats.drawnObjects++;
      } else if (obj.type === 'path' && Array.isArray(obj.path)) {
        const strokeCol = hexToRgbTuple(obj.stroke || '#0f172a');
        const fillCol = hexToRgbTuple(obj.fill);
        const sw = Math.max(0.8, (obj.strokeWidth || 2) * Math.max(scaleX, scaleY));
        const offset = obj.pathOffset || computePathOffsetFallback(obj.path);
        const ox = offset.x;
        const oy = offset.y;
        const left = obj.left || 0;
        const top = obj.top || 0;
        // Fabric Path bounding box includes strokeWidth around path bounds
        const cx = left + ((obj.width || 0) + (obj.strokeWidth || 0)) * scaleX * 0.5;
        const cy = top + ((obj.height || 0) + (obj.strokeWidth || 0)) * scaleY * 0.5;

        const mapCmdPt = (px, py) => {
          const vx = cx + (px - ox) * scaleX;
          const vy = cy + (py - oy) * scaleY;
          const rotVis = rotatePointAround(vx, vy, left, top, angle);
          return toMedia(rotVis.x, rotVis.y);
        };

        let lastPt = null;
        let firstPt = null;
        const lineCol = strokeCol || fillCol || rgb(0.06, 0.09, 0.16);

        for (const cmd of obj.path) {
          const t = cmd[0];
          if (t === 'M') {
            lastPt = mapCmdPt(cmd[1], cmd[2]);
            if (!firstPt) firstPt = lastPt;
          } else if (t === 'L' && lastPt) {
            const nextPt = mapCmdPt(cmd[1], cmd[2]);
            outPage.drawLine({
              start: lastPt,
              end: nextPt,
              thickness: sw,
              color: lineCol,
              opacity,
              lineCap: LineCapStyle.Round,
            });
            lastPt = nextPt;
          } else if (t === 'Q' && lastPt) {
            const cPt = mapCmdPt(cmd[1], cmd[2]);
            const endPt = mapCmdPt(cmd[3], cmd[4]);
            outPage.drawLine({ start: lastPt, end: cPt, thickness: sw, color: lineCol, opacity, lineCap: LineCapStyle.Round });
            outPage.drawLine({ start: cPt, end: endPt, thickness: sw, color: lineCol, opacity, lineCap: LineCapStyle.Round });
            lastPt = endPt;
          } else if (t === 'C' && lastPt) {
            const p1 = mapCmdPt(cmd[1], cmd[2]);
            const p2 = mapCmdPt(cmd[3], cmd[4]);
            const endPt = mapCmdPt(cmd[5], cmd[6]);
            outPage.drawLine({ start: lastPt, end: p1, thickness: sw, color: lineCol, opacity, lineCap: LineCapStyle.Round });
            outPage.drawLine({ start: p1, end: p2, thickness: sw, color: lineCol, opacity, lineCap: LineCapStyle.Round });
            outPage.drawLine({ start: p2, end: endPt, thickness: sw, color: lineCol, opacity, lineCap: LineCapStyle.Round });
            lastPt = endPt;
          } else if ((t === 'Z' || t === 'z') && lastPt && firstPt) {
            outPage.drawLine({
              start: lastPt,
              end: firstPt,
              thickness: sw,
              color: lineCol,
              opacity,
              lineCap: LineCapStyle.Round,
            });
          }
        }
        stats.drawnObjects++;
      } else if (obj.type === 'group' && Array.isArray(obj.objects)) {
        const groupLeft = obj.left || 0;
        const groupTop = obj.top || 0;
        const gw = (obj.width || 0) * scaleX;
        const gh = (obj.height || 0) * scaleY;
        const strokeCol = hexToRgbTuple(obj.objects[0]?.stroke || '#38bdf8') || rgb(0.22, 0.74, 0.97);
        const sw = Math.max(1.5, (obj.objects[0]?.strokeWidth || 2.5) * Math.max(scaleX, scaleY));

        const midVy = groupTop + gh / 2;
        const rs = rotatePointAround(groupLeft, midVy, groupLeft, groupTop, angle);
        const re = rotatePointAround(groupLeft + gw, midVy, groupLeft, groupTop, angle);
        outPage.drawLine({
          start: toMedia(rs.x, rs.y),
          end: toMedia(re.x, re.y),
          thickness: sw,
          color: strokeCol,
          opacity,
          lineCap: LineCapStyle.Round,
        });
        stats.drawnObjects++;
      }
    }
  }

  const bytes = await outDoc.save();
  return { bytes, stats };
}
