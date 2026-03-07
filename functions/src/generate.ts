import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useCredit, initCredits } from "./credits";
import { getTemplate, buildImagePrompt, buildScenicImagePrompt } from "./templates";

interface GenerateBody {
  imageDataUrl: string;
  description: string;
  templateId: string;
  aspectRatio?: string;
  imageSize?: string;
  annotatedImageDataUrl?: string;
  includeText?: boolean;
  targetWidth?: number;
  targetHeight?: number;
}

interface HighlightBox {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

interface TextAnalysisResult {
  headline: string;
  subHeadline: string;
  highlightTarget: string;
  tooltipText: string;
  marketingCopy: string;
  highlightBox?: HighlightBox;
}

interface GenerateResult {
  text: TextAnalysisResult | null; // null for scenic mode
  variations: string[];            // base64 data URLs of generated images
}

/**
 * Detailed layout directives for each variation.
 * V1 = Screenshot Focused (screenshot is hero, large and legible)
 * V2 = Marketing Focused (full template treatment, dramatic composition)
 * V3 = Angled Float (available for regen)
 */
const VARIATION_DIRECTIVES: string[] = [
  // V1: Screenshot Focused
  `LAYOUT DIRECTIVE — SCREENSHOT FOCUSED:
The screenshot MUST be the dominant visual element, occupying at least 70-85% of the composition.
Display the screenshot FLAT or near-flat (maximum 5° tilt). Do NOT place it inside a device frame or mockup.
The screenshot content must be clearly LEGIBLE — do not shrink, crop, or obscure it.
Keep all text elements (headline, sub-headline, tooltip) SMALL and positioned along the edges or corners.
Text should complement the screenshot, not compete with it.
Add only minimal decorative elements — a subtle background gradient or border is fine.
The feel should be clean, focused, and documentation-quality — the screenshot tells the story.`,

  // V2: Marketing Focused
  `LAYOUT DIRECTIVE — MARKETING FOCUSED:
Create a polished marketing composition where text and screenshot share visual prominence.
The screenshot can be placed inside a device frame, tilted, or styled per the template's visual direction.
Headline text should be LARGE and prominent — this is a marketing piece, not documentation.
Sub-headline appears near the headline in supporting weight.
Tooltip/callout highlights the key UI element with the template's signature style.
Apply the full visual treatment: gradients, shadows, decorative elements, perspective effects.
The feel should be eye-catching and social-media-ready — prioritize visual impact over screenshot legibility.`,

  // V3: Angled Float (used for regen)
  `LAYOUT DIRECTIVE — ANGLED FLOAT:
Display the screenshot ROTATED 15-25 degrees, floating dynamically in the composition.
Add a dramatic drop shadow beneath the angled screenshot for depth and dimension.
Headline text is LARGE and anchored to one corner (top-left or bottom-right).
Sub-headline positioned near the headline but offset for visual tension.
The overall composition follows a DIAGONAL flow from one corner to the opposite.
Tooltip/callout positioned at the edge of the rotated screenshot.
The feel should be dynamic, energetic, and eye-catching — like a poster or ad.
Use the angle to create visual movement and break the static grid.`,
];

/**
 * Scenic variation directives — NO text references at all.
 * Used when description is empty (scenic mode).
 */
/**
 * Safe zone directive — injected into every image generation prompt.
 * Ensures text/content stays inset from edges so cover-fit cropping
 * (due to Gemini aspect ratio vs target size mismatch) never clips content.
 */
const BASE_SAFE_ZONE_PCT = 5;

/**
 * Gemini aspect ratio string → numeric value.
 */
const GEMINI_RATIO_VALUES: Record<string, number> = {
  "1:1": 1, "3:2": 1.5, "2:3": 2 / 3, "3:4": 0.75, "4:3": 4 / 3,
  "4:5": 0.8, "5:4": 1.25, "9:16": 9 / 16, "16:9": 16 / 9, "21:9": 21 / 9,
};

/**
 * Build a dynamic safe zone directive based on expected crop.
 * When the Gemini output ratio differs from the target, we know which edges
 * will be cropped and by how much, so we increase the buffer on those edges.
 * Only adds extra buffer for crops >= 6%.
 */
function buildSafeZone(aspectRatio?: string, targetWidth?: number, targetHeight?: number): string {
  const base = BASE_SAFE_ZONE_PCT;
  let topBottom = base;
  let leftRight = base;

  if (aspectRatio && targetWidth && targetHeight) {
    const geminiRatio = GEMINI_RATIO_VALUES[aspectRatio];
    const targetRatio = targetWidth / targetHeight;

    if (geminiRatio && targetRatio) {
      if (geminiRatio > targetRatio) {
        // Gemini is wider → sides get cropped
        const cropPct = Math.round(((geminiRatio - targetRatio) / geminiRatio) * 100);
        if (cropPct >= 6) {
          leftRight = base + cropPct;
        }
      } else if (geminiRatio < targetRatio) {
        // Gemini is taller → top/bottom get cropped
        const cropPct = Math.round(((1 / geminiRatio - 1 / targetRatio) / (1 / geminiRatio)) * 100);
        if (cropPct >= 6) {
          topBottom = base + cropPct;
        }
      }
    }
  }

  if (topBottom === base && leftRight === base) {
    return `SAFE ZONE — MANDATORY:
Keep ALL text, headlines, sub-headlines, tooltips, logos, UI elements, and important visual content at least ${base}% inset from EVERY edge of the image. The outer ${base}% margin on all four sides must contain only background, gradients, or decorative elements — NEVER text or critical content. This ensures clean cropping at any aspect ratio.`;
  }

  return `SAFE ZONE — MANDATORY:
Keep ALL text, headlines, sub-headlines, tooltips, logos, UI elements, and important visual content well inset from the edges.
- LEFT and RIGHT edges: keep at least ${leftRight}% inset from each side.
- TOP and BOTTOM edges: keep at least ${topBottom}% inset from each edge.
These margins must contain only background, gradients, or decorative elements — NEVER text or critical content. This ensures clean cropping at the target aspect ratio.`;
}

const SCENIC_VARIATION_DIRECTIVES: string[] = [
  // V1: Clean Showcase
  `LAYOUT DIRECTIVE — CLEAN SHOWCASE:
The screenshot MUST be the dominant visual element, occupying at least 70-85% of the composition.
Display the screenshot FLAT or near-flat (maximum 5° tilt). Do NOT place it inside a device frame or mockup.
The screenshot content must be clearly LEGIBLE — do not shrink, crop, or obscure it.
Add only minimal decorative elements — a subtle background gradient or border is fine.
The feel should be clean, focused, and polished — the screenshot tells the story.
Do NOT add any text, labels, or annotations of any kind.`,

  // V2: Styled Presentation
  `LAYOUT DIRECTIVE — STYLED PRESENTATION:
Create a polished visual composition showcasing the screenshot with full decorative treatment.
The screenshot can be placed inside a device frame, tilted, or styled per the template's visual direction.
Apply the full visual treatment: gradients, shadows, decorative elements, perspective effects.
The feel should be eye-catching and social-media-ready — a beautiful presentation of the screenshot.
Do NOT add any text, labels, or annotations of any kind.`,

  // V3: Dynamic Float
  `LAYOUT DIRECTIVE — DYNAMIC FLOAT:
Display the screenshot ROTATED 15-25 degrees, floating dynamically in the composition.
Add a dramatic drop shadow beneath the angled screenshot for depth and dimension.
The overall composition follows a DIAGONAL flow from one corner to the opposite.
The feel should be dynamic, energetic, and visually striking — like a premium product shot.
Use the angle to create visual movement and break the static grid.
Do NOT add any text, labels, or annotations of any kind.`,
];

/**
 * Lifestyle variation directives — product-in-context photography.
 */
const LIFESTYLE_VARIATION_DIRECTIVES: string[] = [
  // V1: Close-up Product Shot
  `LAYOUT DIRECTIVE — CLOSE-UP PRODUCT:
The product is the hero — fill 50-70% of the frame with the product clearly visible.
Person is partially visible (hands, arms, torso) providing context but not dominating.
Shallow depth of field with the product in sharp focus.
Professional product photography lighting and composition.
The feel should be commercial, polished, and aspirational — like a brand campaign hero image.`,

  // V2: Wide Lifestyle Scene
  `LAYOUT DIRECTIVE — WIDE LIFESTYLE SCENE:
Create a wider environmental scene showing the product in its natural context.
Person and product share the frame — the environment tells a story about who uses this product.
Show enough of the setting to establish mood and lifestyle context.
Natural, editorial photography style — candid and aspirational.
The feel should be like a lifestyle brand's Instagram post or magazine ad.`,
];

const LIFESTYLE_SCENIC_DIRECTIVES: string[] = [
  `LAYOUT DIRECTIVE — CLOSE-UP PRODUCT:
The product is the hero — fill 50-70% of the frame with the product clearly visible.
Person is partially visible (hands, arms, torso) providing context but not dominating.
Shallow depth of field with the product in sharp focus.
Professional product photography lighting and composition.
Do NOT add any text, labels, or annotations of any kind.`,

  `LAYOUT DIRECTIVE — WIDE LIFESTYLE SCENE:
Create a wider environmental scene showing the product in its natural context.
Person and product share the frame — the environment tells a story about who uses this product.
Natural, editorial photography style — candid and aspirational.
Do NOT add any text, labels, or annotations of any kind.`,
];

/** IDs of lifestyle templates — used to select correct variation directives. */
const LIFESTYLE_TEMPLATE_IDS = new Set([
  "hand_holding", "in_use", "flat_lay", "on_display", "unboxing",
]);

/**
 * Extract base64 data and media type from a data URL.
 */
function parseDataUrl(dataUrl: string): { mediaType: string; base64Data: string } {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid image data URL format"
    );
  }
  return { mediaType: match[1], base64Data: match[2] };
}

