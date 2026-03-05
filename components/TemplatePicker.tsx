import { useRef, useState } from 'react';
import type { PresentationTemplate, TemplateCategory } from '../types';
import { TEMPLATE_CATEGORIES } from '../types';
import { presentationTemplates, getTemplatesByCategory } from '../lib/presentationTemplates';

interface TemplatePickerProps {
  selectedTemplateId: string;
  onTemplateChange: (template: PresentationTemplate) => void;
}

export default function TemplatePicker({
  selectedTemplateId,
  onTemplateChange,
}: TemplatePickerProps) {
  const selectedTemplate = presentationTemplates.find((t) => t.id === selectedTemplateId);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>(
    selectedTemplate?.category ?? 'product'
  );
  const [hoveredTemplate, setHoveredTemplate] = useState<PresentationTemplate | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = getTemplatesByCategory(activeCategory);

  function handleMouseEnter(template: PresentationTemplate, e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Position popover to the left of the sidebar, vertically centered on the card
    setPopoverPos({
      top: btnRect.top - containerRect.top + btnRect.height / 2,
      left: -8, // just left of the container edge
    });
    setHoveredTemplate(template);
  }

  function handleMouseLeave() {
    setHoveredTemplate(null);
    setPopoverPos(null);
  }

  return (
    <div className="relative flex flex-col gap-2" ref={containerRef}>
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
          return (
            <button
              key={template.id}
              type="button"
              title={template.description}
              aria-label={`${template.name} template`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onTemplateChange(template)}
              onMouseEnter={(e) => handleMouseEnter(template, e)}
              onMouseLeave={handleMouseLeave}
              className={`flex flex-col gap-1 rounded-lg border overflow-hidden text-left transition-all ${
                isActive
                  ? 'border-ds-accent ring-1 ring-ds-accent-border'
                  : 'border-ds-border-light bg-ds-elevated hover:border-ds-accent/50'
              }`}
            >
              {/* Thumbnail preview */}
              <img
                src={template.previewUrl}
                alt={`${template.name} preview`}
                loading="lazy"
                className="h-20 w-full object-cover"
              />
              <span
                className={`px-2 pb-1.5 text-xs font-medium ${
                  isActive ? 'text-ds-accent' : 'text-ds-text-muted'
                }`}
              >
                {template.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hover popover — enlarged preview positioned to the left */}
      {hoveredTemplate && popoverPos && (
        <div
          className="pointer-events-none absolute z-50"
          style={{
            top: popoverPos.top,
            right: '100%',
            transform: 'translateY(-50%)',
            marginRight: 8,
          }}
        >
          <div className="overflow-hidden rounded-xl border border-ds-border-light bg-ds-elevated shadow-2xl shadow-black/60">
            <img
              src={hoveredTemplate.previewUrl}
              alt={`${hoveredTemplate.name} enlarged`}
              className="h-auto w-56"
            />
            <div className="px-3 py-2">
              <div className="text-sm font-medium text-ds-text">{hoveredTemplate.name}</div>
              <div className="text-xs text-ds-text-muted">{hoveredTemplate.description}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
