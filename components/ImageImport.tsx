import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DIMENSION = 4096;

interface ImageImportProps {
  onImageImport: (dataUrl: string) => void;
}

/**
 * Resize image if either dimension exceeds MAX_DIMENSION.
 * Returns a data URL at the original format (or PNG fallback).
 */
function resizeIfNeeded(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.convertToBlob({ type: mimeType }).then((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    };
    img.onerror = () => resolve(dataUrl); // fallback: use original
    img.src = dataUrl;
  });
}

export default function ImageImport({ onImageImport }: ImageImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const readFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        showToast('Unsupported file type', 'error');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast('File too large (max 20 MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const resized = await resizeIfNeeded(reader.result, file.type);
          onImageImport(resized);
        }
      };
      reader.onerror = () => {
        showToast('Failed to read file', 'error');
      };
      reader.readAsDataURL(file);
    },
    [onImageImport, showToast],
  );

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) readFile(file);
          return;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [readFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex max-w-md flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-300 ${
        isDragging
          ? 'border-ds-accent bg-ds-accent-subtle shadow-[0_0_20px_4px_rgba(88,166,255,0.3)]'
          : 'border-ds-border-light hover:border-[#ff6a00] hover:shadow-[0_0_20px_4px_rgba(255,106,0,0.35)]'
      }`}
      style={!isDragging ? { animation: 'dropFlash 20s ease-in-out infinite' } : undefined}
    >
      <svg
        className="h-12 w-12 text-ds-text-dim"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>

      <div className="text-center">
        <p className="text-ds-text-muted">Drop an image here, or paste from clipboard</p>
        <p className="mt-1 text-sm text-ds-text-dim">PNG, JPEG, WebP, GIF, BMP, SVG (max 20 MB)</p>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-lg bg-ds-accent-emphasis px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-accent"
      >
        Choose File
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
