import { useEffect, useState } from 'react';
import { presentationTemplates } from '../lib/presentationTemplates';

interface GeneratingPreviewProps {
  selectedTemplateName: string;
}

export default function GeneratingPreview({ selectedTemplateName }: GeneratingPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Shuffle templates once on mount, excluding duplicates
  const [shuffled] = useState(() => {
    const copy = [...presentationTemplates];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  });

  // Auto-advance every 3.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffled.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [shuffled.length]);

  const current = shuffled[currentIndex];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
      {/* Spinner + status */}
      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 animate-spin text-ds-accent" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium text-ds-text">
          Generating with <span className="text-ds-accent">{selectedTemplateName}</span>...
        </span>
      </div>

      {/* Template showcase carousel */}
      <div className="relative w-full max-w-lg">
        {/* Image with crossfade */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-ds-border bg-ds-elevated shadow-lg shadow-black/30">
          <img
            key={current.id}
            src={current.previewUrl}
            alt={current.name}
            className="absolute inset-0 h-full w-full object-cover animate-fadeIn"
          />

          {/* Gradient overlay at bottom for text */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-4 pt-12">
            <div className="text-base font-semibold text-white">{current.name}</div>
            <div className="mt-0.5 text-sm text-white/70">{current.description}</div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex justify-center gap-1.5">
          {shuffled.slice(0, 8).map((t, i) => (
            <div
              key={t.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex % 8
                  ? 'w-4 bg-ds-accent'
                  : 'w-1.5 bg-ds-border-light'
              }`}
            />
          ))}
        </div>
      </div>

      {/* AI disclaimer */}
      <p className="max-w-md text-center text-xs text-ds-text-dim">
        Powered by Google Gemini AI. Generated images may contain misspellings, visual artifacts, or inaccuracies.
      </p>
    </div>
  );
}
