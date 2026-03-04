import type { CropRegion, ImageAdjustments, ImageDimensions } from '../types';

/** Load a data URL into an HTMLImageElement. */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/** Convert an OffscreenCanvas to a data URL string. */
async function canvasToDataUrl(canvas: OffscreenCanvas, mimeType = 'image/png'): Promise<string> {
  const blob = await canvas.convertToBlob({ type: mimeType });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/** Get the natural dimensions of a data URL image. */
export async function getImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  const img = await loadImage(dataUrl);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/** Crop an image to the specified region. */
export async function cropImage(dataUrl: string, region: CropRegion): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = Math.round(region.width);
  const h = Math.round(region.height);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    img,
    Math.round(region.x), Math.round(region.y), w, h,
    0, 0, w, h,
  );
  return canvasToDataUrl(canvas);
}

/** Resize an image to exact dimensions. */
export async function resizeImage(dataUrl: string, width: number, height: number): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = Math.round(width);
  const h = Math.round(height);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvasToDataUrl(canvas);
}

/** Rotate image 90 degrees clockwise or counter-clockwise. */
export async function rotateImage(dataUrl: string, direction: 'cw' | 'ccw'): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = new OffscreenCanvas(img.naturalHeight, img.naturalWidth);
  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(direction === 'cw' ? Math.PI / 2 : -Math.PI / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvasToDataUrl(canvas);
}

/** Flip image horizontally or vertically. */
export async function flipImage(dataUrl: string, axis: 'horizontal' | 'vertical'): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d')!;
  if (axis === 'horizontal') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(img, 0, 0);
  return canvasToDataUrl(canvas);
}

/** Apply brightness/contrast/saturation adjustments. Values range -100 to 100 (0 = no change). */
export async function adjustImage(dataUrl: string, adjustments: ImageAdjustments): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d')!;

  // Convert -100..100 to CSS filter values
  const brightness = 100 + adjustments.brightness; // 0..200 (100 = normal)
  const contrast = 100 + adjustments.contrast;
  const saturation = 100 + adjustments.saturation;

  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(img, 0, 0);
  return canvasToDataUrl(canvas);
}
