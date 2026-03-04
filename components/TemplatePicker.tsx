import type { PresentationTemplate } from '../types';
import { presentationTemplates } from '../lib/presentationTemplates';

interface TemplatePickerProps {
  selectedTemplateId: string;
  onTemplateChange: (template: PresentationTemplate) => void;
}

/** Color accent per template for the visual indicator */
const templateColors: Record<string, { from: string; to: string }> = {
  glassmorphic: { from: '#7c3aed', to: '#06b6d4' },
  clean_minimal: { from: '#e5e7eb', to: '#f9fafb' },
  bold_marketing: { from: '#ec4899', to: '#f97316' },
  dark_professional: { from: '#1e293b', to: '#0f172a' },
  documentation: { from: '#3b82f6', to: '#06b6d4' },
};

export default function TemplatePicker({
  selectedTemplateId,
  onTemplateChange,
}: TemplatePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
        Template
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {presentationTemplates.map((template) => {
          const isActive = selectedTemplateId === template.id;
          const colors = templateColors[template.id];
          return (
            <button
              key={template.id}
              type="button"
              aria-label={`${template.name} template`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onTemplateChange(template)}
              className={`flex flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-all ${
                isActive
                  ? 'border-ds-accent bg-ds-accent-subtle ring-1 ring-ds-accent-border'
                  : 'border-ds-border-light bg-ds-elevated hover:border-ds-accent/50'
              }`}
            >
              {/* Gradient preview bar */}
              <div
                className="h-8 w-full rounded"
                style={{
                  background: colors
                    ? `linear-gradient(135deg, ${colors.from}, ${colors.to})`
                    : '#374151',
                }}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-ds-accent' : 'text-ds-text-muted'
                }`}
              >
                {template.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