/**
 * Step 1: Gemini analyzes the screenshot and generates marketing copy.
 * Uses structured JSON output (responseMimeType + responseSchema).
 */
async function runTextAnalysis(
  genAI: GoogleGenerativeAI,
  base64Data: string,
  mediaType: string,
  description: string,
  analysisPrompt: string,
  hasHighlights = false,
): Promise<TextAnalysisResult> {
  console.log("runTextAnalysis: starting", {
    mediaType,
    imageSize: base64Data.length,
    descriptionLength: description.length,
    promptLength: analysisPrompt.length,
    hasHighlights,
  });

  // Build schema — add highlightBox when user drew highlights
  const schemaProperties: Record<string, any> = {
    headline: { type: SchemaType.STRING },
    subHeadline: { type: SchemaType.STRING },
    highlightTarget: { type: SchemaType.STRING },
    tooltipText: { type: SchemaType.STRING },
    marketingCopy: { type: SchemaType.STRING },
  };
  const requiredFields = ["headline", "subHeadline", "highlightTarget", "tooltipText", "marketingCopy"];

  if (hasHighlights) {
    schemaProperties.highlightBox = {
      type: SchemaType.OBJECT,
      description: "Bounding box of the highlighted region as percentages of image dimensions (0-100)",
      properties: {
        xPercent: { type: SchemaType.NUMBER, description: "Left edge as percentage of image width (0-100)" },
        yPercent: { type: SchemaType.NUMBER, description: "Top edge as percentage of image height (0-100)" },
        widthPercent: { type: SchemaType.NUMBER, description: "Width as percentage of image width (0-100)" },
        heightPercent: { type: SchemaType.NUMBER, description: "Height as percentage of image height (0-100)" },
      },
      required: ["xPercent", "yPercent", "widthPercent", "heightPercent"],
    };
    requiredFields.push("highlightBox");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: analysisPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: schemaProperties,
        required: requiredFields,
      },
    },
  });

  const highlightInstruction = hasHighlights
    ? "\n\nThe image contains blue semi-transparent highlight overlays drawn by the user to indicate the area they want emphasized. Identify the bounding box of the highlighted region and return it in highlightBox as percentages of the image dimensions (0-100). The tooltip/callout should reference this highlighted area."
    : "";

  let response;
  try {
    response = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: base64Data,
        },
      },
      {
        text: `${description}${highlightInstruction}\n\nIMPORTANT: Double-check all spelling. Every word must be spelled correctly.`,
      },
    ]);
  } catch (apiError: any) {
    console.error("runTextAnalysis: Gemini API call failed", {
      error: apiError.message,
      stack: apiError.stack,
      status: apiError.status,
      statusText: apiError.statusText,
      errorDetails: apiError.errorDetails,
    });
    throw new functions.https.HttpsError(
      "internal",
      `Text analysis API call failed: ${apiError.message}`
    );
  }

  console.log("runTextAnalysis: got response", {
    candidateCount: response.response.candidates?.length ?? 0,
    finishReason: response.response.candidates?.[0]?.finishReason,
    promptFeedback: response.response.promptFeedback,
  });

  const text = response.response.text();
  if (!text) {
    console.error("runTextAnalysis: empty text response", {
      candidates: JSON.stringify(response.response.candidates),
      promptFeedback: JSON.stringify(response.response.promptFeedback),
    });
    throw new functions.https.HttpsError("internal", "No text response from AI");
  }

  console.log("runTextAnalysis: raw text response:", text);

  try {
    const result = JSON.parse(text);

    // Validate all 5 fields present and non-empty
    const required = ["headline", "subHeadline", "highlightTarget", "tooltipText", "marketingCopy"];
    for (const field of required) {
      if (typeof result[field] !== "string" || !result[field].trim()) {
        throw new Error(`Missing or empty field: ${field}`);
      }
    }

    return result as TextAnalysisResult;
  } catch (parseError: any) {
    console.error("runTextAnalysis: failed to parse response", {
      rawText: text,
      error: parseError.message,
    });
    throw new functions.https.HttpsError(
      "internal",
      "Failed to parse analysis response from AI"
    );
  }
}

