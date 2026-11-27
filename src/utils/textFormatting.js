/**
 * Text case transformation and Fabric.js per-character style splicing utilities.
 */

export function applyCaseTransform(str = '', mode = 'upper') {
  if (mode === 'upper') return str.toUpperCase();
  if (mode === 'lower') return str.toLowerCase();
  if (mode === 'title') {
    return str.replace(/\b([a-zA-Z])([a-zA-Z']*)/g, (_, first, rest) => {
      return first.toUpperCase() + rest.toLowerCase();
    });
  }
  return str;
}

/**
 * Replaces [start, end) in a Fabric Textbox/IText string while preserving
 * per-character styles across the entire text block (including before and after the edit).
 */
export function spliceFabricTextPreservingStyles(obj, start, end, replacement) {
  const oldText = obj.text || '';
  const newText = oldText.slice(0, start) + replacement + oldText.slice(end);
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Flatten old per-character styles into a 1D index array
  const flatStyles = [];
  let charCursor = 0;
  for (let lineIdx = 0; lineIdx < oldLines.length; lineIdx++) {
    const lineLen = oldLines[lineIdx].length;
    const lineStyles = obj.styles?.[lineIdx] || {};
    for (let c = 0; c < lineLen; c++) {
      flatStyles[charCursor] = lineStyles[c] ? { ...lineStyles[c] } : null;
      charCursor++;
    }
    if (lineIdx < oldLines.length - 1) {
      flatStyles[charCursor] = null; // newline
      charCursor++;
    }
  }

  // Inherit style from the first replaced character so formatting never resets
  const inheritedStyle = flatStyles[start] ? { ...flatStyles[start] } : null;
  const insertedStyles = Array.from({ length: replacement.length }, () =>
    inheritedStyle ? { ...inheritedStyle } : null
  );
  const updatedFlat = [
    ...flatStyles.slice(0, start),
    ...insertedStyles,
    ...flatStyles.slice(end),
  ];

  // Rebuild Fabric 2D styles map
  const rebuiltStyles = {};
  let idx = 0;
  for (let lineIdx = 0; lineIdx < newLines.length; lineIdx++) {
    const lineLen = newLines[lineIdx].length;
    for (let c = 0; c < lineLen; c++) {
      const st = updatedFlat[idx];
      if (st && Object.keys(st).length > 0) {
        if (!rebuiltStyles[lineIdx]) rebuiltStyles[lineIdx] = {};
        rebuiltStyles[lineIdx][c] = st;
      }
      idx++;
    }
    if (lineIdx < newLines.length - 1) idx++;
  }

  obj.styles = rebuiltStyles;
  obj.set({ text: newText, dirty: true });
}
