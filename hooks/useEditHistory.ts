import { useCallback, useState } from 'react';

const MAX_HISTORY = 10;

interface EditHistory {
  current: string;
  canUndo: boolean;
  canRedo: boolean;
  pushState: (dataUrl: string) => void;
  undo: () => string;
  redo: () => string;
  reset: (dataUrl: string) => void;
}

export function useEditHistory(initial: string): EditHistory {
  const [current, setCurrent] = useState(initial);
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const pushState = useCallback((dataUrl: string) => {
    setCurrent((prev) => {
      setPast((p) => {
        const next = [...p, prev];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
      setFuture([]);
      return dataUrl;
    });
  }, []);

  const undo = useCallback((): string => {
    let restored = current;
    setPast((p) => {
      if (p.length === 0) return p;
      const newPast = [...p];
      restored = newPast.pop()!;
      setCurrent((cur) => {
        setFuture((f) => [...f, cur]);
        return restored;
      });
      return newPast;
    });
    return restored;
  }, [current]);

  const redo = useCallback((): string => {
    let restored = current;
    setFuture((f) => {
      if (f.length === 0) return f;
      const newFuture = [...f];
      restored = newFuture.pop()!;
      setCurrent((cur) => {
        setPast((p) => [...p, cur]);
        return restored;
      });
      return newFuture;
    });
    return restored;
  }, [current]);

  const reset = useCallback((dataUrl: string) => {
    setCurrent(dataUrl);
    setPast([]);
    setFuture([]);
  }, []);

  return {
    current,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pushState,
    undo,
    redo,
    reset,
  };
}
