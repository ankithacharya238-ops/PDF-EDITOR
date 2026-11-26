import assert from 'node:assert/strict';
import { fabric } from 'fabric';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  DEFAULT_TEXT_STYLE,
  FONT_CATEGORIES,
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  SHARPENING_PRESETS,
  resolveFontOption,
} from '../src/config/editorConfig.js';
import { guessFontInfo } from '../src/pdf/fontUtils.js';
import { exportEditedPdf } from '../src/pdf/pdfExporter.js';

async function runFontTests() {
  console.log('1. Verifying complete categorized font library...');
  const requiredCategories = ['sans-serif', 'modern', 'serif', 'monospace', 'handwritten', 'fantasy'];
  for (const cat of requiredCategories) {
    assert.ok(FONT_CATEGORIES.some((c) => c.id === cat), `Missing category ${cat}`);
    const inCat = FONT_OPTIONS.filter((f) => f.category === cat);
    assert.ok(inCat.length >= 3, `Expected at least 3 fonts in ${cat}, found ${inCat.length}`);
  }

  const requiredFamilies = [
    'Times New Roman',
    'Arial',
    'Roboto',
    'Poppins',
    'Inter',
    'Helvetica',
    'Georgia',
    'Courier New',
    'JetBrains Mono',
    'Caveat',
    'Dancing Script',
    'Orbitron',
    'Playfair Display',
  ];
  for (const name of requiredFamilies) {
    const resolved = resolveFontOption(name);
    assert.equal(resolved.id, name, `Expected resolveFontOption(${name}) to match`);
    assert.ok(resolved.cssFamily.length > 0);
    assert.ok(resolved.pdfStandard.normal && resolved.pdfStandard.bold && resolved.pdfStandard.italic && resolved.pdfStandard.boldItalic);
  }
  assert.ok(FONT_WEIGHT_OPTIONS.length >= 8, 'Expected 8 font weight options (100-900)');

  console.log('2. Verifying font sharpening presets...');
  const off = SHARPENING_PRESETS.find((s) => s.id === 'off');
  const crisp = SHARPENING_PRESETS.find((s) => s.id === 'crisp');
  const ultra = SHARPENING_PRESETS.find((s) => s.id === 'ultra');
  assert.equal(off.disableCache, false);
  assert.equal(crisp.disableCache, true);
  assert.equal(crisp.scale, 2);
  assert.equal(ultra.disableCache, true);
  assert.equal(ultra.scale, 3);

  console.log('3. Verifying PDF font & weight detection (guessFontInfo)...');
  const f1 = guessFontInfo('ABCDEF+Roboto-BoldItalic');
  assert.equal(f1.mappedFamily, 'Roboto');
  assert.equal(f1.fontWeight, '700');
  assert.equal(f1.isBold, true);
  assert.equal(f1.isItalic, true);
  assert.equal(f1.isEmbeddedSubset, true);

  const f2 = guessFontInfo('GHIJKL+Poppins-SemiBold');
  assert.equal(f2.mappedFamily, 'Poppins');
  assert.equal(f2.fontWeight, '600');
  assert.equal(f2.isBold, true);

  const f3 = guessFontInfo('TimesNewRomanPS-BoldMT');
  assert.equal(f3.mappedFamily, 'Times New Roman');
  assert.equal(f3.fontWeight, '700');

  console.log('4. Verifying formatting preservation during Fabric.Textbox text edit & Reset...');
  // Provide minimal 2D text measuring context for Node JSDOM
  fabric.Textbox.prototype.getMeasuringContext = function () {
    return {
      font: '',
      textBaseline: 'alphabetic',
      measureText: (txt = '') => ({ width: txt.length * 8 }),
      save: () => {},
      restore: () => {},
    };
  };
  const poppins = resolveFontOption('Poppins');
  const originalFmt = {
    nexFontId: 'Poppins',
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    underline: true,
    fill: '#7c3aed',
    textAlign: 'center',
    lineHeight: 1.35,
    charSpacing: 40,
  };

  const tb = new fabric.Textbox('Original Heading', {
    left: 50,
    top: 60,
    width: 240,
    fontFamily: poppins.cssFamily,
    nexFontId: poppins.id,
    fontSize: originalFmt.fontSize,
    fontWeight: originalFmt.fontWeight,
    fontStyle: originalFmt.fontStyle,
    underline: originalFmt.underline,
    fill: originalFmt.fill,
    textAlign: originalFmt.textAlign,
    lineHeight: originalFmt.lineHeight,
    charSpacing: originalFmt.charSpacing,
    nexOriginalFormat: originalFmt,
    objectCaching: !ultra.disableCache,
  });

  // Simulate editing text content — formatting must NOT reset to default
  tb.styles = {};
  tb.set({ text: 'Edited Heading Without Losing Style' });
  assert.equal(tb.nexFontId, 'Poppins');
  assert.equal(tb.fontFamily, poppins.cssFamily);
  assert.equal(tb.fontSize, 22);
  assert.equal(tb.fontWeight, '600');
  assert.equal(tb.fontStyle, 'italic');
  assert.equal(tb.fill, '#7c3aed');
  assert.equal(tb.objectCaching, false, 'Sharpening must keep objectCaching disabled');

  // Mutate and test Reset to Original/Default
  tb.set({ fontSize: 40, fill: '#ef4444', fontWeight: '900' });
  const resetBase = tb.nexOriginalFormat || DEFAULT_TEXT_STYLE;
  tb.set({
    nexFontId: resetBase.nexFontId,
    fontFamily: resolveFontOption(resetBase.nexFontId).cssFamily,
    fontSize: resetBase.fontSize,
    fontWeight: resetBase.fontWeight,
    fontStyle: resetBase.fontStyle,
    underline: resetBase.underline,
    fill: resetBase.fill,
  });
  assert.equal(tb.text, 'Edited Heading Without Losing Style', 'Reset formatting keeps edited text');
  assert.equal(tb.fontSize, 22);
  assert.equal(tb.fill, '#7c3aed');
  assert.equal(tb.fontWeight, '600');

  console.log(`5. Testing PDF export across all ${FONT_OPTIONS.length} font families...`);
  const blankDoc = await PDFDocument.create();
  blankDoc.addPage([612, 792]);
  const baseBytes = await blankDoc.save();

  const fabricObjects = FONT_OPTIONS.map((fontOpt, idx) => ({
    type: 'textbox',
    text: `Font_${idx}_${fontOpt.id}`,
    left: 40 + (idx % 2) * 280,
    top: 30 + Math.floor(idx / 2) * 44,
    width: 240,
    fontSize: 12,
    fontWeight: idx % 2 === 0 ? '700' : '400',
    fontStyle: idx % 3 === 0 ? 'italic' : 'normal',
    scaleX: 1,
    scaleY: 1,
    fill: '#1e293b',
    nexFontId: fontOpt.id,
  }));

  const { bytes: exportedBytes, stats } = await exportEditedPdf({
    originalPdfBytes: baseBytes,
    pagesState: [
      {
        id: 'p1',
        isBlank: false,
        sourcePageIndex: 0,
        width: 612,
        height: 792,
        rotationDelta: 0,
        removedTextIds: [],
        removedImageIds: [],
        fabricJson: { version: '5.3.0', objects: fabricObjects },
      },
    ],
    pageMetadataMap: { 0: { width: 612, height: 792, textBlocks: [], images: [] } },
  });

  assert.equal(stats.drawnObjects, FONT_OPTIONS.length);

  const parsedDoc = await pdfjsLib.getDocument({ data: exportedBytes.slice(), verbosity: 0 }).promise;
  const page1 = await parsedDoc.getPage(1);
  const tc = await page1.getTextContent();
  const extracted = tc.items.map((i) => i.str).join(' ');
  for (let i = 0; i < FONT_OPTIONS.length; i++) {
    assert.ok(extracted.includes(`Font_${i}_`), `Exported PDF missing text for font ${FONT_OPTIONS[i].id}`);
  }

  console.log(`All font library (${FONT_OPTIONS.length} fonts), sharpening, formatting preservation, and PDF export tests passed!`);
}

runFontTests().catch((err) => {
  console.error('Font test failed:', err);
  process.exit(1);
});
