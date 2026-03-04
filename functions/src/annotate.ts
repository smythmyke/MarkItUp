import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useCredit, initCredits } from "./credits";

const SYSTEM_PROMPT = `You are an image annotation assistant for MarkItUp, a Chrome extension that adds visual annotations to images.

Given an image and user instructions, generate a JSON array of annotations to place on the image.

Each annotation must have:
- "id": a unique string (use format "ai-1", "ai-2", etc.)
- "type": one of "box", "arrow", or "highlight"
- "x": x coordinate (pixels from left edge of image)
- "y": y coordinate (pixels from top edge of image)
- "label": short text label for the callout

For "box" annotations, also include:
- "width": box width in pixels
- "height": box height in pixels

For "arrow" annotations, also include:
- "toX": x coordinate of arrow endpoint
- "toY": y coordinate of arrow endpoint

For "highlight" annotations, also include:
- "width": highlight width in pixels
- "height": highlight height in pixels

IMPORTANT:
- Coordinates must be relative to the actual image dimensions
- Place annotations precisely on the elements the user describes
- Use concise, descriptive labels (2-5 words)
- Choose the most appropriate annotation type for each element`;

interface AnnotateBody {
  imageDataUrl: string;
  context: string;
  existingAnnotations?: unknown[];
}

export async function handleAnnotateRequest(
  body: AnnotateBody,
  user: admin.auth.DecodedIdToken
): Promise<{ annotations: unknown[] }> {
  const { imageDataUrl, context, existingAnnotations } = body;

  if (!imageDataUrl || !context) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "imageDataUrl and context are required"
    );
  }

  const db = admin.firestore();

  // Ensure credits are initialized (grants free credits on first use)
  await initCredits(db, user.uid);

  // Atomically deduct 1 credit — throws 402 if insufficient
  await useCredit(db, user.uid);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API is not configured"
    );
  }

  // Extract base64 data and media type from data URL
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid image data URL format"
    );
  }
  const mediaType = match[1];
  const base64Data = match[2];

  // Build user prompt
  let userPrompt = context;
  if (existingAnnotations && existingAnnotations.length > 0) {
    userPrompt += `\n\nExisting annotations (add MORE, don't duplicate these):\n${JSON.stringify(existingAnnotations)}`;
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            type: { type: SchemaType.STRING },
            x: { type: SchemaType.NUMBER },
            y: { type: SchemaType.NUMBER },
            label: { type: SchemaType.STRING },
            width: { type: SchemaType.NUMBER },
            height: { type: SchemaType.NUMBER },
            toX: { type: SchemaType.NUMBER },
            toY: { type: SchemaType.NUMBER },
          },
          required: ["id", "type", "x", "y", "label"],
        },
      },
    },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType,
        data: base64Data,
      },
    },
    {
      text: userPrompt,
    },
  ]);

  const text = result.response.text();
  if (!text) {
    throw new functions.https.HttpsError("internal", "No text response from AI");
  }

  try {
    const annotations = JSON.parse(text);
    if (!Array.isArray(annotations)) {
      throw new Error("Response is not an array");
    }
    return { annotations };
  } catch (parseError) {
    console.error("Failed to parse annotation response:", text);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to parse annotation response from AI"
    );
  }
}
