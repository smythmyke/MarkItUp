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
    <div className="flex h-full w-full flex-col items-center justify-center p-8">
      {/* Spinner + status — pinned at top */}
      <div className="mb-4 flex shrink-0 items-center gap-3">
        <svg className="h-5 w-5 animate-spin text-ds-accent" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium text-ds-text">
          Generating with <span className="text-ds-accent">{selectedTemplateName}</span>...
        </span>
      </div>

      {/* Template showcase carousel — fixed-height area, images fit naturally */}
      <div className="relative flex w-full max-w-lg flex-1 flex-col items-center" style={{ minHeight: 0 }}>
        <div className="flex flex-1 items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
          <img
            key={current.id}
            src={current.previewUrl}
            alt={current.name}
            className="max-h-full max-w-full rounded-xl border border-ds-border object-contain shadow-lg shadow-black/30 animate-fadeIn"
          />
        </div>

        {/* Template name + description below image */}
        <div className="mt-3 shrink-0 text-center">
          <div className="text-base font-semibold text-ds-text">{current.name}</div>
          <div className="mt-0.5 text-sm text-ds-text-muted">{current.description}</div>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex shrink-0 justify-center gap-1.5">
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

      {/* AI disclaimer — pinned at bottom */}
      <p className="mt-4 shrink-0 max-w-md text-center text-xs text-ds-text-dim">
        Powered by Google Gemini AI. Generated images may contain misspellings, visual artifacts, or inaccuracies.
      </p>
    </div>
  );
}
