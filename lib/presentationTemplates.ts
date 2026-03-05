import type { PresentationTemplate, TemplateCategory } from '../types';

function previewUrl(id: string): string {
  return `${import.meta.env.BASE_URL}templates/${id}.webp`;
}

export const presentationTemplates: PresentationTemplate[] = [
  // --- Product & Marketing ---
  {
    id: 'glassmorphic',
    name: 'Glassmorphic',
    description: 'Frosted glass panel, gradient backdrop, iridescent edges, sparkle accents',
    previewUrl: previewUrl('glassmorphic'),
    category: 'product',
  },
  {
    id: 'bold_marketing',
    name: 'Bold Marketing',
    description: 'Vibrant gradient, large headline, neon glow highlights, energetic',
    previewUrl: previewUrl('bold_marketing'),
    category: 'product',
  },
  {
    id: 'device_mockup',
    name: 'Device Mockup',
    description: 'Screenshot in MacBook/phone frame, angled perspective, gradient background',
    previewUrl: previewUrl('device_mockup'),
    category: 'product',
  },
  {
    id: 'gradient_noise',
    name: 'Gradient Noise',
    description: 'Mesh gradient background, grain texture overlay, warm tactile feel',
    previewUrl: previewUrl('gradient_noise'),
    category: 'product',
  },
  {
    id: 'app_store',
    name: 'App Store',
    description: 'App store screenshot format, phone frame, feature badge, clean background',
    previewUrl: previewUrl('app_store'),
    category: 'product',
  },

  // --- Professional & Enterprise ---
  {
    id: 'dark_professional',
    name: 'Dark Professional',
    description: 'Dark backdrop, sharp contrast, gold/cyan accents, executive feel',
    previewUrl: previewUrl('dark_professional'),
    category: 'professional',
  },
  {
    id: 'cinematic_aurora',
    name: 'Cinematic Aurora',
    description: 'Dark environment, aurora color washes, particle effects, elegant typography',
    previewUrl: previewUrl('cinematic_aurora'),
    category: 'professional',
  },
  {
    id: 'corporate_clean',
    name: 'Corporate Clean',
    description: 'Blue/gray palette, structured grid, geometric patterns, executive feel',
    previewUrl: previewUrl('corporate_clean'),
    category: 'professional',
  },
  {
    id: 'bento_grid',
    name: 'Bento Grid',
    description: 'Modular card layout, screenshot as hero tile, feature callout tiles',
    previewUrl: previewUrl('bento_grid'),
    category: 'professional',
  },

  // --- Technical & Documentation ---
  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    description: 'White background, thin borders, subtle shadow, clean typography',
    previewUrl: previewUrl('clean_minimal'),
    category: 'technical',
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Single clear callout, clean arrows, neutral palette, help-doc quality',
    previewUrl: previewUrl('documentation'),
    category: 'technical',
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Engineering diagram aesthetic, grid overlay, technical callouts, monospace',
    previewUrl: previewUrl('blueprint'),
    category: 'technical',
  },
  {
    id: 'terminal_dark',
    name: 'Terminal Dark',
    description: 'Dark terminal-inspired, monospace typography, code aesthetic, green/amber accents',
    previewUrl: previewUrl('terminal_dark'),
    category: 'technical',
  },

  // --- Creative & Social ---
  {
    id: 'neo_brutalist',
    name: 'Neo Brutalist',
    description: 'Thick black borders, bold primary colors, raw angular layout, offset shadows',
    previewUrl: previewUrl('neo_brutalist'),
    category: 'creative',
  },
  {
    id: 'retro_futurism',
    name: 'Retro Futurism',
    description: 'Chrome finishes, neon palette, dark background with grid floor, 80s sci-fi',
    previewUrl: previewUrl('retro_futurism'),
    category: 'creative',
  },
  {
    id: 'collage_mixed',
    name: 'Collage Mixed',
    description: 'Layered fragments, overlapping elements, mixed media texture, torn edges',
    previewUrl: previewUrl('collage_mixed'),
    category: 'creative',
  },
];

/** Color accent per template for the visual indicator gradient */
export const templateColors: Record<string, { from: string; to: string }> = {
  // Product
  glassmorphic: { from: '#7c3aed', to: '#06b6d4' },
  bold_marketing: { from: '#ec4899', to: '#f97316' },
  device_mockup: { from: '#6366f1', to: '#8b5cf6' },
  gradient_noise: { from: '#f59e0b', to: '#ef4444' },
  app_store: { from: '#3b82f6', to: '#60a5fa' },
  // Professional
  dark_professional: { from: '#1e293b', to: '#0f172a' },
  cinematic_aurora: { from: '#059669', to: '#7c3aed' },
  corporate_clean: { from: '#3b82f6', to: '#64748b' },
  bento_grid: { from: '#475569', to: '#1e293b' },
  // Technical
  clean_minimal: { from: '#e5e7eb', to: '#f9fafb' },
  documentation: { from: '#3b82f6', to: '#06b6d4' },
  blueprint: { from: '#1e3a5f', to: '#2563eb' },
  terminal_dark: { from: '#064e3b', to: '#0a0a0a' },
  // Creative
  neo_brutalist: { from: '#ef4444', to: '#eab308' },
  retro_futurism: { from: '#d946ef', to: '#06b6d4' },
  collage_mixed: { from: '#f97316', to: '#ec4899' },
};

/** Get templates filtered by category */
export function getTemplatesByCategory(category: TemplateCategory): PresentationTemplate[] {
  return presentationTemplates.filter((t) => t.category === category);
}

export const defaultTemplate = presentationTemplates[0];
