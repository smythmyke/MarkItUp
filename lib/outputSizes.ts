import type { OutputSizePreset, OutputSizeCategory } from '../types';

// --- Constants ---

export const CUSTOM_SIZE_MIN = 500;
export const CUSTOM_SIZE_MAX = 4000;
export const MAX_ASPECT_RATIO = 5;
export const DEFAULT_OUTPUT_SIZE_ID = 'ig_square';

// --- Categories ---

export const OUTPUT_SIZE_CATEGORIES: { id: OutputSizeCategory; label: string }[] = [
  { id: 'social', label: 'Social' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'product', label: 'Product' },
  { id: 'banners', label: 'Banners' },
];

// --- Presets ---

export const OUTPUT_SIZE_PRESETS: OutputSizePreset[] = [
  // Social
  { id: 'ig_square', label: 'Instagram Square', platform: 'Instagram', width: 1080, height: 1080, category: 'social', geminiAspectRatio: '1:1', geminiImageSize: '2K' },
  { id: 'ig_portrait', label: 'Instagram Portrait', platform: 'Instagram', width: 1080, height: 1350, category: 'social', geminiAspectRatio: '4:5', geminiImageSize: '2K' },
  { id: 'ig_grid', label: 'Instagram Grid', platform: 'Instagram', width: 1080, height: 1440, category: 'social', geminiAspectRatio: '3:4', geminiImageSize: '2K' },
  { id: 'story_reel', label: 'Story / Reel', platform: 'Instagram', width: 1080, height: 1920, category: 'social', geminiAspectRatio: '9:16', geminiImageSize: '2K' },
  // Marketing
  { id: 'fb_linkedin', label: 'Facebook / LinkedIn', platform: 'Facebook', width: 1200, height: 628, category: 'marketing', geminiAspectRatio: '16:9', geminiImageSize: '2K' },
  { id: 'yt_thumbnail', label: 'YouTube Thumbnail', platform: 'YouTube', width: 1280, height: 720, category: 'marketing', geminiAspectRatio: '16:9', geminiImageSize: '2K' },
  { id: 'pinterest', label: 'Pinterest Pin', platform: 'Pinterest', width: 1000, height: 1500, category: 'marketing', geminiAspectRatio: '2:3', geminiImageSize: '2K' },
  // Product
  { id: 'product_hd', label: 'Product HD', platform: 'Product', width: 2000, height: 2000, category: 'product', geminiAspectRatio: '1:1', geminiImageSize: '2K' },
  { id: 'product_hunt', label: 'Product Hunt', platform: 'Product Hunt', width: 1270, height: 760, category: 'product', geminiAspectRatio: '3:2', geminiImageSize: '2K' },
  { id: 'dribbble', label: 'Dribbble Shot', platform: 'Dribbble', width: 2800, height: 2100, category: 'product', geminiAspectRatio: '4:3', geminiImageSize: '4K' },
  // Banners
  { id: 'twitter_banner', label: 'Twitter/X Banner', platform: 'Twitter', width: 1500, height: 500, category: 'banners', geminiAspectRatio: '21:9', geminiImageSize: '2K' },
  { id: 'yt_banner', label: 'YouTube Banner', platform: 'YouTube', width: 2560, height: 1440, category: 'banners', geminiAspectRatio: '16:9', geminiImageSize: '4K' },
];

// --- Lookup ---

export function findPresetById(id: string): OutputSizePreset | undefined {
  return OUTPUT_SIZE_PRESETS.find((p) => p.id === id);
}

// --- Search ---

export function searchPresets(query: string): OutputSizePreset[] {
  if (!query.trim()) return OUTPUT_SIZE_PRESETS;
  const q = query.toLowerCase();
  return OUTPUT_SIZE_PRESETS.filter((p) => {
    const dims = `${p.width}×${p.height} ${p.width}x${p.height}`;
    const haystack = `${p.label} ${p.platform} ${dims}`.toLowerCase();
    return haystack.includes(q);
  });
}

// --- Gemini Config Resolution (for custom sizes) ---

const GEMINI_RATIOS: { label: string; value: number }[] = [
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: '4:5', value: 4 / 5 },
  { label: '5:4', value: 5 / 4 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
  { label: '21:9', value: 21 / 9 },
];

export function resolveGeminiConfig(w: number, h: number): { aspectRatio: string; imageSize: string } {
  const ratio = w / h;

  let closest = GEMINI_RATIOS[0];
  let minDiff = Math.abs(ratio - closest.value);
  for (const gr of GEMINI_RATIOS) {
    const diff = Math.abs(ratio - gr.value);
    if (diff < minDiff) {
      closest = gr;
      minDiff = diff;
    }
  }

  const imageSize = Math.max(w, h) > 2048 ? '4K' : '2K';

  return { aspectRatio: closest.label, imageSize };
}

// --- Client-Side Resize (cover-fit + center-crop) ---

export function resizeImageToTarget(
  dataUrl: string,
  targetW: number,
  targetH: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (targetW - scaledW) / 2;
      const offsetY = (targetH - scaledH) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for resize'));
    img.src = dataUrl;
  });
}
