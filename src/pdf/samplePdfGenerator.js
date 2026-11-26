import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Generates a realistic 2-page PDF document in-memory (including standard text,
 * styled headers, vector shapes, and an embedded PNG chart image) so users can
 * immediately test genuine text editing, image moving/removal, and multi-page operations.
 */
export async function generateSamplePdfBytes() {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const courier = await doc.embedFont(StandardFonts.Courier);

  // Create a crisp PNG graphic on an offscreen canvas to embed as a real PDF image XObject
  const imgCanvas = document.createElement('canvas');
  imgCanvas.width = 480;
  imgCanvas.height = 280;
  const ctx = imgCanvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, 480, 280);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 480, 280);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 460, 260);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Quarterly Performance Metrics', 28, 44);

  const bars = [
    { label: 'Q1', h: 90, color: '#38bdf8' },
    { label: 'Q2', h: 130, color: '#8b5cf6' },
    { label: 'Q3', h: 112, color: '#6366f1' },
    { label: 'Q4', h: 168, color: '#22d3ee' },
  ];
  bars.forEach((b, idx) => {
    const x = 48 + idx * 102;
    const y = 230 - b.h;
    ctx.fillStyle = b.color;
    ctx.fillRect(x, y, 56, b.h);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px sans-serif';
    ctx.fillText(b.label, x + 18, 254);
  });

  const pngDataUrl = imgCanvas.toDataURL('image/png');
  const pngBytes = Uint8Array.from(atob(pngDataUrl.split(',')[1]), (c) => c.charCodeAt(0));
  const embeddedImg = await doc.embedPng(pngBytes);

  // PAGE 1
  const p1 = doc.addPage([612, 792]);
  p1.drawRectangle({ x: 0, y: 700, width: 612, height: 92, color: rgb(0.06, 0.09, 0.19) });
  p1.drawText('NEXPDF PRODUCT PROPOSAL', {
    x: 48,
    y: 742,
    size: 22,
    font: helveticaBold,
    color: rgb(0.96, 0.98, 1),
  });
  p1.drawText('Executive Summary & Architecture Brief — FY 2026', {
    x: 48,
    y: 718,
    size: 11,
    font: timesItalic,
    color: rgb(0.58, 0.85, 0.98),
  });

  p1.drawText('1. Overview & Objectives', {
    x: 48,
    y: 655,
    size: 15,
    font: helveticaBold,
    color: rgb(0.11, 0.14, 0.25),
  });
  p1.drawText(
    'Click any line of text on this document using the Edit Text tool to modify content,',
    { x: 48, y: 630, size: 11.5, font: helvetica, color: rgb(0.2, 0.24, 0.34) }
  );
  p1.drawText(
    'change font families, resize typography, or genuinely delete content from the stream.',
    { x: 48, y: 612, size: 11.5, font: helvetica, color: rgb(0.2, 0.24, 0.34) }
  );

  p1.drawText('2. Embedded Image Asset (Selectable & Movable)', {
    x: 48,
    y: 565,
    size: 15,
    font: helveticaBold,
    color: rgb(0.11, 0.14, 0.25),
  });
  p1.drawImage(embeddedImg, { x: 48, y: 345, width: 320, height: 186 });

  p1.drawText('Key Takeaways:', {
    x: 392,
    y: 505,
    size: 13,
    font: helveticaBold,
    color: rgb(0.25, 0.18, 0.65),
  });
  p1.drawText('- 48% faster workflow', { x: 392, y: 480, size: 11, font: helvetica, color: rgb(0.2, 0.24, 0.34) });
  p1.drawText('- Layout preserved', { x: 392, y: 460, size: 11, font: helvetica, color: rgb(0.2, 0.24, 0.34) });
  p1.drawText('- Stream-level edits', { x: 392, y: 440, size: 11, font: helvetica, color: rgb(0.2, 0.24, 0.34) });

  p1.drawRectangle({
    x: 48,
    y: 230,
    width: 516,
    height: 76,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.55, 0.36, 0.96),
    borderWidth: 1.5,
  });
  p1.drawText('CONTRACT ID: NX-2026-8841', {
    x: 68,
    y: 274,
    size: 12,
    font: courier,
    color: rgb(0.18, 0.2, 0.35),
  });
  p1.drawText('Approved for client review. Try highlighting or signing below.', {
    x: 68,
    y: 250,
    size: 11,
    font: helvetica,
    color: rgb(0.3, 0.35, 0.45),
  });

  p1.drawText('Authorized Signature:', {
    x: 48,
    y: 135,
    size: 11,
    font: helveticaBold,
    color: rgb(0.15, 0.18, 0.28),
  });
  p1.drawLine({
    start: { x: 48, y: 100 },
    end: { x: 260, y: 100 },
    thickness: 1,
    color: rgb(0.45, 0.5, 0.6),
  });
  p1.drawText('Page 1 of 2', {
    x: 280,
    y: 36,
    size: 9.5,
    font: helvetica,
    color: rgb(0.45, 0.5, 0.6),
  });

  // PAGE 2
  const p2 = doc.addPage([612, 792]);
  p2.drawText('ANNEX A — TECHNICAL SPECIFICATIONS', {
    x: 48,
    y: 730,
    size: 18,
    font: helveticaBold,
    color: rgb(0.08, 0.12, 0.25),
  });
  p2.drawText('Use Page Thumbnails to duplicate, rotate, reorder, or add blank pages.', {
    x: 48,
    y: 696,
    size: 11.5,
    font: helvetica,
    color: rgb(0.25, 0.3, 0.4),
  });

  const rows = [
    ['Module', 'Engine', 'Status'],
    ['PDF Rendering', 'PDF.js High-DPI Canvas', 'Active'],
    ['Content Stream Editor', 'pdf-lib Stream Tokenizer', 'Active'],
    ['Object Manipulation', 'Fabric.js 72-DPI Canonical', 'Active'],
    ['Local Persistence', 'IndexedDB Project Store', 'Active'],
  ];

  rows.forEach((row, rIdx) => {
    const y = 630 - rIdx * 36;
    p2.drawRectangle({
      x: 48,
      y: y - 10,
      width: 516,
      height: 32,
      color: rIdx === 0 ? rgb(0.1, 0.14, 0.28) : rIdx % 2 === 0 ? rgb(0.96, 0.97, 0.99) : rgb(1, 1, 1),
      borderColor: rgb(0.84, 0.87, 0.93),
      borderWidth: 0.75,
    });
    const textColor = rIdx === 0 ? rgb(1, 1, 1) : rgb(0.15, 0.18, 0.28);
    const f = rIdx === 0 ? helveticaBold : helvetica;
    p2.drawText(row[0], { x: 60, y, size: 10.5, font: f, color: textColor });
    p2.drawText(row[1], { x: 220, y, size: 10.5, font: f, color: textColor });
    p2.drawText(row[2], { x: 465, y, size: 10.5, font: f, color: textColor });
  });

  p2.drawText('Page 2 of 2', {
    x: 280,
    y: 36,
    size: 9.5,
    font: helvetica,
    color: rgb(0.45, 0.5, 0.6),
  });

  return doc.save();
}
