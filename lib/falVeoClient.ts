// ============================================================
// lib/falVeoClient.ts — FAL Veo 2 + Veo 3 Video Generation Engine
//
// ARCHITECTURE:
// ┌──────────────────────────────────────────────────────────┐
// │  buildVeoPrompt()  ← MAHWOUS_MAN character injected      │
// │       ↓                                                  │
// │  submitToFalQueue()  → fal.ai queue endpoint             │
// │       ↓                                                  │
// │  pollFalUntilDone()  → polls every 5s, max 300s          │
// │       ↓                                                  │
// │  Returns { videoUrl, model, duration }                   │
// └──────────────────────────────────────────────────────────┘
//
// FAL Veo 2 endpoint: fal-ai/veo2
// FAL Veo 3 endpoint: fal-ai/veo3
// FAL Veo 3 Fast:     fal-ai/veo3/fast  (if available)
//
// CHARACTER CONSISTENCY:
//   MAHWOUS_MAN LoRA is used for image generation (FLUX).
//   For video, the same character description is embedded
//   directly into the prompt to maintain visual consistency.
// ============================================================

const FAL_KEY = process.env.FAL_KEY?.replace(/\\n/g, '').trim();
const FAL_BASE = 'https://queue.fal.run';
const FAL_RESULT_BASE = 'https://queue.fal.run';

// ── Character constants (must match FLUX LoRA training) ──────────────────────
export const MAHWOUS_CHARACTER_DESC = `a stylish confident Saudi Arab man in his late 20s, 
black swept-back hair with clean fade, thick full black beard neatly groomed, 
tan warm skin tone, sharp defined facial features, wearing pristine white Saudi thobe with subtle embroidery`;

// ── Model configurations ──────────────────────────────────────────────────────
export type FalVeoModel = 'veo3' | 'veo3_fast' | 'veo2';

interface FalVeoModelConfig {
  endpoint: string;
  displayName: string;
  maxDuration: number;
  supportsAudio: boolean;
  resolution: '720p' | '1080p';
}

const FAL_VEO_MODELS: Record<FalVeoModel, FalVeoModelConfig> = {
  veo3: {
    endpoint: 'fal-ai/veo3',
    displayName: 'Veo 3 (Full)',
    maxDuration: 8,
    supportsAudio: true,
    resolution: '1080p',
  },
  veo3_fast: {
    endpoint: 'fal-ai/veo3/fast',
    displayName: 'Veo 3 Fast',
    maxDuration: 8,
    supportsAudio: true,
    resolution: '720p',
  },
  veo2: {
    endpoint: 'fal-ai/veo2',
    displayName: 'Veo 2',
    maxDuration: 8,
    supportsAudio: false,
    resolution: '720p',
  },
};

// ── Request/Response types ────────────────────────────────────────────────────
export interface FalVeoRequest {
  productName: string;
  brandName?: string;
  bottleDescription?: string;      // From Claude Vision analysis
  bottleLoraAddition?: string;     // Extra LoRA prompt from bottle analysis
  scent?: string;                  // Perfume scent notes
  vibe?: string;                   // Campaign vibe/mood
  aspectRatio?: '9:16' | '16:9';
  duration?: number;               // seconds: 5-8
  model?: FalVeoModel;             // default: veo3
  generateAudio?: boolean;         // default: true for veo3
  customPromptPortrait?: string;   // Override prompt for 9:16 (from scenario engine)
  customPromptLandscape?: string;  // Override prompt for 16:9 (from scenario engine)
  referenceImageUrl?: string;      // Optional: use generated FLUX image as reference
}

export interface FalVeoResult {
  videoUrl: string;
  model: string;
  duration: number;
  aspectRatio: string;
  prompt: string;
}

