import type { PresentationTemplate } from '../types';

export const presentationTemplates: PresentationTemplate[] = [
  {
    id: 'glassmorphic',
    name: 'Glassmorphic',
    description: 'Frosted glass panel, gradient backdrop, iridescent edges, sparkle accents',
    previewUrl: '', // TODO: Add preview thumbnail
  },
  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    description: 'White background, thin borders, subtle shadow, clean typography',
    previewUrl: '',
  },
  {
    id: 'bold_marketing',
    name: 'Bold Marketing',
    description: 'Vibrant gradient, large headline, neon glow highlights, energetic',
    previewUrl: '',
  },
  {
    id: 'dark_professional',
    name: 'Dark Professional',
    description: 'Dark backdrop, sharp contrast, gold/cyan accents, executive feel',
    previewUrl: '',
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Numbered callouts, clean arrows, step indicators, neutral palette',
    previewUrl: '',
  },
];

export const defaultTemplate = presentationTemplates[0];
