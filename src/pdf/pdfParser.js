import { pdfjsLib } from './pdfjsSetup.js';
import { guessFontInfo } from './fontUtils.js';

export { guessFontInfo };

const { OPS, Util } = pdfjsLib;

function multiplyMatrices(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function imageObjectToDataUrl(imgObj) {
  if (!imgObj) return null;
  try {
    const { width, height, data, kind, bitmap } = imgObj;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (bitmap) {
      ctx.drawImage(bitmap, 0, 0);
      return canvas.toDataURL('image/png');
    }

    if (!data || !width || !height) return null;

    const imageData = ctx.createImageData(width, height);
    const dst = imageData.data;

    if (data.length === width * height * 4) {
      dst.set(data);
    } else if (data.length === width * height * 3) {
      for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
        dst[j] = data[i];
        dst[j + 1] = data[i + 1];
        dst[j + 2] = data[i + 2];
        dst[j + 3] = 255;
      }
    } else if (data.length === width * height) {
      for (let i = 0, j = 0; i < data.length; i++, j += 4) {
        const v = data[i];
        dst[j] = v;
        dst[j + 1] = v;
        dst[j + 2] = v;
        dst[j + 3] = 255;
      }
    } else if (kind === 1) {
      let bitIdx = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const byte = data[bitIdx >> 3];
          const bit = (byte >> (7 - (bitIdx & 7))) & 1;
          const p = (y * width + x) * 4;
          const v = bit ? 255 : 0;
          dst[p] = v;
          dst[p + 1] = v;
          dst[p + 2] = v;
          dst[p + 3] = 255;
          bitIdx++;
        }
      }
    } else {
      return null;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Renders a PDF.js page onto a high-DPI HTML canvas without altering layout.
 */
export async function renderPdfPageToCanvas(page, canvas, scale = 1, sharpScale = 1) {
  const dpr = Math.min(3, Math.max(window.devicePixelRatio || 1, sharpScale));
  const viewport = page.getViewport({ scale });
  const renderViewport = page.getViewport({ scale: scale * dpr });

  canvas.width = Math.floor(renderViewport.width);
  canvas.height = Math.floor(renderViewport.height);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvasContext: ctx,
    viewport: renderViewport,
  });
  await renderTask.promise;
  return viewport;
}

/**
 * Extracts editable grouped text blocks (with exact PDF coordinates, weight, & font metadata)
 * and existing embedded image XObjects (with bounding boxes & extracted PNG data URLs).
 */
export async function extractPageMetadata(page, pageIndex) {
  const viewport = page.getViewport({ scale: 1 });
  const opList = await page.getOperatorList();
  const textContent = await page.getTextContent({ includeMarkedContent: false });

  const images = [];
  const ctmStack = [];
  let ctm = [1, 0, 0, 1, 0, 0];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    if (fn === OPS.save) {
      ctmStack.push([...ctm]);
    } else if (fn === OPS.restore) {
      ctm = ctmStack.pop() || [1, 0, 0, 1, 0, 0];
    } else if (fn === OPS.transform) {
      ctm = multiplyMatrices(ctm, args);
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
      const imgName = args[0];
      const corners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([ux, uy]) => {
        const px = ctm[0] * ux + ctm[2] * uy + ctm[4];
        const py = ctm[1] * ux + ctm[3] * uy + ctm[5];
        return viewport.convertToViewportPoint(px, py);
      });

      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      const width = Math.max(...xs) - left;
      const height = Math.max(...ys) - top;

      const pdfCorners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([ux, uy]) => [
        ctm[0] * ux + ctm[2] * uy + ctm[4],
        ctm[1] * ux + ctm[3] * uy + ctm[5],
      ]);
      const pdfX = Math.min(...pdfCorners.map((c) => c[0]));
      const pdfY = Math.min(...pdfCorners.map((c) => c[1]));
      const pdfWidth = Math.max(...pdfCorners.map((c) => c[0])) - pdfX;
      const pdfHeight = Math.max(...pdfCorners.map((c) => c[1])) - pdfY;

      if (width > 8 && height > 8) {
        let dataUrl = null;
        try {
          const obj = page.objs.has(imgName) ? page.objs.get(imgName) : null;
          dataUrl = imageObjectToDataUrl(obj);
        } catch {
          dataUrl = null;
        }

        images.push({
          id: `pdf-img-${pageIndex}-${images.length}`,
          pageIndex,
          resourceName: typeof imgName === 'string' ? imgName : '',
          left,
          top,
          width,
          height,
          pdfX,
          pdfY,
          pdfWidth,
          pdfHeight,
          dataUrl,
        });
      }
    }
  }

  const rawItems = [];
  for (const item of textContent.items) {
    if (!item.str || !item.str.trim()) continue;
    const tx = Util.transform(viewport.transform, item.transform);
    const fontSize = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12;
    const vpFontSize = Math.hypot(tx[0], tx[1]) || fontSize;

    let realFontName = item.fontName || '';
    try {
      if (page.commonObjs.has(item.fontName)) {
        const fontObj = page.commonObjs.get(item.fontName);
        if (fontObj?.name) realFontName = fontObj.name;
      }
    } catch {
      // ignore
    }

    const fontInfo = guessFontInfo(realFontName);
    const width = Math.max(item.width || 4, 4);
    const height = Math.max(vpFontSize * 1.15, 10);
    const left = tx[4];
    const top = tx[5] - vpFontSize * 0.88;

    rawItems.push({
      str: item.str,
      left,
      top,
      width,
      height,
      fontSize: vpFontSize,
      baselineY: tx[5],
      pdfX: item.transform[4],
      pdfY: item.transform[5],
      pdfWidth: item.width || width,
      pdfFontSize: fontSize,
      fontName: item.fontName,
      fontInfo,
    });
  }

  rawItems.sort((a, b) => {
    if (Math.abs(a.baselineY - b.baselineY) > 4) return a.baselineY - b.baselineY;
    return a.left - b.left;
  });

  const textBlocks = [];
  for (const item of rawItems) {
    const prev = textBlocks[textBlocks.length - 1];
    const sameBaseline =
      prev &&
      Math.abs(prev.baselineY - item.baselineY) <= Math.max(prev.fontSize, item.fontSize) * 0.35;
    const sameSize = prev && Math.abs(prev.fontSize - item.fontSize) <= 2;
    const prevRight = prev ? prev.left + prev.width : 0;
    const gap = item.left - prevRight;
    const closeHorizontally = prev && gap >= -4 && gap <= item.fontSize * 2.2;

    if (sameBaseline && sameSize && closeHorizontally) {
      const spacer = gap > item.fontSize * 0.25 && !prev.text.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '';
      prev.text += spacer + item.str;
      prev.width = Math.max(prev.left + prev.width, item.left + item.width) - prev.left;
      prev.top = Math.min(prev.top, item.top);
      prev.height = Math.max(prev.height, item.height);
      prev.rawItems.push(item);
    } else {
      textBlocks.push({
        id: `pdf-txt-${pageIndex}-${textBlocks.length}`,
        pageIndex,
        text: item.str,
        left: item.left,
        top: item.top,
        width: item.width,
        height: item.height,
        baselineY: item.baselineY,
        fontSize: Math.round(item.fontSize * 10) / 10,
        pdfX: item.pdfX,
        pdfY: item.pdfY,
        fontInfo: item.fontInfo,
        rawItems: [item],
      });
    }
  }

  return {
    width: viewport.width,
    height: viewport.height,
    rotation: page.rotate || 0,
    textBlocks,
    images,
  };
}
