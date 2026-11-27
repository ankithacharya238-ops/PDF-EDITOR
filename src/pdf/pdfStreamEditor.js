import { PDFArray, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import pako from 'pako';

function bytesToLatin1(bytes) {
  let out = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return out;
}

function latin1ToBytes(str) {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    out[i] = str.charCodeAt(i) & 0xff;
  }
  return out;
}

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

function decodePdfLiteralString(token) {
  // token starts with ( and ends with )
  const inner = token.slice(1, -1);
  let res = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '\\') {
      const next = inner[i + 1];
      if (next === 'n') {
        res += '\n';
        i++;
      } else if (next === 'r') {
        res += '\r';
        i++;
      } else if (next === 't') {
        res += '\t';
        i++;
      } else if (next === '(' || next === ')' || next === '\\') {
        res += next;
        i++;
      } else if (/[0-7]/.test(next || '')) {
        const oct = inner.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)[0];
        res += String.fromCharCode(parseInt(oct, 8));
        i += oct.length;
      } else {
        i++;
      }
    } else {
      res += ch;
    }
  }
  return res;
}

function decodePdfHexString(token) {
  const hex = token.slice(1, -1).replace(/\s+/g, '');
  const padded = hex.length % 2 === 1 ? `${hex}0` : hex;
  let ascii = '';
  const bytes = [];
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(parseInt(padded.slice(i, i + 2), 16));
  }
  // Support 1-byte WinAnsi and simple 2-byte big-endian ASCII (00 XX)
  const looksTwoByte = bytes.length >= 4 && bytes.length % 2 === 0 && bytes[0] === 0 && bytes[2] === 0;
  if (looksTwoByte) {
    for (let i = 0; i < bytes.length; i += 2) {
      const code = (bytes[i] << 8) | bytes[i + 1];
      if (code >= 32 && code <= 126) ascii += String.fromCharCode(code);
    }
  } else {
    for (const b of bytes) {
      if (b >= 32 && b <= 126) ascii += String.fromCharCode(b);
    }
  }
  return ascii;
}

/**
 * Tokenizes a PDF content stream into atomic tokens with exact character offsets
 * so matched operators can be surgically omitted without corrupting surrounding graphics.
 */
