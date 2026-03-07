import type { BrandKit } from '../types';

interface BrandKitSelectorProps {
  kits: BrandKit[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onManage: () => void;
  disabled?: boolean;
}

export default function BrandKitSelector({
  kits,
  selectedId,
  onSelect,
  onManage,
  disabled,
}: BrandKitSelectorProps) {
  const selected = kits.find((k) => k.id === selectedId);

  if (kits.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">Brand Kit</h3>
        <button
          type="button"
          onClick={onManage}
          className="flex items-center gap-2 rounded-md border border-dashed border-ds-border-light px-3 py-2 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Set up Brand Kit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">Brand Kit</h3>
      <div className="flex gap-2">
        <select
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          disabled={disabled}
          className="flex-1 rounded-md border border-ds-border-light bg-ds-elevated px-2 py-1.5 text-sm text-ds-text focus:border-ds-accent focus:outline-none disabled:opacity-50"
        >
          <option value="">None</option>
          {kits.map((kit) => (
            <option key={kit.id} value={kit.id}>{kit.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onManage}
          title="Manage brand kits"
          className="rounded-md border border-ds-border-light px-2 py-1.5 text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Mini preview of selected brand */}
      {selected && (
        <div className="flex items-center gap-2 rounded-md bg-ds-elevated px-2.5 py-1.5">
          {selected.logoDataUrl && (
            <img src={selected.logoDataUrl} alt="" className="h-5 w-5 object-contain" />
          )}
          <span className="truncate text-xs text-ds-text-muted">{selected.name}</span>
          <div className="ml-auto flex gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selected.colors.primary }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selected.colors.secondary }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selected.colors.accent }} />
          </div>
        </div>
      )}

      {disabled && selectedId && (
        <p className="text-[10px] text-ds-text-dim">Brand Kit applies to paid generations only</p>
      )}
    </div>
  );
}
