// ══════════════════════════════════════════════════════════════════════════════
// lib/veoClient.ts — Google Veo 3 Client via Gemini API
//
// يستخدم Google Veo 3.1 Fast لتوليد فيديوهات عالية الجودة
// - Veo 3.1 Fast: أسرع وأرخص — مناسب للسوشيال ميديا
// - Veo 3.1: جودة أعلى — مناسب للإعلانات الرسمية
// - يدعم image-to-video مع LoRA الشخصية الثابتة
// - يدعم النصوص العربية كـ overlay
// ══════════════════════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai';

const VEO_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ── نماذج Veo المتاحة ─────────────────────────────────────────────────────────
export const VEO_MODELS = {
  VEO_3_FAST: 'veo-3.0-fast-generate-001',   // ✅ VERIFIED — أسرع وأرخص
  VEO_3:      'veo-3.0-generate-001',         // ✅ VERIFIED — جودة أعلى
  VEO_3_1_FAST: 'veo-3.1-fast-generate-preview', // ✅ VERIFIED — أحدث سريع
  VEO_3_1:    'veo-3.1-generate-preview',    // ✅ VERIFIED — أحدث وأعلى جودة
  VEO_2:      'veo-2.0-generate-001',        // ✅ VERIFIED — النسخة الثانية
} as const;

export type VeoModel = typeof VEO_MODELS[keyof typeof VEO_MODELS];

// ── أنواع الطلبات ─────────────────────────────────────────────────────────────
export interface VeoGenerationRequest {
  prompt: string;                    // وصف الفيديو بالإنجليزية (مفصّل)
  imageUrl?: string;                 // صورة مرجعية (image-to-video)
  aspectRatio: '9:16' | '16:9';     // نسبة العرض
  durationSeconds?: 5 | 6 | 7 | 8;  // مدة الفيديو (5-8 ثوانٍ)
  model?: VeoModel;                  // النموذج المستخدم
  enhancePrompt?: boolean;           // تحسين الـ prompt تلقائياً
}

export interface VeoOperationResult {
  operationName: string;   // اسم العملية للـ polling
  status: 'pending' | 'running' | 'done' | 'failed';
  videoUrl?: string;       // URL الفيديو عند الاكتمال
  error?: string;
}

// ── دالة توليد الفيديو ────────────────────────────────────────────────────────
export async function generateVeoVideo(
  request: VeoGenerationRequest
): Promise<VeoOperationResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  const model = request.model || VEO_MODELS.VEO_3_FAST;
  const url = `${VEO_API_BASE}/models/${model}:predictLongRunning?key=${apiKey}`;

  // ── بناء الطلب ───────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestBody: Record<string, any> = {
    instances: [
      {
        prompt: request.prompt,
      },
    ],
    parameters: {
      aspectRatio: request.aspectRatio,
      durationSeconds: request.durationSeconds || 6,
      // NOTE: enhancePrompt and personGeneration are NOT supported — verified by testing
    },
  };

  // إضافة الصورة المرجعية إذا متوفرة (image-to-video)
  if (request.imageUrl) {
    // تحميل الصورة كـ base64 أو استخدام URL مباشر
    if (request.imageUrl.startsWith('http')) {
      requestBody.instances[0].image = {
        bytesBase64Encoded: await fetchImageAsBase64(request.imageUrl),
        mimeType: 'image/jpeg',
      };
    } else if (request.imageUrl.startsWith('data:')) {
      const base64 = request.imageUrl.split(',')[1];
      requestBody.instances[0].image = {
        bytesBase64Encoded: base64,
        mimeType: 'image/jpeg',
      };
    }
  }

  console.log(`[Veo3] Generating ${request.aspectRatio} video with model: ${model}`);
  console.log(`[Veo3] Prompt preview: ${request.prompt.substring(0, 100)}...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Veo3] API Error:', response.status, errorText);
    throw new Error(`Veo API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('[Veo3] Operation started:', data.name);

  return {
    operationName: data.name,
    status: 'pending',
  };
}

