import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, decodePDFRawStream, PDFRawStream, PDFArray, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { editPageContentStream } from '../src/pdf/pdfStreamEditor.js';
import { exportEditedPdf } from '../src/pdf/pdfExporter.js';

function decodeAllPageStreams(page) {
  const contents = page.node.Contents();
  const streams = [];
  if (contents instanceof PDFRawStream) streams.push(contents);
  else if (contents instanceof PDFArray) {
    for (let i = 0; i < contents.size(); i++) {
      const item = contents.lookup(i);
      if (item instanceof PDFRawStream) streams.push(item);
    }
  }
  return streams
    .map((s) => Buffer.from(decodePDFRawStream(s).decode()).toString('latin1'))
    .join('\n');
}

function streamContainsText(stream, str) {
  if (stream.includes(str)) return true;
  const hex = Buffer.from(str, 'ascii').toString('hex').toUpperCase();
  return stream.toUpperCase().includes(hex);
}

async function extractPdfJsText(pdfBytes) {
  const doc = await pdfjsLib.getDocument({ data: pdfBytes.slice(), verbosity: 0 }).promise;
  const pagesText = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    pagesText.push(tc.items.map((it) => it.str).join(' '));
  }
  return { numPages: doc.numPages, pagesText };
}

async function runTests() {
  console.log('1. Creating synthetic multi-page PDF with text and 1x1 PNG image...');
  const srcDoc = await PDFDocument.create();
  const font = await srcDoc.embedFont(StandardFonts.Helvetica);

  const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const pngBytes = Buffer.from(tinyPngBase64, 'base64');
  const embeddedImg = await srcDoc.embedPng(pngBytes);

  const p1 = srcDoc.addPage([612, 792]);
  p1.drawText('REMOVE_THIS_LINE', { x: 72, y: 700, size: 16, font, color: rgb(0, 0, 0) });
  p1.drawText('KEEP_THIS_ORIGINAL_TEXT', { x: 72, y: 660, size: 14, font, color: rgb(0, 0, 0) });
  p1.drawImage(embeddedImg, { x: 72, y: 500, width: 120, height: 80 });

  const p2 = srcDoc.addPage([612, 792]);
  p2.drawText('SECOND_PAGE_INTACT', { x: 72, y: 700, size: 14, font });

  const originalBytes = await srcDoc.save();

  console.log('2. Testing direct content-stream removal via editPageContentStream...');
  const testDoc = await PDFDocument.load(originalBytes);
  const testPage1 = testDoc.getPage(0);
  const streamResult = editPageContentStream(testDoc, testPage1, {
    removedRawTextItems: [
      {
        _uid: 'txt-0',
        str: 'REMOVE_THIS_LINE',
        pdfX: 72,
        pdfY: 700,
        pdfWidth: 160,
        pdfFontSize: 16,
      },
    ],
    removedImages: [
      {
        id: 'img-0',
        resourceName: '',
        pdfX: 72,
        pdfY: 500,
        pdfWidth: 120,
        pdfHeight: 80,
      },
    ],
  });

  assert.equal(streamResult.matchedTextCount, 1, 'Expected 1 matched text operator in stream');
  assert.equal(streamResult.matchedImageCount, 1, 'Expected 1 matched image Do operator in stream');

  const modifiedStream = decodeAllPageStreams(testPage1);
  assert.ok(!streamContainsText(modifiedStream, 'REMOVE_THIS_LINE'), 'Removed text must not remain in content stream');
  assert.ok(streamContainsText(modifiedStream, 'KEEP_THIS_ORIGINAL_TEXT'), 'Untouched text must stay in content stream');
  assert.ok(!/\bDo\b/.test(modifiedStream), 'Removed image Do operator must not remain in content stream');

  console.log('3. Testing full exportEditedPdf (text, shapes, rounded rect, path w/ pathOffset, rotated page, blank page)...');
  const pageMetadataMap = {
    0: {
      width: 612,
      height: 792,
      textBlocks: [
        {
          id: 'block-0',
          rawItems: [
            {
              str: 'REMOVE_THIS_LINE',
              pdfX: 72,
              pdfY: 700,
              pdfWidth: 160,
              pdfFontSize: 16,
            },
          ],
        },
      ],
      images: [
        {
          id: 'img-0',
          resourceName: '',
          pdfX: 72,
          pdfY: 500,
          pdfWidth: 120,
          pdfHeight: 80,
        },
      ],
    },
    1: { width: 612, height: 792, textBlocks: [], images: [] },
  };

  const pagesState = [
    {
      id: 'p1',
      isBlank: false,
      sourcePageIndex: 0,
      width: 612,
      height: 792,
      rotationDelta: 0,
      removedTextIds: ['block-0'],
      removedImageIds: ['img-0'],
      fabricJson: {
        version: '5.3.0',
        objects: [
          {
            type: 'textbox',
            text: 'GENUINELY_REPLACED_TEXT',
            left: 72,
            top: 76,
            width: 260,
            fontSize: 16,
            scaleX: 1,
            scaleY: 1,
            fill: '#1e293b',
            nexFontId: 'Helvetica',
            fontWeight: 'bold',
            underline: true,
          },
          {
            type: 'textbox',
            text: 'Justified multi word line wrapping across the full width box',
            left: 72,
            top: 130,
            width: 150,
            fontSize: 12,
            scaleX: 1,
            scaleY: 1,
            fill: '#0f172a',
            nexFontId: 'Times',
            textAlign: 'justify',
          },
          {
            type: 'image',
            src: `data:image/png;base64,${tinyPngBase64}`,
            left: 200,
            top: 220,
            width: 1,
            height: 1,
            scaleX: 100,
            scaleY: 60,
            opacity: 0.9,
          },
          {
            type: 'rect',
            left: 50,
            top: 320,
            width: 120,
            height: 40,
            rx: 12,
            ry: 12,
            scaleX: 1,
            scaleY: 1,
            fill: '#facc15',
            stroke: '#3b82f6',
            strokeWidth: 2,
            opacity: 0.5,
          },
          {
            type: 'ellipse',
            left: 220,
            top: 320,
            rx: 40,
            ry: 25,
            scaleX: 1,
            scaleY: 1,
            fill: 'transparent',
            stroke: '#8b5cf6',
            strokeWidth: 2,
          },
          {
            type: 'triangle',
            left: 330,
            top: 320,
            width: 60,
            height: 55,
            scaleX: 1,
            scaleY: 1,
            fill: '#22d3ee',
            stroke: '#0f172a',
            strokeWidth: 1.5,
          },
          {
            type: 'path',
            left: 8,
            top: 18,
            width: 100,
            height: 50,
            scaleX: 1,
            scaleY: 1,
            stroke: '#ec4899',
            strokeWidth: 4,
            fill: 'transparent',
            pathOffset: { x: 60, y: 45 },
            path: [['M', 10, 20], ['L', 110, 20], ['L', 110, 70]],
          },
        ],
      },
    },
    {
      id: 'blank-mid',
      isBlank: true,
      sourcePageIndex: -1,
      width: 612,
      height: 792,
      rotationDelta: 0,
      removedTextIds: [],
      removedImageIds: [],
      fabricJson: {
        version: '5.3.0',
        objects: [
          {
            type: 'textbox',
            text: 'BLANK_PAGE_CONTENT',
            left: 100,
            top: 100,
            width: 200,
            fontSize: 14,
            scaleX: 1,
            scaleY: 1,
            fill: '#0f172a',
            nexFontId: 'Courier',
          },
        ],
      },
    },
    {
      id: 'p2',
      isBlank: false,
      sourcePageIndex: 1,
      width: 612,
      height: 792,
      rotationDelta: 90,
      removedTextIds: [],
      removedImageIds: [],
      fabricJson: {
        version: '5.3.0',
        objects: [
          {
            type: 'textbox',
            text: 'ROTATED_PAGE_NOTE',
            left: 100,
            top: 80,
            width: 200,
            fontSize: 14,
            scaleX: 1,
            scaleY: 1,
            fill: '#3b82f6',
            nexFontId: 'Helvetica',
          },
        ],
      },
    },
  ];

  const { bytes: exportedBytes, stats } = await exportEditedPdf({
    originalPdfBytes: originalBytes,
    pagesState,
    pageMetadataMap,
  });

  assert.equal(stats.totalPages, 3);
  assert.equal(stats.streamRemovedText, 1);
  assert.equal(stats.streamRemovedImages, 1);
  assert.equal(stats.fallbackMaskedItems, 0);
  assert.equal(stats.drawnObjects, 9);

  const reloaded = await PDFDocument.load(exportedBytes);
  assert.equal(reloaded.getPageCount(), 3, 'Exported PDF should have 3 pages');
  assert.equal(reloaded.getPage(2).getRotation().angle, 90, 'Page 3 rotation should be 90 degrees');

  console.log('4. Re-parsing exported PDF with PDF.js to confirm visual text fidelity...');
  const parsed = await extractPdfJsText(exportedBytes);
  assert.equal(parsed.numPages, 3);
  assert.ok(!parsed.pagesText[0].includes('REMOVE_THIS_LINE'), 'PDF.js must NOT find deleted original text');
  assert.ok(parsed.pagesText[0].includes('KEEP_THIS_ORIGINAL_TEXT'), 'PDF.js must still find untouched original text');
  assert.ok(parsed.pagesText[0].includes('GENUINELY_REPLACED_TEXT'), 'PDF.js must extract newly replaced text');
  assert.ok(parsed.pagesText[1].includes('BLANK_PAGE_CONTENT'), 'PDF.js must extract blank page text');
  assert.ok(parsed.pagesText[2].includes('SECOND_PAGE_INTACT'), 'PDF.js must extract page 3 original text');
  assert.ok(parsed.pagesText[2].includes('ROTATED_PAGE_NOTE'), 'PDF.js must extract text added on rotated page');

  console.log('All NexPDF end-to-end engine + PDF.js round-trip tests passed:', stats);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
