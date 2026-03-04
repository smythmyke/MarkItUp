import { useCallback, useEffect, useState } from 'react';
import type { ImageDimensions } from '../../types';

interface ResizeToolProps {
  imageDimensions: ImageDimensions;
  onApply: (width: number, height: number) => void;
}

const scalePresets = [
  { label: '50%', factor: 0.5 },
  { label: '75%', factor: 0.75 },
  { label: '150%', factor: 1.5 },
  { label: '200%', factor: 2 },
];

export default function ResizeTool({ imageDimensions, onApply }: ResizeToolProps) {
  const [width, setWidth] = useState(imageDimensions.width);
  const [height, setHeight] = useState(imageDimensions.height);
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectRatio] = useState(imageDimensions.width / imageDimensions.height);

  // Reset when source dimensions change
  useEffect(() => {
    setWidth(imageDimensions.width);
    setHeight(imageDimensions.height);
  }, [imageDimensions]);

  const handleWidthChange = useCallback((v: number) => {
    setWidth(v);
    if (lockAspect) setHeight(Math.round(v / aspectRatio));
  }, [lockAspect, aspectRatio]);

  const handleHeightChange = useCallback((v: number) => {
    setHeight(v);
    if (lockAspect) setWidth(Math.round(v * aspectRatio));
  }, [lockAspect, aspectRatio]);

  const handlePreset = (factor: number) => {
    const w = Math.round(imageDimensions.width * factor);
    const h = Math.round(imageDimensions.height * factor);
    setWidth(w);
    setHeight(h);
  };

  const noChange = width === imageDimensions.width && height === imageDimensions.height;

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <label className="flex flex-col gap-1 text-xs text-ds-text-muted">
          Width
          <input
            type="number"
            min={1}
            value={width}
            onChange={(e) => handleWidthChange(Number(e.target.value) || 1)}
            className="w-24 rounded border border-ds-border-light bg-ds-elevated px-2 py-1 text-sm text-ds-text"
          />
        </label>
        <button
          type="button"
          onClick={() => setLockAspect(!lockAspect)}
          className={`mt-4 rounded p-1 transition-colors ${lockAspect ? 'text-ds-accent' : 'text-ds-text-dim'}`}
          aria-label={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {lockAspect ? (
              <path d="M12 10V6a4 4 0 118 0v4M5 10h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" />
            ) : (
              <path d="M16 10V6a4 4 0 00-8 0M5 10h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" />
            )}
          </svg>
        </button>
        <label className="flex flex-col gap-1 text-xs text-ds-text-muted">
          Height
          <input
            type="number"
            min={1}
            value={height}
            onChange={(e) => handleHeightChange(Number(e.target.value) || 1)}
            className="w-24 rounded border border-ds-border-light bg-ds-elevated px-2 py-1 text-sm text-ds-text"
          />
        </label>
      </div>

      <div className="flex gap-1.5">
        {scalePresets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handlePreset(p.factor)}
            className="rounded-md border border-ds-border-light px-2.5 py-1 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onApply(width, height)}
        disabled={noChange || width < 1 || height < 1}
        className="rounded-md bg-ds-accent-emphasis px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ds-accent disabled:opacity-40"
      >
        Apply Resize
      </button>
    </div>
  );
}
