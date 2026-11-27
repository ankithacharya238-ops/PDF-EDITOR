import { StandardFonts } from 'pdf-lib';

export const TOOLS = [
  { id: 'select', label: 'Select', shortcut: 'V', description: 'Select, move, resize, or rotate objects' },
  { id: 'editText', label: 'Edit Text', shortcut: 'E', description: 'Click existing PDF text to edit while preserving formatting' },
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

export const FONT_CATEGORIES = [
  { id: 'all', label: 'All Fonts' },
  { id: 'sans-serif', label: 'Sans-Serif' },
  { id: 'modern', label: 'Modern / Minimalist' },
  { id: 'serif', label: 'Serif / Elegant' },
  { id: 'monospace', label: 'Monospace' },
  { id: 'handwritten', label: 'Cursive / Handwritten' },
  { id: 'fantasy', label: 'Fantasy / Display' },
];

const SANS_PDF = {
  normal: StandardFonts.Helvetica,
  bold: StandardFonts.HelveticaBold,
  italic: StandardFonts.HelveticaOblique,
  boldItalic: StandardFonts.HelveticaBoldOblique,
};

const SERIF_PDF = {
  normal: StandardFonts.TimesRoman,
  bold: StandardFonts.TimesRomanBold,
  italic: StandardFonts.TimesRomanItalic,
  boldItalic: StandardFonts.TimesRomanBoldItalic,
};

const MONO_PDF = {
  normal: StandardFonts.Courier,
  bold: StandardFonts.CourierBold,
  italic: StandardFonts.CourierOblique,
  boldItalic: StandardFonts.CourierBoldOblique,
};

export const FONT_OPTIONS = [
  // Sans-Serif
  {
    id: 'Arial',
    label: 'Arial',
    category: 'sans-serif',
    tags: ['sans-serif', 'clean', 'classic'],
    cssFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Helvetica',
    label: 'Helvetica',
    category: 'sans-serif',
    tags: ['sans-serif', 'swiss', 'minimalist'],
    cssFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Inter',
    label: 'Inter',
    category: 'sans-serif',
    tags: ['sans-serif', 'modern', 'minimalist', 'ui'],
    cssFamily: '"Inter", "Plus Jakarta Sans", sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Roboto',
    label: 'Roboto',
    category: 'sans-serif',
    tags: ['sans-serif', 'modern', 'google'],
    cssFamily: '"Roboto", Arial, sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Poppins',
    label: 'Poppins',
    category: 'sans-serif',
    tags: ['sans-serif', 'geometric', 'modern'],
    cssFamily: '"Poppins", sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Open Sans',
    label: 'Open Sans',
    category: 'sans-serif',
    tags: ['sans-serif', 'readable'],
    cssFamily: '"Open Sans", sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Montserrat',
    label: 'Montserrat',
    category: 'sans-serif',
    tags: ['sans-serif', 'modern', 'headline'],
    cssFamily: '"Montserrat", sans-serif',
    pdfStandard: SANS_PDF,
  },

  // Modern & Minimalist
  {
    id: 'Plus Jakarta Sans',
    label: 'Plus Jakarta Sans',
    category: 'modern',
    tags: ['modern', 'minimalist', 'sans-serif'],
    cssFamily: '"Plus Jakarta Sans", Inter, sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Space Grotesk',
    label: 'Space Grotesk',
    category: 'modern',
    tags: ['modern', 'futuristic', 'minimalist'],
    cssFamily: '"Space Grotesk", sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'DM Sans',
    label: 'DM Sans',
    category: 'modern',
    tags: ['modern', 'minimalist'],
    cssFamily: '"DM Sans", sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Outfit',
    label: 'Outfit',
    category: 'modern',
    tags: ['modern', 'minimalist', 'geometric'],
    cssFamily: '"Outfit", sans-serif',
    pdfStandard: SANS_PDF,
  },

  // Serif & Elegant
  {
    id: 'Times New Roman',
    label: 'Times New Roman',
    category: 'serif',
    tags: ['serif', 'classic', 'formal'],
    cssFamily: '"Times New Roman", Times, serif',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Georgia',
    label: 'Georgia',
    category: 'serif',
    tags: ['serif', 'editorial'],
    cssFamily: 'Georgia, "Times New Roman", serif',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Playfair Display',
    label: 'Playfair Display',
    category: 'serif',
    tags: ['serif', 'elegant', 'luxury'],
    cssFamily: '"Playfair Display", Georgia, serif',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Lora',
    label: 'Lora',
    category: 'serif',
    tags: ['serif', 'elegant', 'modern'],
    cssFamily: '"Lora", Georgia, serif',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Merriweather',
    label: 'Merriweather',
    category: 'serif',
    tags: ['serif', 'readable'],
    cssFamily: '"Merriweather", Georgia, serif',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Cormorant Garamond',
    label: 'Cormorant Garamond',
    category: 'serif',
    tags: ['serif', 'elegant', 'editorial'],
    cssFamily: '"Cormorant Garamond", Georgia, serif',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Cinzel',
    label: 'Cinzel',
    category: 'serif',
    tags: ['serif', 'elegant', 'classic'],
    cssFamily: '"Cinzel", Georgia, serif',
    pdfStandard: SERIF_PDF,
  },

  // Monospace
  {
    id: 'Courier New',
    label: 'Courier New',
    category: 'monospace',
    tags: ['monospace', 'typewriter'],
    cssFamily: '"Courier New", Courier, monospace',
    pdfStandard: MONO_PDF,
  },
  {
    id: 'JetBrains Mono',
    label: 'JetBrains Mono',
    category: 'monospace',
    tags: ['monospace', 'code', 'modern'],
    cssFamily: '"JetBrains Mono", monospace',
    pdfStandard: MONO_PDF,
  },
  {
    id: 'Fira Code',
    label: 'Fira Code',
    category: 'monospace',
    tags: ['monospace', 'code'],
    cssFamily: '"Fira Code", monospace',
    pdfStandard: MONO_PDF,
  },
  {
    id: 'Roboto Mono',
    label: 'Roboto Mono',
    category: 'monospace',
    tags: ['monospace', 'minimalist'],
    cssFamily: '"Roboto Mono", monospace',
    pdfStandard: MONO_PDF,
  },

  // Cursive & Handwritten
  {
    id: 'Caveat',
    label: 'Caveat',
    category: 'handwritten',
    tags: ['cursive', 'handwritten', 'signature'],
    cssFamily: '"Caveat", cursive',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Dancing Script',
    label: 'Dancing Script',
    category: 'handwritten',
    tags: ['cursive', 'handwritten', 'elegant'],
    cssFamily: '"Dancing Script", cursive',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Pacifico',
    label: 'Pacifico',
    category: 'handwritten',
    tags: ['cursive', 'handwritten', 'brush'],
    cssFamily: '"Pacifico", cursive',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Great Vibes',
    label: 'Great Vibes',
    category: 'handwritten',
    tags: ['cursive', 'handwritten', 'elegant', 'calligraphy'],
    cssFamily: '"Great Vibes", cursive',
    pdfStandard: SERIF_PDF,
  },
  {
    id: 'Indie Flower',
    label: 'Indie Flower',
    category: 'handwritten',
    tags: ['handwritten', 'casual', 'cursive'],
    cssFamily: '"Indie Flower", cursive',
    pdfStandard: SERIF_PDF,
  },

  // Fantasy & Display
  {
    id: 'Orbitron',
    label: 'Orbitron',
    category: 'fantasy',
    tags: ['fantasy', 'futuristic', 'sci-fi'],
    cssFamily: '"Orbitron", fantasy, sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Bebas Neue',
    label: 'Bebas Neue',
    category: 'fantasy',
    tags: ['fantasy', 'display', 'poster'],
    cssFamily: '"Bebas Neue", fantasy, sans-serif',
    pdfStandard: SANS_PDF,
  },
  {
    id: 'Syne',
    label: 'Syne',
    category: 'fantasy',
    tags: ['fantasy', 'artistic', 'modern'],
    cssFamily: '"Syne", fantasy, sans-serif',
    pdfStandard: SANS_PDF,
  },
];

export const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: '100 — Thin' },
  { value: '300', label: '300 — Light' },
  { value: '400', label: '400 — Regular' },
  { value: '500', label: '500 — Medium' },
  { value: '600', label: '600 — SemiBold' },
  { value: '700', label: '700 — Bold' },
  { value: '800', label: '800 — ExtraBold' },
  { value: '900', label: '900 — Black' },
];

