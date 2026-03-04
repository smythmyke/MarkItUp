import { useCallback, useEffect, useRef, useState } from 'react';
import type { OutputSizeCategory } from '../types';
import {
  OUTPUT_SIZE_PRESETS,
  OUTPUT_SIZE_CATEGORIES,
  searchPresets,
  findPresetById,
  CUSTOM_SIZE_MIN,
  CUSTOM_SIZE_MAX,
  MAX_ASPECT_RATIO,
} from '../lib/outputSizes';

interface OutputSizePickerProps {
  selectedPresetId: string;       // preset id or 'custom'
  customWidth: number;
  customHeight: number;
  onPresetChange: (id: string) => void;
  onCustomSizeChange: (w: number, h: number) => void;
}

export default function OutputSizePicker({
  selectedPresetId,
  customWidth,
  customHeight,
  onPresetChange,
  onCustomSizeChange,
}: OutputSizePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isCustom = selectedPresetId === 'custom';
  const selectedPreset = isCustom ? null : findPresetById(selectedPresetId);
  const filtered = searchPresets(query);

  // Build flat list of selectable items for keyboard nav
  const selectableItems: { type: 'preset'; id: string }[] = [];
  const groupedByCategory = new Map<OutputSizeCategory, typeof filtered>();
  for (const p of filtered) {
    if (!groupedByCategory.has(p.category)) groupedByCategory.set(p.category, []);
    groupedByCategory.get(p.category)!.push(p);
  }
  for (const cat of OUTPUT_SIZE_CATEGORIES) {
    const items = groupedByCategory.get(cat.id);
    if (items) {
      for (const item of items) {
        selectableItems.push({ type: 'preset', id: item.id });
      }
    }
  }
  selectableItems.push({ type: 'preset', id: 'custom' });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Auto-focus search when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setFocusedIndex(-1);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const selectItem = useCallback((id: string) => {
    onPresetChange(id);
    setOpen(false);
  }, [onPresetChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, selectableItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      selectItem(selectableItems[focusedIndex].id);
    }
  }, [focusedIndex, selectableItems, selectItem]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${focusedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  // Custom size validation
  const customError = isCustom ? getCustomSizeError(customWidth, customHeight) : null;

  // Trigger label
  const triggerLabel = isCustom
    ? `Custom \u00b7 ${customWidth} \u00d7 ${customHeight}`
    : selectedPreset
      ? `${selectedPreset.label} \u00b7 ${selectedPreset.width} \u00d7 ${selectedPreset.height}`
      : 'Select size';

  let flatIndex = 0;

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
        Output Size
      </h3>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-ds-border-light bg-ds-elevated px-3 py-2 text-left text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
      >
        <span className="truncate">{triggerLabel}</span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="z-50 flex max-h-72 flex-col overflow-hidden rounded-md border border-ds-border bg-ds-elevated shadow-lg"
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="border-b border-ds-border p-2">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search sizes..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setFocusedIndex(-1); }}
              className="w-full rounded border border-ds-border bg-ds-surface px-2 py-1.5 text-sm text-ds-text placeholder-ds-text-dim outline-none focus:border-ds-accent"
            />
          </div>

          {/* Options list */}
          <div ref={listRef} className="overflow-y-auto scrollbar-hidden">
            {OUTPUT_SIZE_CATEGORIES.map((cat) => {
              const items = groupedByCategory.get(cat.id);
              if (!items || items.length === 0) return null;
              return (
                <div key={cat.id}>
                  {/* Category header */}
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
                    {cat.label}
                  </div>
                  {items.map((preset) => {
                    const idx = flatIndex++;
                    const isSelected = selectedPresetId === preset.id;
                    const isFocused = focusedIndex === idx;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        data-index={idx}
                        onClick={() => selectItem(preset.id)}
                        className={`flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors ${
                          isFocused
                            ? 'bg-ds-accent-subtle text-ds-text'
                            : isSelected
                              ? 'bg-ds-surface text-ds-accent'
                              : 'text-ds-text-muted hover:bg-ds-surface hover:text-ds-text'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className="ml-2 text-xs text-ds-text-dim">
                          {preset.width} &times; {preset.height}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Custom size option */}
            <div>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
                Custom
              </div>
              {(() => {
                const idx = flatIndex++;
                const isFocused = focusedIndex === idx;
                return (
                  <button
                    type="button"
                    data-index={idx}
                    onClick={() => selectItem('custom')}
                    className={`flex w-full items-center px-3 py-1.5 text-sm transition-colors ${
                      isFocused
                        ? 'bg-ds-accent-subtle text-ds-text'
                        : isCustom
                          ? 'bg-ds-surface text-ds-accent'
                          : 'text-ds-text-muted hover:bg-ds-surface hover:text-ds-text'
                    }`}
                  >
                    Custom Size...
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Custom size inputs */}
      {isCustom && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={CUSTOM_SIZE_MIN}
              max={CUSTOM_SIZE_MAX}
              value={customWidth}
              onChange={(e) => onCustomSizeChange(Number(e.target.value) || CUSTOM_SIZE_MIN, customHeight)}
              className={`w-full rounded border px-2 py-1.5 text-sm text-ds-text bg-ds-surface outline-none focus:border-ds-accent ${
                customError ? 'border-red-500' : 'border-ds-border'
              }`}
              placeholder="Width"
            />
            <span className="text-xs text-ds-text-dim">&times;</span>
            <input
              type="number"
              min={CUSTOM_SIZE_MIN}
              max={CUSTOM_SIZE_MAX}
              value={customHeight}
              onChange={(e) => onCustomSizeChange(customWidth, Number(e.target.value) || CUSTOM_SIZE_MIN)}
              className={`w-full rounded border px-2 py-1.5 text-sm text-ds-text bg-ds-surface outline-none focus:border-ds-accent ${
                customError ? 'border-red-500' : 'border-ds-border'
              }`}
              placeholder="Height"
            />
          </div>
          {customError && (
            <p className="text-[11px] text-red-400">{customError}</p>
          )}
        </div>
      )}
    </div>
  );
}

function getCustomSizeError(w: number, h: number): string | null {
  if (w < CUSTOM_SIZE_MIN || h < CUSTOM_SIZE_MIN) {
    return `Minimum size is ${CUSTOM_SIZE_MIN}px`;
  }
  if (w > CUSTOM_SIZE_MAX || h > CUSTOM_SIZE_MAX) {
    return `Maximum size is ${CUSTOM_SIZE_MAX}px`;
  }
  const ratio = Math.max(w / h, h / w);
  if (ratio > MAX_ASPECT_RATIO) {
    return `Aspect ratio cannot exceed ${MAX_ASPECT_RATIO}:1`;
  }
  return null;
}
