import type { Annotation } from '../types';

export function generateAnnotationId(): string {
  return crypto.randomUUID();
}

export function createDefaultAnnotation(
  type: Annotation['type'],
  canvasWidth: number,
  canvasHeight: number,
): Annotation {
  const id = generateAnnotationId();
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  switch (type) {
    case 'box':
      return {
        id,
        type: 'box',
        x: cx - 75,
        y: cy - 50,
        width: 150,
        height: 100,
        label: 'Label',
      };
    case 'arrow':
      return {
        id,
        type: 'arrow',
        x: cx - 80,
        y: cy,
        toX: cx + 80,
        toY: cy,
        label: 'Label',
      };
    case 'highlight':
      return {
        id,
        type: 'highlight',
        x: cx - 75,
        y: cy - 30,
        width: 150,
        height: 60,
        label: 'Highlight',
      };
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