/**
 * Step 2: Gemini generates a single visual variation.
 * Returns a base64 data URL of the generated image, or null on failure.
 */
async function runGeminiGeneration(
  genAI: GoogleGenerativeAI,
  base64Data: string,
  mediaType: string,
  imagePrompt: string,
  variationIndex: number,
  aspectRatio?: string,
  imageSize?: string,
  scenic?: boolean,
  templateId?: string,
  safeZone?: string,
): Promise<string | null> {
  console.log(`runGeminiGeneration[${variationIndex}]: starting`, {
    mediaType,
    imageSize: base64Data.length,
    promptLength: imagePrompt.length,
  });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-image-preview",
      generationConfig: {
        // @ts-expect-error — responseModalities/imageConfig/thinkingConfig not yet in SDK types
        responseModalities: ["image", "text"],
        thinkingConfig: {
          thinkingLevel: "high",
        },
        ...(aspectRatio || imageSize ? {
          imageConfig: {
            ...(aspectRatio && { aspectRatio }),
            ...(imageSize && { imageSize }),
          },
        } : {}),
      },
    });

    const isLifestyle = templateId ? LIFESTYLE_TEMPLATE_IDS.has(templateId) : false;
    let directives: string[];
    if (isLifestyle) {
      directives = scenic ? LIFESTYLE_SCENIC_DIRECTIVES : LIFESTYLE_VARIATION_DIRECTIVES;
    } else {
      directives = scenic ? SCENIC_VARIATION_DIRECTIVES : VARIATION_DIRECTIVES;
    }
    const layoutDirective = directives[variationIndex] || directives[0];

    const closingInstruction = scenic
      ? "Generate the visual as an image. The product shown in the screenshot above should be clearly recognizable in the final image. Do NOT include any text whatsoever."
      : isLifestyle
        ? "Generate the lifestyle product visual as an image. The product shown in the screenshot above must be clearly recognizable in the final image. AI-generated people are fictional. Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image."
        : "Generate the marketing visual as an image. The screenshot provided above should be incorporated into the final visual. Ensure there is no gibberish text, extra floating letters, or misspelled words anywhere in the image.";

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: base64Data,
        },
      },
      {
        text: `${safeZone || buildSafeZone()}\n\n${layoutDirective}\n\n${imagePrompt}\n\n${closingInstruction}`,
      },
    ]);

    const response = result.response;
    const candidates = response.candidates;

    console.log(`runGeminiGeneration[${variationIndex}]: response received`, {
      candidateCount: candidates?.length ?? 0,
      finishReason: candidates?.[0]?.finishReason,
      safetyRatings: JSON.stringify(candidates?.[0]?.safetyRatings),
      promptFeedback: JSON.stringify(response.promptFeedback),
    });

    if (!candidates || candidates.length === 0) {
      console.error(`runGeminiGeneration[${variationIndex}]: No candidates returned`, {
        promptFeedback: JSON.stringify(response.promptFeedback),
        fullResponse: JSON.stringify(response),
      });
      return null;
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      console.error(`runGeminiGeneration[${variationIndex}]: No parts in candidate`, {
        candidate: JSON.stringify(candidates[0]),
      });
      return null;
    }

    console.log(`runGeminiGeneration[${variationIndex}]: parts found`, {
      partCount: parts.length,
      partTypes: parts.map((p: any) => {
        if (p.inlineData) return `inlineData(${p.inlineData.mimeType}, ${(p.inlineData.data?.length ?? 0)} bytes)`;
        if (p.text) return `text(${p.text.length} chars)`;
        return `unknown(${Object.keys(p).join(",")})`;
      }),
    });

    // Find the image part in the response
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
        const imgMime = part.inlineData.mimeType;
        const imgData = part.inlineData.data;
        console.log(`runGeminiGeneration[${variationIndex}]: image found`, {
          mimeType: imgMime,
          dataSize: imgData?.length ?? 0,
        });
        return `data:${imgMime};base64,${imgData}`;
      }
    }

    // Log text parts if no image found
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
    console.error(`runGeminiGeneration[${variationIndex}]: No image in response`, {
      textParts,
      finishReason: candidates[0].finishReason,
    });
    return null;
  } catch (error: any) {
    console.error(`runGeminiGeneration[${variationIndex}]: exception`, {
      message: error.message,
      stack: error.stack,
      status: error.status,
      statusText: error.statusText,
      errorDetails: error.errorDetails,
    });
    return null;
  }
}

