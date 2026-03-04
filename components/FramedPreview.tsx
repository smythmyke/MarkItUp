import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cropImage, getImageDimensions } from '../lib/imageEditor';

interface FramedPreviewProps {
  imageDataUrl: string;
  targetWidth: number;
  targetHeight: number;
  onCrop: (croppedDataUrl: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function FramedPreview({
  imageDataUrl,
  targetWidth,
  targetHeight,
  onCrop,
}: FramedPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cropping, setCropping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Load image dimensions
  useEffect(() => {
    let cancelled = false;
    getImageDimensions(imageDataUrl).then((dims) => {
      if (!cancelled) setImgDims(dims);
    });
    return () => { cancelled = true; };
  }, [imageDataUrl]);

  // Reset zoom/pan when aspect ratio or image changes
  const aspectKey = targetWidth / targetHeight;
  useEffect(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [aspectKey, imageDataUrl]);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- Computed geometry ---

  const geometry = useMemo(() => {
    const { width: cW, height: cH } = containerSize;
    const { width: imgW, height: imgH } = imgDims;
    if (!cW || !cH || !imgW || !imgH) return null;

    const frameRatio = targetWidth / targetHeight;
    const containerRatio = cW / cH;

    // Frame sized to 85% of container, maintaining target aspect ratio
    let frameW: number, frameH: number;
    if (frameRatio > containerRatio) {
      frameW = cW * 0.85;
      frameH = frameW / frameRatio;
    } else {
      frameH = cH * 0.85;
      frameW = frameH * frameRatio;
    }

    // Base crop: largest rectangle of target aspect ratio within source image
    const imgRatio = imgW / imgH;
    let baseCropW: number, baseCropH: number;
    if (frameRatio >= imgRatio) {
      baseCropW = imgW;
      baseCropH = imgW / frameRatio;
    } else {
      baseCropH = imgH;
      baseCropW = imgH * frameRatio;
    }

    return { frameW, frameH, baseCropW, baseCropH, imgW, imgH };
  }, [containerSize, imgDims, targetWidth, targetHeight]);

  // Crop region at current zoom + pan
  const cropRegion = useMemo(() => {
    if (!geometry) return null;
    const { baseCropW, baseCropH, imgW, imgH } = geometry;
    const cropW = baseCropW / zoom;
    const cropH = baseCropH / zoom;
    const maxPanX = (imgW - cropW) / 2;
    const maxPanY = (imgH - cropH) / 2;
    const clampedPanX = clamp(panX, -maxPanX, maxPanX);
    const clampedPanY = clamp(panY, -maxPanY, maxPanY);
    const cropX = (imgW - cropW) / 2 - clampedPanX;
    const cropY = (imgH - cropH) / 2 - clampedPanY;
    return { x: cropX, y: cropY, width: cropW, height: cropH };
  }, [geometry, zoom, panX, panY]);

  // Display transform: map crop region to frame
  const displayTransform = useMemo(() => {
    if (!geometry || !cropRegion) return null;
    const { frameW, frameH, imgW, imgH } = geometry;
    const displayScale = frameW / cropRegion.width;
    return {
      imgDisplayW: imgW * displayScale,
      imgDisplayH: imgH * displayScale,
      imgLeft: -cropRegion.x * displayScale,
      imgTop: -cropRegion.y * displayScale,
      displayScale,
    };
  }, [geometry, cropRegion]);

  // --- Pan clamping helper ---

  const clampPan = useCallback(
    (px: number, py: number, z: number) => {
      if (!geometry) return { px, py };
      const { baseCropW, baseCropH, imgW, imgH } = geometry;
      const cropW = baseCropW / z;
      const cropH = baseCropH / z;
      const maxPanX = (imgW - cropW) / 2;
      const maxPanY = (imgH - cropH) / 2;
      return {
        px: clamp(px, -maxPanX, maxPanX),
        py: clamp(py, -maxPanY, maxPanY),
      };
    },
    [geometry],
  );

  // --- Zoom handler ---

  const handleZoom = useCallback(
    (newZoom: number) => {
      const z = clamp(newZoom, 1, 5);
      setZoom(z);
      setPanX((prev) => clampPan(prev, panY, z).px);
      setPanY((prev) => clampPan(panX, prev, z).py);
    },
    [clampPan, panX, panY],
  );

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      handleZoom(zoom * factor);
    },
    [zoom, handleZoom],
  );

