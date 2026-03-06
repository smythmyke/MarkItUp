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
    tags: ['glass', 'frosted', 'gradient', 'iridescent', 'modern', 'saas', 'premium', 'sparkle', 'translucent'],
  },
  {
    id: 'bold_marketing',
    name: 'Bold Marketing',
    description: 'Vibrant gradient, large headline, neon glow highlights, energetic',
    previewUrl: previewUrl('bold_marketing'),
    category: 'product',
    tags: ['bold', 'vibrant', 'neon', 'energetic', 'social media', 'ads', 'landing page', 'attention', 'loud'],
  },
  {
    id: 'device_mockup',
    name: 'Device Mockup',
    description: 'Screenshot in MacBook/phone frame, angled perspective, gradient background',
    previewUrl: previewUrl('device_mockup'),
    category: 'product',
    tags: ['mockup', 'device', 'macbook', 'iphone', 'phone', 'laptop', 'apple', 'perspective', '3d', 'frame'],
  },
  {
    id: 'gradient_noise',
    name: 'Gradient Noise',
    description: 'Mesh gradient background, grain texture overlay, warm tactile feel',
    previewUrl: previewUrl('gradient_noise'),
    category: 'product',
    tags: ['gradient', 'grain', 'warm', 'indie', 'dribbble', 'tactile', 'organic', 'soft', 'texture', 'mesh'],
  },
  {
    id: 'app_store',
    name: 'App Store',
    description: 'App store screenshot format, phone frame, feature badge, clean background',
    previewUrl: previewUrl('app_store'),
    category: 'product',
    tags: ['app store', 'google play', 'mobile', 'phone', 'badge', 'listing', 'download', 'ios', 'android'],
  },

  // --- Professional & Enterprise ---
  {
    id: 'dark_professional',
    name: 'Dark Professional',
    description: 'Dark backdrop, sharp contrast, gold/cyan accents, executive feel',
    previewUrl: previewUrl('dark_professional'),
    category: 'professional',
    tags: ['dark', 'executive', 'premium', 'gold', 'elegant', 'corporate', 'pitch deck', 'boardroom', 'luxury'],
  },
  {
    id: 'cinematic_aurora',
    name: 'Cinematic Aurora',
    description: 'Dark environment, aurora color washes, particle effects, elegant typography',
    previewUrl: previewUrl('cinematic_aurora'),
    category: 'professional',
    tags: ['cinematic', 'aurora', 'dark', 'particles', 'elegant', 'luxury', 'atmospheric', 'glow', 'premium'],
  },
  {
    id: 'corporate_clean',
    name: 'Corporate Clean',
    description: 'Blue/gray palette, structured grid, geometric patterns, executive feel',
    previewUrl: previewUrl('corporate_clean'),
    category: 'professional',
    tags: ['corporate', 'blue', 'enterprise', 'presentation', 'business', 'structured', 'grid', 'formal', 'white paper'],
  },
  {
    id: 'bento_grid',
    name: 'Bento Grid',
    description: 'Modular card layout, screenshot as hero tile, feature callout tiles',
    previewUrl: previewUrl('bento_grid'),
    category: 'professional',
    tags: ['bento', 'grid', 'tiles', 'modular', 'cards', 'apple', 'linear', 'features', 'modern', 'layout'],
  },

  // --- Technical & Documentation ---
  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    description: 'White background, thin borders, subtle shadow, clean typography',
    previewUrl: previewUrl('clean_minimal'),
    category: 'technical',
    tags: ['clean', 'minimal', 'white', 'simple', 'blog', 'documentation', 'light', 'whitespace', 'neutral'],
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Single clear callout, clean arrows, neutral palette, help-doc quality',
    previewUrl: previewUrl('documentation'),
    category: 'technical',
    tags: ['docs', 'documentation', 'tutorial', 'help', 'onboarding', 'instructions', 'callout', 'arrow', 'guide'],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Engineering diagram aesthetic, grid overlay, technical callouts, monospace',
    previewUrl: previewUrl('blueprint'),
    category: 'technical',
    tags: ['blueprint', 'engineering', 'diagram', 'technical', 'schematic', 'grid', 'monospace', 'spec', 'developer'],
  },
  {
    id: 'terminal_dark',
    name: 'Terminal Dark',
    description: 'Dark terminal-inspired, monospace typography, code aesthetic, green/amber accents',
    previewUrl: previewUrl('terminal_dark'),
    category: 'technical',
    tags: ['terminal', 'dark', 'code', 'developer', 'hacker', 'cli', 'monospace', 'vscode', 'green', 'matrix'],
  },

  // --- Creative & Social ---
  {
    id: 'neo_brutalist',
    name: 'Neo Brutalist',
    description: 'Thick black borders, bold primary colors, raw angular layout, offset shadows',
    previewUrl: previewUrl('neo_brutalist'),
    category: 'creative',
    tags: ['brutalist', 'bold', 'raw', 'indie', 'angular', 'primary colors', 'edgy', 'punk', 'web', 'loud'],
  },
  {
    id: 'retro_futurism',
    name: 'Retro Futurism',
    description: 'Chrome finishes, neon palette, dark background with grid floor, 80s sci-fi',
    previewUrl: previewUrl('retro_futurism'),
    category: 'creative',
    tags: ['retro', 'futurism', 'neon', 'chrome', 'sci-fi', 'tron', 'blade runner', 'grid', 'synthwave', '80s'],
  },
  {
    id: 'collage_mixed',
    name: 'Collage Mixed',
    description: 'Layered fragments, overlapping elements, mixed media texture, torn edges',
    previewUrl: previewUrl('collage_mixed'),
    category: 'creative',
    tags: ['collage', 'mixed media', 'torn', 'tape', 'layered', 'editorial', 'magazine', 'art', 'scrapbook', 'texture'],
  },
  {
    id: 'comic_book',
    name: 'Comic Book',
    description: 'Bold outlines, halftone dots, speech bubbles, action lines, primary colors',
    previewUrl: previewUrl('comic_book'),
    category: 'creative',
    tags: ['comic', 'manga', 'pop art', 'halftone', 'speech bubble', 'action', 'marvel', 'bold', 'hero', 'fun'],
  },
  {
    id: 'vintage_polaroid',
    name: 'Vintage Polaroid',
    description: 'Faded film look, white Polaroid frame, warm color cast, handwritten caption',
    previewUrl: previewUrl('vintage_polaroid'),
    category: 'creative',
    tags: ['polaroid', 'vintage', 'film', 'nostalgic', 'warm', 'photo', 'retro', 'faded', 'personal', 'analog'],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Pastel neon gradients, marble busts, glitch art, retro OS windows, surreal',
    previewUrl: previewUrl('vaporwave'),
    category: 'creative',
    tags: ['vaporwave', 'aesthetic', 'glitch', 'pastel', 'neon', 'surreal', 'windows 95', 'internet', 'ironic', 'dreamy'],
  },

  // --- Decade-Inspired ---
  {
    id: 'psychedelic_60s',
    name: 'Psychedelic 60s',
    description: 'Swirling tie-dye colors, wavy lettering, flower power motifs, concert poster',
    previewUrl: previewUrl('psychedelic_60s'),
    category: 'decade',
    tags: ['60s', '1960s', 'psychedelic', 'tie-dye', 'flower power', 'hippie', 'woodstock', 'peace', 'groovy', 'colorful'],
  },
  {
    id: 'disco_70s',
    name: 'Disco 70s',
    description: 'Gold accents, mirror ball sparkle, sunburst rays, warm earth tones, groovy',
    previewUrl: previewUrl('disco_70s'),
    category: 'decade',
    tags: ['70s', '1970s', 'disco', 'gold', 'funky', 'groovy', 'mirror ball', 'retro', 'warm', 'earth tones'],
  },
  {
    id: 'synthwave_80s',
    name: 'Synthwave 80s',
    description: 'Neon grid, palm trees, VHS scanlines, sunset horizon, chrome text, Miami Vice',
    previewUrl: previewUrl('synthwave_80s'),
    category: 'decade',
    tags: ['80s', '1980s', 'synthwave', 'neon', 'vhs', 'miami vice', 'palm trees', 'chrome', 'arcade', 'radical'],
  },
  {
    id: 'grunge_90s',
    name: 'Grunge 90s',
    description: 'Torn paper, distressed type, photocopied aesthetic, zine culture, raw attitude',
    previewUrl: previewUrl('grunge_90s'),
    category: 'decade',
    tags: ['90s', '1990s', 'grunge', 'zine', 'punk', 'distressed', 'raw', 'alternative', 'nirvana', 'skateboard'],
  },
  {
    id: 'y2k_2000s',
    name: 'Y2K 2000s',
    description: 'Glossy 3D text, iridescent bubbles, chrome orbs, translucent plastic, iPod era',
    previewUrl: previewUrl('y2k_2000s'),
    category: 'decade',
    tags: ['2000s', 'y2k', 'glossy', '3d', 'chrome', 'bubble', 'ipod', 'imac', 'futuristic', 'millennium'],
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
  comic_book: { from: '#ef4444', to: '#3b82f6' },
  vintage_polaroid: { from: '#d4a574', to: '#f5e6d3' },
  vaporwave: { from: '#ec4899', to: '#06b6d4' },
  // Decade
  psychedelic_60s: { from: '#f97316', to: '#a855f7' },
  disco_70s: { from: '#d4af37', to: '#f59e0b' },
  synthwave_80s: { from: '#ec4899', to: '#06b6d4' },
  grunge_90s: { from: '#4a5e3a', to: '#8b4513' },
  y2k_2000s: { from: '#93c5fd', to: '#f9a8d4' },
};

/** Get templates filtered by category */
export function getTemplatesByCategory(category: TemplateCategory): PresentationTemplate[] {
  return presentationTemplates.filter((t) => t.category === category);
}

/** Search templates by query — matches name, description, and tags */
export function searchTemplates(query: string): PresentationTemplate[] {
  if (!query.trim()) return presentationTemplates;
  const terms = query.toLowerCase().split(/\s+/);
  return presentationTemplates.filter((t) => {
    const haystack = `${t.name} ${t.description} ${t.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export const defaultTemplate = presentationTemplates[0];
