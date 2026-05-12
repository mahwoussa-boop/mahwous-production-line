// ============================================================
// app/api/generate/route.ts
// Mahwous Perfume AI — Image Generation Pipeline v14
//
// STRATEGY (v14): Three-Stage Pipeline — SMART COMPOSITING
//
// Stage 1: FLUX LoRA (text-to-image)
//   → Generates MAHWOUS_MAN character holding a generic perfume bottle
//   → LoRA weights guarantee consistent face/body
//   → Natural holding pose with full hand grip
//
// Stage 2: SMART COMPOSITING (Sharp pixel-perfect overlay)
//   → Downloads the real product photo from mahwous.com
//   → Detects the bottle region in Stage 1 image
//   → Composites the real bottle pixel-perfectly into the hand
//   → 100% bottle accuracy — zero AI hallucination
//   → Used when productImageUrl is available (from scraper)
//
// Stage 3: FLUX Kontext LoRA (lighting fix)
//   → Takes the composited image from Stage 2
//   → Applies consistent lighting, shadows, and integration
//   → Makes the bottle look naturally placed in the scene
//
// FALLBACK: If Stage 2/3 fails, Stage 1 image is returned as-is
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { buildFluxPrompt, buildNegativePrompt } from '@/lib/promptEngine';
import type { GenerationRequest } from '@/lib/types';
import { retryWithBackoff, withCircuit, isTransientError } from '@/lib/engines/resilience';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ─── MAHWOUS_MAN LoRA weights ─────────────────────────────────────────────────
const MAHWOUS_LORA_URL =
  'https://v3b.fal.media/files/b/0a90eba7/OiQI7NS6N3neTl50fJHcC_pytorch_lora_weights.safetensors';
const MAHWOUS_TRIGGER = 'MAHWOUS_MAN';

/** Trim/BOM-safe — avoids silent empty auth when .env.local has stray whitespace */
function normalizeFalKey(): string {
  const v = process.env.FAL_KEY;
  if (v == null || v === '') return '';
  return v.replace(/^\uFEFF/, '').replace(/\\n/g, '').trim();
}
const FAL_KEY_ENV = () => normalizeFalKey();

function userFacingFalFailure(messages: string[]): string {
  const text = messages.filter(Boolean).join(' | ');
  if (/exhausted balance|User is locked/i.test(text)) {
    return 'رصيد حساب fal.ai منتهٍ والحساب موقوف مؤقتاً. أعد الشحن من https://fal.ai/dashboard/billing ثم أعد المحاولة.';
  }
  if (/401|Unauthorized|invalid api key|invalid.*credentials/i.test(text)) {
    return 'مفتاح FAL_KEY غير مقبول. أنشئ مفتاحاً من https://fal.ai/dashboard/keys وأعد تشغيل الخادم بعد تحديث .env.local.';
  }
  if (/fal\.ai submit error 403|403:/i.test(text) && /detail/i.test(text)) {
    return 'طلب fal.ai مرفوض (403). تحقق من صلاحيات المفتاح أو رصيد الفوترة في لوحة fal.ai.';
  }
  const first = messages.find((m) => m && m.trim().length > 0);
  if (first && first.length <= 500) {
    return `فشل توليد الصور: ${first}`;
  }
  return 'فشل توليد الصور. راجع تفاصيل الخطأ في استجابة الخادم (حقل details) أو سجلات الطرفية.';
}
const FAL_QUEUE_BASE = 'https://queue.fal.run';
const FAL_MODEL_T2I = 'fal-ai/flux-lora';
const FAL_MODEL_KONTEXT = 'fal-ai/flux-kontext-lora';

