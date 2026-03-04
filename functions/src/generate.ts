import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useCredit, initCredits } from "./credits";
import { getTemplate, buildImagePrompt } from "./templates";

interface GenerateBody {
  imageDataUrl: string;
  description: string;
  templateId: string;
}

interface TextAnalysisResult {
  headline: string;
  subHeadline: string;
  highlightTarget: string;
  tooltipText: string;
  marketingCopy: string;
}

interface GenerateResult {
  text: TextAnalysisResult;
  variations: string[]; // base64 data URLs of generated images
}

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
  analysisPrompt: string
): Promise<TextAnalysisResult> {
  console.log("runTextAnalysis: starting", {
    mediaType,
    imageSize: base64Data.length,
    descriptionLength: description.length,
    promptLength: analysisPrompt.length,
  });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: analysisPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          headline: { type: SchemaType.STRING },
          subHeadline: { type: SchemaType.STRING },
          highlightTarget: { type: SchemaType.STRING },
          tooltipText: { type: SchemaType.STRING },
          marketingCopy: { type: SchemaType.STRING },
        },
        required: ["headline", "subHeadline", "highlightTarget", "tooltipText", "marketingCopy"],
      },
    },
  });

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
        text: `${description}\n\nIMPORTANT: Double-check all spelling. Every word must be spelled correctly.`,
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
  variationIndex: number
): Promise<string | null> {
  console.log(`runGeminiGeneration[${variationIndex}]: starting`, {
    mediaType,
    imageSize: base64Data.length,
    promptLength: imagePrompt.length,
  });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: {
        // @ts-expect-error — responseModalities is supported in Gemini 2.0 but not yet in SDK types
        responseModalities: ["image", "text"],
      },
    });

    const variationHint =
      variationIndex === 0
        ? "Create the primary, most polished version."
        : variationIndex === 1
        ? "Create an alternative version with a slightly different layout or color emphasis."
        : "Create a third variation with a different compositional approach.";

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: base64Data,
        },
      },
      {
        text: `${imagePrompt}\n\nVARIATION INSTRUCTION: ${variationHint}\n\nGenerate the marketing visual as an image. The screenshot provided above should be incorporated into the final visual.`,
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
 * Step 2: Gemini image generation × 3 (parallel)
 */
export async function handleGenerateRequest(
  body: GenerateBody,
  user: admin.auth.DecodedIdToken
): Promise<GenerateResult> {
  const { imageDataUrl, description, templateId } = body;

  if (!imageDataUrl || !description || !templateId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "imageDataUrl, description, and templateId are required"
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

  // --- Step 1: Text Analysis ---
  console.log(`Generate: Step 1 — text analysis for user ${user.uid}, template ${templateId}`);
  const analysisResult = await runTextAnalysis(
    genAI,
    base64Data,
    mediaType,
    description,
    template.analysisPrompt
  );

  console.log("Analysis result:", JSON.stringify(analysisResult));

  // --- Step 2: Gemini Image Generation × 3 ---
  const imagePrompt = buildImagePrompt(template, analysisResult);

  console.log(`Generate: Step 2 — Gemini rendering × 3`);

  // Run 3 generations in parallel
  const variationPromises = [0, 1, 2].map((i) =>
    runGeminiGeneration(genAI, base64Data, mediaType, imagePrompt, i)
  );

  const variationResults = await Promise.all(variationPromises);

  // Filter out failures
  const variations = variationResults.filter((v): v is string => v !== null);

  if (variations.length === 0) {
    console.error("Generate: All 3 image generation attempts failed", {
      userId: user.uid,
      templateId,
      analysisResult: JSON.stringify(analysisResult),
    });
    throw new functions.https.HttpsError(
      "internal",
      "All image generation attempts failed. Please try again."
    );
  }

  if (variations.length < 3) {
    console.warn(`Generate: Only ${variations.length}/3 Gemini variations succeeded`);
  }

  console.log(`Generate: complete — ${variations.length} variations produced`);

  return {
    text: analysisResult,
    variations,
  };
}