// ── Build cinematic video prompt ─────────────────────────────────────────────
function buildVeoPrompt(req: FalVeoRequest, aspectRatio: '9:16' | '16:9'): string {
  // Use custom scenario prompt if provided
  if (aspectRatio === '9:16' && req.customPromptPortrait) {
    return req.customPromptPortrait;
  }
  if (aspectRatio === '16:9' && req.customPromptLandscape) {
    return req.customPromptLandscape;
  }

  const {
    productName,
    brandName = 'Mahwous',
    bottleDescription,
    bottleLoraAddition,
    scent,
    vibe,
  } = req;

  // Bottle description — use Claude Vision analysis if available
  const bottleDesc = bottleDescription
    ? `The perfume bottle is ${bottleDescription}`
    : `a luxury perfume bottle named "${productName}" by ${brandName}`;

  // Scent atmosphere
  const scentAtmosphere = scent
    ? `The fragrance evokes ${scent}, creating an atmosphere of luxury and sophistication.`
    : 'The fragrance creates an atmosphere of luxury and sophistication.';

  // Vibe/mood
  const vibeDesc = vibe
    ? `The overall mood is ${vibe}.`
    : 'The overall mood is cinematic, luxurious, and aspirational.';

  // Extra bottle details from LoRA analysis
  const extraBottleDetails = bottleLoraAddition
    ? ` ${bottleLoraAddition}`
    : '';

  if (aspectRatio === '9:16') {
    // Portrait — Instagram/TikTok style
    return `Cinematic luxury perfume advertisement. ${MAHWOUS_CHARACTER_DESC}, standing confidently in a breathtaking setting. He holds ${bottleDesc} elegantly in his hands, presenting it toward the camera with pride.${extraBottleDetails} The bottle's exact shape, color, and design are preserved perfectly — no alterations. ${scentAtmosphere} ${vibeDesc} Camera: slow cinematic push-in from wide to medium close-up, then a beauty shot of the bottle. Lighting: warm golden-hour light with soft bokeh background. Style: high-end luxury commercial, 4K ultra-detailed, photorealistic. The man's face, beard, and features remain consistent and sharp throughout every frame. Arabic luxury perfume brand advertisement.`;
  } else {
    // Landscape — YouTube/wide format
    return `Epic cinematic luxury perfume commercial. ${MAHWOUS_CHARACTER_DESC}, walking through a stunning landscape (golden desert dunes or marble palace interior). He carries ${bottleDesc} — the bottle's exact shape and design are shown clearly.${extraBottleDetails} ${scentAtmosphere} ${vibeDesc} Camera: sweeping drone shot transitioning to tracking shot, then close-up of bottle. Lighting: dramatic cinematic lighting with lens flares. Style: Hollywood-level luxury commercial, 4K, photorealistic. The man's face and features remain perfectly consistent in every frame. Premium Saudi perfume brand advertisement.`;
  }
}

// ── Get FAL auth header ───────────────────────────────────────────────────────
function getFalAuthHeader(): string {
  if (!FAL_KEY) throw new Error('FAL_KEY environment variable is not set');
  return `Key ${FAL_KEY}`;
}

