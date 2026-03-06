/**
 * Watermark utility — applies an Option F gradient corner badge
 * with the MarkItUp logo + text to exported images.
 *
 * Only applied to free-credit users (totalPurchased === 0).
 */

import logoUrl from '../logo-transparent.png';

let logoImageCache: HTMLImageElement | null = null;

function loadLogo(): Promise<HTMLImageElement> {
  if (logoImageCache) return Promise.resolve(logoImageCache);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      logoImageCache = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load watermark logo'));
    img.src = logoUrl;
  });
}

/**
 * Apply watermark to a data URL image. Returns a new data URL with the watermark burned in.
 */
export async function applyWatermark(
  dataUrl: string,
  format: 'png' | 'jpeg' = 'png',
  quality = 0.9,
): Promise<string> {
  const [logo, source] = await Promise.all([
    loadLogo(),
    loadImage(dataUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;

  // Draw original image
  ctx.drawImage(source, 0, 0);

  // Scale watermark relative to image size
  const scale = Math.max(source.width, source.height) / 1200;
  const badgeHeight = Math.round(32 * scale);
  const logoPad = Math.round(6 * scale);
  const logoSize = badgeHeight - logoPad * 2;
  const fontSize = Math.round(11 * scale);
  const hPad = Math.round(12 * scale);
  const vPad = Math.round(8 * scale);

  // Measure text
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const textMarkIt = 'MARKIT';
  const textUp = 'UP';
  const markWidth = ctx.measureText(textMarkIt).width;
  const upWidth = ctx.measureText(textUp).width;
  const gap = Math.round(4 * scale);

  const totalWidth = hPad + logoSize + gap + markWidth + upWidth + hPad;
  const totalHeight = badgeHeight;

  const x = source.width - totalWidth - Math.round(10 * scale);
  const y = source.height - totalHeight - Math.round(10 * scale);

  // Gradient background (corner badge)
  const grad = ctx.createLinearGradient(x, y, x + totalWidth, y + totalHeight);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');

  // Rounded rect
  const radius = Math.round(6 * scale);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + totalWidth - radius, y);
  ctx.quadraticCurveTo(x + totalWidth, y, x + totalWidth, y + radius);
  ctx.lineTo(x + totalWidth, y + totalHeight - radius);
  ctx.quadraticCurveTo(x + totalWidth, y + totalHeight, x + totalWidth - radius, y + totalHeight);
  ctx.lineTo(x + radius, y + totalHeight);
  ctx.quadraticCurveTo(x, y + totalHeight, x, y + totalHeight - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Backdrop blur effect (subtle inner glow)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();

  // Draw logo
  const logoX = x + hPad;
  const logoY = y + logoPad;
  ctx.globalAlpha = 0.7;
  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  ctx.globalAlpha = 1;

  // Draw text
  const textX = logoX + logoSize + gap;
  const textY = y + totalHeight / 2 + fontSize * 0.35;

  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(textMarkIt, textX, textY);

  ctx.fillStyle = 'rgba(88, 166, 255, 0.7)';
  ctx.fillText(textUp, textX + markWidth, textY);

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
