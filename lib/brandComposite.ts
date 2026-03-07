import type { BrandKit } from '../types';

/**
 * Composite a brand logo onto a generated image at the specified position/size.
 * Applied as post-processing after AI generation (like watermark).
 */
export async function compositeBrandLogo(
  imageDataUrl: string,
  kit: BrandKit,
  format: 'png' | 'jpeg' = 'png',
  quality = 0.9,
): Promise<string> {
  if (!kit.logoDataUrl) return imageDataUrl;

  const [source, logo] = await Promise.all([
    loadImage(imageDataUrl),
    loadImage(kit.logoDataUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(source, 0, 0);

  // Calculate logo dimensions based on size setting
  const maxDim = Math.max(source.width, source.height);
  const sizeMultipliers = { small: 0.06, medium: 0.10, large: 0.15 };
  const targetSize = Math.round(maxDim * sizeMultipliers[kit.logoSize]);

  // Maintain logo aspect ratio
  const logoAspect = logo.width / logo.height;
  let drawW: number;
  let drawH: number;
  if (logoAspect >= 1) {
    drawW = targetSize;
    drawH = Math.round(targetSize / logoAspect);
  } else {
    drawH = targetSize;
    drawW = Math.round(targetSize * logoAspect);
  }

  // Calculate position with padding
  const pad = Math.round(maxDim * 0.02);
  let x: number;
  let y: number;

  switch (kit.logoPosition) {
    case 'top-left':
      x = pad;
      y = pad;
      break;
    case 'top-right':
      x = source.width - drawW - pad;
      y = pad;
      break;
    case 'bottom-left':
      x = pad;
      y = source.height - drawH - pad;
      break;
    case 'bottom-right':
    default:
      x = source.width - drawW - pad;
      y = source.height - drawH - pad;
      break;
  }

  ctx.drawImage(logo, x, y, drawW, drawH);

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
