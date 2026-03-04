import type { ImageAdjustments } from '../../types';

interface AdjustToolProps {
  adjustments: ImageAdjustments;
  onChange: (adjustments: ImageAdjustments) => void;
  onApply: () => void;
  onReset: () => void;
}

const sliders: { key: keyof ImageAdjustments; label: string }[] = [
  { key: 'brightness', label: 'Brightness' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'saturation', label: 'Saturation' },
];

export default function AdjustTool({ adjustments, onChange, onApply, onReset }: AdjustToolProps) {
  const isDefault = adjustments.brightness === 0 && adjustments.contrast === 0 && adjustments.saturation === 0;

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {sliders.map((s) => (
        <label key={s.key} className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-ds-text-muted">{s.label}</span>
            <span className="text-ds-text-dim">{adjustments[s.key]}</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjustments[s.key]}
            onChange={(e) => onChange({ ...adjustments, [s.key]: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ds-border-light accent-ds-accent"
          />
        </label>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={isDefault}
          className="flex-1 rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text disabled:opacity-40"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={isDefault}
          className="flex-1 rounded-md bg-ds-accent-emphasis px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ds-accent disabled:opacity-40"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
