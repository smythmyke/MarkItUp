import { removeBackground, type Config } from '@imgly/background-removal';

export type BgRemovalPhase = 'downloading' | 'processing';

export interface BgRemovalProgress {
  phase: BgRemovalPhase;
  progress: number; // 0-1
}

/** Remove background from a data URL image. Returns a data URL with transparent background. */
export async function removeImageBackground(
  dataUrl: string,
  onProgress?: (progress: BgRemovalProgress) => void,
): Promise<string> {
  const config: Config = {
    progress: (key: string, current: number, total: number) => {
      if (!onProgress) return;
      const pct = total > 0 ? current / total : 0;
      const phase: BgRemovalPhase = key.includes('fetch') || key.includes('download')
        ? 'downloading'
        : 'processing';
      onProgress({ phase, progress: pct });
    },
  };

  const blob = await removeBackground(dataUrl, config);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
