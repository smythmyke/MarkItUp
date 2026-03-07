interface DescriptionInputProps {
  description: string;
  onDescriptionChange: (text: string) => void;
  isLifestyle?: boolean;
  includeText?: boolean;
  onIncludeTextChange?: (value: boolean) => void;
}

const MAX_LENGTH = 2000;

export default function DescriptionInput({
  description,
  onDescriptionChange,
  isLifestyle,
  includeText = true,
  onIncludeTextChange,
}: DescriptionInputProps) {
  const charPercent = description.length / MAX_LENGTH;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm leading-snug text-ds-text-muted">
        {isLifestyle ? 'Describe your product' : 'Describe what to highlight'}{' '}
        <span className="text-ds-text-dim">(optional — leave empty for scenic mode)</span>
      </h3>
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={isLifestyle
            ? 'e.g. "Organic dog treats in a resealable kraft bag. Show someone enjoying time with their dog."\n\nAI-generated people are fictional and do not represent real individuals.'
            : 'e.g. "This is my SaaS dashboard. Highlight the bulk upload button and emphasize the real-time metrics panel."\n\nLeave empty for a text-free scenic visual.'}
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

      {/* Include marketing text toggle */}
      {onIncludeTextChange && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeText}
            onChange={(e) => onIncludeTextChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-ds-border accent-ds-accent"
          />
          <span className="text-xs text-ds-text-muted">Include marketing text in image</span>
        </label>
      )}
    </div>
  );
}
