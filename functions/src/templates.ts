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

  // --- NEW TEMPLATES ---

  device_mockup: {
    id: "device_mockup",
    name: "Device Mockup",
    analysisPrompt: `You are a product marketing specialist creating copy for a device mockup visual.

Analyze the screenshot and the user's description. Create compelling copy that positions the product as premium and professional — this will be shown inside a realistic device frame.

Return a JSON object with these exact fields:
{
  "headline": "A confident product headline (4-8 words) that positions the product as polished and reliable",
  "subHeadline": "A benefit-driven sentence (10-18 words) that highlights what makes this product worth using",
  "highlightTarget": "Description of the UI element to emphasize inside the device frame (be specific about location)",
  "tooltipText": "A short callout (5-10 words) that draws attention to the key feature",
  "marketingCopy": "One sentence that makes the product feel premium and desirable"
}

Write confident, product-focused copy. Emphasize quality and polish.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a device mockup marketing visual using the provided screenshot and text.

VISUAL STYLE — Device Mockup:
- Place the screenshot inside a realistic MacBook or iPhone device frame
- Tilt the device at a 15-25° perspective angle for a dynamic 3D feel
- Use a smooth gradient background (cool blues, purples, or dark neutrals)
- Add subtle reflections on the device screen surface
- Soft ambient shadow beneath the device
- Clean, modern sans-serif typography outside the device frame
- Overall feel: premium product showcase, Apple-style marketing

LAYOUT:
- The device with screenshot is the hero element — large and prominent
- Headline positioned above or beside the device in bold weight
- Sub-headline below the headline in lighter weight
- A callout arrow or badge pointing to the highlighted UI element inside the device
- Tooltip text in a clean rounded rectangle near the callout
- Balanced composition with generous padding

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  gradient_noise: {
    id: "gradient_noise",
    name: "Gradient Noise",
    analysisPrompt: `You are an indie product designer creating warm, tactile copy for a product visual.

Analyze the screenshot and the user's description. Create copy with a friendly, approachable tone — this will be used for indie product showcases, dribbble shots, or landing pages.

Return a JSON object with these exact fields:
{
  "headline": "A warm, inviting headline (4-7 words) that feels approachable and human",
  "subHeadline": "A friendly sentence (10-18 words) that highlights the benefit in a conversational tone",
  "highlightTarget": "Description of the UI element to highlight (be specific about location)",
  "tooltipText": "A short, friendly callout (5-10 words) pointing to the key feature",
  "marketingCopy": "One sentence that makes the product feel crafted and thoughtful"
}

Write warm, human copy. Avoid corporate jargon. Feel indie and authentic.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a warm, textured marketing visual using the provided screenshot and text.

VISUAL STYLE — Gradient Noise:
- Rich mesh gradient background using warm palette (peach, coral, amber, soft rose)
- Apply a subtle grain/noise texture overlay across the entire image for tactile depth
- Screenshot displayed with rounded corners and a soft shadow
- Organic, slightly rounded shapes as decorative accents (blobs, circles)
- Warm, friendly sans-serif typography
- Overall feel: indie, crafted, Dribbble-quality design

LAYOUT:
- Screenshot prominently displayed, slightly elevated with shadow
- Headline in medium-bold weight, positioned above or beside the screenshot
- Sub-headline below the headline in a slightly lighter tone
- A soft callout bubble or arrow pointing to the highlighted element
- Tooltip text in a rounded pill-shaped container
- Organic, slightly asymmetric composition

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  app_store: {
    id: "app_store",
    name: "App Store",
    analysisPrompt: `You are a mobile app marketer creating copy for an app store screenshot visual.

Analyze the screenshot and the user's description. Create punchy, app-store-optimized copy — short, scannable, benefit-focused. This will appear in an app store listing format.

Return a JSON object with these exact fields:
{
  "headline": "A punchy app store headline (3-6 words) — benefit-first, scannable at a glance",
  "subHeadline": "A concise benefit statement (8-15 words) that complements the headline",
  "highlightTarget": "Description of the UI element to showcase inside the phone frame (be specific)",
  "tooltipText": "A short feature badge label (3-8 words) like a feature tag",
  "marketingCopy": "One sentence that would convince someone to download the app"
}

Write scannable, benefit-first copy. Short words, active voice. Think app store optimization.${SPELLING_REMINDER}`,

    geminiPrompt: `Create an app store screenshot visual using the provided screenshot and text.

VISUAL STYLE — App Store:
- Portrait phone frame (iPhone-style) with the screenshot displayed inside
- Clean, solid or subtle gradient background behind the phone
- A feature badge or pill label near the top or bottom of the composition
- Bold, large headline text above the phone
- Clean sans-serif typography optimized for readability at small sizes
- Optional: subtle confetti, stars, or accent shapes for energy
- Overall feel: polished app store listing, ready for Apple App Store or Google Play

LAYOUT:
- Phone frame centered, occupying roughly 60% of vertical space
- Headline above the phone in large, bold text
- Sub-headline below the headline in medium weight
- Feature badge as a colored pill near the highlighted element
- Tooltip text inside the badge
- Clean, vertically stacked composition

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  cinematic_aurora: {
    id: "cinematic_aurora",
    name: "Cinematic Aurora",
    analysisPrompt: `You are a luxury brand strategist creating elevated, premium copy for a cinematic visual.

Analyze the screenshot and the user's description. Create sophisticated, aspirational copy — this will appear in a cinematic, aurora-lit environment.

Return a JSON object with these exact fields:
{
  "headline": "An elegant, aspirational headline (4-7 words) that conveys prestige and innovation",
  "subHeadline": "A refined statement (10-18 words) that positions the product as cutting-edge and premium",
  "highlightTarget": "Description of the UI element to spotlight with a glow effect (be specific)",
  "tooltipText": "A sophisticated callout (5-10 words) for the highlighted element",
  "marketingCopy": "One sentence that makes the product feel like the future"
}

Sound elevated and visionary. Use precise, evocative language. Think luxury tech brand.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a cinematic aurora-themed marketing visual using the provided screenshot and text.

VISUAL STYLE — Cinematic Aurora:
- Very dark background (#050510 near-black with subtle blue undertone)
- Flowing aurora borealis color washes (green → teal → purple → pink) across the background
- Subtle floating particle effects or tiny light dots
- Screenshot with a soft luminous glow border
- Elegant, light-weight sans-serif typography (white or very light)
- Subtle lens flare or light bloom effects
- Overall feel: cinematic, premium, otherworldly, luxury tech

LAYOUT:
- Screenshot centered with a luminous aura/glow around it
- Headline in elegant, well-spaced typography above or overlaying the aurora
- Sub-headline below the headline in lighter weight
- A glowing spotlight or highlight beam on the target UI element
- Tooltip text in a translucent dark panel with glow border
- The composition should feel expansive and atmospheric

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  corporate_clean: {
    id: "corporate_clean",
    name: "Corporate Clean",
    analysisPrompt: `You are a corporate communications writer creating professional copy for an enterprise presentation.

Analyze the screenshot and the user's description. Create polished, corporate-appropriate copy — this will be used in presentations, white papers, or enterprise marketing.

Return a JSON object with these exact fields:
{
  "headline": "A professional headline (4-8 words) suitable for a corporate presentation",
  "subHeadline": "A clear value statement (10-18 words) that speaks to business outcomes",
  "highlightTarget": "Description of the UI element that demonstrates business value (be specific)",
  "tooltipText": "A concise professional callout (5-10 words) for the highlighted element",
  "marketingCopy": "One sentence positioning this as an enterprise-ready solution"
}

Sound professional and measured. Focus on business outcomes and reliability. Avoid hype.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a clean corporate marketing visual using the provided screenshot and text.

VISUAL STYLE — Corporate Clean:
- White or light gray background with subtle blue tint
- Corporate blue (#1e40af) and slate gray (#475569) as primary colors
- Screenshot placed in a structured grid layout with clean alignment
- Subtle geometric patterns or thin line accents in the background
- Professional sans-serif typography (medium weight, well-spaced)
- Clean divider lines or subtle card boundaries
- Overall feel: polished enterprise presentation, boardroom-ready

LAYOUT:
- Structured, grid-based composition with clear visual hierarchy
- Headline in corporate blue, bold weight, above the screenshot
- Sub-headline below the headline in slate gray
- Screenshot with thin border and subtle shadow, cleanly positioned
- A precise callout line connecting to the highlighted element
- Tooltip text in a clean, bordered rectangle
- Generous whitespace and alignment

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  bento_grid: {
    id: "bento_grid",
    name: "Bento Grid",
    analysisPrompt: `You are a product designer creating concise copy for a bento-grid feature showcase.

Analyze the screenshot and the user's description. Create short, scannable copy — each piece will appear in a separate tile of a bento grid layout.

Return a JSON object with these exact fields:
{
  "headline": "A bold feature headline (3-6 words) for the hero tile of the bento grid",
  "subHeadline": "A concise description (8-15 words) explaining the key benefit shown",
  "highlightTarget": "Description of the UI element to showcase in the hero tile (be specific)",
  "tooltipText": "A short feature label (3-8 words) for a callout tile in the grid",
  "marketingCopy": "One sentence summarizing the overall product value for a supporting tile"
}

Write short, scannable copy. Each field will appear in its own tile. Keep it punchy.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a bento grid marketing visual using the provided screenshot and text.

VISUAL STYLE — Bento Grid:
- Dark or neutral background with rounded-corner tiles arranged in a bento/grid layout
- The screenshot fills the largest tile (hero tile, roughly 60% of the composition)
- Smaller tiles contain text, feature labels, or decorative accents
- Subtle borders between tiles, slightly rounded corners (12-16px radius)
- Clean sans-serif typography, white text on dark tiles or dark text on light tiles
- Consistent padding within each tile
- Overall feel: modern product page, Apple/Linear-style bento layout

LAYOUT:
- Hero tile: screenshot displayed prominently, occupying the largest grid area
- Headline tile: bold text in a medium-sized tile adjacent to the hero
- Sub-headline in a smaller tile below or beside the headline
- Tooltip text in a compact accent-colored tile as a feature callout
- 4-6 tiles total in an asymmetric but balanced grid arrangement
- A highlight or accent border on the tile containing the key feature

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    analysisPrompt: `You are a technical documentation engineer creating precise, technical copy for a blueprint-style visual.

Analyze the screenshot and the user's description. Create technical, specification-style copy — this will appear in an engineering diagram aesthetic.

Return a JSON object with these exact fields:
{
  "headline": "A technical title (4-7 words) as if labeling an engineering diagram",
  "subHeadline": "A precise technical description (10-18 words) explaining the system or component shown",
  "highlightTarget": "Description of the UI component to annotate with a technical callout (be specific)",
  "tooltipText": "A specification-style label (4-10 words) for the highlighted component",
  "marketingCopy": "One sentence describing the technical capability in engineering terms"
}

Write like a technical spec. Use precise, engineering language. Think system documentation.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a blueprint-style technical visual using the provided screenshot and text.

VISUAL STYLE — Blueprint:
- Blueprint blue background (#1a3a5c or similar dark navy-blue)
- White gridlines creating an engineering paper grid pattern
- Screenshot displayed with technical annotation lines and markers
- Right-angle connector lines from labels to UI elements (like technical diagrams)
- Monospace or technical sans-serif typography in white or light blue
- Dimension lines, measurement markers, or specification boxes
- Overall feel: engineering blueprint, technical schematic, developer documentation

LAYOUT:
- Screenshot centered with technical annotation overlay
- Headline as a title block label (top-left or top-center, bordered)
- Sub-headline as a specification description below the title
- Right-angle leader lines connecting callout labels to specific UI elements
- The highlighted target gets the primary annotation with the tooltip text
- Coordinate markers or dimension indicators as decorative elements
- Clean, precise alignment throughout

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  terminal_dark: {
    id: "terminal_dark",
    name: "Terminal Dark",
    analysisPrompt: `You are a developer advocate creating dev-friendly copy for a terminal-inspired visual.

Analyze the screenshot and the user's description. Create copy with a developer tone — concise, slightly witty, and technically credible. This will appear in a terminal/code aesthetic.

Return a JSON object with these exact fields:
{
  "headline": "A dev-friendly headline (3-7 words) — concise and slightly clever",
  "subHeadline": "A developer-oriented description (10-18 words) highlighting technical capability",
  "highlightTarget": "Description of the UI element to highlight with a terminal-style callout (be specific)",
  "tooltipText": "A short dev-style label (4-10 words) like a code comment or CLI flag description",
  "marketingCopy": "One sentence that would resonate with developers and technical users"
}

Write like a developer, for developers. Concise, slightly witty, technically credible.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a terminal-inspired dark marketing visual using the provided screenshot and text.

VISUAL STYLE — Terminal Dark:
- Very dark background (#0a0a0a or near-black)
- Terminal window chrome: title bar with red/yellow/green dots, subtle border
- Screenshot displayed inside a terminal-like frame with rounded corners
- Green (#22c55e) or amber (#f59e0b) accent colors for highlights
- Monospace typography (like a code editor) for labels and callouts
- Code comment style annotations (// or /* */ format for decorative text)
- Subtle scan lines or CRT-like texture overlay (optional)
- Overall feel: developer tool, hacker aesthetic, VS Code meets marketing

LAYOUT:
- Screenshot inside a terminal/editor window frame
- Headline in monospace, styled like a terminal command or heading comment
- Sub-headline below in lighter monospace, like a code description
- Callout annotations styled as code comments pointing to UI elements
- Tooltip text in a monospace badge or inline comment style
- The highlighted element gets a green/amber glow border or underline
- Dark, focused composition with minimal decoration

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  neo_brutalist: {
    id: "neo_brutalist",
    name: "Neo Brutalist",
    analysisPrompt: `You are an indie creative director creating bold, irreverent copy for a neo-brutalist visual.

Analyze the screenshot and the user's description. Create punchy, bold copy with attitude — this will appear in a raw, high-contrast brutalist design.

Return a JSON object with these exact fields:
{
  "headline": "A bold, attention-grabbing headline (3-6 words) — punchy, confident, maybe slightly irreverent",
  "subHeadline": "A direct statement (8-15 words) with energy and confidence",
  "highlightTarget": "Description of the UI element to emphasize with a bold callout (be specific)",
  "tooltipText": "A short, bold label (3-8 words) — direct and impactful",
  "marketingCopy": "One sentence with attitude that makes the product feel essential"
}

Be bold, direct, slightly edgy. No corporate fluff. Think indie brand with confidence.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a neo-brutalist marketing visual using the provided screenshot and text.

VISUAL STYLE — Neo Brutalist:
- Bold, flat colors: bright yellow (#facc15), red (#ef4444), blue (#3b82f6), black, white
- Thick black borders (3-4px) around all elements
- No gradients — flat, solid color blocks
- Screenshot with a thick black border and slight rotation (2-5°)
- Offset/drop shadows in solid black (shifted 4-6px down-right)
- Raw, angular layout — intentionally imperfect and energetic
- Bold, heavy-weight sans-serif typography (almost condensed)
- Overall feel: indie web, brutalist design, raw energy

LAYOUT:
- Screenshot slightly rotated with thick border and offset shadow
- Headline in very large, heavy-weight text — impossible to miss
- Sub-headline in medium weight, contrasting color block background
- A bold arrow or thick-bordered callout pointing to the highlighted element
- Tooltip text in a colored badge with thick black border
- Overlapping elements allowed — embrace the controlled chaos
- High contrast, maximum visual impact

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  retro_futurism: {
    id: "retro_futurism",
    name: "Retro Futurism",
    analysisPrompt: `You are a creative director creating dramatic, cinematic copy for a retro-futuristic visual.

Analyze the screenshot and the user's description. Create copy that feels like a sci-fi movie poster — dramatic, futuristic, with a vintage edge.

Return a JSON object with these exact fields:
{
  "headline": "A dramatic, futuristic headline (3-7 words) — cinematic and bold",
  "subHeadline": "A visionary statement (10-18 words) that makes the product feel like the future",
  "highlightTarget": "Description of the UI element to spotlight with a neon glow (be specific)",
  "tooltipText": "A short, dramatic label (4-10 words) with sci-fi energy",
  "marketingCopy": "One sentence that positions the product as from the future"
}

Write dramatic, cinematic copy. Think Blade Runner meets product marketing.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a retro-futuristic marketing visual using the provided screenshot and text.

VISUAL STYLE — Retro Futurism:
- Dark background (#0a0a1a) with a perspective grid floor receding to a vanishing point
- Neon color palette: hot pink (#ec4899), electric cyan (#06b6d4), chrome silver
- Chrome/metallic text effects on the headline (reflective, shiny)
- Screenshot with a neon glow border (pink or cyan)
- Scan lines or VHS-style subtle texture overlay
- Sun or geometric shape on the horizon line
- Overall feel: 80s sci-fi, synthwave, Tron/Blade Runner aesthetic

LAYOUT:
- Screenshot floating above the grid floor with neon glow
- Headline in large chrome/metallic text above the screenshot
- Sub-headline below in clean neon-colored text
- A neon glow highlight or scan line effect on the target UI element
- Tooltip text in a retro-styled badge or HUD element
- The composition should feel like a movie poster or album cover
- Dramatic, symmetrical or slightly dynamic arrangement

CRITICAL TEXT RULES:
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"`,
  },

  collage_mixed: {
    id: "collage_mixed",
    name: "Collage Mixed",
    analysisPrompt: `You are an art director creating eclectic, creative copy for a mixed-media collage visual.

Analyze the screenshot and the user's description. Create expressive, creative copy — this will appear in a layered, textured collage composition.

Return a JSON object with these exact fields:
{
  "headline": "A creative, expressive headline (3-7 words) — artsy and distinctive",
  "subHeadline": "An evocative description (10-18 words) with creative flair",
  "highlightTarget": "Description of the UI element to feature as a collage element (be specific)",
  "tooltipText": "A short, creative label (4-10 words) — handwritten or stamp-like feel",
  "marketingCopy": "One sentence that makes the product feel unique and artistically crafted"
}

Write creatively. Think editorial magazine, art show, zine aesthetic.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a mixed-media collage marketing visual using the provided screenshot and text.

VISUAL STYLE — Collage Mixed:
- Textured background: paper, cardboard, or canvas texture
- Screenshot displayed as if it's a photo/printout layered into the collage
- Torn paper edges, tape strips (washi tape or masking tape) holding elements
- Overlapping layers: screenshot, text blocks, decorative elements
- Mix of clean typography and handwritten-style annotations
- Sticker-like badges, stamps, or circular labels
- Color palette: warm neutrals with pops of accent color
- Overall feel: creative agency, editorial design, mixed-media art

LAYOUT:
- Screenshot slightly rotated and "taped" onto the composition
- Headline in bold type, possibly on a colored paper strip or label
- Sub-headline in lighter type or handwritten style nearby
- Other elements layered around: arrows, circles, decorative scraps
- The highlighted element gets a hand-drawn circle or arrow annotation
- Tooltip text on a sticker-like badge or stamp element
- Intentionally layered and textured — not perfectly aligned

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
