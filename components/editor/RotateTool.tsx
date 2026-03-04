interface RotateToolProps {
  onRotate: (direction: 'cw' | 'ccw') => void;
  onFlip: (axis: 'horizontal' | 'vertical') => void;
}

export default function RotateTool({ onRotate, onFlip }: RotateToolProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      <button
        type="button"
        onClick={() => onRotate('ccw')}
        className="flex items-center gap-1.5 rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6M3.5 15a9 9 0 104-11.3L1 10" />
        </svg>
        Rotate Left
      </button>
      <button
        type="button"
        onClick={() => onRotate('cw')}
        className="flex items-center gap-1.5 rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 4v6h-6M20.5 15a9 9 0 11-4-11.3L23 10" />
        </svg>
        Rotate Right
      </button>
      <button
        type="button"
        onClick={() => onFlip('horizontal')}
        className="flex items-center gap-1.5 rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 20V4" />
        </svg>
        Flip H
      </button>
      <button
        type="button"
        onClick={() => onFlip('vertical')}
        className="flex items-center gap-1.5 rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8V5a2 2 0 012-2h14a2 2 0 012 2v3M3 16v3a2 2 0 002 2h14a2 2 0 002-2v-3M4 12h16" />
        </svg>
        Flip V
      </button>
    </div>
  );
}
