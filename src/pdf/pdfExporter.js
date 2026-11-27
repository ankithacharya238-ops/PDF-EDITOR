import { PDFDocument, StandardFonts, degrees, rgb, LineCapStyle } from 'pdf-lib';
import { resolveFontOption } from '../config/editorConfig.js';
import { editPageContentStream } from './pdfStreamEditor.js';

function hexToRgbTuple(hex = '#0f172a') {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.trim().toLowerCase();
  if (!clean || clean === 'transparent' || clean === 'none' || clean === 'inherit' || clean === 'initial' || clean === 'unset') {
    return null;
  }
  if (clean.startsWith('rgb')) {
    const nums = clean.match(/[\d.]+/g);
    if (nums && nums.length >= 3) {
      if (nums.length >= 4 && parseFloat(nums[3]) <= 0.01) {
        return null;
      }
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
  if (clean.length === 8) {
    // RRGGBBAA hex with 00 alpha is transparent
    if (parseInt(clean.slice(6, 8), 16) <= 2) return null;
    clean = clean.slice(0, 6);
  }
  if (!/^[0-9a-f]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function sanitizeHighlightColor(color) {
  if (!color || typeof color !== 'string') return '';
  const trimmed = color.trim();
  if (!hexToRgbTuple(trimmed)) return '';
  return trimmed;
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

/**
 * Resolves per-character style overrides from either Fabric's serialized
 * [{ start, end, style }] array or 2D { lineIdx: { charIdx: style } } map.
 */
function buildCharStyleLookup(obj) {
  const text = obj.text || '';
  const perChar = new Array(text.length).fill(null);

  if (Array.isArray(obj.styles)) {
    for (const span of obj.styles) {
      if (!span || !span.style) continue;
      const s = Math.max(0, span.start || 0);
      const e = Math.min(text.length, span.end ?? s);
      for (let i = s; i < e; i++) {
        perChar[i] = { ...(perChar[i] || {}), ...span.style };
      }
    }
  } else if (obj.styles && typeof obj.styles === 'object') {
    const rawLines = text.split('\n');
    let offset = 0;
    for (let li = 0; li < rawLines.length; li++) {
      const lineMap = obj.styles[li];
      if (lineMap && typeof lineMap === 'object') {
        for (const [ciStr, st] of Object.entries(lineMap)) {
          const ci = Number(ciStr);
          if (!Number.isNaN(ci) && offset + ci < text.length) {
            perChar[offset + ci] = { ...(perChar[offset + ci] || {}), ...st };
          }
        }
      }
      offset += rawLines[li].length + 1;
    }
  }

  return (charIdx) => {
    const st = perChar[charIdx] || {};
    const scaleY = obj.scaleY ?? 1;
    const rawSize = st.fontSize || obj.fontSize || 16;
    const fontWeight = st.fontWeight ?? obj.fontWeight ?? '400';
    const fontStyle = st.fontStyle ?? obj.fontStyle ?? 'normal';
    const isBold = fontWeight === 'bold' || Number(fontWeight) >= 600;
    const isItalic = fontStyle === 'italic';
    const fontId = st.nexFontId || (st.fontFamily ? resolveFontOption(st.fontFamily).id : obj.nexFontId || 'Helvetica');

    const rawHighlight =
      st.nexHighlightApplied === false
        ? ''
        : st.nexHighlightApplied === true
        ? st.textBackgroundColor
        : obj.nexHighlightApplied === true && st.textBackgroundColor === undefined
        ? obj.textBackgroundColor
        : st.textBackgroundColor && obj.nexHighlightApplied !== false
        ? st.textBackgroundColor
        : '';

    return {
      fontId,
      fontSize: rawSize * scaleY,
      isBold,
      isItalic,
      underline: Boolean(st.underline !== undefined ? st.underline : obj.underline),
      fill: st.fill || obj.fill || '#0f172a',
      textBackgroundColor: sanitizeHighlightColor(rawHighlight),
    };
  };
}

function wrapStyledTextToWidth(text, getCharStyle, getPdfFontSync, maxWidth, charSpacingPt = 0) {
  const lines = [];
  let cursor = 0;
  const paragraphs = (text || '').split(/\r?\n/);

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    if (!para) {
      lines.push({ chars: [], isLastInPara: true });
      cursor += 1;
      continue;
    }

    const tokens = [];
    let pos = 0;
    while (pos < para.length) {
      const isSpace = para[pos] === ' ';
      let end = pos + 1;
      while (end < para.length && (para[end] === ' ') === isSpace) end++;
      const chars = [];
      for (let k = pos; k < end; k++) {
        const ch = sanitizeWinAnsi(para[k]);
        const style = getCharStyle(cursor + k);
        const font = getPdfFontSync(style.fontId, style.isBold, style.isItalic);
        const w = font.widthOfTextAtSize(ch, style.fontSize) + charSpacingPt;
        chars.push({ ch, style, font, w });
      }
      tokens.push({ isSpace, chars, width: chars.reduce((a, c) => a + c.w, 0) });
      pos = end;
    }

    let currentChars = [];
    let currentWidth = 0;
    for (const tok of tokens) {
      if (currentChars.length === 0 && tok.isSpace) continue;
      if (currentWidth + tok.width <= maxWidth + 4 || currentChars.length === 0) {
        currentChars.push(...tok.chars);
        currentWidth += tok.width;
      } else {
        // Trim trailing spaces on wrap
        while (currentChars.length > 0 && currentChars[currentChars.length - 1].ch === ' ') {
          currentChars.pop();
        }
        lines.push({ chars: currentChars, isLastInPara: false });
        currentChars = tok.isSpace ? [] : [...tok.chars];
        currentWidth = tok.isSpace ? 0 : tok.width;
      }
    }
    if (currentChars.length > 0) {
      lines.push({ chars: currentChars, isLastInPara: true });
    }
    cursor += para.length + 1;
  }

  return lines;
}

function visualPointToMediaBox(vx, vy, mediaW, mediaH, totalRotDeg) {
  const rot = ((totalRotDeg % 360) + 360) % 360;
  if (rot === 90) return { x: vy, y: vx };
  if (rot === 180) return { x: mediaW - vx, y: vy };
  if (rot === 270) return { x: mediaW - vy, y: mediaH - vx };
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
 * Exports the full edited PDF document using pdf-lib, preserving selective per-run
 * typography, inline text highlighting, alignment, stream removals, images, and pages.
 */
export async function exportEditedPdf({ originalPdfBytes, pagesState, pageMetadataMap }) {
  const srcDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const outDoc = await PDFDocument.create();

  // Pre-embed all standard font variants so styled wrapping can query synchronously
  const fontCache = {};
  const allStdFonts = [
    StandardFonts.Helvetica,
    StandardFonts.HelveticaBold,
    StandardFonts.HelveticaOblique,
    StandardFonts.HelveticaBoldOblique,
    StandardFonts.TimesRoman,
    StandardFonts.TimesRomanBold,
    StandardFonts.TimesRomanItalic,
    StandardFonts.TimesRomanBoldItalic,
    StandardFonts.Courier,
    StandardFonts.CourierBold,
    StandardFonts.CourierOblique,
    StandardFonts.CourierBoldOblique,
  ];
  for (const sf of allStdFonts) {
    fontCache[sf] = await outDoc.embedFont(sf);
  }

  const getPdfFontSync = (fontId = 'Helvetica', isBold = false, isItalic = false) => {
    const def = resolveFontOption(fontId);
    const variant = getFontVariantKey(isBold, isItalic);
    const stdFont = def.pdfStandard[variant] || StandardFonts.Helvetica;
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

    if (!pageSpec.isBlank && meta) {
      const removedTextIds = new Set(pageSpec.removedTextIds || []);
      const removedImageIds = new Set(pageSpec.removedImageIds || []);

      const removedRawItems = [];
      for (const block of meta.textBlocks || []) {
        if (removedTextIds.has(block.id)) {
          for (let r = 0; r < block.rawItems.length; r++) {
            removedRawItems.push({ ...block.rawItems[r], _blockId: block.id, _uid: `${block.id}-${r}` });
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

      for (const fallbackText of streamRes.unmatchedTextItems) {
        stats.fallbackMaskedItems++;
        const block = meta.textBlocks.find((b) => b.id === fallbackText._blockId);
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

    const fabricObjects = pageSpec.fabricJson?.objects || [];
    for (const obj of fabricObjects) {
      const scaleX = obj.scaleX ?? 1;
      const scaleY = obj.scaleY ?? 1;
      const angle = obj.angle ?? 0;
      const opacity = obj.opacity ?? 1;

      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
        const baseFontSize = (obj.fontSize || 16) * scaleY;
        const charSpacingPt = ((obj.charSpacing || 0) / 1000) * baseFontSize;
        const boxWidth = (obj.width || 240) * scaleX;
        const lineHeightMult = obj.lineHeight || 1.2;
        const getCharStyle = buildCharStyleLookup(obj);

        const lines = wrapStyledTextToWidth(
          obj.text || '',
          getCharStyle,
          getPdfFontSync,
          boxWidth,
          charSpacingPt
        );

        const baseLeft = obj.left || 0;
        const baseTop = obj.top || 0;
        let currentVy = baseTop;

        lines.forEach((lineObj) => {
          const chars = lineObj.chars;
          const maxLineFontSize =
            chars.length > 0
              ? Math.max(...chars.map((c) => c.style.fontSize))
              : baseFontSize;

          if (chars.length === 0) {
            currentVy += maxLineFontSize * lineHeightMult;
            return;
          }

          const rawLineWidth = chars.reduce((acc, c) => acc + c.w, 0) - charSpacingPt;
          let startVx = baseLeft;
          if (obj.textAlign === 'center') {
            startVx = baseLeft + Math.max(0, (boxWidth - rawLineWidth) / 2);
          } else if (obj.textAlign === 'right') {
            startVx = baseLeft + Math.max(0, boxWidth - rawLineWidth);
          }

          const spaceCount = chars.filter((c) => c.ch === ' ').length;
          const extraSpacePerGap =
            obj.textAlign === 'justify' && !lineObj.isLastInPara && spaceCount > 0
              ? Math.max(0, (boxWidth - rawLineWidth) / spaceCount)
              : 0;

          const baselineVy = currentVy + maxLineFontSize * 0.88;

          // Group consecutive characters with matching styles into runs
          const runs = [];
          let cursorVx = startVx;
          for (const c of chars) {
            const advance = c.w + (c.ch === ' ' ? extraSpacePerGap : 0);
            const prev = runs[runs.length - 1];
            const sameRun =
              prev &&
              prev.style.fontId === c.style.fontId &&
              prev.style.fontSize === c.style.fontSize &&
              prev.style.isBold === c.style.isBold &&
              prev.style.isItalic === c.style.isItalic &&
              prev.style.fill === c.style.fill &&
              prev.style.underline === c.style.underline &&
              prev.style.textBackgroundColor === c.style.textBackgroundColor &&
              c.ch !== ' '; // split spaces cleanly when justifying

            if (sameRun && extraSpacePerGap === 0) {
              prev.text += c.ch;
              prev.width += advance;
            } else {
              runs.push({
                text: c.ch,
                startVx: cursorVx,
                width: advance,
                style: c.style,
                font: c.font,
              });
            }
            cursorVx += advance;
          }

          // Merge adjacent runs with identical styles when not justified (cleaner PDF text streams)
          const mergedRuns = [];
          for (const r of runs) {
            const prev = mergedRuns[mergedRuns.length - 1];
            if (
              prev &&
              extraSpacePerGap === 0 &&
              prev.style.fontId === r.style.fontId &&
              prev.style.fontSize === r.style.fontSize &&
              prev.style.isBold === r.style.isBold &&
              prev.style.isItalic === r.style.isItalic &&
              prev.style.fill === r.style.fill &&
              prev.style.underline === r.style.underline &&
              prev.style.textBackgroundColor === r.style.textBackgroundColor
            ) {
              prev.text += r.text;
              prev.width += r.width;
            } else {
              mergedRuns.push(r);
            }
          }

          for (const run of mergedRuns) {
            const rSize = run.style.fontSize;
            const rColor = hexToRgbTuple(run.style.fill) || rgb(0.06, 0.09, 0.16);

            // 1. Inline text highlight rectangle behind text (never changes font or size)
            if (run.style.textBackgroundColor && run.style.textBackgroundColor !== 'transparent') {
              const hlCol = hexToRgbTuple(run.style.textBackgroundColor);
              if (hlCol) {
                const hlHeight = rSize * 1.14;
                const hlBl = rotatePointAround(
                  run.startVx,
                  baselineVy + rSize * 0.22,
                  baseLeft,
                  baseTop,
                  angle
                );
                const hlMedia = toMedia(hlBl.x, hlBl.y);
                outPage.drawRectangle({
                  x: hlMedia.x,
                  y: hlMedia.y,
                  width: Math.max(2, run.width),
                  height: hlHeight,
                  color: hlCol,
                  opacity: opacity * 0.85,
                  rotate: degrees(objAngleInMedia(angle)),
                });
              }
            }

            // 2. Text run drawing
            if (Math.abs(charSpacingPt) > 0.05) {
              let chVx = run.startVx;
              for (const ch of run.text) {
                const rv = rotatePointAround(chVx, baselineVy, baseLeft, baseTop, angle);
                const mp = toMedia(rv.x, rv.y);
                outPage.drawText(ch, {
                  x: mp.x,
                  y: mp.y,
                  size: rSize,
                  font: run.font,
                  color: rColor,
                  opacity,
                  rotate: degrees(objAngleInMedia(angle)),
                });
                chVx += run.font.widthOfTextAtSize(ch, rSize) + charSpacingPt;
              }
            } else {
              const rv = rotatePointAround(run.startVx, baselineVy, baseLeft, baseTop, angle);
              const mp = toMedia(rv.x, rv.y);
              outPage.drawText(run.text, {
                x: mp.x,
                y: mp.y,
                size: rSize,
                font: run.font,
                color: rColor,
                opacity,
                rotate: degrees(objAngleInMedia(angle)),
              });
            }

            // 3. Underline
            if (run.style.underline && run.text.trim().length > 0) {
              const ulY = baselineVy + Math.max(1.5, rSize * 0.12);
              const rs = rotatePointAround(run.startVx, ulY, baseLeft, baseTop, angle);
              const re = rotatePointAround(run.startVx + run.width, ulY, baseLeft, baseTop, angle);
              outPage.drawLine({
                start: toMedia(rs.x, rs.y),
                end: toMedia(re.x, re.y),
                thickness: Math.max(0.8, rSize * 0.06),
                color: rColor,
                opacity,
              });
            }
          }

          currentVy += maxLineFontSize * lineHeightMult;
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