function tokenizeContentStream(src) {
  const tokens = [];
  const len = src.length;
  let i = 0;

  while (i < len) {
    const ch = src[i];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\0') {
      i++;
      continue;
    }

    // Comment
    if (ch === '%') {
      const start = i;
      while (i < len && src[i] !== '\n' && src[i] !== '\r') i++;
      tokens.push({ type: 'comment', value: src.slice(start, i), start, end: i });
      continue;
    }

    // Literal string (...)
    if (ch === '(') {
      const start = i;
      let depth = 1;
      i++;
      while (i < len && depth > 0) {
        if (src[i] === '\\') {
          i += 2;
          continue;
        }
        if (src[i] === '(') depth++;
        else if (src[i] === ')') depth--;
        i++;
      }
      const value = src.slice(start, i);
      tokens.push({ type: 'string', value, decoded: decodePdfLiteralString(value), start, end: i });
      continue;
    }

    // Dict << >> or Hex string <...>
    if (ch === '<') {
      if (src[i + 1] === '<') {
        tokens.push({ type: 'dictStart', value: '<<', start: i, end: i + 2 });
        i += 2;
      } else {
        const start = i;
        i++;
        while (i < len && src[i] !== '>') i++;
        if (i < len) i++;
        const value = src.slice(start, i);
        tokens.push({ type: 'hex', value, decoded: decodePdfHexString(value), start, end: i });
      }
      continue;
    }

    if (ch === '>') {
      if (src[i + 1] === '>') {
        tokens.push({ type: 'dictEnd', value: '>>', start: i, end: i + 2 });
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (ch === '[' || ch === ']') {
      tokens.push({ type: 'bracket', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }

    // Name /Foo
    if (ch === '/') {
      const start = i;
      i++;
      while (i < len && !/[\s()<>[\]{}/%]/.test(src[i])) i++;
      tokens.push({ type: 'name', value: src.slice(start, i), start, end: i });
      continue;
    }

    // Number or operator word
    const start = i;
    while (i < len && !/[\s()<>[\]{}/%]/.test(src[i])) i++;
    const word = src.slice(start, i);
    const isNum = /^[+-]?(\d+\.?\d*|\.\d+)$/.test(word);
    tokens.push({
      type: isNum ? 'number' : 'op',
      value: word,
      num: isNum ? parseFloat(word) : undefined,
      start,
      end: i,
    });

    // Skip inline image binary payload between ID and EI
    if (!isNum && word === 'ID') {
      const eiMatch = src.slice(i).search(/\sEI(?:\s|$)/);
      if (eiMatch !== -1) {
        i = i + eiMatch + 3;
      }
    }
  }

  return tokens;
}

function getDecodedPageContentString(pdfDoc, page) {
  const contents = page.node.Contents();
  if (!contents) return '';

  const streams = [];
  if (contents instanceof PDFRawStream) {
    streams.push(contents);
  } else if (contents instanceof PDFArray) {
    for (let i = 0; i < contents.size(); i++) {
      const item = contents.lookup(i);
      if (item instanceof PDFRawStream) streams.push(item);
    }
  }

  const parts = [];
  for (const st of streams) {
    try {
      const decoded = decodePDFRawStream(st).decode();
      parts.push(bytesToLatin1(decoded));
    } catch {
      try {
        const raw = st.getContents();
        parts.push(bytesToLatin1(pako.inflate(raw)));
      } catch {
        parts.push(bytesToLatin1(st.getContents()));
      }
    }
  }
  return parts.join('\n');
}

/**
 * Surgically strips matched text operators (Tj, TJ, ', ") and image Do operators
 * from the PDF page's content stream using exact PDF user-space coordinate & text matching.
 * Returns lists of matched/unmatched items so the exporter only uses background fallback
 * when an item could not be reached in the top-level stream (e.g. Form XObjects).
 */
export function editPageContentStream(pdfDoc, page, { removedRawTextItems = [], removedImages = [] }) {
  if (removedRawTextItems.length === 0 && removedImages.length === 0) {
    return { matchedTextCount: 0, unmatchedTextItems: [], matchedImageCount: 0, unmatchedImages: [] };
  }

  const src = getDecodedPageContentString(pdfDoc, page);
  if (!src) {
    return {
      matchedTextCount: 0,
      unmatchedTextItems: removedRawTextItems,
      matchedImageCount: 0,
      unmatchedImages: removedImages,
    };
  }

  const tokens = tokenizeContentStream(src);
  const removals = []; // Array of { start, end, replacement }

  const matchedTextIds = new Set();
  const matchedImageIds = new Set();

  let ctm = [1, 0, 0, 1, 0, 0];
  const ctmStack = [];
  let inText = false;
  let tm = [1, 0, 0, 1, 0, 0];
  let tlm = [1, 0, 0, 1, 0, 0];
  let leading = 0;

  let operandStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'comment') continue;

    if (tok.type !== 'op') {
      operandStack.push(tok);
      continue;
    }

    const op = tok.value;

    // Handle inline image ID ... BI ... EI safely (skip binary blob)
    if (op === 'BI') {
      operandStack = [];
      continue;
    }

    if (op === 'q') {
      ctmStack.push([...ctm]);
    } else if (op === 'Q') {
      ctm = ctmStack.pop() || [1, 0, 0, 1, 0, 0];
    } else if (op === 'cm' && operandStack.length >= 6) {
      const m = operandStack.slice(-6).map((t) => t.num ?? 0);
      ctm = multiplyMatrices(ctm, m);
    } else if (op === 'BT') {
      inText = true;
      tm = [1, 0, 0, 1, 0, 0];
      tlm = [1, 0, 0, 1, 0, 0];
    } else if (op === 'ET') {
      inText = false;
    } else if (inText && op === 'TL' && operandStack.length >= 1) {
      leading = operandStack[operandStack.length - 1].num ?? 0;
    } else if (inText && op === 'Tm' && operandStack.length >= 6) {
      const m = operandStack.slice(-6).map((t) => t.num ?? 0);
      tm = [...m];
      tlm = [...m];
    } else if (inText && (op === 'Td' || op === 'TD') && operandStack.length >= 2) {
      const tx = operandStack[operandStack.length - 2].num ?? 0;
      const ty = operandStack[operandStack.length - 1].num ?? 0;
      if (op === 'TD') leading = -ty;
      tlm = multiplyMatrices(tlm, [1, 0, 0, 1, tx, ty]);
      tm = [...tlm];
    } else if (inText && op === 'T*') {
      tlm = multiplyMatrices(tlm, [1, 0, 0, 1, 0, -leading]);
      tm = [...tlm];
    } else if (inText && (op === 'Tj' || op === 'TJ' || op === "'" || op === '"')) {
      if (op === "'" || op === '"') {
        tlm = multiplyMatrices(tlm, [1, 0, 0, 1, 0, -leading]);
        tm = [...tlm];
      }

      const fullMatrix = multiplyMatrices(ctm, tm);
      const curX = fullMatrix[4];
      const curY = fullMatrix[5];

      // Extract readable ASCII text from operands for secondary verification
      let opStart = tok.start;
      let decodedPieces = '';

      if (op === 'TJ') {
        const openIdx = operandStack.findLastIndex((t) => t.type === 'bracket' && t.value === '[');
        if (openIdx !== -1) {
          opStart = operandStack[openIdx].start;
          for (let k = openIdx + 1; k < operandStack.length; k++) {
            if (operandStack[k].type === 'string' || operandStack[k].type === 'hex') {
              decodedPieces += operandStack[k].decoded || '';
            }
          }
        }
      } else if (op === 'Tj' && operandStack.length >= 1) {
        const strTok = operandStack[operandStack.length - 1];
        opStart = strTok.start;
        decodedPieces = strTok.decoded || '';
      } else if (op === "'" && operandStack.length >= 1) {
        const strTok = operandStack[operandStack.length - 1];
        opStart = strTok.start;
        decodedPieces = strTok.decoded || '';
      } else if (op === '"' && operandStack.length >= 3) {
        opStart = operandStack[operandStack.length - 3].start;
        decodedPieces = operandStack[operandStack.length - 1].decoded || '';
      }

      // Check against any target removedRawTextItems (match all items covered by this Tj/TJ operator)
      const hits = removedRawTextItems.filter((item) => {
        const dx = Math.abs(curX - item.pdfX);
        const dy = Math.abs(curY - item.pdfY);
        const coordClose = dx <= Math.max(10, item.pdfWidth * 0.25) && dy <= Math.max(5, item.pdfFontSize * 0.45);
        const textClose =
          decodedPieces &&
          item.str &&
          (decodedPieces.includes(item.str.trim()) || item.str.trim().includes(decodedPieces.trim()));
        const insideTjRun =
          op === 'TJ' &&
          dy <= Math.max(5, item.pdfFontSize * 0.45) &&
          item.pdfX >= curX - 6 &&
          decodedPieces &&
          item.str &&
          decodedPieces.includes(item.str.trim());
        return (coordClose && (textClose || !decodedPieces)) || (dy <= 3 && dx <= 8) || insideTjRun;
      });

      if (hits.length > 0) {
        hits.forEach((h) => matchedTextIds.add(h._uid));
        // Preserve leading advance if ' or "
        const replacement = op === "'" || op === '"' ? ' T* ' : ' ';
        removals.push({ start: opStart, end: tok.end, replacement });
      }
    } else if (op === 'Do' && operandStack.length >= 1) {
      const nameTok = operandStack[operandStack.length - 1];
      if (nameTok.type === 'name') {
        const resName = nameTok.value.slice(1); // strip leading /
        // Compute CTM image bounding box center
        const corners = [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([ux, uy]) => [
          ctm[0] * ux + ctm[2] * uy + ctm[4],
          ctm[1] * ux + ctm[3] * uy + ctm[5],
        ]);
        const minX = Math.min(...corners.map((c) => c[0]));
        const minY = Math.min(...corners.map((c) => c[1]));
        const w = Math.max(...corners.map((c) => c[0])) - minX;
        const h = Math.max(...corners.map((c) => c[1])) - minY;

        const hitImg = removedImages.find((img) => {
          if (matchedImageIds.has(img.id)) return false;
          const sameName = img.resourceName && img.resourceName === resName;
          const posClose =
            Math.abs(minX - img.pdfX) <= 12 &&
            Math.abs(minY - img.pdfY) <= 12 &&
            Math.abs(w - img.pdfWidth) <= 18 &&
            Math.abs(h - img.pdfHeight) <= 18;
          return posClose || (sameName && Math.abs(minY - img.pdfY) <= 30);
        });

        if (hitImg) {
          matchedImageIds.add(hitImg.id);
          removals.push({ start: nameTok.start, end: tok.end, replacement: ' ' });
        }
      }
    }

    operandStack = [];
  }

  if (removals.length > 0) {
    // Apply removals in reverse character offset order
    removals.sort((a, b) => b.start - a.start);
    let updated = src;
    for (const r of removals) {
      updated = updated.slice(0, r.start) + r.replacement + updated.slice(r.end);
    }

    const newStream = pdfDoc.context.flateStream(latin1ToBytes(updated));
    const streamRef = pdfDoc.context.register(newStream);
    page.node.set(PDFName.of('Contents'), streamRef);
  }

  return {
    matchedTextCount: matchedTextIds.size,
    unmatchedTextItems: removedRawTextItems.filter((item) => !matchedTextIds.has(item._uid)),
    matchedImageCount: matchedImageIds.size,
    unmatchedImages: removedImages.filter((img) => !matchedImageIds.has(img.id)),
  };
}