// ─── Aspect ratio configurations ─────────────────────────────────────────────
const ASPECT_CONFIGS = [
  {
    format: 'story' as const,
    label: 'Instagram Story (9:16)',
    dimensions: { width: 864, height: 1536 },
    imageSize: { width: 864, height: 1536 },
    aspectRatio: '9:16',
    aspectHint: 'VERTICAL PORTRAIT (9:16 tall format, taller than wide)',
  },
  {
    format: 'post' as const,
    label: 'Post Square (1:1)',
    dimensions: { width: 1072, height: 1072 },
    imageSize: { width: 1072, height: 1072 },
    aspectRatio: '1:1',
    aspectHint: 'SQUARE (1:1 equal width and height)',
  },
  {
    format: 'landscape' as const,
    label: 'Twitter / LinkedIn (16:9)',
    dimensions: { width: 1280, height: 720 },
    imageSize: { width: 1280, height: 720 },
    aspectRatio: '16:9',
    aspectHint: 'HORIZONTAL LANDSCAPE (16:9 wide format, wider than tall)',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Image Proxy Helper — converts any URL to Base64 data URI
// ═══════════════════════════════════════════════════════════════════════════════
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MahwousBot/1.0)',
        'Accept': 'image/webp,image/jpeg,image/png,image/*',
        'Referer': 'https://mahwous.com/',
      },
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    }
    const res2 = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*',
        'Referer': 'https://mahwous.com/',
        'Origin': 'https://mahwous.com',
      },
    });
    if (res2.ok) {
      const contentType = res2.headers.get('content-type') || 'image/jpeg';
      const buffer = await res2.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    }
    return null;
  } catch (err) {
    console.error('[proxy] fetchImageAsBase64 error:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAL Queue Helpers
// ═══════════════════════════════════════════════════════════════════════════════
async function falSubmit(model: string, input: Record<string, unknown>): Promise<string> {
  // محمي بـ retry+circuit للأخطاء العابرة (429/5xx/timeout)
  return withCircuit(`fal:${model}`, () =>
    retryWithBackoff(
      async () => {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 20_000);
        try {
          const res = await fetch(`${FAL_QUEUE_BASE}/${model}`, {
            method: 'POST',
            headers: {
              Authorization: `Key ${FAL_KEY_ENV()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const errText = await res.text();
            const err = new Error(`fal.ai submit error ${res.status}: ${errText}`);
            (err as Error & { status?: number }).status = res.status;
            throw err;
          }
          const data = await res.json();
          const requestId = data?.request_id as string | undefined;
          if (!requestId) throw new Error('fal.ai did not return a request_id');
          return requestId;
        } finally {
          clearTimeout(t);
        }
      },
      { maxAttempts: 3, baseDelayMs: 800, shouldRetry: isTransientError },
    ),
  );
}

async function falPoll(model: string, requestId: string, timeoutMs = 240000): Promise<Record<string, unknown>> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${FAL_QUEUE_BASE}/${model}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${FAL_KEY_ENV()}` },
    });
    if (!res.ok) continue;
    const status = await res.json();
    if (status?.status === 'COMPLETED') {
      const resultRes = await fetch(`${FAL_QUEUE_BASE}/${model}/requests/${requestId}`, {
        headers: { Authorization: `Key ${FAL_KEY_ENV()}` },
      });
      if (!resultRes.ok) throw new Error(`fal.ai result fetch error ${resultRes.status}`);
      return await resultRes.json();
    }
    if (status?.status === 'FAILED') {
      throw new Error(`fal.ai job failed: ${JSON.stringify(status)}`);
    }
  }
  throw new Error(`fal.ai job timed out after ${timeoutMs}ms`);
}

async function falRun(model: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const requestId = await falSubmit(model, input);
  return falPoll(model, requestId);
}

function extractImageUrl(result: Record<string, unknown>): string {
  const images = result?.images as Array<{ url: string }> | undefined;
  const url = images?.[0]?.url;
  if (!url) throw new Error('No image URL in fal.ai result');
  return url;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Stage 1: Generate character with FLUX LoRA
// ═══════════════════════════════════════════════════════════════════════════════
async function generateStage1(params: {
  body: GenerationRequest & { bottleDescription?: string; productImageUrl?: string };
  ac: typeof ASPECT_CONFIGS[0];
}): Promise<string> {
  const { body, ac } = params;
  const stage1Prompt = buildFluxPrompt({
    perfumeData: {
      name: body.perfumeData.name,
      brand: body.perfumeData.brand,
      notes: body.perfumeData.notes,
      description: body.perfumeData.description,
    },
    vibe: body.vibe,
    attire: body.attire,
    aspectHint: ac.aspectHint,
    loraTriggerWord: MAHWOUS_TRIGGER,
    bottleDescription: body.bottleDescription,
    hasBottleReference: !!body.productImageUrl,
  });

  const stage1Input: Record<string, unknown> = {
    prompt: stage1Prompt,
    negative_prompt: buildNegativePrompt(),
    loras: [{ path: MAHWOUS_LORA_URL, scale: 0.85 }],
    image_size: ac.imageSize,
    num_inference_steps: 35,
    guidance_scale: 7.5,
    num_images: 1,
    output_format: 'jpeg',
    enable_safety_checker: false,
  };

  console.log(`[stage-1] ${ac.format}: Generating character with FLUX LoRA...`);
  const result = await falRun(FAL_MODEL_T2I, stage1Input);
  return extractImageUrl(result);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Stage 2: Smart Compositing via /api/composite
// ═══════════════════════════════════════════════════════════════════════════════
async function generateStage2Composite(params: {
  stage1ImageUrl: string;
  productImageUrl: string;
  format: string;
}): Promise<string> {
  const { stage1ImageUrl, productImageUrl, format } = params;

  console.log(`[stage-2-composite] ${format}: Calling /api/composite...`);

  // Call our internal composite API
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const compositeRes = await fetch(`${baseUrl}/api/composite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      characterImageUrl: stage1ImageUrl,
      bottleImageUrl: productImageUrl,
    }),
  });

  if (!compositeRes.ok) {
    const errText = await compositeRes.text();
    throw new Error(`/api/composite error ${compositeRes.status}: ${errText}`);
  }

  const compositeData = await compositeRes.json();
  const compositeUrl = compositeData?.url as string | undefined;
  if (!compositeUrl) throw new Error('/api/composite did not return a URL');

  console.log(`[stage-2-composite] ${format}: Composited image ready: ${compositeUrl.substring(0, 80)}`);
  return compositeUrl;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Stage 3: Kontext Lighting Fix
// ═══════════════════════════════════════════════════════════════════════════════
function buildKontextLightingPrompt(params: {
  name: string;
  brand: string;
  bottleDescription?: string;
}): string {
  const { name, brand, bottleDescription } = params;
  const bottleName = `${brand} ${name}`.trim();
  const bottleDetails = bottleDescription && bottleDescription.trim().length > 10
    ? `Bottle details: ${bottleDescription.trim()}`
    : '';
  return `The character is holding the ${bottleName} perfume bottle. Apply natural, consistent lighting and shadows to make the bottle look perfectly integrated into the scene. The bottle shape, label, and design must remain EXACTLY as shown. Only improve the lighting, shadows, and blending to make the bottle look naturally placed in the character's hand. Keep the same 3D Pixar/Disney animation style, same character, same pose, same background.
${bottleDetails}`.trim();
}

async function generateStage3Lighting(params: {
  compositedImageUrl: string;
  kontextPrompt: string;
  loraPath: string;
  imageSize: { width: number; height: number };
  format: string;
}): Promise<string> {
  const { compositedImageUrl, kontextPrompt, loraPath, imageSize, format } = params;

  console.log(`[stage-3-lighting] ${format}: Applying Kontext lighting fix...`);

  const kontextInput: Record<string, unknown> = {
    image_url: compositedImageUrl,
    prompt: kontextPrompt,
    loras: [{ path: loraPath, scale: 0.6 }],
    image_size: imageSize,
    num_inference_steps: 30,
    guidance_scale: 7,
    num_images: 1,
    output_format: 'jpeg',
    enable_safety_checker: false,
  };

  const result = await falRun(FAL_MODEL_KONTEXT, kontextInput);
  return extractImageUrl(result);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main per-format pipeline
// ═══════════════════════════════════════════════════════════════════════════════
async function generateFormat(
  body: GenerationRequest & { bottleDescription?: string; productImageUrl?: string },
  ac: typeof ASPECT_CONFIGS[0]
): Promise<{
  format: string;
  label: string;
  dimensions: { width: number; height: number };
  aspectRatio: string;
  url: string | null;
  status: string;
  pipeline: string;
  errorMessage?: string;
}> {
  try {
    // Stage 1: Generate character
    const stage1Url = await generateStage1({ body, ac });
    console.log(`[pipeline-v14] ${ac.format}: Stage 1 done: ${stage1Url.substring(0, 80)}`);

    if (body.productImageUrl && body.productImageUrl.trim().length > 10) {
      // Stage 2: Smart Compositing
      try {
        const compositedUrl = await generateStage2Composite({
          stage1ImageUrl: stage1Url,
          productImageUrl: body.productImageUrl.trim(),
          format: ac.format,
        });
        console.log(`[pipeline-v14] ${ac.format}: Stage 2 (composite) done`);

        // Stage 3: Kontext Lighting Fix
        try {
          const lightingPrompt = buildKontextLightingPrompt({
            name: body.perfumeData.name,
            brand: body.perfumeData.brand,
            bottleDescription: body.bottleDescription,
          });
          const finalUrl = await generateStage3Lighting({
            compositedImageUrl: compositedUrl,
            kontextPrompt: lightingPrompt,
            loraPath: MAHWOUS_LORA_URL,
            imageSize: ac.imageSize,
            format: ac.format,
          });
          console.log(`[pipeline-v14] ${ac.format}: Stage 3 (lighting) done`);
          return {
            format: ac.format,
            label: ac.label,
            dimensions: ac.dimensions,
            aspectRatio: ac.aspectRatio,
            url: finalUrl,
            status: 'COMPLETED',
            pipeline: 'smart_composite_v14_full',
          };
        } catch (stage3Err) {
          console.warn(`[stage-3] ${ac.format}: Lighting fix FAILED, using composited image:`, stage3Err);
          return {
            format: ac.format,
            label: ac.label,
            dimensions: ac.dimensions,
            aspectRatio: ac.aspectRatio,
            url: compositedUrl,
            status: 'COMPLETED',
            pipeline: 'smart_composite_v14_no_lighting',
          };
        }
      } catch (stage2Err) {
        console.warn(`[stage-2] ${ac.format}: Compositing FAILED, using Stage 1 image:`, stage2Err);
        return {
          format: ac.format,
          label: ac.label,
          dimensions: ac.dimensions,
          aspectRatio: ac.aspectRatio,
          url: stage1Url,
          status: 'COMPLETED',
          pipeline: 'flux_lora_only_v14_fallback',
        };
      }
    }
    // No product image — return Stage 1 directly
    console.log(`[stage-2] ${ac.format}: No product image — returning Stage 1 result`);
    return {
      format: ac.format,
      label: ac.label,
      dimensions: ac.dimensions,
      aspectRatio: ac.aspectRatio,
      url: stage1Url,
      status: 'COMPLETED',
      pipeline: 'flux_lora_only_v14',
    };
  } catch (err) {
    console.error(`[pipeline-v14] FAILED (${ac.format}):`, err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      format: ac.format,
      label: ac.label,
      dimensions: ac.dimensions,
      aspectRatio: ac.aspectRatio,
      url: null,
      status: 'FAILED',
      pipeline: 'failed',
      errorMessage,
    };
  }
}
// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Upload buffer to fal.ai storage to get a public URL
// ═══════════════════════════════════════════════════════════════════════════════
async function uploadBufferToFal(buffer: Buffer, filename: string): Promise<string> {
  const falKey = FAL_KEY_ENV();
  if (!falKey) throw new Error('FAL_KEY is not set.');
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('file', blob, filename);
  const res = await fetch('https://rest.fal.run/storage/upload', {
    method: 'POST',
    headers: { Authorization: `Key ${falKey}` },
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`fal.ai upload error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const url = data?.url as string | undefined;
  if (!url) throw new Error('fal.ai upload did not return a URL');
  console.log(`[upload] Uploaded to fal.ai: ${url.substring(0, 80)}`);
  return url;
}
// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    if (!body.perfumeData?.name?.trim() || !body.perfumeData?.brand?.trim()) {
      return NextResponse.json(
        { error: 'perfumeData.name and perfumeData.brand are required.' },
        { status: 400 }
      );
    }
    if (!FAL_KEY_ENV()) {
      return NextResponse.json(
        { error: 'FAL_KEY is not configured. Please add it to environment variables.' },
        { status: 500 }
      );
    }
    const effectiveBottleDescription =
      body.bottleDescription ||
      body.bottleAnalysis?.description ||
      body.bottleAnalysis?.loraPromptAddition ||
      undefined;
    const effectiveProductImageUrl =
      body.productImageUrl ||
      body.perfumeData?.imageUrl ||
      undefined;
    const enrichedBody = {
      ...body,
      bottleDescription: effectiveBottleDescription,
      productImageUrl: effectiveProductImageUrl,
    };
    console.log(`[generate] Pipeline v14 (Smart Compositing + Kontext Lighting) — "${body.perfumeData.name}" by ${body.perfumeData.brand}`);
    console.log(`[generate] Product image URL: ${effectiveProductImageUrl ? effectiveProductImageUrl.substring(0, 80) : 'none — Stage 1 only'}`);
    console.log(`[generate] Pipeline mode: ${effectiveProductImageUrl ? 'SMART COMPOSITING (real bottle pixel-perfect)' : 'STAGE 1 ONLY (no product image)'}`);
    const results = await Promise.all(
      ASPECT_CONFIGS.map((ac) => generateFormat(enrichedBody, ac))
    );
    const completedImages = results.filter((r) => r.status === 'COMPLETED' && r.url);
    if (completedImages.length === 0) {
      const rawMessages = [...new Set(results.map((r) => r.errorMessage).filter((m): m is string => !!m))];
      const error = userFacingFalFailure(rawMessages.length ? rawMessages : ['لم يُرجع fal.ai أي صورة ناجحة.']);
      return NextResponse.json({ error, details: rawMessages[0]?.slice(0, 800) }, { status: 500 });
    }
    console.log(`[generate] Completed: ${completedImages.length}/3 images`);
    completedImages.forEach((img) => {
      console.log(`  ${img.format}: ${img.pipeline}`);
    });
    return NextResponse.json({
      status: 'completed',
      images: completedImages.map((img) => ({
        format: img.format,
        label: img.label,
        dimensions: img.dimensions,
        url: img.url,
        aspectRatio: img.aspectRatio,
      })),
      pipeline: 'smart_composite_v14',
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('[/api/generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Image generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
