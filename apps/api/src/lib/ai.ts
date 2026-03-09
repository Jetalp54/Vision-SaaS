import type { Bindings } from '../types';
import { AppError } from '../middleware/error-handler';
import { ErrorCode } from '@vision-saas/types';

// ─── Model Constants ──────────────────────────────────────────────────────────

export const MODELS = {
  LLAVA: '@cf/llava-hf/llava-1.5-7b-hf',
  OCR: '@cf/microsoft/resnet-50', // fallback; use LLaVA for OCR too
} as const;

// ─── AI Gateway URL Builder ───────────────────────────────────────────────────
// Routes all AI requests through AI Gateway for logging, cost tracking,
// and model fallback. See: https://developers.cloudflare.com/ai-gateway/

export function buildAiGatewayUrl(env: Bindings, model: string): string {
  return `https://gateway.ai.cloudflare.com/v1/${env.AI_GATEWAY_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/workers-ai/${model}`;
}

// ─── Image-to-Prompt (LLaVA) ─────────────────────────────────────────────────

export interface ImageToPromptOptions {
  imageBytes: Uint8Array;
  mimeType: string;
  maxTokens?: number;
}

export interface AITextResult {
  text: string;
  model: string;
  tokensUsed: number | null;
}

export async function imageToPrompt(
  env: Bindings,
  opts: ImageToPromptOptions,
): Promise<AITextResult> {
  const { imageBytes, maxTokens = 512 } = opts;

  const prompt =
    'Describe this image in rich, detailed natural language suitable for use as a generative AI prompt. ' +
    'Include: subject matter, composition, lighting, color palette, mood, style, and any notable details. ' +
    'Output only the prompt text, no preamble.';

  try {
    const response = await env.AI.run(MODELS.LLAVA, {
      image: [...imageBytes],
      prompt,
      max_tokens: maxTokens,
    });

    const text =
      typeof response === 'object' && response !== null && 'description' in response
        ? String((response as { description: string }).description)
        : JSON.stringify(response);

    return {
      text,
      model: MODELS.LLAVA,
      tokensUsed: null, // CF AI doesn't always expose token counts
    };
  } catch (err) {
    console.error('[ai:imageToPrompt]', err);
    throw new AppError(
      ErrorCode.AI_PROCESSING_FAILED,
      502,
      'AI Processing Failed',
      'The AI model failed to process the image. Please try again.',
    );
  }
}

// ─── Image-to-Text / OCR (LLaVA with OCR prompt) ────────────────────────────

export interface ImageToTextOptions {
  imageBytes: Uint8Array;
  mimeType: string;
  language?: string;
  outputFormat?: 'markdown' | 'plain' | 'json';
  maxTokens?: number;
}

export async function imageToText(
  env: Bindings,
  opts: ImageToTextOptions,
): Promise<AITextResult> {
  const { imageBytes, language = 'en', outputFormat = 'plain', maxTokens = 1024 } = opts;

  const formatInstructions: Record<string, string> = {
    markdown: 'Format the output as clean Markdown, preserving headings and structure.',
    plain: 'Output plain text only, preserving line breaks and paragraph structure.',
    json: 'Output a JSON object with keys: "text" (full extracted text) and "blocks" (array of {type, content}).',
  };

  const prompt =
    `Extract all text visible in this image. The primary language is ${language}. ` +
    (formatInstructions[outputFormat] ?? formatInstructions['plain']) +
    ' Do not add any commentary — output only the extracted text.';

  try {
    const response = await env.AI.run(MODELS.LLAVA, {
      image: [...imageBytes],
      prompt,
      max_tokens: maxTokens,
    });

    const text =
      typeof response === 'object' && response !== null && 'description' in response
        ? String((response as { description: string }).description)
        : JSON.stringify(response);

    return {
      text,
      model: MODELS.LLAVA,
      tokensUsed: null,
    };
  } catch (err) {
    console.error('[ai:imageToText]', err);
    throw new AppError(
      ErrorCode.AI_PROCESSING_FAILED,
      502,
      'AI Processing Failed',
      'The AI model failed to extract text from the image. Please try again.',
    );
  }
}
