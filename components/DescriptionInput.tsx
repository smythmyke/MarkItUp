import { useAuth } from '../contexts/AuthContext';

interface DescriptionInputProps {
  description: string;
  onDescriptionChange: (text: string) => void;
  loading: boolean;
  hasResult: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onCancel?: () => void;
  onSignInToGenerate?: () => void;
}

const MAX_LENGTH = 2000;

export default function DescriptionInput({
  description,
  onDescriptionChange,
  loading,
  hasResult,
  onGenerate,
  onRegenerate,
  onCancel,
  onSignInToGenerate,
}: DescriptionInputProps) {
  const { user } = useAuth();
  const signedIn = !!user;
  const canGenerate = signedIn && !loading;
  const charPercent = description.length / MAX_LENGTH;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading) {
      e.preventDefault();
      if (!signedIn) {
        onSignInToGenerate?.();
      } else if (hasResult) {
        onRegenerate();
      } else {
        onGenerate();
      }
    }
  }

  function handleGenerateClick() {
    if (!signedIn) {
      onSignInToGenerate?.();
    } else {
      onGenerate();
    }
  }

  function handleRegenerateClick() {
    if (!signedIn) {
      onSignInToGenerate?.();
    } else {
      onRegenerate();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm leading-snug text-ds-text-muted">
        Describe what to highlight{' '}
        <span className="text-ds-text-dim">(optional — leave empty for scenic mode)</span>
      </h3>
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder={'e.g. "This is my SaaS dashboard. Highlight the bulk upload button and emphasize the real-time metrics panel."\n\nLeave empty for a text-free scenic visual.'}
          maxLength={MAX_LENGTH}
          rows={5}
          className="w-full resize-none rounded-lg border border-ds-border-light bg-ds-elevated px-3 py-3 text-sm leading-relaxed text-ds-text placeholder-ds-text-dim focus:border-ds-accent focus:outline-none"
        />
        {charPercent > 0.8 && (
          <span className="absolute bottom-2 right-2 text-xs text-ds-text-dim">
            {description.length}/{MAX_LENGTH}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {!hasResult ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerateClick}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors ${
              !loading
                ? 'bg-ds-accent-emphasis hover:bg-ds-accent'
                : 'cursor-not-allowed bg-ds-accent-emphasis opacity-50'
            }`}
          >
            {loading && <Spinner />}
            {loading ? 'Generating...' : signedIn ? 'Generate (1 credit)' : 'Sign in & Generate — 5 free credits'}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleRegenerateClick}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors ${
              !loading
                ? 'bg-ds-accent-emphasis hover:bg-ds-accent'
                : 'cursor-not-allowed bg-ds-accent-emphasis opacity-50'
            }`}
          >
            {loading && <Spinner />}
            {loading ? 'Regenerating...' : signedIn ? 'Regenerate (1 credit)' : 'Sign in & Generate — 5 free credits'}
          </button>
        )}

        {loading && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-ds-border-light px-3 py-2 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
