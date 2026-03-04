import { useCallback, useState } from 'react';
import { removeImageBackground, type BgRemovalProgress } from '../../lib/backgroundRemoval';

interface BackgroundRemovalToolProps {
  imageDataUrl: string;
  onApply: (resultDataUrl: string) => void;
}

export default function BackgroundRemovalTool({ imageDataUrl, onApply }: BackgroundRemovalToolProps) {
  const [progress, setProgress] = useState<BgRemovalProgress | null>(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = useCallback(async () => {
    setProcessing(true);
    setError(null);
    setPreview(null);
    try {
      const result = await removeImageBackground(imageDataUrl, setProgress);
      setPreview(result);
    } catch (err: any) {
      setError(err.message || 'Background removal failed');
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  }, [imageDataUrl]);

  const handleApply = useCallback(() => {
    if (preview) onApply(preview);
  }, [preview, onApply]);

  const progressPct = progress ? Math.round(progress.progress * 100) : 0;

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {!preview && !processing && (
        <>
          <p className="text-xs text-ds-text-dim">
            Removes the background from your image using an AI model. First use downloads a ~30 MB model (cached for future use).
          </p>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-md bg-ds-accent-emphasis px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ds-accent"
          >
            Remove Background
          </button>
        </>
      )}

      {processing && progress && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ds-text-muted">
            {progress.phase === 'downloading' ? 'Downloading model...' : 'Processing...'}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-ds-elevated">
            <div
              className="h-full rounded-full bg-ds-accent-emphasis transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-ds-text-dim">{progressPct}%</span>
        </div>
      )}

      {processing && !progress && (
        <p className="text-xs text-ds-text-muted">Starting background removal...</p>
      )}

      {error && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-red-400">{error}</p>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
          >
            Retry
          </button>
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded border border-ds-border-light">
            <img src={preview} alt="Background removed preview" className="max-h-32 w-full object-contain bg-[repeating-conic-gradient(#30363d_0_25%,transparent_0_50%)] bg-[length:16px_16px]" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="flex-1 rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-md bg-ds-accent-emphasis px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ds-accent"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
