/**
 * Generate template preview images using the Gemini API.
 * Runs the full two-step pipeline (text analysis → image generation) for each template.
 *
 * Usage: node scripts/generate-previews.mjs <source-image-path>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// --- Config ---
// Read API key from functions/.env (never hardcode keys in committed files)
const envPath = path.join(ROOT, "functions", ".env");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
const keyMatch = envContent.match(/^GEMINI_API_KEY=(.+)$/m);
const API_KEY = process.env.GEMINI_API_KEY || keyMatch?.[1] || "";
if (!API_KEY) {
  console.error("GEMINI_API_KEY not found. Set it in functions/.env or as an environment variable.");
  process.exit(1);
}
const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image-preview"; // for image generation
const OUTPUT_DIR = path.join(ROOT, "public", "templates");
const CONCURRENCY = 2; // parallel generations to stay within rate limits

// All 24 template IDs
const TEMPLATE_IDS = [
  "glassmorphic",
  "bold_marketing",
  "device_mockup",
  "gradient_noise",
  "app_store",
  "dark_professional",
  "cinematic_aurora",
  "corporate_clean",
  "bento_grid",
  "clean_minimal",
  "documentation",
  "blueprint",
  "terminal_dark",
  "neo_brutalist",
  "retro_futurism",
  "collage_mixed",
  // Creative (new)
  "comic_book",
  "vintage_polaroid",
  "vaporwave",
  // Decade
  "psychedelic_60s",
  "disco_70s",
  "synthwave_80s",
  "grunge_90s",
  "y2k_2000s",
  // Lifestyle
  "hand_holding",
  "in_use",
  "flat_lay",
  "on_display",
  "unboxing",
];

// --- Template prompts (analysis + image) imported inline to avoid TS compilation ---
// We'll read them from the compiled functions or duplicate the essential parts here.

// Analysis prompts per template (simplified - just the system instruction)
const ANALYSIS_PROMPTS = {
  glassmorphic: `You are a marketing copywriter analyzing a software screenshot for a SaaS marketing visual. Analyze the screenshot and produce compelling marketing copy. Focus on the key value proposition visible in the UI.`,
  bold_marketing: `You are an advertising copywriter creating punchy, high-energy marketing copy for a product visual. Create copy that grabs attention and drives action.`,
  device_mockup: `You are a product marketing specialist creating copy for a device mockup visual. Create compelling copy that positions the product as premium and professional.`,
  gradient_noise: `You are an indie product designer creating warm, tactile copy for a product visual. Create copy with a friendly, approachable tone.`,
  app_store: `You are a mobile app marketer creating copy for an app store screenshot visual. Create punchy, app-store-optimized copy — short, scannable, benefit-focused.`,
  dark_professional: `You are a business communications expert creating executive-quality copy for a product showcase. Create polished, professional copy suitable for pitch decks.`,
  cinematic_aurora: `You are a luxury brand strategist creating elevated, premium copy for a cinematic visual. Create sophisticated, aspirational copy.`,
  corporate_clean: `You are a corporate communications writer creating professional copy for an enterprise presentation. Create polished, corporate-appropriate copy.`,
  bento_grid: `You are a product designer creating concise copy for a bento-grid feature showcase. Create short, scannable copy.`,
  clean_minimal: `You are a technical writer creating clear, informative copy for a documentation or blog visual. Focus on clarity and precision.`,
  documentation: `You are a UX writer creating clear instructional copy for a help document. Create copy that helps users understand a feature.`,
  blueprint: `You are a technical documentation engineer creating precise, technical copy for a blueprint-style visual. Create technical, specification-style copy.`,
  terminal_dark: `You are a developer advocate creating dev-friendly copy for a terminal-inspired visual. Create copy with a developer tone — concise and technically credible.`,
  neo_brutalist: `You are an indie creative director creating bold, irreverent copy for a neo-brutalist visual. Create punchy, bold copy with attitude.`,
  retro_futurism: `You are a creative director creating dramatic, cinematic copy for a retro-futuristic visual. Create copy that feels like a sci-fi movie poster.`,
  collage_mixed: `You are an art director creating eclectic, creative copy for a mixed-media collage visual. Create expressive, creative copy.`,
  comic_book: `You are a comic book letterer and cover artist creating punchy, action-packed copy for a comic-style visual. Create copy with comic book energy — bold, dramatic, action-packed.`,
  vintage_polaroid: `You are a nostalgic photographer creating warm, personal copy for a vintage photo-style visual. Create copy that feels personal, authentic, and nostalgic.`,
  vaporwave: `You are a vaporwave aesthetic curator creating dreamy, ironic, internet-nostalgia copy for a surreal visual. Create copy that channels vaporwave — dreamy, surreal, with a touch of irony.`,
  psychedelic_60s: `You are a counterculture poster artist creating groovy, expressive copy for a psychedelic visual. Create copy that channels the spirit of the 1960s — peace, love, freedom.`,
  disco_70s: `You are a disco-era graphic designer creating funky, glamorous copy for a 1970s-inspired visual. Create copy that channels Saturday Night Fever — glamorous, funky, and golden.`,
  synthwave_80s: `You are an 80s pop culture creative director creating radical, high-energy copy for a synthwave visual. Create copy that channels Miami Vice, Top Gun, and arcade culture.`,
  grunge_90s: `You are a 90s zine maker creating raw, anti-establishment copy for a grunge-inspired visual. Create copy with 90s attitude — raw, authentic, anti-corporate.`,
  y2k_2000s: `You are a Y2K-era web designer creating futuristic, glossy copy for a millennium-inspired visual. Create copy that channels the year 2000 — glossy, optimistic, digital-futuristic.`,
  hand_holding: `You are a lifestyle product photographer creating copy for a hand-holding product shot. Create warm, personal copy that makes the product feel approachable.`,
  in_use: `You are a lifestyle product photographer creating copy for an in-use product shot. Create copy that shows the product being actively used in a real scenario.`,
  flat_lay: `You are a lifestyle product photographer creating copy for a flat lay product shot. Create clean, organized copy that complements a top-down product arrangement.`,
  on_display: `You are a lifestyle product photographer creating copy for a product display shot. Create elegant copy for a product beautifully placed in its natural environment.`,
  unboxing: `You are a lifestyle product photographer creating copy for an unboxing experience shot. Create exciting copy that captures the thrill of opening a new product.`,
};

// Shared analysis instruction appended to all
const ANALYSIS_SCHEMA_INSTRUCTION = `

Return a JSON object with these exact fields:
{
  "headline": "A bold headline (3-8 words)",
  "subHeadline": "A supporting sentence (10-20 words)",
  "highlightTarget": "Description of the UI element to emphasize",
  "tooltipText": "A short callout (4-10 words)",
  "marketingCopy": "One compelling sentence"
}

CRITICAL CHARACTER LIMITS:
- headline: MAXIMUM 25 characters (including spaces). Shorter is better.
- subHeadline: MAXIMUM 60 characters (including spaces).
- tooltipText: MAXIMUM 25 characters (including spaces). Shorter is better.
Double-check all spelling. Every word must be spelled correctly.`;

// We need the image prompts. Let's import from the TS source by reading the file
// and extracting. Instead, let's duplicate the geminiPrompt for each template.
// This is a one-time script so duplication is fine.

const IMAGE_PROMPTS = {
  glassmorphic: `Create a stunning glassmorphic marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element in clean, precise, modern sans-serif typography with perfect clarity.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  bold_marketing: `Create a bold, high-energy marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element as if physically printed on a sign or banner in bold, clean, sans-serif block letters.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  device_mockup: `Create a device mockup marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element in clean, precise, modern sans-serif typography with perfect clarity.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  gradient_noise: `Create a warm, textured marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element in warm, friendly, rounded sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  app_store: `Create an app store screenshot visual using the provided screenshot and text.

VISUAL STYLE — App Store:
- Portrait phone frame (iPhone-style) with the screenshot displayed inside
- Clean, solid or subtle gradient background behind the phone
- A feature badge or pill label near the top or bottom
- Bold, large headline text above the phone
- Overall feel: polished app store listing

LAYOUT:
- Phone frame centered, occupying roughly 60% of vertical space
- Headline above the phone in large, bold text
- Sub-headline below the headline in medium weight
- Tooltip text inside a feature badge pill

CRITICAL TEXT RULES:
- Render each text element as if physically printed on a sign or banner in bold, clean, sans-serif block letters.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  dark_professional: `Create a dark, professional executive-quality visual using the provided screenshot and text.

VISUAL STYLE — Dark Professional:
- Dark background (#0A0A0F or very dark navy/charcoal)
- Screenshot displayed with crisp edges, subtle light border, and a refined drop shadow
- Accent colors: gold (#D4AF37), cyan (#00D4FF), or silver highlights — used sparingly
- Subtle gradient overlays or vignette effects
- Overall feel: premium, executive, boardroom-ready

LAYOUT:
- Screenshot centered or slightly offset with generous dark space
- Headline in refined typography with accent color highlight on a key word
- Sub-headline below in lighter weight, slightly muted color
- A precise callout line (gold or cyan) connecting to the highlighted UI element

CRITICAL TEXT RULES:
- Render each text element in elegant, refined, light-to-medium weight sans-serif typography with generous letter-spacing.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  cinematic_aurora: `Create a cinematic aurora-themed marketing visual using the provided screenshot and text.

VISUAL STYLE — Cinematic Aurora:
- Very dark background (#050510 near-black with subtle blue undertone)
- Flowing aurora borealis color washes (green → teal → purple → pink) across the background
- Subtle floating particle effects or tiny light dots
- Screenshot with a soft luminous glow border
- Overall feel: cinematic, premium, otherworldly, luxury tech

LAYOUT:
- Screenshot centered with a luminous aura/glow around it
- Headline in elegant, well-spaced typography above or overlaying the aurora
- Sub-headline below the headline in lighter weight
- A glowing spotlight or highlight beam on the target UI element

CRITICAL TEXT RULES:
- Render each text element in elegant, refined, light-to-medium weight sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  corporate_clean: `Create a clean corporate marketing visual using the provided screenshot and text.

VISUAL STYLE — Corporate Clean:
- White or light gray background with subtle blue tint
- Corporate blue (#1e40af) and slate gray (#475569) as primary colors
- Screenshot placed in a structured grid layout with clean alignment
- Subtle geometric patterns or thin line accents in the background
- Overall feel: polished enterprise presentation, boardroom-ready

LAYOUT:
- Headline in corporate blue, bold weight, above the screenshot
- Sub-headline below the headline in slate gray
- Screenshot with thin border and subtle shadow, cleanly positioned
- A precise callout line connecting to the highlighted element

CRITICAL TEXT RULES:
- Render each text element in clean, precise, modern sans-serif typography with perfect clarity.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  bento_grid: `Create a bento grid marketing visual using the provided screenshot and text.

VISUAL STYLE — Bento Grid:
- Dark or neutral background with rounded-corner tiles arranged in a bento/grid layout
- The screenshot fills the largest tile (hero tile, roughly 60% of the composition)
- Smaller tiles contain text, feature labels, or decorative accents
- Subtle borders between tiles, slightly rounded corners
- Overall feel: modern product page, Apple/Linear-style bento layout

LAYOUT:
- Hero tile: screenshot displayed prominently
- Headline tile: bold text in a medium-sized tile adjacent to the hero
- Sub-headline in a smaller tile below or beside the headline
- Tooltip text in a compact accent-colored tile

CRITICAL TEXT RULES:
- Render each text element as if physically printed on a sign or banner in bold, clean, sans-serif block letters.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  clean_minimal: `Create a clean, minimal documentation-style visual using the provided screenshot and text.

VISUAL STYLE — Clean Minimal:
- White or very light gray (#F8F9FA) background
- Screenshot placed straight-on (no perspective tilt), centered with generous padding
- Thin, subtle border (1px light gray) around the screenshot
- Soft drop shadow beneath the screenshot
- Minimal decorative elements — let the screenshot speak

LAYOUT:
- Headline above or below the screenshot in medium-weight font
- Sub-headline directly below the headline in lighter weight
- A clean callout arrow pointing to the highlighted element
- Generous whitespace throughout

CRITICAL TEXT RULES:
- Render each text element in clean, precise, modern sans-serif typography with perfect clarity.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  documentation: `Create a clean documentation-style visual with a single clear callout using the provided screenshot and text.

VISUAL STYLE — Documentation:
- Light, neutral background (white or light warm gray)
- Screenshot displayed straight-on, full-width or near-full-width
- A single callout indicator in a consistent accent color (blue or teal)
- A clean arrow pointing from the callout to the specific UI element
- Overall feel: clear, instructional, help-doc quality

LAYOUT:
- Headline as a section header above the screenshot
- Sub-headline as instructional text below the headline
- Screenshot with ONE single callout overlay pointing to the highlighted element
- Do NOT add multiple numbered steps or extra callouts — keep it to ONE

CRITICAL TEXT RULES:
- Render each text element in clean, precise, modern sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  blueprint: `Create a blueprint-style technical visual using the provided screenshot and text.

VISUAL STYLE — Blueprint:
- Blueprint blue background (#1a3a5c or similar dark navy-blue)
- White gridlines creating an engineering paper grid pattern
- Screenshot displayed with technical annotation lines and markers
- Right-angle connector lines from labels to UI elements
- Overall feel: engineering blueprint, technical schematic

LAYOUT:
- Screenshot centered with technical annotation overlay
- Headline as a title block label (top-left or top-center, bordered)
- Sub-headline as a specification description below the title
- A single right-angle leader line connecting tooltip text to highlighted element

CRITICAL TEXT RULES:
- Render each text element in clean monospace or technical sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  terminal_dark: `Create a terminal-inspired dark marketing visual using the provided screenshot and text.

VISUAL STYLE — Terminal Dark:
- Very dark background (#0a0a0a or near-black)
- Terminal window chrome: title bar with red/yellow/green dots, subtle border
- Screenshot displayed inside a terminal-like frame with rounded corners
- Green (#22c55e) or amber (#f59e0b) accent colors for highlights
- Overall feel: developer tool, hacker aesthetic, VS Code meets marketing

LAYOUT:
- Screenshot inside a terminal/editor window frame
- Headline styled like a terminal command or heading comment
- Sub-headline below in lighter monospace
- Callout annotation styled as a code comment pointing to highlighted element

CRITICAL TEXT RULES:
- Render each text element in clean monospace or technical sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  neo_brutalist: `Create a neo-brutalist marketing visual using the provided screenshot and text.

VISUAL STYLE — Neo Brutalist:
- Bold, flat colors: bright yellow (#facc15), red (#ef4444), blue (#3b82f6), black, white
- Thick black borders (3-4px) around all elements
- No gradients — flat, solid color blocks
- Screenshot with a thick black border and slight rotation (2-5°)
- Offset/drop shadows in solid black (shifted 4-6px down-right)
- Overall feel: indie web, brutalist design, raw energy

LAYOUT:
- Screenshot slightly rotated with thick border and offset shadow
- Headline in very large, heavy-weight text
- Sub-headline in medium weight, contrasting color block background
- A bold arrow or thick-bordered callout pointing to the highlighted element

CRITICAL TEXT RULES:
- Render each text element as if physically printed on a sign or banner in bold, clean, sans-serif block letters.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  retro_futurism: `Create a retro-futuristic marketing visual using the provided screenshot and text.

VISUAL STYLE — Retro Futurism:
- Dark background (#0a0a1a) with a perspective grid floor receding to a vanishing point
- Neon color palette: hot pink (#ec4899), electric cyan (#06b6d4), chrome silver
- Screenshot with a neon glow border (pink or cyan)
- Scan lines or VHS-style subtle texture overlay
- Overall feel: 80s sci-fi, synthwave, Tron/Blade Runner aesthetic

LAYOUT:
- Screenshot floating above the grid floor with neon glow
- Headline in large chrome/metallic text above the screenshot
- Sub-headline below in clean neon-colored text
- A neon glow highlight on the target UI element

CRITICAL TEXT RULES:
- Render each text element with a chrome, metallic, or neon glow effect consistent with an 80s sci-fi synthwave aesthetic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  collage_mixed: `Create a mixed-media collage marketing visual using the provided screenshot and text.

VISUAL STYLE — Collage Mixed:
- Textured background: paper, cardboard, or canvas texture
- Screenshot displayed as if it's a photo/printout layered into the collage
- Torn paper edges, tape strips holding elements
- Overlapping layers: screenshot, text blocks, decorative elements
- Overall feel: creative agency, editorial design, mixed-media art

LAYOUT:
- Screenshot slightly rotated and "taped" onto the composition
- Headline on a colored paper strip or label
- Sub-headline in lighter type nearby
- The highlighted element gets a hand-drawn circle or arrow annotation

CRITICAL TEXT RULES:
- Render each text element as if physically placed into a mixed-media collage — bold type on paper strips or sticker-like elements.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  comic_book: `Create a comic book-style marketing visual using the provided screenshot and text.

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
- A speech bubble containing the tooltip text pointing to the UI element
- Starburst shapes or action lines as decorative elements

CRITICAL TEXT RULES:
- Render each text element in bold uppercase block letters with thick black outlines, consistent with comic book lettering.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  vintage_polaroid: `Create a vintage Polaroid-style marketing visual using the provided screenshot and text.

VISUAL STYLE — Vintage Polaroid:
- Warm, faded color cast — slightly desaturated with amber/sepia undertones
- Classic Polaroid frame: white border (thick at bottom for caption), slight shadow
- Film grain texture overlay across the image
- Subtle vignette darkening the corners
- Warm spotlight or light leak effects
- Overall feel: nostalgic instant photo, vintage film, personal and authentic

LAYOUT:
- Screenshot placed inside a Polaroid-style white frame, slightly tilted (2-5°)
- Headline as handwritten-style text on or below the Polaroid's white bottom border
- Sub-headline in a softer handwritten or casual style nearby
- A warm glow or soft circle highlighting the target UI element

CRITICAL TEXT RULES:
- Render each text element in warm, friendly, rounded sans-serif typography that feels approachable and human.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  vaporwave: `Create a vaporwave-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Vaporwave:
- Pastel-neon gradient palette: pink, teal, purple, soft lavender, warm peach
- Greek/Roman marble bust or statue element as a decorative accent
- Checkerboard floor or Windows 95-style UI elements in the background
- Glitch effects, pixel sorting, or chromatic aberration distortion
- Palm trees, dolphins, or geometric shapes as surreal floating elements
- Overall feel: A E S T H E T I C, internet nostalgia, surreal dream, Macintosh Plus

LAYOUT:
- Screenshot displayed in a retro computer window frame or with glitch-border effect
- Headline in clean, wide-spaced text with pink/teal gradient or chrome sheen
- Sub-headline below in a softer, dreamy style
- Floating surreal elements around the composition
- A glowing or iridescent callout highlighting the target UI element

CRITICAL TEXT RULES:
- Render each text element with a chrome, metallic, or neon glow effect consistent with a vaporwave aesthetic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  psychedelic_60s: `Create a psychedelic 1960s-inspired marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element in wavy, organic, art-nouveau-inspired letterforms — hand-drawn or decorative, never rigid or digital.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  disco_70s: `Create a disco 1970s-inspired marketing visual using the provided screenshot and text.

VISUAL STYLE — Disco 70s:
- Warm color palette: burnt orange, brown, gold, mustard, teal, cream
- Metallic gold and silver accents — mirror ball reflections, sparkle highlights
- Sunburst or radial ray patterns emanating from the center or screenshot
- Rounded, bubble-style decorative shapes
- Subtle halftone or film grain texture overlay
- Geometric patterns: circles, arches, chevrons in retro earth tones
- Overall feel: disco poster, 70s album cover, Saturday Night Fever glamour

LAYOUT:
- Screenshot framed within a rounded or arch-shaped border with gold edge
- Sunburst rays radiating behind the screenshot
- Headline in rounded, bubble-style or inline-shadow lettering above the screenshot
- Sub-headline below in a lighter retro style
- A gold or sparkle-accented callout highlighting the target UI element

CRITICAL TEXT RULES:
- Render each text element with a chrome, metallic, or neon glow effect consistent with a disco aesthetic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  synthwave_80s: `Create an 80s synthwave-inspired marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element with a chrome, metallic, or neon glow effect consistent with an 80s sci-fi synthwave aesthetic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  grunge_90s: `Create a 90s grunge-inspired marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element as if stamped, stenciled, or photocopied — distressed, imperfect, raw and authentic.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  hand_holding: `Create a lifestyle product photography visual showing a hand holding the product from the provided screenshot.

VISUAL STYLE — Hand Holding:
- A real human hand naturally holding or presenting the product
- Soft, warm lighting with shallow depth of field (blurred background)
- Clean, lifestyle-appropriate background (coffee shop, desk, outdoors)
- The product from the screenshot should be clearly recognizable
- Natural skin tones and realistic hand positioning
- Overall feel: authentic, personal, Instagram-worthy product photography

LAYOUT:
- Hand positioned naturally, holding the product at a slight angle
- Product is the clear focal point — sharp focus on the product
- Background softly blurred with warm bokeh
- Headline text overlaid in clean, modern typography
- Sub-headline below in lighter weight

CRITICAL TEXT RULES:
- Render each text element in clean, modern sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  in_use: `Create a lifestyle product photography visual showing the product from the provided screenshot being actively used.

VISUAL STYLE — In Use:
- Someone actively using/interacting with the product in a natural setting
- Candid, authentic feel — not posed or staged
- Warm, natural lighting
- The product from the screenshot should be clearly visible and recognizable
- Overall feel: real-world usage, authentic lifestyle photography

LAYOUT:
- Person naturally using the product — focus on the interaction
- Product clearly visible and recognizable from the screenshot
- Warm, inviting environment in the background
- Headline overlaid in clean typography
- Sub-headline below

CRITICAL TEXT RULES:
- Render each text element in clean, modern sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  flat_lay: `Create a flat lay product photography visual featuring the product from the provided screenshot.

VISUAL STYLE — Flat Lay:
- Top-down (bird's eye) camera angle
- Product centered with complementary props arranged around it
- Clean, organized composition on a textured surface (marble, wood, linen)
- Consistent lighting from above — minimal shadows
- Props relevant to the product category (stationery, plants, coffee, tech accessories)
- Overall feel: Pinterest-worthy, organized, editorial flat lay

LAYOUT:
- Product from screenshot prominently centered
- Supporting props arranged symmetrically or in golden ratio
- Clean negative space for text placement
- Headline overlaid in clean, modern typography
- Sub-headline below

CRITICAL TEXT RULES:
- Render each text element in clean, modern sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  on_display: `Create a product display photography visual featuring the product from the provided screenshot.

VISUAL STYLE — On Display:
- Product elegantly placed on a shelf, table, or display stand
- Beautiful environment that complements the product
- Professional studio-quality lighting with soft shadows
- The product from the screenshot should be the star of the scene
- Overall feel: catalog photography, editorial product display

LAYOUT:
- Product beautifully positioned in an aspirational setting
- Environment enhances the product's appeal
- Professional lighting creating depth and dimension
- Headline in elegant typography
- Sub-headline below

CRITICAL TEXT RULES:
- Render each text element in clean, modern sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  unboxing: `Create an unboxing experience photography visual featuring the product from the provided screenshot.

VISUAL STYLE — Unboxing:
- Product emerging from or next to its packaging
- Tissue paper, branded box, or premium packaging materials visible
- Overhead or slight angle view capturing the unboxing moment
- Warm, excited lighting — as if capturing a special moment
- The product from the screenshot should be clearly recognizable
- Overall feel: premium unboxing experience, social media share-worthy

LAYOUT:
- Product partially out of box or artfully arranged with packaging
- Packaging materials (tissue, ribbons, branded elements) visible
- Clean composition with the product as the focal point
- Headline overlaid in clean typography
- Sub-headline below

CRITICAL TEXT RULES:
- Render each text element in clean, modern sans-serif typography.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,

  y2k_2000s: `Create a Y2K 2000s-inspired marketing visual using the provided screenshot and text.

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

CRITICAL TEXT RULES:
- Render each text element in clean, precise, modern sans-serif typography with perfect clarity.
- Render ALL text EXACTLY as provided — do not alter spelling, capitalization, or wording.
- The headline text is: "{headline}"
- The sub-headline text is: "{subHeadline}"
- The tooltip text is: "{tooltipText}"
- No gibberish text, extra floating letters, or misspelled words.`,
};

// --- V2 Marketing Focused directive ---
const V2_DIRECTIVE = `
LAYOUT DIRECTIVE — MARKETING FOCUSED:
Create a polished marketing composition where text and screenshot share visual prominence.
The screenshot can be placed inside a device frame, tilted, or styled per the template's visual direction.
Headline text should be LARGE and prominent — this is a marketing piece, not documentation.
Sub-headline appears near the headline in supporting weight.
Tooltip/callout highlights the key UI element with the template's signature style.
Apply the full visual treatment: gradients, shadows, decorative elements, perspective effects.
The feel should be eye-catching and social-media-ready — prioritize visual impact over screenshot legibility.`;

// --- Helpers ---

async function callGemini(model, contents, generationConfig = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
  const body = { contents, generationConfig };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${text}`);
  }

  return resp.json();
}

async function runTextAnalysis(base64Data, mediaType, templateId) {
  const systemPrompt =
    ANALYSIS_PROMPTS[templateId] + ANALYSIS_SCHEMA_INSTRUCTION;
  const userPrompt =
    "Analyze this screenshot of a YouTube metadata generator tool called TubePilot. Create marketing copy for it.";

  const result = await callGemini(
    TEXT_MODEL,
    [
      {
        role: "user",
        parts: [
          { text: systemPrompt + "\n\n" + userPrompt },
          {
            inlineData: {
              mimeType: mediaType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    {
      responseMimeType: "application/json",
      temperature: 0.7,
    }
  );

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text analysis result");
  return JSON.parse(text);
}

async function runImageGeneration(base64Data, mediaType, imagePrompt) {
  const result = await callGemini(
    IMAGE_MODEL,
    [
      {
        role: "user",
        parts: [
          { text: imagePrompt },
          {
            inlineData: {
              mimeType: mediaType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1.0,
    }
  );

  // Extract image from response
  const parts = result.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith("image/")) {
      return part.inlineData.data; // base64 image
    }
  }
  throw new Error("No image in response");
}

function buildPrompt(templateId, analysis) {
  let prompt = IMAGE_PROMPTS[templateId];
  prompt = prompt.replace("{headline}", analysis.headline);
  prompt = prompt.replace("{subHeadline}", analysis.subHeadline);
  prompt = prompt.replace("{tooltipText}", analysis.tooltipText);
  prompt += "\n\n" + V2_DIRECTIVE;
  prompt +=
    "\n\nEnsure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.";
  return prompt;
}

async function generateForTemplate(base64Data, mediaType, templateId) {
  console.log(`[${templateId}] Starting text analysis...`);
  const analysis = await runTextAnalysis(base64Data, mediaType, templateId);
  console.log(`[${templateId}] Text: "${analysis.headline}" / "${analysis.subHeadline}"`);

  const imagePrompt = buildPrompt(templateId, analysis);
  console.log(`[${templateId}] Generating image...`);
  const imageBase64 = await runImageGeneration(
    base64Data,
    mediaType,
    imagePrompt
  );

  // Save as webp (Gemini returns PNG; we save raw and convert via sharp if available, else save as-is)
  const rawBuffer = Buffer.from(imageBase64, "base64");
  const outputPath = path.join(OUTPUT_DIR, `${templateId}.webp`);
  try {
    const sharp = (await import("sharp")).default;
    const webpBuffer = await sharp(rawBuffer).webp({ quality: 85 }).toBuffer();
    fs.writeFileSync(outputPath, webpBuffer);
  } catch {
    // sharp not available — save as PNG with .webp extension (browsers handle it fine)
    fs.writeFileSync(outputPath, rawBuffer);
  }
  console.log(`[${templateId}] Saved: ${outputPath}`);
  return outputPath;
}

// --- Main ---

async function main() {
  // Parse args: skip flags, first non-flag arg is the source image path
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const sourceImagePath =
    args[0] || "C:\\Users\\smyth\\Downloads\\Screenshot 2026-02-23 170750.png";

  if (!fs.existsSync(sourceImagePath)) {
    console.error(`Source image not found: ${sourceImagePath}`);
    process.exit(1);
  }

  // --only-new flag: skip templates that already have a .webp preview
  const onlyNew = process.argv.includes("--only-new");

  let templatesToGenerate = [...TEMPLATE_IDS];
  if (onlyNew) {
    templatesToGenerate = templatesToGenerate.filter(
      (id) => !fs.existsSync(path.join(OUTPUT_DIR, `${id}.webp`))
    );
    if (templatesToGenerate.length === 0) {
      console.log("All templates already have previews. Nothing to do.");
      return;
    }
  }

  console.log(`Source image: ${sourceImagePath}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Templates: ${templatesToGenerate.length}${onlyNew ? " (new only)" : ""}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log("");

  // Read source image
  const imageBuffer = fs.readFileSync(sourceImagePath);
  const base64Data = imageBuffer.toString("base64");
  const ext = path.extname(sourceImagePath).toLowerCase();
  const mediaType =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : "image/png";

  console.log(`Image: ${mediaType}, ${(imageBuffer.length / 1024).toFixed(0)}KB\n`);

  // Process templates with concurrency limit
  const remaining = [...templatesToGenerate];
  const results = [];
  const failed = [];

  while (remaining.length > 0) {
    const batch = remaining.splice(0, CONCURRENCY);
    const promises = batch.map(async (templateId) => {
      try {
        await generateForTemplate(base64Data, mediaType, templateId);
        results.push(templateId);
      } catch (err) {
        console.error(`[${templateId}] FAILED: ${err.message}`);
        failed.push(templateId);
      }
    });
    await Promise.all(promises);

    if (remaining.length > 0) {
      // Brief pause between batches to respect rate limits
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\nDone! ${results.length}/${templatesToGenerate.length} succeeded.`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