  // --- Drag/pan handlers ---

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !displayTransform) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      // Convert display pixels to source pixels
      const srcDx = dx / displayTransform.displayScale;
      const srcDy = dy / displayTransform.displayScale;

      setPanX((prev) => clampPan(prev + srcDx, panY, zoom).px);
      setPanY((prev) => clampPan(panX, prev + srcDy, zoom).py);
    },
    [displayTransform, clampPan, panX, panY, zoom],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // --- Apply crop ---

  const handleApplyCrop = useCallback(async () => {
    if (!cropRegion) return;
    setCropping(true);
    try {
      const region = {
        x: Math.round(cropRegion.x),
        y: Math.round(cropRegion.y),
        width: Math.round(cropRegion.width),
        height: Math.round(cropRegion.height),
      };
      const cropped = await cropImage(imageDataUrl, region);
      onCrop(cropped);
    } finally {
      setCropping(false);
    }
  }, [cropRegion, imageDataUrl, onCrop]);

  // --- Reset ---

  const handleReset = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const isDefaultView = zoom === 1 && panX === 0 && panY === 0;

  if (!geometry || !cropRegion || !displayTransform) {
    // Still loading image / measuring container — show placeholder
    return (
      <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
        <img
          src={imageDataUrl}
          alt="Source image"
          className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
        />
      </div>
    );
  }

  const { frameW, frameH } = geometry;
  const { imgDisplayW, imgDisplayH, imgLeft, imgTop } = displayTransform;

  // Frame position: centered in container
  const frameLeft = (containerSize.width - frameW) / 2;
  const frameTop = (containerSize.height - frameH) / 2;

  return (
    <div ref={containerRef} className="relative flex h-full w-full flex-col">
      {/* Preview area */}
      <div
        className="relative flex-1 cursor-grab select-none overflow-hidden active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Dark background behind everything */}
        <div className="absolute inset-0 bg-ds-bg" />

        {/* Image rendered at display scale (visible only through frame) */}
        <img
          src={imageDataUrl}
          alt="Source image"
          className="pointer-events-none absolute"
          style={{
            width: imgDisplayW,
            height: imgDisplayH,
            left: frameLeft + imgLeft,
            top: frameTop + imgTop,
          }}
          draggable={false}
        />

        {/* Dark overlay: four rects around the frame */}
        {/* Top */}
        <div
          className="absolute left-0 right-0 top-0 bg-black/50"
          style={{ height: frameTop }}
        />
        {/* Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-black/50"
          style={{ height: containerSize.height - frameTop - frameH }}
        />
        {/* Left */}
        <div
          className="absolute left-0 bg-black/50"
          style={{ top: frameTop, width: frameLeft, height: frameH }}
        />
        {/* Right */}
        <div
          className="absolute right-0 bg-black/50"
          style={{
            top: frameTop,
            width: containerSize.width - frameLeft - frameW,
            height: frameH,
          }}
        />

        {/* Frame border */}
        <div
          className="pointer-events-none absolute border-2 border-white/60"
          style={{
            left: frameLeft,
            top: frameTop,
            width: frameW,
            height: frameH,
          }}
        >
          {/* Rule-of-thirds grid */}
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-ds-surface/80 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* Zoom out */}
          <button
            type="button"
            onClick={() => handleZoom(zoom / 1.1)}
            disabled={zoom <= 1}
            className="rounded p-1 text-ds-text-muted transition-colors hover:text-ds-text disabled:opacity-30"
            title="Zoom out"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Slider */}
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => handleZoom(parseFloat(e.target.value))}
            className="h-1 w-28 cursor-pointer accent-ds-accent"
          />

          {/* Zoom in */}
          <button
            type="button"
            onClick={() => handleZoom(zoom * 1.1)}
            disabled={zoom >= 5}
            className="rounded p-1 text-ds-text-muted transition-colors hover:text-ds-text disabled:opacity-30"
            title="Zoom in"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Zoom percentage */}
          <span className="min-w-[3rem] text-xs text-ds-text-muted">
            {Math.round(zoom * 100)}%
          </span>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            disabled={isDefaultView}
            className="rounded px-2 py-1 text-xs text-ds-text-muted transition-colors hover:text-ds-text disabled:opacity-30"
          >
            Reset
          </button>
        </div>

        {/* Apply */}
        <button
          type="button"
          onClick={handleApplyCrop}
          disabled={cropping}
          className="rounded-md bg-ds-accent-emphasis px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ds-accent-emphasis/90 disabled:opacity-50"
        >
          {cropping ? 'Cropping\u2026' : 'Apply Crop'}
        </button>
      </div>
    </div>
  );
}
