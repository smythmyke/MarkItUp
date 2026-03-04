import type { EditorTool } from '../../types';

interface EditorToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

const tools: { id: EditorTool; label: string; icon: string }[] = [
  { id: 'crop', label: 'Crop', icon: 'M7 7h10v10M17 7V4M7 7H4M7 17v3M17 17h3' },
  { id: 'resize', label: 'Resize', icon: 'M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4' },
  { id: 'rotate', label: 'Rotate', icon: 'M4 4v5h5M20 20v-5h-5M7.5 5.5A9.96 9.96 0 0112 4c5.52 0 10 4.48 10 10M16.5 18.5A9.96 9.96 0 0112 20C6.48 20 2 15.52 2 10' },
  { id: 'adjust', label: 'Adjust', icon: 'M12 3v18M6 8v8M18 5v14' },
  { id: 'bgremoval', label: 'Remove BG', icon: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7' },
];

export default function EditorToolbar({ activeTool, onToolChange }: EditorToolbarProps) {
  return (
    <div className="flex gap-1 border-b border-ds-border bg-ds-surface px-4 py-2">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            aria-label={tool.label}
            aria-pressed={isActive}
            onClick={() => onToolChange(tool.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-ds-accent-emphasis text-white'
                : 'border border-ds-border-light text-ds-text-muted hover:border-ds-accent hover:text-ds-text'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tool.icon} />
            </svg>
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