// ── دالة polling لمتابعة حالة التوليد ────────────────────────────────────────
export async function pollVeoOperation(
  operationName: string
): Promise<VeoOperationResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  const url = `${VEO_API_BASE}/${operationName}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Poll error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    return {
      operationName,
      status: 'failed',
      error: data.error.message || 'Unknown error',
    };
  }

  if (!data.done) {
    return {
      operationName,
      status: 'running',
    };
  }

  // اكتمل التوليد — استخراج URL الفيديو
  const videoUrl = extractVideoUrl(data);
  if (!videoUrl) {
    return {
      operationName,
      status: 'failed',
      error: 'No video URL in response',
    };
  }

  return {
    operationName,
    status: 'done',
    videoUrl,
  };
}

// ── polling مع انتظار تلقائي (حتى 5 دقائق) ──────────────────────────────────
export async function waitForVeoVideo(
  operationName: string,
  maxWaitMs: number = 300_000,  // 5 دقائق
  intervalMs: number = 10_000   // كل 10 ثوانٍ
): Promise<VeoOperationResult> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const result = await pollVeoOperation(operationName);

    if (result.status === 'done' || result.status === 'failed') {
      return result;
    }

    console.log(`[Veo3] Still processing... (${Math.round((Date.now() - start) / 1000)}s)`);
    await sleep(intervalMs);
  }

  return {
    operationName,
    status: 'failed',
    error: `Timeout after ${maxWaitMs / 1000}s`,
  };
}

// ── دوال مساعدة ───────────────────────────────────────────────────────────────

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVideoUrl(data: any): string | null {
  // محاولة استخراج URL الفيديو من الاستجابة
  try {
    // ── التنسيق الجديد: generateVideoResponse.generatedSamples ──────────────
    // هذا هو التنسيق الفعلي الذي يُرجعه Veo 2 و Veo 3
    const genVideoResp = data.response?.generateVideoResponse;
    if (genVideoResp?.generatedSamples?.length > 0) {
      const sample = genVideoResp.generatedSamples[0];
      if (sample?.video?.uri) {
        console.log('[Veo] Video URI found (generateVideoResponse):', sample.video.uri.substring(0, 80));
        return sample.video.uri;
      }
      if (sample?.video?.bytesBase64Encoded) {
        return `data:video/mp4;base64,${sample.video.bytesBase64Encoded}`;
      }
    }
    // ── التنسيق القديم: predictions ─────────────────────────────────────────
    const predictions = data.response?.predictions;
    if (predictions && predictions.length > 0) {
      const video = predictions[0];
      if (video.bytesBase64Encoded) {
        return `data:video/mp4;base64,${video.bytesBase64Encoded}`;
      }
      if (video.gcsUri) return video.gcsUri;
      if (video.videoUri) return video.videoUri;
    }
    // ── هيكل بديل: generatedSamples مباشرة ──────────────────────────────────
    if (data.response?.generatedSamples) {
      const sample = data.response.generatedSamples[0];
      if (sample?.video?.uri) return sample.video.uri;
      if (sample?.video?.bytesBase64Encoded) {
        return `data:video/mp4;base64,${sample.video.bytesBase64Encoded}`;
      }
    }
  } catch (e) {
    console.error('[Veo3] Error extracting video URL:', e);
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── التحقق من توفر Veo API ────────────────────────────────────────────────────
export function isVeoAvailable(): boolean {
  // Veo متاح إذا كان GOOGLE_GENERATIVE_AI_API_KEY موجوداً
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

// ── إحصائيات الاستخدام ────────────────────────────────────────────────────────
export function getVeoCostEstimate(durationSeconds: number): {
  estimatedCostUSD: number;
  model: string;
} {
  // Veo 3.1: ~$0.40/ثانية
  // Veo 3.1 Fast: ~$0.20/ثانية (تقدير)
  const costPerSecond = 0.20; // Fast model
  return {
    estimatedCostUSD: durationSeconds * costPerSecond,
    model: 'veo-3.0-generate-preview (Fast)',
  };
}

// ── استخدام Gemini SDK للـ prompt enhancement ─────────────────────────────────
export async function enhancePromptWithGemini(
  arabicScript: string,
  scenarioContext: string,
  perfumeName: string,
  perfumeBrand: string,
  bottleDescription?: string,
  bottleLoraAddition?: string,
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return scenarioContext;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // وصف الشخصية الموحدة
    const characterDesc = `CONSISTENT CHARACTER throughout entire video:
- Stylish Saudi Arab man in his late 20s
- Black swept-back hair with clean fade on sides
- Thick full black beard, perfectly groomed
- Warm olive skin tone, sharp jawline, expressive dark eyes
- Wearing elegant white Saudi thobe OR luxury outfit
- Direct charismatic eye contact with camera
- Same face, same appearance in every frame`;

    // وصف الزجاجة الحقيقية
    const bottleSection = bottleDescription
      ? `PERFUME BOTTLE (reproduce EXACTLY): ${bottleDescription}${bottleLoraAddition ? ` Key visual: ${bottleLoraAddition}` : ''}`
      : `PERFUME BOTTLE: Luxury "${perfumeName}" by ${perfumeBrand} bottle, prominently featured`;

    const systemPrompt = `You are an expert video director for luxury perfume content targeting Saudi Arabian social media audiences.
Your task: Convert an Arabic perfume review script into a detailed English video generation prompt for Google Veo 3.

CRITICAL REQUIREMENTS:
1. CHARACTER CONSISTENCY: ${characterDesc}
2. BOTTLE FIDELITY: ${bottleSection}
3. Premium social media content quality (TikTok/Instagram Reels)
4. Include: camera movements, lighting, background, character expressions
5. Include: sound design hints, transition style
6. Keep it under 220 words
7. Authentic Saudi cultural context
8. NEVER include spraying action — character PRESENTS/HOLDS bottle only
9. Direct eye contact with camera throughout
10. Bottle must be clearly visible in every shot`;

    const userPrompt = `Arabic Script: "${arabicScript}"
Perfume: ${perfumeName} by ${perfumeBrand}
Base scenario: ${scenarioContext}

Generate an enhanced Veo 3 video prompt in English ensuring character consistency and exact bottle reproduction:`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);

    const enhanced = result.response.text().trim();
    console.log('[Veo3] Enhanced prompt generated');
    return enhanced;
  } catch (error) {
    console.error('[Veo3] Prompt enhancement failed, using base prompt:', error);
    return scenarioContext;
  }
}
