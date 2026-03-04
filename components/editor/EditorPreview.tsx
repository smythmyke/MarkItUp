import { useCallback, useEffect, useRef, useState } from 'react';
import type { CropRegion, ImageAdjustments } from '../../types';

interface EditorPreviewProps {
  imageDataUrl: string;
  cropActive: boolean;
  cropRegion: CropRegion;
  onCropRegionChange: (region: CropRegion) => void;
  adjustPreview: ImageAdjustments | null;
  imageDimensions: { width: number; height: number };
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export default function EditorPreview({
  imageDataUrl,
  cropActive,
  cropRegion,
  onCropRegionChange,
  adjustPreview,
  imageDimensions,
}: EditorPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [dragging, setDragging] = useState<{ handle: DragHandle; startX: number; startY: number; startRegion: CropRegion } | null>(null);

  // Compute display size when image or container changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageDimensions.width) return;

    const observer = new ResizeObserver(() => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / imageDimensions.width, ch / imageDimensions.height, 1);
      const w = imageDimensions.width * scale;
      const h = imageDimensions.height * scale;
      setDisplaySize({ width: w, height: h, offsetX: (cw - w) / 2, offsetY: (ch - h) / 2 });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [imageDimensions]);

  const scaleFactor = displaySize.width > 0 ? imageDimensions.width / displaySize.width : 1;

  // Convert crop region to display coordinates
  const cropDisplay = {
    x: cropRegion.x / scaleFactor,
    y: cropRegion.y / scaleFactor,
    width: cropRegion.width / scaleFactor,
    height: cropRegion.height / scaleFactor,
  };

  const handlePointerDown = useCallback((e: React.PointerEvent, handle: DragHandle) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({ handle, startX: e.clientX, startY: e.clientY, startRegion: { ...cropRegion } });
  }, [cropRegion]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragging.startX) * scaleFactor;
    const dy = (e.clientY - dragging.startY) * scaleFactor;
    const r = { ...dragging.startRegion };
    const maxW = imageDimensions.width;
    const maxH = imageDimensions.height;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    if (dragging.handle === 'move') {
      r.x = clamp(r.x + dx, 0, maxW - r.width);
      r.y = clamp(r.y + dy, 0, maxH - r.height);
    } else {
      // Resize handles
      if (dragging.handle.includes('w')) {
        const newX = clamp(r.x + dx, 0, r.x + r.width - 20);
        r.width -= (newX - r.x);
        r.x = newX;
      }
      if (dragging.handle.includes('e')) {
        r.width = clamp(r.width + dx, 20, maxW - r.x);
      }
      if (dragging.handle.includes('n')) {
        const newY = clamp(r.y + dy, 0, r.y + r.height - 20);
        r.height -= (newY - r.y);
        r.y = newY;
      }
      if (dragging.handle.includes('s')) {
        r.height = clamp(r.height + dy, 20, maxH - r.y);
      }
    }

    onCropRegionChange(r);
  }, [dragging, scaleFactor, imageDimensions, onCropRegionChange]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // CSS filter for live adjust preview
  const filterStyle = adjustPreview
    ? `brightness(${100 + adjustPreview.brightness}%) contrast(${100 + adjustPreview.contrast}%) saturate(${100 + adjustPreview.saturation}%)`
    : undefined;

  const handleSize = 10;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-ds-bg"
      onPointerMove={cropActive ? handlePointerMove : undefined}
      onPointerUp={cropActive ? handlePointerUp : undefined}
    >
      <img
        src={imageDataUrl}
        alt="Editor preview"
        className="absolute object-contain"
        style={{
          left: displaySize.offsetX,
          top: displaySize.offsetY,
          width: displaySize.width,
          height: displaySize.height,
          filter: filterStyle,
        }}
        draggable={false}
      />

      {/* Crop overlay */}
      {cropActive && displaySize.width > 0 && (
        <div
          className="absolute"
          style={{
            left: displaySize.offsetX,
            top: displaySize.offsetY,
            width: displaySize.width,
            height: displaySize.height,
          }}
        >
          {/* Dark overlays around crop region */}
          <div className="absolute bg-black/50" style={{ left: 0, top: 0, width: cropDisplay.x, height: '100%' }} />
          <div className="absolute bg-black/50" style={{ left: cropDisplay.x + cropDisplay.width, top: 0, right: 0, height: '100%' }} />
          <div className="absolute bg-black/50" style={{ left: cropDisplay.x, top: 0, width: cropDisplay.width, height: cropDisplay.y }} />
          <div className="absolute bg-black/50" style={{ left: cropDisplay.x, top: cropDisplay.y + cropDisplay.height, width: cropDisplay.width, bottom: 0 }} />

          {/* Crop region border */}
          <div
            className="absolute cursor-move border-2 border-white/80"
            style={{
              left: cropDisplay.x,
              top: cropDisplay.y,
              width: cropDisplay.width,
              height: cropDisplay.height,
            }}
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          />

          {/* 8 drag handles */}
          {([
            ['nw', cropDisplay.x, cropDisplay.y],
            ['n', cropDisplay.x + cropDisplay.width / 2, cropDisplay.y],
            ['ne', cropDisplay.x + cropDisplay.width, cropDisplay.y],
            ['w', cropDisplay.x, cropDisplay.y + cropDisplay.height / 2],
            ['e', cropDisplay.x + cropDisplay.width, cropDisplay.y + cropDisplay.height / 2],
            ['sw', cropDisplay.x, cropDisplay.y + cropDisplay.height],
            ['s', cropDisplay.x + cropDisplay.width / 2, cropDisplay.y + cropDisplay.height],
            ['se', cropDisplay.x + cropDisplay.width, cropDisplay.y + cropDisplay.height],
          ] as [DragHandle, number, number][]).map(([handle, hx, hy]) => (
            <div
              key={handle}
              className="absolute bg-white border border-ds-border"
              style={{
                left: hx - handleSize / 2,
                top: hy - handleSize / 2,
                width: handleSize,
                height: handleSize,
                cursor: handle === 'n' || handle === 's' ? 'ns-resize'
                  : handle === 'e' || handle === 'w' ? 'ew-resize'
                  : handle === 'nw' || handle === 'se' ? 'nwse-resize'
                  : 'nesw-resize',
              }}
              onPointerDown={(e) => handlePointerDown(e, handle)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
