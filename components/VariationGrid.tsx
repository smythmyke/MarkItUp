interface VariationGridProps {
  variations: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  checkedIndices: Set<number>;
  onToggleCheck: (index: number) => void;
  loading: boolean;
  outputSizeLabel?: string;
  onRegen?: (index: number) => void;
  regenLoadingIndex?: number;
  freeRegenAvailable?: boolean;
}

function LoadingPlaceholder() {
  return (
    <div className="flex aspect-video items-center justify-center rounded-lg border border-ds-border bg-ds-elevated">
      <div className="flex flex-col items-center gap-2 text-ds-text-dim">
        <svg
          className="h-6 w-6 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
        <span className="text-xs">Generating...</span>
      </div>
    </div>
  );
}

export default function VariationGrid({
  variations,
  selectedIndex,
  onSelect,
  checkedIndices,
  onToggleCheck,
  loading,
  outputSizeLabel,
  onRegen,
  regenLoadingIndex = -1,
  freeRegenAvailable = true,
}: VariationGridProps) {
  if (loading && variations.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
          Generating Variations
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <LoadingPlaceholder />
          <LoadingPlaceholder />
        </div>
      </div>
    );
  }

  if (variations.length === 0) return null;

  const regenDisabled = loading || regenLoadingIndex >= 0;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
        {variations.length} Variation{variations.length !== 1 ? 's' : ''} — Click to preview
      </h3>
      <div className={`grid gap-3 ${variations.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {variations.map((dataUrl, i) => (
          <div key={i} className="relative">
            {/* Preview button */}
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={`w-full overflow-hidden rounded-lg border-2 transition-all ${
                selectedIndex === i
                  ? 'border-ds-accent ring-2 ring-ds-accent/30'
                  : 'border-ds-border hover:border-ds-accent/50'
              }`}
            >
              <img
                src={dataUrl}
                alt={`Variation ${i + 1}`}
                className="h-auto w-full"
              />
            </button>

            {/* Regen overlay */}
            {regenLoadingIndex === i && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-ds-bg/70">
                <div className="flex flex-col items-center gap-2 text-ds-text-dim">
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs font-medium">Regen...</span>
                </div>
              </div>
            )}

            {/* Regen button */}
            {onRegen && regenLoadingIndex !== i && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRegen(i); }}
                disabled={regenDisabled}
                title={freeRegenAvailable ? 'Regen (free)' : 'Regen (1 credit)'}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-ds-surface/80 text-ds-text-muted backdrop-blur transition-colors hover:bg-ds-accent hover:text-white disabled:opacity-40 disabled:hover:bg-ds-surface/80 disabled:hover:text-ds-text-muted"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            )}

            {/* Export checkbox */}
            <label
              className="absolute top-1.5 left-1.5 flex cursor-pointer items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={checkedIndices.has(i)}
                onChange={() => onToggleCheck(i)}
                className="h-4 w-4 cursor-pointer rounded border-ds-border accent-ds-accent"
              />
            </label>

            {outputSizeLabel && (
              <div className="mt-1 text-center text-[10px] text-ds-text-dim">
                {outputSizeLabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
