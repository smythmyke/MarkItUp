/**
 * Presentation templates for the two-step AI pipeline.
 * Each template has an analysis prompt (text analysis + copywriting) and
 * an image prompt (visual rendering instructions).
 */

export interface TemplatePrompts {
  id: string;
  name: string;
  analysisPrompt: string;
  geminiPrompt: string;
}

const SPELLING_REMINDER = "\n\nCRITICAL: Double-check all spelling. Every word must be spelled correctly.";

const templates: Record<string, TemplatePrompts> = {
  glassmorphic: {
    id: "glassmorphic",
    name: "Glassmorphic",
    analysisPrompt: `You are a marketing copywriter analyzing a software screenshot for a SaaS marketing visual.

Analyze the screenshot and the user's description to produce compelling marketing copy. Focus on the key value proposition visible in the UI.

Return a JSON object with these exact fields:
{
  "headline": "A bold, concise headline (5-8 words) that captures the main value proposition",
  "subHeadline": "A supporting sentence (10-20 words) that expands on the headline with a specific benefit",
  "highlightTarget": "Description of the UI element to visually emphasize (be specific about location and what it is)",
  "tooltipText": "A short tooltip or callout (5-12 words) pointing to the key feature",
  "marketingCopy": "One sentence of supporting marketing copy describing what users can see in this view"
}

Write text that is accurate to what's shown in the screenshot. Do not invent features not visible in the image. Be specific and action-oriented.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a stunning glassmorphic marketing visual using the provided screenshot and text.

VISUAL STYLE — Glassmorphic:
- Place the screenshot at a slight 3D angle (5-10° perspective tilt)
- Add a frosted glass panel overlaying or adjacent to the screenshot with the headline and sub-headline
- Use a rich gradient backdrop (deep purple → blue → teal) behind everything
- Apply iridescent/holographic edge highlights on the glass panel
- Add subtle sparkle/bokeh light accents in the background
- Use clean, modern sans-serif typography (white text on the glass panel)
- The screenshot should have a subtle drop shadow and rounded corners
- Overall feel: premium, modern, SaaS-quality marketing material

LAYOUT:
- The screenshot is the hero element — it should be clearly visible and legible
- Headline appears prominently on or near the glass panel
- Sub-headline appears below the headline in smaller text
- A tooltip/callout arrow or badge highlights the specified UI element
- The composition should feel balanced and professional

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  clean_minimal: {
    id: "clean_minimal",
    name: "Clean Minimal",
    analysisPrompt: `You are a technical writer creating clear, informative copy for a documentation or blog visual.

Analyze the screenshot and the user's description. Focus on clarity and precision — this will be used in tutorials, docs, or blog posts.

Return a JSON object with these exact fields:
{
  "headline": "A clear, descriptive title (4-8 words) explaining what this screenshot shows",
  "subHeadline": "A concise explanation (10-20 words) of what the user is looking at or can do here",
  "highlightTarget": "Description of the UI element to highlight (be specific about location)",
  "tooltipText": "A helpful, informative callout (5-12 words) explaining the highlighted element",
  "marketingCopy": "One sentence providing additional context about this feature or view"
}

Be factual and precise. Describe what is actually visible. Avoid marketing hype — aim for helpful clarity.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a clean, minimal documentation-style visual using the provided screenshot and text.

VISUAL STYLE — Clean Minimal:
- White or very light gray (#F8F9FA) background
- Screenshot placed straight-on (no perspective tilt), centered with generous padding
- Thin, subtle border (1px light gray) around the screenshot
- Soft drop shadow beneath the screenshot (subtle, not dramatic)
- Clean sans-serif typography (dark gray or black text)
- Minimal decorative elements — let the screenshot speak
- Optional: thin accent line (blue or brand color) as a subtle design element

LAYOUT:
- Headline above or below the screenshot in medium-weight font
- Sub-headline directly below the headline in lighter weight
- A clean callout arrow or numbered indicator pointing to the highlighted element
- Tooltip text in a simple rounded rectangle near the callout
- Generous whitespace throughout

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  bold_marketing: {
    id: "bold_marketing",
    name: "Bold Marketing",
    analysisPrompt: `You are an advertising copywriter creating punchy, high-energy marketing copy for a product visual.

Analyze the screenshot and the user's description. Create copy that grabs attention and drives action — this will be used for social media, ads, or landing pages.

Return a JSON object with these exact fields:
{
  "headline": "A bold, attention-grabbing headline (3-7 words) — punchy and energetic",
  "subHeadline": "An action-oriented sentence (10-18 words) that creates urgency or highlights a specific benefit",
  "highlightTarget": "Description of the most impressive UI element to showcase (be specific)",
  "tooltipText": "A short, punchy callout (4-10 words) that emphasizes the wow factor",
  "marketingCopy": "One powerful sentence that makes the viewer want to try this product"
}

Be bold and confident. Use active voice and strong verbs. Make it exciting but still accurate to what's shown.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a bold, high-energy marketing visual using the provided screenshot and text.

VISUAL STYLE — Bold Marketing:
- Vibrant gradient background (electric blue → hot pink, or orange → magenta)
- Screenshot displayed prominently with a dramatic perspective or floating effect
- Neon glow or bright accent highlights around key areas
- Large, bold headline text — big enough to read at a glance
- Energetic design elements: diagonal lines, geometric shapes, or particle effects
- High contrast throughout — nothing subtle
- Overall feel: eye-catching, modern, social-media-ready

LAYOUT:
- Headline is the LARGEST text element — impossible to miss
- Screenshot is the hero but the headline competes for attention
- Sub-headline below the headline in contrasting weight
- A glowing highlight or neon border around the target UI element
- Tooltip as a bright badge or callout with an arrow
- The composition should feel dynamic and energetic

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  dark_professional: {
    id: "dark_professional",
    name: "Dark Professional",
    analysisPrompt: `You are a business communications expert creating executive-quality copy for a product showcase.

Analyze the screenshot and the user's description. Create polished, professional copy suitable for pitch decks, case studies, or enterprise marketing.

Return a JSON object with these exact fields:
{
  "headline": "A refined, professional headline (4-8 words) that conveys authority and capability",
  "subHeadline": "A measured, confident statement (10-20 words) highlighting the business value",
  "highlightTarget": "Description of the key UI element that demonstrates the product's value (be specific)",
  "tooltipText": "A concise, professional callout (5-12 words) for the highlighted element",
  "marketingCopy": "One polished sentence positioning this as an enterprise-grade solution"
}

Sound authoritative and refined. Use precise language. Avoid casual tone or hype — aim for executive credibility.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a dark, professional executive-quality visual using the provided screenshot and text.

VISUAL STYLE — Dark Professional:
- Dark background (#0A0A0F or very dark navy/charcoal)
- Screenshot displayed with crisp edges, subtle light border, and a refined drop shadow
- Accent colors: gold (#D4AF37), cyan (#00D4FF), or silver highlights — used sparingly
- Elegant, refined typography — medium-weight sans-serif, well-spaced
- Subtle gradient overlays or vignette effects
- Optional: thin gold or cyan accent lines as design elements
- Overall feel: premium, executive, boardroom-ready

LAYOUT:
- Screenshot centered or slightly offset with generous dark space
- Headline in refined typography with accent color highlight on a key word
- Sub-headline below in lighter weight, slightly muted color
- A precise callout line (gold or cyan) connecting to the highlighted UI element
- Tooltip in a dark rounded rectangle with accent border
- The composition should feel restrained and sophisticated

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  documentation: {
    id: "documentation",
    name: "Documentation",
    analysisPrompt: `You are a UX writer creating clear instructional copy for a help document or onboarding guide.

Analyze the screenshot and the user's description. Create copy that helps users understand a step or feature — this will be used in help docs, onboarding flows, or how-to guides.

Return a JSON object with these exact fields:
{
  "headline": "A clear step title or feature name (3-7 words) — instructional and direct",
  "subHeadline": "A helpful instruction or explanation (10-20 words) telling the user what to do or what they're seeing",
  "highlightTarget": "Description of the UI element the user needs to interact with (be very specific about location and type)",
  "tooltipText": "A direct instruction or label (4-10 words) for the highlighted element, e.g. 'Click here to save'",
  "marketingCopy": "One sentence providing context about why this step matters or what happens next"
}

Be direct and instructional. Use imperative mood ("Click", "Select", "Enter") where appropriate. Prioritize clarity over cleverness.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a clean documentation-style visual with numbered callouts using the provided screenshot and text.

VISUAL STYLE — Documentation:
- Light, neutral background (white or light warm gray)
- Screenshot displayed straight-on, full-width or near-full-width
- Numbered callout circles (1, 2, 3) in a consistent accent color (blue or teal)
- Clean arrows pointing from callouts to specific UI elements
- Step indicator badges with numbers
- Neutral color palette — blue accent for interactive elements, gray for chrome
- Overall feel: clear, instructional, help-doc quality

LAYOUT:
- Headline as a section header above the screenshot
- Sub-headline as instructional text below the headline
- Screenshot with numbered callout overlays pointing to key elements
- The highlighted target gets the primary callout (number 1) with the tooltip text
- Additional numbered callouts can point to related UI elements
- Clean spacing between all elements

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },
};

/**
 * Get template prompts by ID. Returns null if not found.
 */
export function getTemplate(templateId: string): TemplatePrompts | null {
  return templates[templateId] || null;
}

/**
 * Get all available template IDs.
 */
export function getTemplateIds(): string[] {
  return Object.keys(templates);
}

/**
 * Interpolate analysis text into an image prompt template.
 * Replaces {headline}, {subHeadline}, {tooltipText} placeholders.
 */
export function buildImagePrompt(
  template: TemplatePrompts,
  analysis: {
    headline: string;
    subHeadline: string;
    tooltipText: string;
  }
): string {
  return template.geminiPrompt
    .replace("{headline}", analysis.headline)
    .replace("{subHeadline}", analysis.subHeadline)
    .replace("{tooltipText}", analysis.tooltipText);
}
