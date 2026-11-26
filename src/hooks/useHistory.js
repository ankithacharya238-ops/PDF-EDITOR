import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

/**
 * Immutable snapshot-based Undo / Redo manager for document state.
 */
export function useHistory(initialState) {
  const [present, setPresent] = useState(initialState);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const [counts, setCounts] = useState({ canUndo: false, canRedo: false });

  const syncCounts = () => {
    setCounts({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    });
  };

  const resetHistory = useCallback((nextState) => {
    pastRef.current = [];
    futureRef.current = [];
    setPresent(nextState);
    setCounts({ canUndo: false, canRedo: false });
  }, []);

  const pushState = useCallback((updater) => {
    setPresent((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next === prev) return prev;
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), prev];
      futureRef.current = [];
      syncCounts();
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return null;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    setPresent((current) => {
      futureRef.current = [current, ...futureRef.current];
      return previous;
    });
    syncCounts();
    return previous;
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    setPresent((current) => {
      pastRef.current = [...pastRef.current, current];
      return next;
    });
    syncCounts();
    return next;
  }, []);

  return {
    state: present,
    pushState,
    undo,
    redo,
    resetHistory,
    canUndo: counts.canUndo,
    canRedo: counts.canRedo,
  };
}