// ── Submit to FAL queue ───────────────────────────────────────────────────────
async function submitToFalQueue(
  endpoint: string,
  input: Record<string, unknown>,
): Promise<string> {
  const url = `${FAL_BASE}/${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getFalAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`FAL queue submit failed (${res.status}): ${errorText.substring(0, 300)}`);
  }

  const data = await res.json();
  const requestId: string = data?.request_id;
  if (!requestId) {
    throw new Error(`FAL did not return request_id. Response: ${JSON.stringify(data).substring(0, 200)}`);
  }

  console.log(`[FAL Veo] Submitted to ${endpoint}, request_id: ${requestId}`);
  return requestId;
}

// ── Poll FAL queue until done ─────────────────────────────────────────────────
async function pollFalUntilDone(
  endpoint: string,
  requestId: string,
  timeoutMs = 300_000,
): Promise<string> {
  const statusUrl = `${FAL_RESULT_BASE}/${endpoint}/requests/${requestId}/status`;
  const resultUrl = `${FAL_RESULT_BASE}/${endpoint}/requests/${requestId}`;
  const deadline = Date.now() + timeoutMs;
  const pollInterval = 5_000; // 5 seconds

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: getFalAuthHeader() },
    });

    if (!statusRes.ok) {
      console.warn(`[FAL Veo] Status check failed: ${statusRes.status}`);
      continue;
    }

    const status = await statusRes.json();
    const queueStatus: string = status?.status ?? '';

    console.log(`[FAL Veo] Status: ${queueStatus} (request: ${requestId})`);

    if (queueStatus === 'COMPLETED') {
      // Fetch the actual result
      const resultRes = await fetch(resultUrl, {
        headers: { Authorization: getFalAuthHeader() },
      });

      if (!resultRes.ok) {
        throw new Error(`FAL result fetch failed: ${resultRes.status}`);
      }

      const result = await resultRes.json();

      // Extract video URL from result
      const videoUrl: string | undefined =
        result?.video?.url ??
        result?.data?.video?.url ??
        result?.videos?.[0]?.url;

      if (!videoUrl) {
        throw new Error(`FAL Veo returned no video URL. Result: ${JSON.stringify(result).substring(0, 300)}`);
      }

      console.log(`[FAL Veo] Video ready: ${videoUrl.substring(0, 80)}`);
      return videoUrl;
    }

    if (queueStatus === 'FAILED') {
      const reason = status?.error ?? status?.detail ?? 'Unknown FAL error';
      throw new Error(`FAL Veo generation failed: ${reason}`);
    }

    // IN_QUEUE or IN_PROGRESS — keep polling
  }

  throw new Error(`FAL Veo generation timed out after ${timeoutMs / 1000}s`);
}

// ── Generate single video (one aspect ratio) ─────────────────────────────────
async function generateSingleVideo(
  req: FalVeoRequest,
  aspectRatio: '9:16' | '16:9',
  model: FalVeoModel,
): Promise<FalVeoResult> {
  const config = FAL_VEO_MODELS[model];
  const prompt = buildVeoPrompt(req, aspectRatio);
  const duration = Math.min(req.duration ?? 8, config.maxDuration);

  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    duration: `${duration}s`,
    auto_fix: true,
  };

  // Add resolution for Veo 3
  if (model === 'veo3') {
    input.resolution = config.resolution;
    input.generate_audio = req.generateAudio !== false; // default true
    input.safety_tolerance = '4';
  }

  // Add negative prompt
  input.negative_prompt = 'blurry, low quality, distorted face, different person, face change, morphing, inconsistent character, wrong bottle shape, altered bottle design, cartoon, anime, unrealistic';

  console.log(`[FAL Veo] Generating ${aspectRatio} video with ${config.displayName}...`);
  console.log(`[FAL Veo] Prompt preview: ${prompt.substring(0, 120)}...`);

  const requestId = await submitToFalQueue(config.endpoint, input);
  const videoUrl = await pollFalUntilDone(config.endpoint, requestId, 300_000);

  return {
    videoUrl,
    model: config.displayName,
    duration,
    aspectRatio,
    prompt,
  };
}

// ── Main export: generate both portrait and landscape videos ─────────────────
export async function generateFalVeoVideos(req: FalVeoRequest): Promise<{
  portrait: FalVeoResult;
  landscape: FalVeoResult;
}> {
  const model = req.model ?? 'veo3';

  console.log(`[FAL Veo] Starting dual-format video generation with ${FAL_VEO_MODELS[model].displayName}`);

  // Generate both formats in parallel
  const [portrait, landscape] = await Promise.all([
    generateSingleVideo(req, '9:16', model),
    generateSingleVideo(req, '16:9', model),
  ]);

  return { portrait, landscape };
}

// ── Generate single video (for specific aspect ratio) ────────────────────────
export async function generateFalVeoVideo(
  req: FalVeoRequest,
  aspectRatio: '9:16' | '16:9' = '9:16',
): Promise<FalVeoResult> {
  const model = req.model ?? 'veo3';
  return generateSingleVideo(req, aspectRatio, model);
}

// ── Check if FAL Veo is available ─────────────────────────────────────────────
export function isFalVeoAvailable(): boolean {
  return !!FAL_KEY?.trim();
}

// ── Get available models ──────────────────────────────────────────────────────
export function getFalVeoModels(): { id: FalVeoModel; name: string }[] {
  return Object.entries(FAL_VEO_MODELS).map(([id, config]) => ({
    id: id as FalVeoModel,
    name: config.displayName,
  }));
}
