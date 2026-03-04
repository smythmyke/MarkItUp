import { useState } from 'react';
import type { PresentationTemplate, TemplateCategory } from '../types';
import { TEMPLATE_CATEGORIES } from '../types';
import { presentationTemplates, templateColors, getTemplatesByCategory } from '../lib/presentationTemplates';

interface TemplatePickerProps {
  selectedTemplateId: string;
  onTemplateChange: (template: PresentationTemplate) => void;
}

export default function TemplatePicker({
  selectedTemplateId,
  onTemplateChange,
}: TemplatePickerProps) {
  // Initialize active category from the currently selected template
  const selectedTemplate = presentationTemplates.find((t) => t.id === selectedTemplateId);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>(
    selectedTemplate?.category ?? 'product'
  );

  const filteredTemplates = getTemplatesByCategory(activeCategory);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
        Template
      </h3>

      {/* Category tab bar */}
      <div className="flex rounded-md overflow-hidden border border-ds-border">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 px-1 py-1.5 text-[11px] font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-ds-accent-emphasis text-white'
                : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredTemplates.map((template) => {
          const isActive = selectedTemplateId === template.id;
          const colors = templateColors[template.id];
          return (
            <button
              key={template.id}
              type="button"
              title={template.description}
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