/**
 * Main generate handler: two-step pipeline.
 * Step 1: Gemini text analysis + copywriting
 * Step 2: Gemini image generation × 2 (parallel)
 */
export async function handleGenerateRequest(
  body: GenerateBody,
  user: admin.auth.DecodedIdToken
): Promise<GenerateResult> {
  const { imageDataUrl, description, templateId, aspectRatio, imageSize, annotatedImageDataUrl, includeText, targetWidth, targetHeight } = body;

  if (!imageDataUrl || !templateId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "imageDataUrl and templateId are required"
    );
  }

  // Validate aspectRatio / imageSize if provided
  const VALID_ASPECT_RATIOS = ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
  const VALID_IMAGE_SIZES = ["1K", "2K", "4K"];

  if (aspectRatio && !VALID_ASPECT_RATIOS.includes(aspectRatio)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid aspectRatio: ${aspectRatio}`
    );
  }
  if (imageSize && !VALID_IMAGE_SIZES.includes(imageSize)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid imageSize: ${imageSize}`
    );
  }

  // Validate template
  const template = getTemplate(templateId);
  if (!template) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Unknown template: ${templateId}`
    );
  }

  const { mediaType, base64Data } = parseDataUrl(imageDataUrl);

  // If user drew highlights, parse the annotated image for text analysis
  let analysisMediaType = mediaType;
  let analysisBase64Data = base64Data;
  if (annotatedImageDataUrl) {
    const annotated = parseDataUrl(annotatedImageDataUrl);
    analysisMediaType = annotated.mediaType;
    analysisBase64Data = annotated.base64Data;
    console.log("Generate: using annotated image for text analysis");
  }

  const db = admin.firestore();

  // Ensure credits are initialized
  await initCredits(db, user.uid);

  // Atomically deduct 1 credit
  await useCredit(db, user.uid);

  // Init Gemini client (shared by both steps)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API is not configured"
    );
  }
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  // Scenic mode: skip text analysis when description is empty or includeText is false
  const scenic = !description || !description.trim() || includeText === false;
  let analysisResult: TextAnalysisResult | null = null;
  let imagePrompt: string;

  if (scenic) {
    console.log(`Generate: scenic mode for user ${user.uid}, template ${templateId} — skipping text analysis`);
    imagePrompt = buildScenicImagePrompt(template);
  } else {
    // --- Step 1: Text Analysis ---
    console.log(`Generate: Step 1 — text analysis for user ${user.uid}, template ${templateId}`);
    analysisResult = await runTextAnalysis(
      genAI,
      analysisBase64Data,
      analysisMediaType,
      description,
      template.analysisPrompt,
      !!annotatedImageDataUrl,
    );
    console.log("Analysis result:", JSON.stringify(analysisResult));
    imagePrompt = buildImagePrompt(template, analysisResult);
  }

  console.log(`Generate: Step 2 — Gemini rendering × 2`);

  const safeZone = buildSafeZone(aspectRatio, targetWidth, targetHeight);

  // Run 2 generations in parallel
  const variationPromises = [0, 1].map((i) =>
    runGeminiGeneration(genAI, base64Data, mediaType, imagePrompt, i, aspectRatio, imageSize, scenic, templateId, safeZone)
  );

  const variationResults = await Promise.all(variationPromises);

  // Filter out failures
  let variations = variationResults.filter((v): v is string => v !== null);

  if (variations.length === 0) {
    console.error("Generate: All 2 image generation attempts failed", {
      userId: user.uid,
      templateId,
      analysisResult: JSON.stringify(analysisResult),
    });
    throw new functions.https.HttpsError(
      "internal",
      "All image generation attempts failed. Please try again."
    );
  }

  if (variations.length < 2) {
    console.warn(`Generate: Only ${variations.length}/2 Gemini variations succeeded`);
  }

  // Step 3: Auto-OCR + retry for text quality (skip for scenic mode)
  if (!scenic && analysisResult) {
    console.log("Generate: Step 3 — Auto-OCR text validation");
    variations = await autoOcrAndRetry(
      genAI, variations, analysisResult, base64Data, mediaType, imagePrompt, aspectRatio, imageSize, templateId, safeZone
    );
  }

  console.log(`Generate: complete — ${variations.length} variations produced`);

  return {
    text: analysisResult,
    variations,
  };
}

/**
 * Auto-OCR each variation and retry any with misspelled text.
 * Uses correction prompt (not synonym swap) to preserve intended text.
 */
async function autoOcrAndRetry(
  genAI: GoogleGenerativeAI,
  variations: string[],
  textAnalysis: TextAnalysisResult,
  base64Data: string,
  mediaType: string,
  imagePrompt: string,
  aspectRatio?: string,
  imageSize?: string,
  templateId?: string,
  safeZone?: string,
): Promise<string[]> {
  // OCR all variations in parallel
  const ocrPromises = variations.map((v, i) => {
    console.log(`Auto-OCR[${i}]: starting`);
    return visionCheckText(genAI, v);
  });
  const ocrResults = await Promise.all(ocrPromises);

  // Check each for misspellings and retry bad ones
  const retryPromises: (Promise<string | null> | null)[] = variations.map(() => null);

  for (let i = 0; i < variations.length; i++) {
    const ocrText = ocrResults[i];
    if (!ocrText) {
      console.warn(`Auto-OCR[${i}]: OCR failed, keeping original`);
      continue;
    }

    const misspelled = compareTextAccuracy(ocrText, textAnalysis);
    if (misspelled.length === 0) {
      console.log(`Auto-OCR[${i}]: text accurate, no retry needed`);
      continue;
    }

    console.log(`Auto-OCR[${i}]: found ${misspelled.length} misspelled words: [${misspelled.join(", ")}], retrying`);

    // Build correction prompt: same image prompt + explicit spelling corrections
    const correctionSuffix = `\n\nSPELLING CORRECTION — A previous attempt misspelled these words. Ensure EXACT correct spelling:\n${misspelled.map((w) => `- "${w}" must be spelled exactly as shown`).join("\n")}`;
    const correctedPrompt = imagePrompt + correctionSuffix;

    retryPromises[i] = runGeminiGeneration(
      genAI, base64Data, mediaType, correctedPrompt, i, aspectRatio, imageSize, false, templateId, safeZone
    );
  }

  // Await retries and replace variations that got better results
  for (let i = 0; i < variations.length; i++) {
    if (retryPromises[i]) {
      const retryResult = await retryPromises[i];
      if (retryResult) {
        console.log(`Auto-OCR[${i}]: retry succeeded, replacing variation`);
        variations[i] = retryResult;
      } else {
        console.warn(`Auto-OCR[${i}]: retry failed, keeping original`);
      }
    }
  }

  return variations;
}

// ---- AI Extend (outpaint) ----

interface ExtendBody {
  imageDataUrl: string;
  aspectRatio: string;
  imageSize: string;
  targetWidth: number;
  targetHeight: number;
}

interface ExtendResult {
  variation: string; // single base64 data URL
}

/**
 * AI Extend: outpaint an image to fill a different aspect ratio.
 * Uses Gemini image generation to naturally extend the canvas.
 */
export async function handleExtendRequest(
  body: ExtendBody,
  user: admin.auth.DecodedIdToken
): Promise<ExtendResult> {
  const { imageDataUrl, aspectRatio, imageSize, targetWidth, targetHeight } = body;

  if (!imageDataUrl || !aspectRatio || !targetWidth || !targetHeight) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "imageDataUrl, aspectRatio, targetWidth, and targetHeight are required"
    );
  }

  const VALID_ASPECT_RATIOS = ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
  const VALID_IMAGE_SIZES = ["1K", "2K", "4K"];

  if (!VALID_ASPECT_RATIOS.includes(aspectRatio)) {
    throw new functions.https.HttpsError("invalid-argument", `Invalid aspectRatio: ${aspectRatio}`);
  }
  if (imageSize && !VALID_IMAGE_SIZES.includes(imageSize)) {
    throw new functions.https.HttpsError("invalid-argument", `Invalid imageSize: ${imageSize}`);
  }

  const db = admin.firestore();
  await initCredits(db, user.uid);
  await useCredit(db, user.uid);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new functions.https.HttpsError("failed-precondition", "Gemini API is not configured");
  }
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  const { mediaType, base64Data } = parseDataUrl(imageDataUrl);

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-image-preview",
    generationConfig: {
      // @ts-expect-error — responseModalities/imageConfig/thinkingConfig not yet in SDK types
      responseModalities: ["image", "text"],
      thinkingConfig: { thinkingLevel: "high" },
      imageConfig: {
        aspectRatio,
        ...(imageSize && { imageSize }),
      },
    },
  });

  const prompt = `TASK: Extend this image to fill a ${aspectRatio} canvas (${targetWidth}x${targetHeight} pixels).

