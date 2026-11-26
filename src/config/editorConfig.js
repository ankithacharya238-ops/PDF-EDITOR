import { StandardFonts } from 'pdf-lib';

export const TOOLS = [
  { id: 'select', label: 'Select', shortcut: 'V', description: 'Select, move, resize, or rotate objects' },
  { id: 'editText', label: 'Edit Text', shortcut: 'E', description: 'Click existing PDF text to edit content & style' },
  { id: 'addText', label: 'Add Text', shortcut: 'T', description: 'Click anywhere on page to insert new text' },
  { id: 'addImage', label: 'Add Image', shortcut: 'I', description: 'Insert JPG, PNG, or WebP image' },
  { id: 'deleteObject', label: 'Delete', shortcut: 'Del', description: 'Click text, image, or annotation to remove it' },
  { id: 'highlight', label: 'Highlight', shortcut: 'H', description: 'Draw translucent highlight box' },
  { id: 'underline', label: 'Underline', shortcut: 'U', description: 'Draw crisp underline annotation' },
  { id: 'draw', label: 'Draw', shortcut: 'D', description: 'Freehand pen drawing on PDF' },
  { id: 'shapes', label: 'Shapes', shortcut: 'S', description: 'Insert rectangle, circle, line, or arrow' },
  { id: 'signature', label: 'Signature', shortcut: 'G', description: 'Draw, type, or upload digital signature' },
  { id: 'eraser', label: 'Eraser', shortcut: 'X', description: 'Erase annotations, strokes, or PDF objects' },
];

export const SHAPE_TYPES = [
  { id: 'rect', label: 'Rectangle' },
  { id: 'roundedRect', label: 'Rounded Box' },
  { id: 'circle', label: 'Circle / Ellipse' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'line', label: 'Line' },
  { id: 'arrow', label: 'Arrow' },
];

export const FONT_OPTIONS = [
  {
    id: 'Helvetica',
    label: 'Helvetica / Sans',
    cssFamily: 'Inter, Helvetica, Arial, sans-serif',
    pdfStandard: {
      normal: StandardFonts.Helvetica,
      bold: StandardFonts.HelveticaBold,
      italic: StandardFonts.HelveticaOblique,
      boldItalic: StandardFonts.HelveticaBoldOblique,
    },
  },
  {
    id: 'Times',
    label: 'Times / Serif',
    cssFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
    pdfStandard: {
      normal: StandardFonts.TimesRoman,
      bold: StandardFonts.TimesRomanBold,
      italic: StandardFonts.TimesRomanItalic,
      boldItalic: StandardFonts.TimesRomanBoldItalic,
    },
  },
  {
    id: 'Courier',
    label: 'Courier / Mono',
    cssFamily: '"JetBrains Mono", "Courier New", monospace',
    pdfStandard: {
      normal: StandardFonts.Courier,
      bold: StandardFonts.CourierBold,
      italic: StandardFonts.CourierOblique,
      boldItalic: StandardFonts.CourierBoldOblique,
    },
  },
  {
    id: 'Inter',
    label: 'Inter Modern',
    cssFamily: '"Plus Jakarta Sans", Inter, sans-serif',
    pdfStandard: {
      normal: StandardFonts.Helvetica,
      bold: StandardFonts.HelveticaBold,
      italic: StandardFonts.HelveticaOblique,
      boldItalic: StandardFonts.HelveticaBoldOblique,
    },
  },
  {
    id: 'Georgia',
    label: 'Georgia Editorial',
    cssFamily: 'Georgia, "Playfair Display", serif',
    pdfStandard: {
      normal: StandardFonts.TimesRoman,
      bold: StandardFonts.TimesRomanBold,
      italic: StandardFonts.TimesRomanItalic,
      boldItalic: StandardFonts.TimesRomanBoldItalic,
    },
  },
];

export const COLOR_SWATCHES = [
  '#0f172a',
  '#1e293b',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

export const HIGHLIGHT_COLORS = [
  '#facc15',
  '#38bdf8',
  '#4ade80',
  '#f472b6',
  '#a78bfa',
];

export const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5];

export const KEYBOARD_SHORTCUTS = [
  { keys: ['V'], action: 'Select Tool' },
  { keys: ['E'], action: 'Edit Existing PDF Text' },
  { keys: ['T'], action: 'Add New Text' },
  { keys: ['I'], action: 'Insert Image' },
  { keys: ['H'], action: 'Highlight Annotation' },
  { keys: ['U'], action: 'Underline Annotation' },
  { keys: ['D'], action: 'Freehand Draw' },
  { keys: ['S'], action: 'Shapes Tool' },
  { keys: ['G'], action: 'Signature Tool' },
  { keys: ['X'], action: 'Eraser Tool' },
  { keys: ['Ctrl', 'Z'], action: 'Undo' },
  { keys: ['Ctrl', 'Y'], action: 'Redo' },
  { keys: ['Ctrl', 'S'], action: 'Save Project Locally' },
  { keys: ['Ctrl', 'E'], action: 'Export & Download PDF' },
  { keys: ['Del'], action: 'Delete Selected Object' },
  { keys: ['+ / -'], action: 'Zoom In / Out' },
];
