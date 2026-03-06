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

const SPELLING_REMINDER = `

CRITICAL CHARACTER LIMITS — These are hard limits to ensure accurate text rendering:
- headline: MAXIMUM 25 characters (including spaces). Shorter is better.
- subHeadline: MAXIMUM 60 characters (including spaces).
- tooltipText: MAXIMUM 25 characters (including spaces). Shorter is better.
- highlightTarget and marketingCopy have no character limit.
Count characters carefully. If your text exceeds these limits, shorten it — use fewer words, abbreviate, or simplify. Never exceed these limits.

CRITICAL: Double-check all spelling. Every word must be spelled correctly.`;

// ---------------------------------------------------------------------------
// Text rendering rules tailored per template style group.
// Core spelling enforcement is universal; only the rendering style varies.
// ---------------------------------------------------------------------------

const TEXT_RULES_BOLD = `CRITICAL TEXT RULES:
- Render each text element as if physically printed on a sign or banner in bold, clean, sans-serif block letters.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this as a prominent, bold sign element.
- The sub-headline text is: "{subHeadline}" — render this as a secondary printed label.
- The tooltip text is: "{tooltipText}" — render this as a small printed badge or tag.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_CLEAN = `CRITICAL TEXT RULES:
- Render each text element in clean, precise, modern sans-serif typography with perfect clarity.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this prominently and legibly.
- The sub-headline text is: "{subHeadline}" — render this in lighter weight below the headline.
- The tooltip text is: "{tooltipText}" — render this in a clean callout or badge.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_ELEGANT = `CRITICAL TEXT RULES:
- Render each text element in elegant, refined, light-to-medium weight sans-serif typography with generous letter-spacing.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this in elegant, well-spaced typography.
- The sub-headline text is: "{subHeadline}" — render this in lighter weight with a subtle, muted tone.
- The tooltip text is: "{tooltipText}" — render this in a refined, understated callout.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_TECHNICAL = `CRITICAL TEXT RULES:
- Render each text element in clean monospace or technical sans-serif typography, consistent with an engineering or developer aesthetic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this as a technical heading or label.
- The sub-headline text is: "{subHeadline}" — render this as a specification or description line.
- The tooltip text is: "{tooltipText}" — render this as a technical annotation or badge.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_WARM = `CRITICAL TEXT RULES:
- Render each text element in warm, friendly, rounded sans-serif typography that feels approachable and human.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this in a warm, inviting style.
- The sub-headline text is: "{subHeadline}" — render this in a lighter, conversational weight.
- The tooltip text is: "{tooltipText}" — render this in a soft, rounded callout or pill shape.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_NEON = `CRITICAL TEXT RULES:
- Render each text element with a chrome, metallic, or neon glow effect consistent with an 80s sci-fi synthwave aesthetic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this in large chrome or neon-glowing letters.
- The sub-headline text is: "{subHeadline}" — render this in clean neon-colored text.
- The tooltip text is: "{tooltipText}" — render this in a retro HUD-style badge or element.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_PSYCHEDELIC = `CRITICAL TEXT RULES:
- Render each text element in wavy, organic, art-nouveau-inspired letterforms — hand-drawn or decorative, never rigid or digital.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this in large, flowing, psychedelic lettering with organic curves.
- The sub-headline text is: "{subHeadline}" — render this in a lighter, groovy decorative style.
- The tooltip text is: "{tooltipText}" — render this in a rounded, flower-power badge or bubble shape.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_GRUNGE = `CRITICAL TEXT RULES:
- Render each text element as if stamped, stenciled, or photocopied — distressed, imperfect, raw and authentic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this in bold, distressed block letters as if rubber-stamped or screen-printed.
- The sub-headline text is: "{subHeadline}" — render this in a lighter, worn typewriter or stencil style.
- The tooltip text is: "{tooltipText}" — render this on a torn strip of paper, duct tape label, or hand-scrawled tag.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_COMIC = `CRITICAL TEXT RULES:
- Render each text element in bold uppercase block letters with thick black outlines, consistent with comic book lettering.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this in large, bold, outlined comic book letters inside a caption box or burst shape.
- The sub-headline text is: "{subHeadline}" — render this in a secondary caption box in slightly smaller comic lettering.
- The tooltip text is: "{tooltipText}" — render this inside a speech bubble or thought bubble with a pointer.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

const TEXT_RULES_COLLAGE = `CRITICAL TEXT RULES:
- Render each text element as if physically placed into a mixed-media collage — bold type on paper strips, labels, or sticker-like elements.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording. Every single letter must be correct.
- The headline text is: "{headline}" — render this in bold type on a colored paper strip or label.
- The sub-headline text is: "{subHeadline}" — render this in lighter type on a nearby element.
- The tooltip text is: "{tooltipText}" — render this on a sticker-like badge or stamp.
- Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.`;

// ---------------------------------------------------------------------------
// Shared instruction block that establishes the priority hierarchy between
// the user's description and the screenshot content for text analysis.
// Appended to every template's analysisPrompt via the "Analyze..." line.
// ---------------------------------------------------------------------------

const DESCRIPTION_PRIORITY = `
IMPORTANT — INPUT PRIORITY:
- The user's description is the PRIMARY source for messaging. It defines the product, value proposition, and what the marketing copy should say.
- The screenshot is SECONDARY visual context. You may reference UI element names, labels, buttons, and layout details visible in the screenshot to enrich the copy.
- If the user's description conflicts with or differs from text/branding visible in the screenshot, ALWAYS follow the user's description.
- Do NOT derive the product name, headline, or core message from text that merely appears inside the screenshot (e.g. content within preview images, embedded text, third-party logos) — use the user's description instead.`;