export const SHARPENING_PRESETS = [
  { id: 'off', label: 'Standard', scale: 1, disableCache: false, desc: 'Native 1x canvas caching' },
  { id: 'crisp', label: 'Crisp 2x', scale: 2, disableCache: true, desc: 'Vector glyph rendering at 2x DPI' },
  { id: 'ultra', label: 'Ultra Sharp', scale: 3, disableCache: true, desc: 'Maximum 3x HiDPI subpixel precision' },
];

export const DEFAULT_TEXT_STYLE = {
  nexFontId: 'Helvetica',
  fontSize: 16,
  fontWeight: '400',
  fontStyle: 'normal',
  underline: false,
  fill: '#0f172a',
  textAlign: 'left',
  lineHeight: 1.2,
  charSpacing: 0,
};

export function resolveFontOption(fontIdOrName = 'Helvetica') {
  if (!fontIdOrName) return FONT_OPTIONS[1]; // Helvetica
  const lower = String(fontIdOrName).toLowerCase().trim();
  const exact = FONT_OPTIONS.find((f) => f.id.toLowerCase() === lower);
  if (exact) return exact;
  if (lower === 'times' || lower.includes('times')) {
    return FONT_OPTIONS.find((f) => f.id === 'Times New Roman') || FONT_OPTIONS[1];
  }
  if (lower === 'courier' || lower.includes('courier')) {
    return FONT_OPTIONS.find((f) => f.id === 'Courier New') || FONT_OPTIONS[1];
  }
  const partial = FONT_OPTIONS.find(
    (f) => lower.includes(f.id.toLowerCase()) || f.id.toLowerCase().includes(lower)
  );
  return partial || FONT_OPTIONS[1];
}

export const COLOR_SWATCHES = [
  '#0f172a',
  '#1e293b',
  '#475569',
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

export const TEXT_HIGHLIGHT_SWATCHES = [
  { color: '#fef08a', label: 'Soft Yellow' },
  { color: '#a5f3fc', label: 'Electric Cyan' },
  { color: '#bbf7d0', label: 'Mint Green' },
  { color: '#fbcfe8', label: 'Rose Pink' },
  { color: '#ddd6fe', label: 'Lavender' },
  { color: '#fed7aa', label: 'Warm Amber' },
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
