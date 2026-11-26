# NexPDF – Advanced PDF Editor

A modern, futuristic, 100% browser-based PDF editing studio built with React, Vite, Tailwind CSS, Three.js, Framer Motion, PDF.js, Fabric.js, and `pdf-lib`.

## Key Features

- **Futuristic 3D Interface**: Interactive Three.js 3D floating PDF showcase, mouse & scroll parallax layers, 3D tilt cards, glassmorphic panels, and a custom glowing cursor with magnetic button interactions and click ripples.
- **Genuine PDF Content-Stream Editing**:
  - Parses and tokenizes PDF content streams (`BT ... ET`, `Tj`, `TJ`, `Tm`, `Td`, `Do`, `cm`, `q`/`Q`) to genuinely remove or replace original text and embedded image `Do` operators on export—not merely covering text with white rectangles.
  - Detects embedded subset fonts and clearly displays a **Font Substitution** notice in the Inspector.
- **Full Interactive Workspace**:
  - **Left Tools**: Select (`V`), Edit Text (`E`), Add Text (`T`), Add Image (`I` — PNG/JPG/WebP), Delete Object (`Del`), Highlight (`H`), Underline (`U`), Freehand Draw (`D`), Shapes (`S` — Rect, Rounded, Circle, Triangle, Line, Arrow), Signature (`G` — Draw, Type, or Upload), and Eraser (`X`).
  - **Center Canvas**: High-DPI PDF.js multi-page rendering, zoom presets & fit-to-screen, page thumbnails, add blank page, duplicate, rotate 90°, reorder, and delete pages.
  - **Right Inspector**: Context-sensitive controls for typography (font family, size, bold, italic, underline, color, alignment, line spacing, letter spacing), images (replace, delete, aspect-locked resize, rotate, opacity, position), and shapes/drawings.
- **Local Persistence & History**: Undo / Redo history (`Ctrl+Z` / `Ctrl+Y`), IndexedDB project saving (`Ctrl+S`) for Recent Documents, and instant PDF export (`Ctrl+E`).

## Local Setup & Commands

```bash
cd "c:\projects\pdf editor"
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

Run PDF engine verification tests:

```bash
npm run test:pdf
```
