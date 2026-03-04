interface VariationGridProps {
  variations: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  checkedIndices: Set<number>;
  onToggleCheck: (index: number) => void;
  loading: boolean;
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
}: VariationGridProps) {
  if (loading && variations.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
          Generating Variations
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <LoadingPlaceholder />
          <LoadingPlaceholder />
          <LoadingPlaceholder />
        </div>
      </div>
    );
  }

  if (variations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
        {variations.length} Variation{variations.length !== 1 ? 's' : ''} — Click to preview
      </h3>
      <div className={`grid gap-3 ${variations.length === 1 ? 'grid-cols-1' : variations.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
          </div>
        ))}
      </div>
    </div>
  );
}
