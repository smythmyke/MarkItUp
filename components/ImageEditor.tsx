import { useCallback, useEffect, useRef, useState } from 'react';
import type { CropRegion, EditorTool, ImageAdjustments, ImageDimensions } from '../types';
import { useEditHistory } from '../hooks/useEditHistory';
import { cropImage, resizeImage, rotateImage, flipImage, adjustImage, getImageDimensions } from '../lib/imageEditor';
import EditorToolbar from './editor/EditorToolbar';
import EditorPreview from './editor/EditorPreview';
import CropTool from './editor/CropTool';
import ResizeTool from './editor/ResizeTool';
import RotateTool from './editor/RotateTool';
import AdjustTool from './editor/AdjustTool';
import BackgroundRemovalTool from './editor/BackgroundRemovalTool';

interface ImageEditorProps {
  imageDataUrl: string;
  onDone: (editedDataUrl: string) => void;
  onCancel: () => void;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = { brightness: 0, contrast: 0, saturation: 0 };

export default function ImageEditor({ imageDataUrl, onDone, onCancel }: ImageEditorProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const history = useEditHistory(imageDataUrl);
  const [activeTool, setActiveTool] = useState<EditorTool>('crop');
  const [dimensions, setDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [cropRegion, setCropRegion] = useState<CropRegion>({ x: 0, y: 0, width: 0, height: 0 });
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [processing, setProcessing] = useState(false);

  const hasEdits = history.canUndo;

  // Load dimensions whenever current image changes
  useEffect(() => {
    getImageDimensions(history.current).then((dims) => {
      setDimensions(dims);
      setCropRegion({ x: 0, y: 0, width: dims.width, height: dims.height });
    });
  }, [history.current]);

  // Auto-focus cancel button on mount
  useEffect(() => {
    cancelBtnRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }

      // Ctrl+Z / Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (history.canRedo) history.redo();
        } else {
          if (history.canUndo) history.undo();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [history, hasEdits]);

  const handleCancel = useCallback(() => {
    if (hasEdits && !confirm('Discard all edits?')) return;
    onCancel();
  }, [hasEdits, onCancel]);

  const handleDone = useCallback(() => {
    onDone(history.current);
  }, [history.current, onDone]);

  // --- Tool actions ---

  const handleCropApply = useCallback(async () => {
    setProcessing(true);
    try {
      const result = await cropImage(history.current, cropRegion);
      history.pushState(result);
    } finally {
      setProcessing(false);
    }
  }, [history, cropRegion]);

  const handleResizeApply = useCallback(async (width: number, height: number) => {
    setProcessing(true);
    try {
      const result = await resizeImage(history.current, width, height);
      history.pushState(result);
    } finally {
      setProcessing(false);
    }
  }, [history]);

  const handleRotate = useCallback(async (direction: 'cw' | 'ccw') => {
    setProcessing(true);
    try {
      const result = await rotateImage(history.current, direction);
      history.pushState(result);
    } finally {
      setProcessing(false);
    }
  }, [history]);

  const handleFlip = useCallback(async (axis: 'horizontal' | 'vertical') => {
    setProcessing(true);
    try {
      const result = await flipImage(history.current, axis);
      history.pushState(result);
    } finally {
      setProcessing(false);
    }
  }, [history]);

  const handleAdjustApply = useCallback(async () => {
    setProcessing(true);
    try {
      const result = await adjustImage(history.current, adjustments);
      history.pushState(result);
      setAdjustments(DEFAULT_ADJUSTMENTS);
    } finally {
      setProcessing(false);
    }
  }, [history, adjustments]);

  const handleAdjustReset = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  const handleBgRemovalApply = useCallback((resultDataUrl: string) => {
    history.pushState(resultDataUrl);
  }, [history]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ds-surface"
      role="dialog"
      aria-modal="true"
      aria-label="Image Editor"
    >
      {/* Top bar */}
      <div ref={modalRef} className="flex h-12 shrink-0 items-center justify-between border-b border-ds-border px-4">
        <button
          ref={cancelBtnRef}
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-ds-border-light px-3 py-1 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
        >
          Cancel
        </button>

        <span className="text-sm font-medium text-ds-text">Edit Image</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => history.undo()}
            disabled={!history.canUndo || processing}
            className="rounded-md border border-ds-border-light p-1.5 text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text disabled:opacity-30"
            aria-label="Undo"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6M3.5 15a9 9 0 104-11.3L1 10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => history.redo()}
            disabled={!history.canRedo || processing}
            className="rounded-md border border-ds-border-light p-1.5 text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text disabled:opacity-30"
            aria-label="Redo"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M20.5 15a9 9 0 11-4-11.3L23 10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={processing}
            className="rounded-md bg-ds-accent-emphasis px-4 py-1 text-sm font-medium text-white transition-colors hover:bg-ds-accent disabled:opacity-40"
          >
            Done
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar activeTool={activeTool} onToolChange={setActiveTool} />

      {/* Preview */}
      <EditorPreview
        imageDataUrl={history.current}
        cropActive={activeTool === 'crop'}
        cropRegion={cropRegion}
        onCropRegionChange={setCropRegion}
        adjustPreview={activeTool === 'adjust' ? adjustments : null}
        imageDimensions={dimensions}
      />

      {/* Tool controls */}
      <div className="shrink-0 border-t border-ds-border bg-ds-surface">
        {activeTool === 'crop' && (
          <CropTool
            cropRegion={cropRegion}
            onCropRegionChange={setCropRegion}
            imageDimensions={dimensions}
            onApply={handleCropApply}
          />
        )}
        {activeTool === 'resize' && (
          <ResizeTool
            imageDimensions={dimensions}
            onApply={handleResizeApply}
          />
        )}
        {activeTool === 'rotate' && (
          <RotateTool
            onRotate={handleRotate}
            onFlip={handleFlip}
          />
        )}
        {activeTool === 'adjust' && (
          <AdjustTool
            adjustments={adjustments}
            onChange={setAdjustments}
            onApply={handleAdjustApply}
            onReset={handleAdjustReset}
          />
        )}
        {activeTool === 'bgremoval' && (
          <BackgroundRemovalTool
            imageDataUrl={history.current}
            onApply={handleBgRemovalApply}
          />
        )}
      </div>
    </div>
  );
}