CRITICAL RULES:
- Preserve the ENTIRE original image content exactly as-is — do not crop, alter, distort, or reinterpret any part of it.
- Fill the extended areas with a natural, seamless continuation of the scene (background, colors, textures, patterns).
- The transition between original content and extended areas must be invisible — no seams, edges, or color shifts.
- Do NOT add any new text, logos, watermarks, or objects that weren't in the original.
- Do NOT apply filters, color grading, or style changes to the original content.
- The result should look like the image was originally captured at this wider/taller framing.

Generate the extended image now.`;

  const result = await model.generateContent([
    { inlineData: { mimeType: mediaType, data: base64Data } },
    { text: prompt },
  ]);

  const candidates = result.response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new functions.https.HttpsError("internal", "AI Extend failed — no response. Please try again.");
  }

  const parts = candidates[0].content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
        const imgDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log(`AI Extend: success for user ${user.uid}, ${aspectRatio} ${targetWidth}x${targetHeight}`);
        return { variation: imgDataUrl };
      }
    }
  }

  throw new functions.https.HttpsError("internal", "AI Extend produced no image. Please try again.");
}

// ---- Regen Feature ----

interface RegenBody {
  variationImageDataUrl: string;          // generated image to OCR
  sourceImageDataUrl: string;             // original user screenshot
  textAnalysis: TextAnalysisResult | null; // null for scenic mode
  templateId: string;
  variationIndex: number;                 // 0 or 1
  aspectRatio?: string;
  imageSize?: string;
  chargeCredit: boolean;
}

interface RegenResult {
  variation: string;                      // base64 data URL
  text: TextAnalysisResult | null;        // null for scenic mode
  textCorrected: boolean;
}

/**
 * Simple Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * OCR: send generated image to Gemini and extract all visible text.
 */
async function visionCheckText(
  genAI: GoogleGenerativeAI,
  imageDataUrl: string
): Promise<string | null> {
  try {
    const { mediaType, base64Data } = parseDataUrl(imageDataUrl);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      { inlineData: { mimeType: mediaType, data: base64Data } },
      { text: "Extract ALL visible text from this image. Return only the raw text, line by line." },
    ]);
    return result.response.text() || null;
  } catch (err: any) {
    console.error("visionCheckText: failed", err.message);
    return null;
  }
}

/**
 * Compare OCR text against intended text to find misspellings.
 * Returns deduplicated array of misspelled words.
 */
function compareTextAccuracy(
  ocrText: string,
  textAnalysis: TextAnalysisResult
): string[] {
  // Build intended word set from headline, subHeadline, tooltipText
  const intendedRaw = [
    textAnalysis.headline,
    textAnalysis.subHeadline,
    textAnalysis.tooltipText,
  ].join(" ");

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);

  const intendedWords = normalize(intendedRaw).filter((w) => w.length > 2);
  const ocrWords = normalize(ocrText).filter((w) => w.length > 2);

  const misspelled = new Set<string>();

  for (const ocrWord of ocrWords) {
    // Find closest intended word
    let bestDist = Infinity;
    let bestMatch = "";
    for (const intended of intendedWords) {
      const dist = levenshtein(ocrWord, intended);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = intended;
      }
    }
    // Distance 1-2 with intended word >3 chars → likely misspelling
    if (bestDist >= 1 && bestDist <= 2 && bestMatch.length > 3) {
      misspelled.add(bestMatch);
    }
  }

  return [...misspelled];
}

/**
 * Handle a regen request: OCR-check the variation, swap misspelled words
 * with synonyms, and regenerate a single image.
 */
export async function handleRegenRequest(
  body: RegenBody,
  user: admin.auth.DecodedIdToken
): Promise<RegenResult> {
  const {
    variationImageDataUrl,
    sourceImageDataUrl,
    textAnalysis,
    templateId,
    variationIndex,
    aspectRatio,
    imageSize,
    chargeCredit,
  } = body;

  if (!variationImageDataUrl || !sourceImageDataUrl || !templateId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "variationImageDataUrl, sourceImageDataUrl, and templateId are required"
    );
  }

  if (variationIndex < 0 || variationIndex > 2) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "variationIndex must be 0, 1, or 2"
    );
  }

  const template = getTemplate(templateId);
  if (!template) {
    throw new functions.https.HttpsError("invalid-argument", `Unknown template: ${templateId}`);
  }

  const db = admin.firestore();

  // Deduct credit if this is a paid regen
  if (chargeCredit) {
    await useCredit(db, user.uid);
  }

  // Init Gemini
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new functions.https.HttpsError("failed-precondition", "Gemini API is not configured");
  }
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  // Scenic mode: skip OCR/synonym pipeline when textAnalysis is null
  const scenic = !textAnalysis;
  let currentText: TextAnalysisResult | null = textAnalysis;
  let textCorrected = false;

  const { mediaType, base64Data } = parseDataUrl(sourceImageDataUrl);
  let imagePrompt: string;

  if (scenic) {
    console.log("Regen: scenic mode — skipping OCR pipeline");
    imagePrompt = buildScenicImagePrompt(template);
  } else {
    // Step 1: OCR the generated variation
    const ocrText = await visionCheckText(genAI, variationImageDataUrl);
    imagePrompt = buildImagePrompt(template, textAnalysis);

    if (ocrText) {
      // Step 2: Compare for misspellings
      const misspelled = compareTextAccuracy(ocrText, textAnalysis);
      console.log(`Regen: found ${misspelled.length} misspelled words`, misspelled);

      if (misspelled.length > 0) {
        // Step 3: Add correction prompt instead of synonym swap (preserves intended text)
        const correctionSuffix = `\n\nSPELLING CORRECTION — A previous attempt misspelled these words. Ensure EXACT correct spelling:\n${misspelled.map((w) => `- "${w}" must be spelled exactly as shown`).join("\n")}`;
        imagePrompt = imagePrompt + correctionSuffix;
        textCorrected = true;
        console.log("Regen: added spelling correction prompt for:", misspelled);
      }
    } else {
      console.warn("Regen: OCR failed, regenerating with original text");
    }

    currentText = textAnalysis;
  }

  const regenSafeZone = buildSafeZone(aspectRatio, undefined, undefined);
  const variation = await runGeminiGeneration(
    genAI, base64Data, mediaType, imagePrompt, variationIndex, aspectRatio, imageSize, scenic, templateId, regenSafeZone
  );

  if (!variation) {
    throw new functions.https.HttpsError("internal", "Image regeneration failed. Please try again.");
  }

  console.log(`Regen: complete — textCorrected=${textCorrected}`);

  return {
    variation,
    text: currentText,
    textCorrected,
  };
}
