import { useCallback, useEffect, useRef, useState } from 'react';

type Tool = 'brush' | 'rect';

interface Stroke {
  tool: Tool;
  points?: { x: number; y: number }[];  // brush strokes
  rect?: { x: number; y: number; w: number; h: number };  // rectangle
}

interface HighlightOverlayProps {
  imageDataUrl: string;
  onHighlightsChange: (hasHighlights: boolean) => void;
  compositeRef: React.MutableRefObject<(() => Promise<string | null>) | null>;
}

const HIGHLIGHT_COLOR = 'rgba(56, 152, 255, 0.35)';  // ds-accent at ~35%
const STROKE_COLOR = 'rgba(56, 152, 255, 0.5)';
const BRUSH_SIZE = 24;

export default function HighlightOverlay({
  imageDataUrl,
  onHighlightsChange,
  compositeRef,
}: HighlightOverlayProps) {
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState<Tool>('brush');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZE);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);
  const rectStart = useRef<{ x: number; y: number } | null>(null);
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
    setStrokes([]);
    setActive(false);
    onHighlightsChange(false);
  }, [imageDataUrl, onHighlightsChange]);

  // Canvas-to-image coordinate conversion
  const toImageCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = imgDims.current.width / rect.width;
    const scaleY = imgDims.current.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Redraw all strokes
  const redraw = useCallback((extraStroke?: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imgDims.current.width;
    canvas.height = imgDims.current.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = extraStroke ? [...strokes, extraStroke] : strokes;
    for (const s of allStrokes) {
      if (s.tool === 'brush' && s.points && s.points.length > 0) {
        ctx.strokeStyle = STROKE_COLOR;
        ctx.lineWidth = brushSize * (imgDims.current.width / (canvasRef.current?.getBoundingClientRect().width || imgDims.current.width));
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
  }, [strokes, brushSize]);

  // Redraw when strokes change
  useEffect(() => {
    if (active) redraw();
  }, [strokes, active, redraw]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!active) return;
    drawing.current = true;
    const pos = toImageCoords(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'brush') {
      currentStroke.current = { tool: 'brush', points: [pos] };
    } else {
      rectStart.current = pos;
      currentStroke.current = { tool: 'rect', rect: { x: pos.x, y: pos.y, w: 0, h: 0 } };
    }
  }, [active, tool, toImageCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing.current || !active) return;
    const pos = toImageCoords(e.clientX, e.clientY);

    if (tool === 'brush' && currentStroke.current?.points) {
      currentStroke.current.points.push(pos);
      redraw(currentStroke.current);
    } else if (tool === 'rect' && rectStart.current) {
      const start = rectStart.current;
      currentStroke.current = {
        tool: 'rect',
        rect: {
          x: Math.min(start.x, pos.x),
          y: Math.min(start.y, pos.y),
          w: Math.abs(pos.x - start.x),
          h: Math.abs(pos.y - start.y),
        },
      };
      redraw(currentStroke.current);
    }
  }, [active, tool, toImageCoords, redraw]);

  const handlePointerUp = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;

    if (currentStroke.current) {
      const newStrokes = [...strokes, currentStroke.current];
      setStrokes(newStrokes);
      onHighlightsChange(newStrokes.length > 0);
    }
    currentStroke.current = null;
    rectStart.current = null;
  }, [strokes, onHighlightsChange]);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    setStrokes((prev) => {
      const next = prev.slice(0, -1);
      onHighlightsChange(next.length > 0);
      return next;
    });
  }, [onHighlightsChange]);

  // Clear all
  const handleClear = useCallback(() => {
    setStrokes([]);
    onHighlightsChange(false);
  }, [onHighlightsChange]);

  // Composite: merge highlights onto screenshot, return data URL
  compositeRef.current = useCallback(async (): Promise<string | null> => {
    if (strokes.length === 0) return null;

    const img = imgRef.current;
    if (!img) return null;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Draw highlight overlay from our canvas
    const overlayCanvas = canvasRef.current;
    if (overlayCanvas) {
      ctx.drawImage(overlayCanvas, 0, 0);
    }

    return canvas.toDataURL('image/png');
  }, [strokes]);

  const hasStrokes = strokes.length > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle + tools */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActive(!active)}
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
            {/* Tool toggle */}
            <div className="flex rounded-md overflow-hidden border border-ds-border">
              <button
                type="button"
                onClick={() => setTool('brush')}
                title="Freehand brush"
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  tool === 'brush' ? 'bg-ds-accent-emphasis text-white' : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
                }`}
              >
                Brush
              </button>
              <button
                type="button"
                onClick={() => setTool('rect')}
                title="Rectangle select"
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  tool === 'rect' ? 'bg-ds-accent-emphasis text-white' : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
                }`}
              >
                Rect
              </button>
            </div>

            {/* Brush size (only for brush) */}
            {tool === 'brush' && (
              <input
                type="range"
                min="8"
                max="64"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="h-1 w-16 cursor-pointer accent-ds-accent"
                title={`Brush size: ${brushSize}px`}
              />
            )}

            {/* Undo / Clear */}
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

      {/* Canvas overlay — positioned over the image in main preview */}
      {active && (
        <div
          ref={containerRef}
          className="relative"
          style={{ cursor: tool === 'brush' ? 'crosshair' : 'crosshair' }}
        >
          <img
            src={imageDataUrl}
            alt="Source with highlights"
            className="max-h-[60vh] w-full rounded-lg object-contain"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-0 h-full w-full rounded-lg"
            style={{ touchAction: 'none' }}
          />
        </div>
      )}

      {/* Indicator when highlights exist but tool is closed */}
      {!active && hasStrokes && (
        <div className="flex items-center gap-1.5 text-[11px] text-ds-accent">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
          {strokes.length} area{strokes.length !== 1 ? 's' : ''} highlighted — AI will focus on these
        </div>
      )}
    </div>
  );
}
