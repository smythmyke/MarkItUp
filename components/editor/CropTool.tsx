import type { AspectRatioPreset, CropRegion, ImageDimensions } from '../../types';

interface CropToolProps {
  cropRegion: CropRegion;
  onCropRegionChange: (region: CropRegion) => void;
  imageDimensions: ImageDimensions;
  onApply: () => void;
}

const presets: { label: string; value: AspectRatioPreset }[] = [
  { label: 'Free', value: 'free' },
  { label: '16:9', value: '16:9' },
  { label: '4:3', value: '4:3' },
  { label: '1:1', value: '1:1' },
  { label: '9:16', value: '9:16' },
  { label: '3:4', value: '3:4' },
];

function getAspectRatio(preset: AspectRatioPreset): number | null {
  switch (preset) {
    case '16:9': return 16 / 9;
    case '4:3': return 4 / 3;
    case '1:1': return 1;
    case '9:16': return 9 / 16;
    case '3:4': return 3 / 4;
    default: return null;
  }
}

export default function CropTool({ cropRegion, onCropRegionChange, imageDimensions, onApply }: CropToolProps) {
  const handlePreset = (preset: AspectRatioPreset) => {
    const ratio = getAspectRatio(preset);
    if (!ratio) {
      // Free: reset to full image
      onCropRegionChange({ x: 0, y: 0, width: imageDimensions.width, height: imageDimensions.height });
      return;
    }

    // Fit aspect ratio within image bounds, centered
    let w = imageDimensions.width;
    let h = w / ratio;
    if (h > imageDimensions.height) {
      h = imageDimensions.height;
      w = h * ratio;
    }
    onCropRegionChange({
      x: (imageDimensions.width - w) / 2,
      y: (imageDimensions.height - h) / 2,
      width: w,
      height: h,
    });
  };

  const isFull = cropRegion.x === 0 && cropRegion.y === 0
    && Math.abs(cropRegion.width - imageDimensions.width) < 1
    && Math.abs(cropRegion.height - imageDimensions.height) < 1;

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handlePreset(p.value)}
            className="rounded-md border border-ds-border-light px-2.5 py-1 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="text-xs text-ds-text-dim">
        {Math.round(cropRegion.width)} x {Math.round(cropRegion.height)} px
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={isFull}
        className="rounded-md bg-ds-accent-emphasis px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ds-accent disabled:opacity-40"
      >
        Apply Crop
      </button>
    </div>
  );
}
