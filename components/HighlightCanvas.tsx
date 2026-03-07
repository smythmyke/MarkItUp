import { useCallback, useEffect, useRef } from 'react';
import type { HighlightTool, Stroke } from './HighlightOverlay';
import { drawStrokes } from './HighlightOverlay';

interface HighlightCanvasProps {
  imageDataUrl: string;
  tool: HighlightTool;
  brushSize: number;
  strokes: Stroke[];
  onAddStroke: (stroke: Stroke) => void;
}

/**
 * Full-size highlight drawing canvas rendered over the main image preview.
 * All coordinates are stored in source image pixels for resolution independence.
 */
export default function HighlightCanvas({
  imageDataUrl,
  tool,
  brushSize,
  strokes,
  onAddStroke,
}: HighlightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgDims = useRef({ width: 0, height: 0 });
  const drawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);
  const rectStart = useRef<{ x: number; y: number } | null>(null);

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      imgDims.current = { width: img.width, height: img.height };
      redraw();
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Convert display coordinates to image coordinates
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
    if (!canvas || !imgDims.current.width) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imgDims.current.width;
    canvas.height = imgDims.current.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = extraStroke ? [...strokes, extraStroke] : strokes;
    drawStrokes(ctx, allStrokes);
  }, [strokes]);

  // Redraw when strokes change
  useEffect(() => {
    redraw();
  }, [strokes, redraw]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    drawing.current = true;
    const pos = toImageCoords(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'brush') {
      currentStroke.current = { tool: 'brush', points: [pos], brushSize };
    } else {
      rectStart.current = pos;
      currentStroke.current = { tool: 'rect', rect: { x: pos.x, y: pos.y, w: 0, h: 0 } };
    }
  }, [tool, brushSize, toImageCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing.current) return;
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
  }, [tool, toImageCoords, redraw]);

  const handlePointerUp = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;

    if (currentStroke.current) {
      onAddStroke(currentStroke.current);
    }
    currentStroke.current = null;
    rectStart.current = null;
  }, [onAddStroke]);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-ds-bg p-4">
      <div className="relative max-h-full max-w-full">
        <img
          src={imageDataUrl}
          alt="Source with highlights"
          className="max-h-[calc(100vh-8rem)] max-w-full rounded-lg object-contain shadow-lg"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 h-full w-full rounded-lg"
          style={{ touchAction: 'none', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}
