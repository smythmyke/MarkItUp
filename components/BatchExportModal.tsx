import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import type { ExportOptions, OutputSizePreset } from '../types';
import {
  OUTPUT_SIZE_PRESETS,
  OUTPUT_SIZE_CATEGORIES,
  resizeImageToTarget,
  checkResizeCompatibility,
} from '../lib/outputSizes';
import type { BrandKit } from '../types';
import { applyWatermark } from '../lib/watermark';
import { compositeBrandLogo } from '../lib/brandComposite';

interface BatchExportModalProps {
  imageDataUrl: string;
  genAspectRatio: string | null; // ratio used during generation (for compat check)
  genImageSize: string | null;
  exportOptions: ExportOptions;
  isFreeUser: boolean;
  brandKit: BrandKit | null;
  onClose: () => void;
  onToast: (msg: string, variant: 'success' | 'error' | 'info') => void;
}

export default function BatchExportModal({
  imageDataUrl,
  genAspectRatio,
  genImageSize,
  exportOptions,
  isFreeUser,
  brandKit,
  onClose,
  onToast,
}: BatchExportModalProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Determine compatibility for each preset
  const presetCompat = useCallback((preset: OutputSizePreset) => {
    if (!genAspectRatio || !genImageSize) {
      // No generation — always compatible (direct export mode)
      return { compatible: true };
    }
    return checkResizeCompatibility(
      genAspectRatio,
      genImageSize,
      preset.geminiAspectRatio,
      Math.max(preset.width, preset.height),
    );
  }, [genAspectRatio, genImageSize]);

  const togglePreset = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllCompatible = useCallback(() => {
    const ids = new Set<string>();
    for (const preset of OUTPUT_SIZE_PRESETS) {
      if (presetCompat(preset).compatible) ids.add(preset.id);
    }
    setCheckedIds(ids);
  }, [presetCompat]);

  const clearAll = useCallback(() => setCheckedIds(new Set()), []);

  const handleExport = useCallback(async () => {
    if (checkedIds.size === 0) return;
    setExporting(true);
    setProgress(0);

    const ext = exportOptions.format === 'jpeg' ? 'jpg' : 'png';
    const mimeType = exportOptions.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const zip = new JSZip();
    const total = checkedIds.size;
    let done = 0;

    for (const id of checkedIds) {
      const preset = OUTPUT_SIZE_PRESETS.find((p) => p.id === id);
      if (!preset) continue;

      try {
        let resized = await resizeImageToTarget(imageDataUrl, preset.width, preset.height);

        // Apply brand logo for paid users
        if (!isFreeUser && brandKit?.logoDataUrl) {
          try {
            resized = await compositeBrandLogo(resized, brandKit, exportOptions.format, exportOptions.quality);
          } catch { /* skip logo on failure */ }
        }

        // Apply watermark for free users
        if (isFreeUser) {
          try {
            resized = await applyWatermark(resized, exportOptions.format, exportOptions.quality);
          } catch { /* skip watermark on failure */ }
        }

        // Convert to JPEG if needed
        if (exportOptions.format === 'jpeg') {
          const canvas = document.createElement('canvas');
          const img = await loadImage(resized);
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          resized = canvas.toDataURL(mimeType, exportOptions.quality);
        }

        // Strip data URL prefix to get raw base64
        const base64 = resized.split(',')[1];
        const filename = `markitup-export-${preset.width}x${preset.height}.${ext}`;
        zip.file(filename, base64, { base64: true });
      } catch (err) {
        console.error(`Batch export failed for ${preset.label}:`, err);
      }

      done++;
      setProgress(Math.round((done / total) * 100));
    }

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `markitup-batch-${checkedIds.size}sizes.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast(`Exported ${checkedIds.size} sizes as ZIP!`, 'success');
      onClose();
    } catch (err) {
      console.error('ZIP generation failed:', err);
      onToast('Failed to create ZIP file', 'error');
    } finally {
      setExporting(false);
    }
  }, [checkedIds, imageDataUrl, exportOptions, isFreeUser, brandKit, onToast, onClose]);

  const compatibleCount = OUTPUT_SIZE_PRESETS.filter((p) => presetCompat(p).compatible).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-[440px] max-w-[95vw] flex-col rounded-xl border border-ds-border bg-ds-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ds-border px-5 py-4">
          <h2 className="text-base font-semibold text-ds-text">Batch Export</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ds-text-muted transition-colors hover:bg-ds-elevated hover:text-ds-text"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between border-b border-ds-border px-5 py-2">
          <span className="text-xs text-ds-text-dim">
            {checkedIds.size} of {OUTPUT_SIZE_PRESETS.length} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllCompatible}
              className="text-xs text-ds-accent hover:underline"
            >
              Select all compatible ({compatibleCount})
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-ds-text-dim hover:text-ds-text"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Size list */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {OUTPUT_SIZE_CATEGORIES.map((cat) => {
            const presets = OUTPUT_SIZE_PRESETS.filter((p) => p.category === cat.id);
            if (presets.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="sticky top-0 z-10 bg-ds-surface px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
                  {cat.label}
                </div>
                {presets.map((preset) => {
                  const compat = presetCompat(preset);
                  const checked = checkedIds.has(preset.id);
                  return (
                    <label
                      key={preset.id}
                      className={`flex cursor-pointer items-center gap-3 px-5 py-2 transition-colors hover:bg-ds-elevated ${
                        !compat.compatible ? 'opacity-40' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!compat.compatible}
                        onChange={() => togglePreset(preset.id)}
                        className="h-3.5 w-3.5 rounded border-ds-border accent-ds-accent"
                      />
                      <span className="flex-1 text-sm text-ds-text">{preset.label}</span>
                      <span className="text-xs text-ds-text-dim">
                        {preset.width} &times; {preset.height}
                      </span>
                      {!compat.compatible && (
                        <span className="text-[9px] text-ds-text-dim" title={compat.reason}>
                          incompatible
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-ds-border px-5 py-3">
          {exporting && (
            <div className="mb-2">
              <div className="h-1.5 w-full rounded-full bg-ds-border">
                <div
                  className="h-1.5 rounded-full bg-ds-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-ds-text-dim">Resizing... {progress}%</p>
            </div>
          )}
          <button
            type="button"
            disabled={exporting || checkedIds.size === 0}
            onClick={handleExport}
            className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white transition-colors ${
              exporting || checkedIds.size === 0
                ? 'cursor-not-allowed bg-ds-accent-emphasis opacity-50'
                : 'bg-ds-accent-emphasis hover:bg-ds-accent'
            }`}
          >
            {exporting ? 'Exporting...' : `Export ${checkedIds.size} Size${checkedIds.size !== 1 ? 's' : ''} as ZIP`}
          </button>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
