import { useState } from 'react';
import type { ExportOptions } from '../types';

interface ExportPanelProps {
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
  onExport: () => void;
  checkedCount: number;
}

export default function ExportPanel({ options, onOptionsChange, onExport, checkedCount }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    onExport();
    // Brief disable to prevent double-clicks
    setTimeout(() => setExporting(false), 600);
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">Export</h3>

      {/* Format toggle */}
      <div className="flex rounded-md overflow-hidden border border-ds-border">
        <button
          type="button"
          onClick={() => onOptionsChange({ ...options, format: 'png' })}
          className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
            options.format === 'png'
              ? 'bg-ds-accent-emphasis text-white'
              : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
          }`}
        >
          PNG
        </button>
        <button
          type="button"
          onClick={() => onOptionsChange({ ...options, format: 'jpeg' })}
          className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
            options.format === 'jpeg'
              ? 'bg-ds-accent-emphasis text-white'
              : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
          }`}
        >
          JPEG
        </button>
      </div>

      {/* Quality slider (JPEG only) */}
      {options.format === 'jpeg' && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-ds-text-muted">
            <span>Quality</span>
            <span>{Math.round(options.quality * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={options.quality}
            onChange={(e) => onOptionsChange({ ...options, quality: parseFloat(e.target.value) })}
            className="w-full accent-ds-accent"
          />
        </div>
      )}

      <button
        type="button"
        disabled={exporting || checkedCount === 0}
        onClick={handleExport}
        className="w-full rounded-md bg-ds-accent-emphasis px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-accent disabled:opacity-50"
      >
        {exporting
          ? 'Exporting...'
          : checkedCount === 0
          ? 'Select images to export'
          : checkedCount === 1
          ? 'Export Image'
          : `Export ${checkedCount} Images`}
      </button>
    </div>
  );
}
