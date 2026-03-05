import { useCallback, useEffect, useRef, useState } from 'react';
import ImageImport from './ImageImport';
import logoUrl from '../assets/logo.png';

const LEFT_IMAGES = ['L1.png', 'L2.png', 'L3.png', 'L4.png', 'L5.png', 'L6.png', 'L7.png'];
const RIGHT_IMAGES = ['R1.png', 'R2.png', 'R3.png', 'R4.png', 'R5.png', 'R6.png', 'R7.png'];

function showcaseUrl(filename: string): string {
  // Both WXT and the web build serve public/ files at their respective base path.
  // import.meta.env.BASE_URL is '/' for the extension and '/MarkItUp/' for the web build.
  return `${import.meta.env.BASE_URL}showcase/${filename}`;
}

interface HeroLandingProps {
  onImageImport: (dataUrl: string) => void;
  /** Compact mode: single column, no video (used in extension to reduce bundle size) */
  compact?: boolean;
}

export default function HeroLanding({ onImageImport, compact = false }: HeroLandingProps) {
  const [enlargedSrc, setEnlargedSrc] = useState<string | null>(null);

  // Escape to close enlarged view
  useEffect(() => {
    if (!enlargedSrc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEnlargedSrc(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [enlargedSrc]);

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Video background (web only) */}
      {!compact && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-25"
          >
            <source src={showcaseUrl('space-bg.mp4')} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, var(--color-ds-bg) 80%)',
            }}
          />
        </div>
      )}

      {/* Left scrolling column */}
      <ScrollColumn images={LEFT_IMAGES} direction="up" onImageClick={setEnlargedSrc} />

      {/* Center content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <img src={logoUrl} alt="MarkItUp" className="h-20 sm:h-24 lg:h-28" />
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Turn screenshots into
          <br />
          <span className="text-ds-accent">marketing visuals</span>
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-ds-text-muted">
          Upload any screenshot, pick a template, describe what to highlight.
          AI generates polished marketing visuals in seconds.
        </p>

        <ImageImport onImageImport={onImageImport} />

        <div className="inline-flex items-center gap-1.5 rounded-full border border-ds-accent/20 bg-ds-accent/10 px-3.5 py-1.5 text-[13px] text-ds-accent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          5 free credits on sign-up
        </div>
      </div>

      {/* Right scrolling column (web only) */}
      {!compact && (
        <ScrollColumn images={RIGHT_IMAGES} direction="down" onImageClick={setEnlargedSrc} />
      )}

      {/* Enlarged image overlay */}
      {enlargedSrc && (
        <div
          className="fixed inset-0 z-[200] flex cursor-pointer items-center justify-center bg-ds-bg/85 backdrop-blur-sm"
          onClick={() => setEnlargedSrc(null)}
        >
          <img
            src={enlargedSrc}
            alt="Enlarged preview"
            className="max-h-[80vh] max-w-[80vw] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

/* --- Scrolling Column --- */

interface ScrollColumnProps {
  images: string[];
  direction: 'up' | 'down';
  onImageClick: (src: string) => void;
}

function ScrollColumn({ images, direction, onImageClick }: ScrollColumnProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // CSS animation handles the loop via duplicated images.
  // We render the image set twice for seamless looping.
  const doubled = [...images, ...images];

  return (
    <div
      className="relative z-10 hidden w-[240px] shrink-0 overflow-hidden lg:block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top fade */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 h-28 bg-gradient-to-b from-ds-bg to-transparent" />
      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-28 bg-gradient-to-t from-ds-bg to-transparent" />

      <div
        ref={trackRef}
        className="flex flex-col gap-4 px-3 py-4"
        style={{
          animation: `${direction === 'up' ? 'heroScrollUp' : 'heroScrollDown'} 50s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {doubled.map((img, i) => (
          <img
            key={`${img}-${i}`}
            src={showcaseUrl(img)}
            alt="Showcase example"
            loading="lazy"
            onClick={() => onImageClick(showcaseUrl(img))}
            className="w-full cursor-pointer rounded-[10px] shadow-lg shadow-black/50 transition-all duration-300 hover:z-10 hover:scale-[1.08] hover:shadow-ds-accent/20 hover:shadow-xl"
          />
        ))}
      </div>
    </div>
  );
}
