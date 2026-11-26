import { useEffect } from 'react';

export function useKeyboardShortcuts({
  enabled,
  onSelectTool,
  onUndo,
  onRedo,
  onDeleteSelected,
  onZoomIn,
  onZoomOut,
  onSaveProject,
  onExportPdf,
}) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isEditingInput =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        e.target?.isContentEditable;

      if (isEditingInput) return;

      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }
      if ((isMod && e.key.toLowerCase() === 'y') || (isMod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        onRedo?.();
        return;
      }
      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveProject?.();
        return;
      }
      if (isMod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onExportPdf?.();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteSelected?.();
        return;
      }

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        onZoomIn?.();
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        onZoomOut?.();
        return;
      }

      if (isMod || e.altKey) return;

      const keyMap = {
        v: 'select',
        e: 'editText',
        t: 'addText',
        i: 'addImage',
        h: 'highlight',
        u: 'underline',
        d: 'draw',
        s: 'shapes',
        g: 'signature',
        x: 'eraser',
      };

      const tool = keyMap[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        onSelectTool?.(tool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onSelectTool,
    onUndo,
    onRedo,
    onDeleteSelected,
    onZoomIn,
    onZoomOut,
    onSaveProject,
    onExportPdf,
  ]);
}