const templates: Record<string, TemplatePrompts> = {
  glassmorphic: {
    id: "glassmorphic",
    name: "Glassmorphic",
    analysisPrompt: `You are a marketing copywriter analyzing a software screenshot for a SaaS marketing visual.

Analyze the user's description and the screenshot to produce compelling marketing copy.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A bold, concise headline (5-8 words) that captures the main value proposition",
  "subHeadline": "A supporting sentence (10-20 words) that expands on the headline with a specific benefit",
  "highlightTarget": "Description of the UI element to visually emphasize (be specific about location and what it is)",
  "tooltipText": "A short callout phrase (5-12 words) that appears as a tooltip pointing to the highlighted element",
  "marketingCopy": "One compelling sentence (15-25 words) that could serve as body copy"
}

Be specific and action-oriented. Ground your copy in the user's description first, then enrich with details visible in the screenshot.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a stunning glassmorphic marketing visual using the provided screenshot and text.

VISUAL STYLE — Glassmorphic:
- Place the screenshot at a slight 3D angle (5-10° perspective tilt)
- Add a frosted glass panel overlaying or adjacent to the screenshot with the headline and sub-headline
- Use a rich gradient backdrop (deep purple → blue → teal) behind everything
- Apply iridescent/holographic edge highlights on the glass panel
- Add subtle sparkle/bokeh light accents in the background
- The screenshot should have a subtle drop shadow and rounded corners
- Overall feel: premium, modern, SaaS-quality marketing material

LAYOUT:
- The screenshot is the hero element — it should be clearly visible and legible
- Headline appears prominently on or near the glass panel
- Sub-headline appears below the headline in smaller text
- A tooltip/callout arrow or badge highlights the specified UI element
- The composition should feel balanced and professional

${TEXT_RULES_CLEAN}`,
  },

  clean_minimal: {
    id: "clean_minimal",
    name: "Clean Minimal",
    analysisPrompt: `You are a technical writer creating clear, informative copy for a documentation or blog visual.

Analyze the user's description and the screenshot. Focus on clarity and precision — this will be used in tutorials, docs, or blog posts.
${DESCRIPTION_PRIORITY}

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
- Minimal decorative elements — let the screenshot speak
- Optional: thin accent line (blue or brand color) as a subtle design element

LAYOUT:
- Headline above or below the screenshot in medium-weight font
- Sub-headline directly below the headline in lighter weight
- A clean callout arrow or indicator pointing to the highlighted element
- Tooltip text in a simple rounded rectangle near the callout
- Generous whitespace throughout

${TEXT_RULES_CLEAN}`,
  },

  bold_marketing: {
    id: "bold_marketing",
    name: "Bold Marketing",
    analysisPrompt: `You are an advertising copywriter creating punchy, high-energy marketing copy for a product visual.

Analyze the user's description and the screenshot. Create copy that grabs attention and drives action — this will be used for social media, ads, or landing pages.
${DESCRIPTION_PRIORITY}

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

${TEXT_RULES_BOLD}`,
  },

  dark_professional: {
    id: "dark_professional",
    name: "Dark Professional",
    analysisPrompt: `You are a business communications expert creating executive-quality copy for a product showcase.

Analyze the user's description and the screenshot. Create polished, professional copy suitable for pitch decks, case studies, or enterprise marketing.
${DESCRIPTION_PRIORITY}

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

${TEXT_RULES_ELEGANT}`,
  },

  documentation: {
    id: "documentation",
    name: "Documentation",
    analysisPrompt: `You are a UX writer creating clear instructional copy for a help document or onboarding guide.

Analyze the user's description and the screenshot. Create copy that helps users understand a feature — this will be used in help docs, onboarding flows, or how-to guides.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A clear step title or feature name (3-7 words) — instructional and direct",
  "subHeadline": "A helpful instruction or explanation (10-20 words) telling the user what to do or what they're seeing",
  "highlightTarget": "Description of the single most important UI element the user needs to see (be very specific about location and type)",
  "tooltipText": "A direct instruction or label (4-10 words) for the highlighted element, e.g. 'Click here to save'",
  "marketingCopy": "One sentence providing context about why this feature matters or what happens next"
}

Be direct and instructional. Use imperative mood ("Click", "Select", "Enter") where appropriate. Prioritize clarity over cleverness.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a clean documentation-style visual with a single clear callout using the provided screenshot and text.

VISUAL STYLE — Documentation:
- Light, neutral background (white or light warm gray)
- Screenshot displayed straight-on, full-width or near-full-width
- A single callout indicator in a consistent accent color (blue or teal)
- A clean arrow pointing from the callout to the specific UI element
- Neutral color palette — blue accent for interactive elements, gray for chrome
- Overall feel: clear, instructional, help-doc quality

LAYOUT:
- Headline as a section header above the screenshot
- Sub-headline as instructional text below the headline
- Screenshot with ONE single callout overlay pointing to the highlighted element
- The callout uses the tooltip text as its label
- Do NOT add multiple numbered steps, annotations, or extra callouts — keep it to ONE
- Clean spacing between all elements

${TEXT_RULES_CLEAN}`,
  },

  // --- NEW TEMPLATES ---

  device_mockup: {
    id: "device_mockup",
    name: "Device Mockup",
    analysisPrompt: `You are a product marketing specialist creating copy for a device mockup visual.

Analyze the user's description and the screenshot. Create compelling copy that positions the product as premium and professional — this will be shown inside a realistic device frame.
${DESCRIPTION_PRIORITY}

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
- Overall feel: premium product showcase, Apple-style marketing

LAYOUT:
- The device with screenshot is the hero element — large and prominent
- Headline positioned above or beside the device in bold weight
- Sub-headline below the headline in lighter weight
- A callout arrow or badge pointing to the highlighted UI element inside the device
- Tooltip text in a clean rounded rectangle near the callout
- Balanced composition with generous padding

${TEXT_RULES_CLEAN}`,
  },

  gradient_noise: {
    id: "gradient_noise",
    name: "Gradient Noise",
    analysisPrompt: `You are an indie product designer creating warm, tactile copy for a product visual.

Analyze the user's description and the screenshot. Create copy with a friendly, approachable tone — this will be used for indie product showcases, dribbble shots, or landing pages.
${DESCRIPTION_PRIORITY}

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
- Overall feel: indie, crafted, Dribbble-quality design

LAYOUT:
- Screenshot prominently displayed, slightly elevated with shadow
- Headline in medium-bold weight, positioned above or beside the screenshot
- Sub-headline below the headline in a slightly lighter tone
- A soft callout bubble or arrow pointing to the highlighted element
- Tooltip text in a rounded pill-shaped container
- Organic, slightly asymmetric composition

${TEXT_RULES_WARM}`,
  },

  app_store: {
    id: "app_store",
    name: "App Store",
    analysisPrompt: `You are a mobile app marketer creating copy for an app store screenshot visual.

Analyze the user's description and the screenshot. Create punchy, app-store-optimized copy — short, scannable, benefit-focused. This will appear in an app store listing format.
${DESCRIPTION_PRIORITY}

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
- Optional: subtle confetti, stars, or accent shapes for energy
- Overall feel: polished app store listing, ready for Apple App Store or Google Play

LAYOUT:
- Phone frame centered, occupying roughly 60% of vertical space
- Headline above the phone in large, bold text
- Sub-headline below the headline in medium weight
- Feature badge as a colored pill near the highlighted element
- Tooltip text inside the badge
- Clean, vertically stacked composition

${TEXT_RULES_BOLD}`,
  },

  cinematic_aurora: {
    id: "cinematic_aurora",
    name: "Cinematic Aurora",
    analysisPrompt: `You are a luxury brand strategist creating elevated, premium copy for a cinematic visual.

Analyze the user's description and the screenshot. Create sophisticated, aspirational copy — this will appear in a cinematic, aurora-lit environment.
${DESCRIPTION_PRIORITY}

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
- Subtle lens flare or light bloom effects
- Overall feel: cinematic, premium, otherworldly, luxury tech

LAYOUT:
- Screenshot centered with a luminous aura/glow around it
- Headline in elegant, well-spaced typography above or overlaying the aurora
- Sub-headline below the headline in lighter weight
- A glowing spotlight or highlight beam on the target UI element
- Tooltip text in a translucent dark panel with glow border
- The composition should feel expansive and atmospheric

${TEXT_RULES_ELEGANT}`,
  },

  corporate_clean: {
    id: "corporate_clean",
    name: "Corporate Clean",
    analysisPrompt: `You are a corporate communications writer creating professional copy for an enterprise presentation.

Analyze the user's description and the screenshot. Create polished, corporate-appropriate copy — this will be used in presentations, white papers, or enterprise marketing.
${DESCRIPTION_PRIORITY}

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

${TEXT_RULES_CLEAN}`,
  },

  bento_grid: {
    id: "bento_grid",
    name: "Bento Grid",
    analysisPrompt: `You are a product designer creating concise copy for a bento-grid feature showcase.

Analyze the user's description and the screenshot. Create short, scannable copy — each piece will appear in a separate tile of a bento grid layout.
${DESCRIPTION_PRIORITY}

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
- Consistent padding within each tile
- Overall feel: modern product page, Apple/Linear-style bento layout

LAYOUT:
- Hero tile: screenshot displayed prominently, occupying the largest grid area
- Headline tile: bold text in a medium-sized tile adjacent to the hero
- Sub-headline in a smaller tile below or beside the headline
- Tooltip text in a compact accent-colored tile as a feature callout
- 4-6 tiles total in an asymmetric but balanced grid arrangement
- A highlight or accent border on the tile containing the key feature

${TEXT_RULES_BOLD}`,
  },

  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    analysisPrompt: `You are a technical documentation engineer creating precise, technical copy for a blueprint-style visual.

Analyze the user's description and the screenshot. Create technical, specification-style copy — this will appear in an engineering diagram aesthetic.
${DESCRIPTION_PRIORITY}

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
- Dimension lines, measurement markers, or specification boxes
- Overall feel: engineering blueprint, technical schematic, developer documentation

LAYOUT:
- Screenshot centered with technical annotation overlay
- Headline as a title block label (top-left or top-center, bordered)
- Sub-headline as a specification description below the title
- A single right-angle leader line connecting the tooltip text to the highlighted UI element
- Coordinate markers or dimension indicators as decorative elements
- Clean, precise alignment throughout

${TEXT_RULES_TECHNICAL}`,
  },

  terminal_dark: {
    id: "terminal_dark",
    name: "Terminal Dark",
    analysisPrompt: `You are a developer advocate creating dev-friendly copy for a terminal-inspired visual.

Analyze the user's description and the screenshot. Create copy with a developer tone — concise, slightly witty, and technically credible. This will appear in a terminal/code aesthetic.
${DESCRIPTION_PRIORITY}

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
- Code comment style annotations (// or /* */ format for decorative text)
- Subtle scan lines or CRT-like texture overlay (optional)
- Overall feel: developer tool, hacker aesthetic, VS Code meets marketing

LAYOUT:
- Screenshot inside a terminal/editor window frame
- Headline styled like a terminal command or heading comment
- Sub-headline below in lighter monospace, like a code description
- Callout annotation styled as a code comment pointing to the highlighted element
- Tooltip text in a monospace badge or inline comment style
- The highlighted element gets a green/amber glow border or underline
- Dark, focused composition with minimal decoration

${TEXT_RULES_TECHNICAL}`,
  },

  neo_brutalist: {
    id: "neo_brutalist",
    name: "Neo Brutalist",
    analysisPrompt: `You are an indie creative director creating bold, irreverent copy for a neo-brutalist visual.

Analyze the user's description and the screenshot. Create punchy, bold copy with attitude — this will appear in a raw, high-contrast brutalist design.
${DESCRIPTION_PRIORITY}

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
- Overall feel: indie web, brutalist design, raw energy

LAYOUT:
- Screenshot slightly rotated with thick border and offset shadow
- Headline in very large, heavy-weight text — impossible to miss
- Sub-headline in medium weight, contrasting color block background
- A bold arrow or thick-bordered callout pointing to the highlighted element
- Tooltip text in a colored badge with thick black border
- Overlapping elements allowed — embrace the controlled chaos
- High contrast, maximum visual impact

${TEXT_RULES_BOLD}`,
  },

  retro_futurism: {
    id: "retro_futurism",
    name: "Retro Futurism",
    analysisPrompt: `You are a creative director creating dramatic, cinematic copy for a retro-futuristic visual.

Analyze the user's description and the screenshot. Create copy that feels like a sci-fi movie poster — dramatic, futuristic, with a vintage edge.
${DESCRIPTION_PRIORITY}

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

${TEXT_RULES_NEON}`,
  },

  collage_mixed: {
    id: "collage_mixed",
    name: "Collage Mixed",
    analysisPrompt: `You are an art director creating eclectic, creative copy for a mixed-media collage visual.

Analyze the user's description and the screenshot. Create expressive, creative copy — this will appear in a layered, textured collage composition.
${DESCRIPTION_PRIORITY}

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
- Sticker-like badges, stamps, or circular labels
- Color palette: warm neutrals with pops of accent color
- Overall feel: creative agency, editorial design, mixed-media art

LAYOUT:
- Screenshot slightly rotated and "taped" onto the composition
- Headline on a colored paper strip or label
- Sub-headline in lighter type nearby
- Other elements layered around: arrows, circles, decorative scraps
- The highlighted element gets a hand-drawn circle or arrow annotation
- Tooltip text on a sticker-like badge or stamp element
- Intentionally layered and textured — not perfectly aligned

${TEXT_RULES_COLLAGE}`,
  },

  // --- Decade-Inspired ---

  psychedelic_60s: {
    id: "psychedelic_60s",
    name: "Psychedelic 60s",
    analysisPrompt: `You are a counterculture poster artist creating groovy, expressive copy for a psychedelic visual.

Analyze the user's description and the screenshot. Create copy that channels the spirit of the 1960s — peace, love, freedom, and mind-expansion. This will appear in a swirling, colorful psychedelic poster composition.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A groovy, expressive headline (3-7 words) — peace-and-love energy, flower power vibes",
  "subHeadline": "A flowing, evocative sentence (10-18 words) with 60s counterculture energy",
  "highlightTarget": "Description of the UI element to feature in the psychedelic composition (be specific)",
  "tooltipText": "A short, groovy callout (4-10 words) — peace sign or flower badge energy",
  "marketingCopy": "One sentence that makes the product feel like a trip into the future"
}

Write with 60s energy. Think concert posters, Woodstock, flower power. Expressive and free.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a psychedelic 1960s-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Psychedelic 60s:
- Swirling, melting color gradients: orange, purple, hot pink, yellow, lime green
- Organic, flowing shapes — paisley patterns, mandalas, flowers
- Wavy, distorted borders and edges — nothing straight or rigid
- Tie-dye or liquid color blending effects in the background
- Peace symbols, flowers, or sunburst motifs as decorative accents
- Overall feel: Woodstock concert poster, 60s counterculture art, Peter Max style

LAYOUT:
- Screenshot placed within a flowing, organic frame with melting/wavy edges
- Headline in large, wavy psychedelic lettering — organic and decorative
- Sub-headline below in a lighter groovy style
- A flower-shaped or peace-sign badge highlighting the target UI element
- Tooltip text inside the badge
- Swirling decorative elements filling the space around the screenshot
- The composition should feel alive and flowing

${TEXT_RULES_PSYCHEDELIC}`,
  },

  disco_70s: {
    id: "disco_70s",
    name: "Disco 70s",
    analysisPrompt: `You are a disco-era graphic designer creating funky, glamorous copy for a 1970s-inspired visual.

Analyze the user's description and the screenshot. Create copy that channels Saturday Night Fever — glamorous, funky, and golden. This will appear in a disco-era composition with metallic accents and warm earth tones.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A funky, glamorous headline (3-7 words) — disco energy, Saturday Night Fever vibes",
  "subHeadline": "A smooth, confident sentence (10-18 words) with 70s swagger and glamour",
  "highlightTarget": "Description of the UI element to spotlight with a disco glow (be specific)",
  "tooltipText": "A short, groovy callout (4-10 words) — funky and confident",
  "marketingCopy": "One sentence that makes the product feel like the life of the party"
}

Write with 70s swagger. Think disco balls, gold chains, funk music. Smooth and confident.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a disco 1970s-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Disco 70s:
- Warm color palette: burnt orange, brown, gold, mustard, teal, cream
- Metallic gold and silver accents — mirror ball reflections, sparkle highlights
- Sunburst or radial ray patterns emanating from the center or screenshot
- Rounded, bubble-style decorative typography and shapes
- Subtle halftone or film grain texture overlay
- Geometric patterns: circles, arches, chevrons in retro earth tones
- Overall feel: disco poster, 70s album cover, Saturday Night Fever glamour

LAYOUT:
- Screenshot framed within a rounded or arch-shaped border with gold edge
- Sunburst rays radiating behind the screenshot
- Headline in rounded, bubble-style or inline-shadow lettering above the screenshot
- Sub-headline below in a lighter retro font style
- A gold or sparkle-accented callout highlighting the target UI element
- Tooltip text in a rounded, retro-styled badge
- Warm, symmetrical composition with groovy energy

${TEXT_RULES_NEON}`,
  },

  synthwave_80s: {
    id: "synthwave_80s",
    name: "Synthwave 80s",
    analysisPrompt: `You are an 80s pop culture creative director creating radical, high-energy copy for a synthwave visual.

Analyze the user's description and the screenshot. Create copy that channels Miami Vice, Top Gun, and arcade culture — neon-drenched, high-energy, and totally radical. This will appear in a full synthwave 80s composition.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A radical, high-energy headline (3-7 words) — 80s action movie tagline energy",
  "subHeadline": "An exciting sentence (10-18 words) dripping with 80s confidence and neon energy",
  "highlightTarget": "Description of the UI element to spotlight with neon glow (be specific)",
  "tooltipText": "A short, punchy callout (4-10 words) — arcade or VHS box art energy",
  "marketingCopy": "One sentence that makes the product feel like the hottest thing since sliced bread"
}

Write like an 80s action movie trailer. Neon, chrome, power. Totally radical.${SPELLING_REMINDER}`,

    geminiPrompt: `Create an 80s synthwave-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Synthwave 80s:
- Dark purple/navy background with neon accents: hot pink, electric cyan, chrome
- Perspective grid floor receding to a sunset horizon line
- Sunset gradient on the horizon: orange → pink → purple
- Palm tree silhouettes flanking the composition
- VHS scanline texture and chromatic aberration effects
- Neon tube-style glowing outlines on key elements
- Chrome, metallic reflections on text and borders
- Overall feel: Miami Vice, Tron, arcade cabinet art, VHS cover

LAYOUT:
- Screenshot floating above the grid with neon pink/cyan glow border
- Headline in large chrome or neon-glowing letters above the screenshot
- Sub-headline below in clean neon-colored text
- Palm trees or geometric shapes framing the sides
- A neon-glow highlight on the target UI element
- Tooltip text in a retro VHS-style badge or HUD element
- Dramatic, symmetrical composition — cinematic and powerful

${TEXT_RULES_NEON}`,
  },

  grunge_90s: {
    id: "grunge_90s",
    name: "Grunge 90s",
    analysisPrompt: `You are a 90s zine maker creating raw, anti-establishment copy for a grunge-inspired visual.

Analyze the user's description and the screenshot. Create copy with 90s attitude — raw, authentic, anti-corporate. This will appear in a grungy, distressed composition that looks photocopied and DIY.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A raw, direct headline (3-6 words) — grunge attitude, no corporate polish",
  "subHeadline": "A blunt, authentic sentence (8-15 words) with 90s alternative energy",
  "highlightTarget": "Description of the UI element to mark up with a hand-drawn circle or arrow (be specific)",
  "tooltipText": "A short, raw label (3-8 words) — like a hand-scrawled note or stamp",
  "marketingCopy": "One sentence with attitude that makes the product feel underground and authentic"
}

Write raw and real. Think zines, Nirvana, skateboard culture. Anti-polish, pro-authenticity.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a 90s grunge-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Grunge 90s:
- Muted, dark palette: dark green, maroon, dirty yellow, black, gray
- Heavy distressed textures: torn paper, coffee stains, photocopier artifacts
- Scratch marks, ink splatters, and smudges across the composition
- Screenshot displayed as if photocopied or printed on rough paper — slightly degraded
- Duct tape, staples, or safety pins holding elements together
- Stencil or rubber stamp motifs as decorative elements
- Overall feel: underground zine, punk flyer, 90s alternative culture

LAYOUT:
- Screenshot slightly askew, as if taped or stapled onto a wall or notebook
- Headline in bold, distressed stencil or block letters — raw and impactful
- Sub-headline in typewriter-style text below
- A hand-drawn circle, arrow, or X marking the highlighted element
- Tooltip text on a torn strip of paper or duct tape label
- Overlapping layers of torn paper, stickers, and scrawl around the edges
- The composition should feel DIY, authentic, and deliberately imperfect

${TEXT_RULES_GRUNGE}`,
  },

  y2k_2000s: {
    id: "y2k_2000s",
    name: "Y2K 2000s",
    analysisPrompt: `You are a Y2K-era web designer creating futuristic, glossy copy for a millennium-inspired visual.

Analyze the user's description and the screenshot. Create copy that channels the year 2000 — glossy, optimistic, digital-futuristic. This will appear in a Y2K aesthetic with 3D effects, translucent plastic, and iridescent colors.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A glossy, futuristic headline (3-7 words) — millennium optimism, digital age energy",
  "subHeadline": "A bright, optimistic sentence (10-18 words) with Y2K tech-utopian confidence",
  "highlightTarget": "Description of the UI element to highlight with a glossy 3D effect (be specific)",
  "tooltipText": "A short, upbeat callout (4-10 words) — iPod-era clean and cool",
  "marketingCopy": "One sentence that makes the product feel like the next big thing of the new millennium"
}

Write with millennium optimism. Think iMac, iPod, early web. Glossy, futuristic, cool.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a Y2K 2000s-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Y2K 2000s:
- Glossy, bubbly 3D effects — inflatable, translucent plastic aesthetic
- Iridescent and holographic color shifts: baby blue, pink, lilac, lime, silver
- Chrome and metallic 3D elements — orbs, tubes, abstract shapes
- Translucent or frosted overlays with rainbow light refraction
- Subtle star sparkles, lens flares, and gloss highlights
- Clean white or soft gradient background with floating 3D objects
- Overall feel: early iPod ads, iMac G3, Britney Spears album art, early web design

LAYOUT:
- Screenshot displayed in a glossy, rounded frame with 3D depth and reflection
- Headline in clean, glossy 3D-extruded text — bubbly and futuristic
- Sub-headline below in a lighter, precise style
- Floating chrome orbs, translucent bubbles, or 3D stars as accents
- A glossy badge or bubble callout highlighting the target UI element
- Tooltip text inside the glossy callout
- Clean, open composition with lots of white space and floating 3D elements

${TEXT_RULES_CLEAN}`,
  },

  // --- Additional Creative ---

  comic_book: {
    id: "comic_book",
    name: "Comic Book",
    analysisPrompt: `You are a comic book letterer and cover artist creating punchy, action-packed copy for a comic-style visual.

Analyze the user's description and the screenshot. Create copy with comic book energy — bold, dramatic, action-packed. This will appear in a classic comic book panel composition with halftone dots and bold outlines.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A bold, action-packed headline (3-6 words) — comic book cover energy, ALL CAPS feel",
  "subHeadline": "A dramatic sentence (8-15 words) like a comic book narrator caption",
  "highlightTarget": "Description of the UI element to feature as the hero element of the panel (be specific)",
  "tooltipText": "A short, punchy exclamation (3-8 words) — like a speech bubble or action word",
  "marketingCopy": "One dramatic sentence like a comic book blurb that builds excitement"
}

Write like a comic book. Bold, dramatic, action words. Think Marvel covers, manga splash pages.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a comic book-style marketing visual using the provided screenshot and text.

VISUAL STYLE — Comic Book:
- Bold black outlines (3-4px) around ALL elements
- Ben-Day dots (halftone pattern) as background texture
- Primary color palette: bright red, blue, yellow + black + white
- Action lines / speed lines radiating from the screenshot
- Starburst / explosion shapes behind key elements
- Panel border framing the composition like a comic page
- Overall feel: classic Marvel/DC comic book cover, pop art, Roy Lichtenstein

LAYOUT:
- Screenshot displayed as the hero panel with thick black border
- Headline in large, bold, outlined comic book lettering in a burst or banner shape
- Sub-headline in a narrator caption box (yellow/cream rectangle with black border)
- Action lines or speed lines radiating from the highlighted element
- A speech bubble or thought bubble containing the tooltip text, pointing to the UI element
- Starburst shapes, "POW" style accents, or comic panel gutters as decorative elements
- Dynamic, diagonal composition with high energy and movement

${TEXT_RULES_COMIC}`,
  },

  vintage_polaroid: {
    id: "vintage_polaroid",
    name: "Vintage Polaroid",
    analysisPrompt: `You are a nostalgic photographer creating warm, personal copy for a vintage photo-style visual.

Analyze the user's description and the screenshot. Create copy that feels personal, authentic, and nostalgic — like a treasured photo with a handwritten note. This will appear in a warm, faded Polaroid composition.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A warm, personal headline (3-7 words) — like writing on the back of a photo",
  "subHeadline": "A nostalgic, heartfelt sentence (10-18 words) that feels personal and authentic",
  "highlightTarget": "Description of the UI element to highlight with a warm spotlight (be specific)",
  "tooltipText": "A short, warm note (4-10 words) — like a handwritten annotation",
  "marketingCopy": "One sentence that makes the product feel like a treasured memory"
}

Write warm and personal. Think photo albums, handwritten notes, nostalgic memories.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a vintage Polaroid-style marketing visual using the provided screenshot and text.

VISUAL STYLE — Vintage Polaroid:
- Warm, faded color cast — slightly desaturated with amber/sepia undertones
- Classic Polaroid frame: white border (thick at bottom for caption), slight shadow
- Film grain texture overlay across the image
- Subtle vignette darkening the corners
- Warm spotlight or light leak effects
- Soft, slightly out-of-focus background with bokeh dots
- Overall feel: nostalgic instant photo, vintage film, personal and authentic

LAYOUT:
- Screenshot placed inside a Polaroid-style white frame, slightly tilted (2-5°)
- Headline as handwritten-style text on or below the Polaroid's white bottom border
- Sub-headline in a softer handwritten or casual style nearby
- A warm glow or soft circle highlighting the target UI element
- Tooltip text in a rounded, warm-colored callout or handwritten annotation
- Additional Polaroid frames or scattered photos as background texture (optional)
- The composition should feel personal, warm, and curated

${TEXT_RULES_WARM}`,
  },

  vaporwave: {
    id: "vaporwave",
    name: "Vaporwave",
    analysisPrompt: `You are a vaporwave aesthetic curator creating dreamy, ironic, internet-nostalgia copy for a surreal visual.

Analyze the user's description and the screenshot. Create copy that channels vaporwave — dreamy, surreal, with a touch of irony and internet nostalgia. This will appear in a pastel-neon, glitch-art composition.
${DESCRIPTION_PRIORITY}

Return a JSON object with these exact fields:
{
  "headline": "A dreamy, surreal headline (3-7 words) — vaporwave aesthetic, slightly ironic and ethereal",
  "subHeadline": "A flowing, dreamlike sentence (10-18 words) with internet nostalgia and surreal beauty",
  "highlightTarget": "Description of the UI element to feature in the surreal composition (be specific)",
  "tooltipText": "A short, aesthetic callout (4-10 words) — dreamy and digital",
  "marketingCopy": "One sentence that makes the product feel like a beautiful digital dream"
}

Write dreamy and aesthetic. Think Windows 95, marble busts, palm trees, pink sunsets. Surreal and beautiful.${SPELLING_REMINDER}`,

    geminiPrompt: `Create a vaporwave-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Vaporwave:
- Pastel-neon gradient palette: pink, teal, purple, soft lavender, warm peach
- Greek/Roman marble bust or statue element as a decorative accent
- Checkerboard floor or Windows 95-style UI elements in the background
- Glitch effects, pixel sorting, or chromatic aberration distortion
- Palm trees, dolphins, or geometric shapes as surreal floating elements
- VHS tracking lines, scan distortion, or old-school computer window frames
- Overall feel: A E S T H E T I C, internet nostalgia, surreal dream, Macintosh Plus

LAYOUT:
- Screenshot displayed in a retro computer window frame or with glitch-border effect
- Headline in clean, wide-spaced text with pink/teal gradient or chrome sheen
- Sub-headline below in a softer, dreamy style
- Floating surreal elements around the composition (busts, palms, geometric shapes)
- A glowing or iridescent callout highlighting the target UI element
- Tooltip text in a retro-styled window or pastel badge
- Dreamy, spacious composition with intentional surreal juxtaposition

${TEXT_RULES_NEON}`,
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

/**
 * Build a text-free scenic image prompt.
 * Strips LAYOUT + CRITICAL TEXT RULES sections, filters text-related lines
 * from VISUAL STYLE, and appends an emphatic no-text directive.
 */
export function buildScenicImagePrompt(template: TemplatePrompts): string {
  // Strip everything from LAYOUT: onward (catches LAYOUT + CRITICAL TEXT RULES)
  let prompt = template.geminiPrompt;
  const layoutIdx = prompt.indexOf("\nLAYOUT:");
  if (layoutIdx !== -1) {
    prompt = prompt.substring(0, layoutIdx).trimEnd();
  } else {
    // Fallback: strip from CRITICAL TEXT RULES if LAYOUT not found
    const critIdx = prompt.indexOf("CRITICAL TEXT RULES:");
    if (critIdx !== -1) {
      prompt = prompt.substring(0, critIdx).trimEnd();
    }
  }

  // Filter out lines mentioning text-related concepts from VISUAL STYLE
  const textKeywords = /\b(headline|sub-headline|subheadline|tooltip|callout|caption|label|typography|font|text\b)/i;
  const lines = prompt.split("\n");
  const filtered = lines.filter((line) => {
    // Keep non-bullet lines (section headers, blank lines, opening sentence)
    if (!line.trimStart().startsWith("-")) return true;
    // Drop bullet lines that reference text elements
    return !textKeywords.test(line);
  });

  // Replace "marketing visual" language in opening line
  filtered[0] = filtered[0]
    .replace(/marketing visual using the provided screenshot and text/i, "scenic visual using the provided screenshot")
    .replace(/marketing visual/i, "scenic visual");

  return `${filtered.join("\n")}

ABSOLUTE TEXT PROHIBITION:
Under NO CIRCUMSTANCES render ANY text, words, letters, numbers, labels, titles, headlines, sub-headlines, tooltips, captions, watermarks, or annotations in this image.
NEVER include ANY text whatsoever in the final image, even if the visual style description above mentions typography or text elements — ignore those references entirely.
This is a SCENIC, TEXT-FREE visual. Focus purely on visual composition, lighting, shadows, depth, and the template's decorative style.
Present the screenshot beautifully within the template's aesthetic — the screenshot is the ONLY content.
Double-check that NO text of any kind appears anywhere in the generated image.`;
}
