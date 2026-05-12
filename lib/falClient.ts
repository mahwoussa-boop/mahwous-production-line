// ============================================================
// lib/falClient.ts
// Fal.ai FLUX-LoRA Image Generation Client
//
// ARCHITECTURE:
// ┌──────────────────────────────────────────────────────────┐
// │  buildPrompt()  ← trigger_word injected FIRST            │
// │       ↓                                                  │
// │  submitToQueue()  → fal.ai queue endpoint                │
// │       ↓                                                  │
// │  pollUntilDone()  → polls every 2s, max 110s             │
// │       ↓                                                  │
// │  3x parallel calls (story / post / landscape)            │
// └──────────────────────────────────────────────────────────┘
//
// FAL.AI FLUX-LoRA INPUT CONTRACT:
//   prompt          - string (trigger_word MUST be first)
//   loras           - [{ path: <URL to .safetensors>, scale: 0.85 }]
//   image_size      - { width, height } or preset string
//   num_inference_steps - 28
//   guidance_scale  - 3.5
//   image_url       - bottle reference for img2img (optional)
//   strength        - img2img blend strength (optional)
//   num_images      - 1
//   enable_safety_checker - true
// ============================================================

import { buildPrompt, buildNegativePrompt } from './promptEngine';
import type { GenerationRequest, GeneratedImage } from './types';

const FAL_BASE = 'https://queue.fal.run';
const FAL_MODEL = 'fal-ai/flux-lora';
const FAL_MODEL_IMG2IMG = 'fal-ai/flux-lora/image-to-image';

// ─── Aspect ratio configurations ─────────────────────────────────────────────
interface AspectConfig {
  format: 'story' | 'post' | 'landscape';
  label: string;
  aspectRatio: string;
  // fal.ai accepts { width, height } objects for custom sizes
  imageSize: { width: number; height: number };
  dimensions: { width: number; height: number };
}

const ASPECT_CONFIGS: AspectConfig[] = [
  {
    format: 'story',
    label: 'Instagram Story (9:16)',
    aspectRatio: '9:16',
    imageSize: { width: 1080, height: 1920 },
    dimensions: { width: 1080, height: 1920 },
  },
  {
    format: 'post',
    label: 'Post Square (1:1)',
    aspectRatio: '1:1',
    imageSize: { width: 1080, height: 1080 },
    dimensions: { width: 1080, height: 1080 },
  },
  {
    format: 'landscape',
    label: 'Twitter / LinkedIn (16:9)',
    aspectRatio: '16:9',
    imageSize: { width: 1280, height: 720 },
    dimensions: { width: 1280, height: 720 },
  },
];

// ─── Auth header ──────────────────────────────────────────────────────────────
function getAuthHeader(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY is not set in environment variables.');
  return `Key ${key}`;
}

// ─── Step 1: Submit to fal.ai queue ──────────────────────────────────────────
// fal.ai's queue API returns status_url and response_url in the submit response.
// We MUST use those URLs — sub-path models like `flux-lora/image-to-image` route
// status/result via the parent model path (`flux-lora`), so constructing the
// result URL from the sub-path yields HTTP 422.
async function submitToQueue(
  input: Record<string, unknown>,
  useImg2Img = false,
): Promise<{ statusUrl: string; responseUrl: string }> {
  const model = useImg2Img ? FAL_MODEL_IMG2IMG : FAL_MODEL;
  const res = await fetch(`${FAL_BASE}/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`fal.ai submit error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const requestId = data?.request_id as string | undefined;
  if (!requestId) throw new Error('fal.ai did not return a request_id');

  // Prefer URLs returned by fal.ai. Fallback strips the sub-path so flux-lora/image-to-image
  // status/result requests go to the parent flux-lora path.
  const baseModel = model.split('/').slice(0, 2).join('/');
  const statusUrl =
    (data?.status_url as string | undefined) ??
    `${FAL_BASE}/${baseModel}/requests/${requestId}/status`;
  const responseUrl =
    (data?.response_url as string | undefined) ??
    `${FAL_BASE}/${baseModel}/requests/${requestId}`;

  return { statusUrl, responseUrl };
}

// ─── Step 2: Poll until done ──────────────────────────────────────────
async function pollUntilDone(
  statusUrl: string,
  responseUrl: string,
  timeoutMs = 110_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: getAuthHeader() },
    });

    if (!statusRes.ok) continue;

    const status = await statusRes.json();
    const queueStatus: string = status?.status ?? '';

    if (queueStatus === 'COMPLETED') {
      // Fetch the actual result
      const resultRes = await fetch(responseUrl, {
        headers: { Authorization: getAuthHeader() },
      });
      if (!resultRes.ok) {
        const errText = await resultRes.text().catch(() => '');
        throw new Error(`fal.ai result fetch error ${resultRes.status}: ${errText}`);
      }
      const result = await resultRes.json();

      // fal.ai returns images as [{ url, content_type, ... }]
      const imageUrl: string | undefined =
        result?.images?.[0]?.url ?? result?.image?.url;

      if (!imageUrl) throw new Error('fal.ai returned no image URL in result');
      return imageUrl;
    }

    if (queueStatus === 'FAILED') {
      const reason = status?.error ?? 'Unknown fal.ai error';
      throw new Error(`fal.ai generation failed: ${reason}`);
    }

    // IN_QUEUE or IN_PROGRESS — keep polling
  }

  throw new Error('fal.ai generation timed out after 110 seconds');
}

// ─── Generate a single aspect ratio ──────────────────────────────────────────
async function generateSingleFormat(
  request: GenerationRequest,
  prompt: string,
  ac: AspectConfig,
): Promise<GeneratedImage> {
  const { loraPath, bottleImageBase64 } = request;

  const input: Record<string, unknown> = {
    prompt,
    image_size: ac.imageSize,
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'jpeg',
  };

  // ── Attach LoRA weights (face consistency) ──────────────────────────────────
  if (loraPath?.trim()) {
    input.loras = [{ path: loraPath.trim(), scale: 1.0 }];
  }

  // ── Attach bottle reference (img2img — product fidelity) ────────────────────
  // Use img2img model when bottle image is available for accurate product representation
  const hasBottleImage = Boolean(bottleImageBase64?.startsWith('data:image/'));
  if (hasBottleImage) {
    input.image_url = bottleImageBase64;
    input.strength = 0.35; // Low strength: keep character but guide bottle shape
  }

  const { statusUrl, responseUrl } = await submitToQueue(input, hasBottleImage);
  const imageUrl = await pollUntilDone(statusUrl, responseUrl, 110_000);

  return {
    format: ac.format,
    label: ac.label,
    aspectRatio: ac.aspectRatio,
    url: imageUrl,
    dimensions: ac.dimensions,
  };
}

// ─── Main export: generate all 3 formats in parallel ─────────────────────────
export async function generateImages(request: GenerationRequest): Promise<{
  images: GeneratedImage[];
  prompt: string;
  negativePrompt: string;
}> {
  const prompt = buildPrompt(request);
  const negativePrompt = buildNegativePrompt();

  // Fire all 3 formats simultaneously
  const images = await Promise.all(
    ASPECT_CONFIGS.map((ac) => generateSingleFormat(request, prompt, ac)),
  );

  return { images, prompt, negativePrompt };
}
