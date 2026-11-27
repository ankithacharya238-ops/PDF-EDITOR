import assert from 'node:assert/strict';
import { fabric } from 'fabric';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TEXT_HIGHLIGHT_SWATCHES, resolveFontOption } from '../src/config/editorConfig.js';
import { analyzeTextErrors } from '../src/utils/textChecker.js';
import { applyCaseTransform, spliceFabricTextPreservingStyles } from '../src/utils/textFormatting.js';
import { exportEditedPdf } from '../src/pdf/pdfExporter.js';

fabric.Textbox.prototype.getMeasuringContext = function () {
  return {
    font: '',
    textBaseline: 'alphabetic',
    measureText: (txt = '') => ({ width: txt.length * 8 }),
    save: () => {},
    restore: () => {},
  };
};

async function runTextEditingTests() {
  console.log('1. Testing selective text formatting & formatting consistency...');
  const roboto = resolveFontOption('Roboto');
  const courier = resolveFontOption('Courier New');
  const tb = new fabric.Textbox('Hello recieve world today', {
    left: 60,
    top: 80,
    width: 320,
    fontFamily: roboto.cssFamily,
    nexFontId: roboto.id,
    fontSize: 18,
    fontWeight: '400',
    fill: '#1e293b',
  });

  // Format ONLY "world" [14, 19) with bold purple Courier + yellow highlight
  tb.setSelectionStyles(
    {
      fontWeight: '700',
      fill: '#7c3aed',
      fontFamily: courier.cssFamily,
      nexFontId: courier.id,
      textBackgroundColor: TEXT_HIGHLIGHT_SWATCHES[0].color,
    },
    14,
    19
  );

  const beforeStyles = tb.getSelectionStyles(0, 5);
  assert.equal(beforeStyles[0]?.fill, undefined, 'Unselected words must remain unaffected');
  const wordStyles = tb.getSelectionStyles(14, 19);
  assert.equal(wordStyles[0]?.fontWeight, '700');
  assert.equal(wordStyles[0]?.fill, '#7c3aed');
  assert.equal(wordStyles[0]?.textBackgroundColor, '#fef08a');

  console.log('2. Testing capitalization (UPPERCASE, lowercase, Title Case) preserving styles...');
  assert.equal(applyCaseTransform('hello world', 'upper'), 'HELLO WORLD');
  assert.equal(applyCaseTransform('HELLO WORLD', 'lower'), 'hello world');
  assert.equal(applyCaseTransform('the quick BROWN fox', 'title'), 'The Quick Brown Fox');

  // Convert ONLY "world" [14, 19) to UPPERCASE while preserving its bold purple highlight
  const upperWord = applyCaseTransform(tb.text.slice(14, 19), 'upper');
  spliceFabricTextPreservingStyles(tb, 14, 19, upperWord);
  assert.equal(tb.text, 'Hello recieve WORLD today');
  const postCaseStyles = tb.getSelectionStyles(14, 19);
  assert.equal(postCaseStyles[0]?.fill, '#7c3aed', 'Capitalization must preserve text color');
  assert.equal(postCaseStyles[0]?.fontWeight, '700', 'Capitalization must preserve font weight');
  assert.equal(postCaseStyles[0]?.textBackgroundColor, '#fef08a', 'Capitalization must preserve highlight');
  assert.equal(tb.fontSize, 18, 'Highlighting/case must not change object fontSize');
  assert.equal(tb.nexFontId, 'Roboto', 'Object font family must remain preserved');

  console.log('3. Testing spelling & grammar error detection + Accept / Ignore...');
  const issues = analyzeTextErrors(tb.text);
  const spellIssue = issues.find((i) => i.type === 'spelling' && i.original === 'recieve');
  assert.ok(spellIssue, 'Expected spelling error for "recieve"');
  assert.ok(spellIssue.suggestions.includes('receive'), 'Expected suggestion "receive"');

  // Accept suggestion -> verify "WORLD" keeps its selective formatting even if length changed!
  spliceFabricTextPreservingStyles(tb, spellIssue.start, spellIssue.end, 'receive');
  assert.equal(tb.text, 'Hello receive WORLD today');
  const worldIdx = tb.text.indexOf('WORLD');
  const shiftedWorldStyles = tb.getSelectionStyles(worldIdx, worldIdx + 5);
  assert.equal(shiftedWorldStyles[0]?.fill, '#7c3aed', 'Splicing error fix must preserve shifted styles');
  assert.equal(shiftedWorldStyles[0]?.textBackgroundColor, '#fef08a');

  // Grammar rules test
  const grammarText = 'We saw the the documnet with a apple and he don\'t know. world';
  const gIssues = analyzeTextErrors(grammarText);
  assert.ok(gIssues.some((i) => i.type === 'grammar' && i.original.toLowerCase() === 'the the'), 'Should catch repeated word');
  assert.ok(gIssues.some((i) => i.type === 'grammar' && i.original.toLowerCase() === 'a apple'), 'Should catch a/an mismatch');
  assert.ok(gIssues.some((i) => i.type === 'grammar' && i.original.toLowerCase() === "he don't"), 'Should catch subject-verb error');
  assert.ok(gIssues.some((i) => i.type === 'grammar' && i.original === 'world'), 'Should catch lowercase sentence start');
  assert.ok(gIssues.some((i) => i.type === 'spelling' && i.original === 'documnet'), 'Should catch misspelling');

  // Ignore error
  const docIssue = gIssues.find((i) => i.original === 'documnet');
  const afterIgnore = analyzeTextErrors(grammarText, [docIssue.key]);
  assert.ok(!afterIgnore.some((i) => i.original === 'documnet'), 'Ignored issue must be suppressed');

  console.log('4. Testing PDF export with alignment + selective styles + text highlights...');
  const blankDoc = await PDFDocument.create();
  blankDoc.addPage([612, 792]);
  const baseBytes = await blankDoc.save();

  const serializedTb = tb.toJSON(['nexFontId']);
  const alignedBoxes = ['left', 'center', 'right', 'justify'].map((align, idx) => ({
    ...serializedTb,
    textAlign: align,
    top: 60 + idx * 90,
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
        fabricJson: { version: '5.3.0', objects: alignedBoxes },
      },
    ],
    pageMetadataMap: { 0: { width: 612, height: 792, textBlocks: [], images: [] } },
  });

  assert.equal(stats.drawnObjects, 4);
  const parsed = await pdfjsLib.getDocument({ data: exportedBytes.slice(), verbosity: 0 }).promise;
  const p1 = await parsed.getPage(1);
  const tc = await p1.getTextContent();
  const extracted = tc.items.map((i) => i.str).join(' ');
  assert.ok(extracted.includes('Hello') && extracted.includes('receive') && extracted.includes('WORLD'));

  console.log('All advanced text-editing tests (alignment, selective formatting, capitalization, highlighting, spell/grammar detection, PDF export) passed!');
}

runTextEditingTests().catch((err) => {
  console.error('Text editing test failed:', err);
  process.exit(1);
});
