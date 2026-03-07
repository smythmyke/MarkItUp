import { useCallback, useEffect, useRef } from 'react';

export type HighlightTool = 'brush' | 'rect';

export interface Stroke {
  tool: HighlightTool;
  points?: { x: number; y: number }[];  // brush strokes (image coords)
  rect?: { x: number; y: number; w: number; h: number };  // rectangle (image coords)
  brushSize?: number;  // stored per-stroke for correct redraw
}

interface HighlightOverlayProps {
  imageDataUrl: string;
  onHighlightsChange: (hasHighlights: boolean) => void;
  compositeRef: React.MutableRefObject<(() => Promise<string | null>) | null>;
  // Lifted state
  active: boolean;
  onActiveChange: (active: boolean) => void;
  tool: HighlightTool;
  onToolChange: (tool: HighlightTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
}

const HIGHLIGHT_COLOR = 'rgba(56, 152, 255, 0.35)';
const STROKE_COLOR = 'rgba(56, 152, 255, 0.5)';

export default function HighlightOverlay({
  imageDataUrl,
  onHighlightsChange,
  compositeRef,
  active,
  onActiveChange,
  tool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  strokes,
  onStrokesChange,
}: HighlightOverlayProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgDims = useRef({ width: 0, height: 0 });

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      imgDims.current = { width: img.width, height: img.height };
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Reset when image changes
  useEffect(() => {
    onStrokesChange([]);
    onActiveChange(false);
    onHighlightsChange(false);
  }, [imageDataUrl]);

  const handleUndo = useCallback(() => {
    const next = strokes.slice(0, -1);
    onStrokesChange(next);
    onHighlightsChange(next.length > 0);
  }, [strokes, onStrokesChange, onHighlightsChange]);

  const handleClear = useCallback(() => {
    onStrokesChange([]);
    onHighlightsChange(false);
  }, [onStrokesChange, onHighlightsChange]);

  // Composite: merge highlights onto screenshot
  compositeRef.current = useCallback(async (): Promise<string | null> => {
    if (strokes.length === 0) return null;
    const img = imgRef.current;
    if (!img) return null;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    drawStrokes(ctx, strokes);
    return canvas.toDataURL('image/png');
  }, [strokes]);

  const hasStrokes = strokes.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onActiveChange(!active)}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
            active
              ? 'border-ds-accent bg-ds-accent/10 text-ds-accent'
              : 'border-ds-border-light text-ds-text-muted hover:border-ds-accent hover:text-ds-text'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" />
            <path d="M17.8 11.8 20 14" /><path d="M15 7a2 2 0 0 0-2-2" />
            <path d="M3 21l9-9" /><path d="M12.2 6.2 14 4" />
          </svg>
          {active ? 'Highlighting' : 'Highlight Areas'}
        </button>

        {active && (
          <>
            <div className="flex rounded-md overflow-hidden border border-ds-border">
              <button
                type="button"
                onClick={() => onToolChange('brush')}
                title="Freehand brush"
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  tool === 'brush' ? 'bg-ds-accent-emphasis text-white' : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
                }`}
              >
                Brush
              </button>
              <button
                type="button"
                onClick={() => onToolChange('rect')}
                title="Rectangle select"
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  tool === 'rect' ? 'bg-ds-accent-emphasis text-white' : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
                }`}
              >
                Rect
              </button>
            </div>

            {tool === 'brush' && (
              <input
                type="range"
                min="8"
                max="64"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                className="h-1 w-16 cursor-pointer accent-ds-accent"
                title={`Brush size: ${brushSize}px`}
              />
            )}

            <button
              type="button"
              onClick={handleUndo}
              disabled={!hasStrokes}
              className="rounded px-2 py-1 text-xs text-ds-text-muted transition-colors hover:text-ds-text disabled:opacity-30"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasStrokes}
              className="rounded px-2 py-1 text-xs text-ds-text-muted transition-colors hover:text-ds-text disabled:opacity-30"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {active && (
        <p className="text-xs text-ds-accent leading-relaxed">
          Draw on the image preview to highlight areas for AI to focus on.
        </p>
      )}

      {!active && hasStrokes && (
        <div className="flex items-center gap-1.5 text-[11px] text-ds-accent">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
          {strokes.length} area{strokes.length !== 1 ? 's' : ''} highlighted — AI will focus on these
        </div>
      )}
    </div>
  );
}

export { HIGHLIGHT_COLOR, STROKE_COLOR };

export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
): void {
  for (const s of strokes) {
    if (s.tool === 'brush' && s.points && s.points.length > 0) {
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth = s.brushSize || 24;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    } else if (s.tool === 'rect' && s.rect) {
      ctx.fillStyle = HIGHLIGHT_COLOR;
      ctx.fillRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth = 3;
      ctx.strokeRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
    }
  }
}
