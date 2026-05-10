// ============================================================
// lib/veoVideoClient.ts — Veo 2 Video Generation Engine
//
// FLOW:
//   1. Build cinematic Arabic prompt (Riyadh dialect hook + voiceover)
//   2. Submit to Veo 2 via Google AI Studio API (image-to-video)
//   3. Poll for completion
//   4. Return video URL
//
// Veo 2 API: POST /v1beta/models/veo-2.0-generate-001:generateVideo
// ============================================================

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const VEO_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const VEO_MODEL = 'veo-2.0-generate-001';

export interface VeoVideoRequest {
  imageUrl: string;           // Reference image (bottle/scene)
  prompt: string;             // Cinematic video prompt
  aspectRatio?: '9:16' | '16:9';
  durationSeconds?: number;   // 5-8 seconds
}

export interface VeoVideoResponse {
  operationName: string;      // Long-running operation name
  status: 'pending' | 'processing' | 'complete' | 'failed';
  videoUrl?: string;
  error?: string;
}

// ── Submit video generation to Veo 2 ─────────────────────────────────────────
export async function submitVeoVideo(req: VeoVideoRequest): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');

  const { imageUrl, prompt, aspectRatio = '9:16', durationSeconds = 8 } = req;

  // Fetch image as base64 if it's a URL
  let imageBase64: string;
  let mimeType = 'image/jpeg';

  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 image data');
    mimeType = match[1];
    imageBase64 = match[2];
  } else {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) });
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    mimeType = contentType.split(';')[0];
    const buffer = await imgRes.arrayBuffer();
    imageBase64 = Buffer.from(buffer).toString('base64');
  }

  const body = {
    model: VEO_MODEL,
    prompt: {
      text: prompt,
      image: {
        bytesBase64Encoded: imageBase64,
        mimeType,
      },
    },
    generationConfig: {
      aspectRatio,
      durationSeconds,
      numberOfVideos: 1,
      enhancePrompt: true,
    },
  };

  const res = await fetch(
    `${VEO_BASE}/models/${VEO_MODEL}:generateVideo?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Veo 2 submit failed: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  const operationName = data?.name as string | undefined;
  if (!operationName) {
    throw new Error(`Veo 2: no operation name in response: ${JSON.stringify(data).substring(0, 200)}`);
  }

  console.log(`[Veo2] Operation started: ${operationName}`);
  return operationName;
}

// ── Poll Veo 2 operation until complete ───────────────────────────────────────
export async function pollVeoOperation(operationName: string): Promise<VeoVideoResponse> {
  if (!GEMINI_API_KEY) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');

  const res = await fetch(
    `${VEO_BASE}/${operationName}?key=${GEMINI_API_KEY}`,
    {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Veo 2 poll failed: ${res.status} — ${errText}`);
  }

  const data = await res.json();

  if (data.error) {
    return {
      operationName,
      status: 'failed',
      error: data.error?.message || JSON.stringify(data.error),
    };
  }

  if (!data.done) {
    return { operationName, status: 'processing' };
  }

  // Operation complete
  const videos = data.response?.generatedSamples || data.response?.videos || [];
  if (videos.length > 0) {
    const videoUrl = videos[0]?.video?.uri || videos[0]?.videoUri || videos[0]?.url;
    if (videoUrl) {
      return { operationName, status: 'complete', videoUrl };
    }
  }

  return {
    operationName,
    status: 'failed',
    error: `No video in response: ${JSON.stringify(data.response).substring(0, 200)}`,
  };
}

// ── Build Veo 2 cinematic prompt (Arabic Riyadh dialect) ──────────────────────
export function buildVeoPrompt(params: {
  perfumeName: string;
  brand: string;
  gender: 'men' | 'women' | 'unisex';
  vibe: string;
  scenario: string;
  hook: string;
  visualFx: string;
  aspectRatio: '9:16' | '16:9';
  bottleDescription?: string;
}): string {
  const { perfumeName, brand, gender, vibe, scenario, hook, visualFx, aspectRatio, bottleDescription } = params;

  const genderDesc = gender === 'women'
    ? 'elegant Saudi woman in luxury attire'
    : gender === 'men'
    ? 'handsome Saudi man in premium traditional or modern outfit'
    : 'stylish Saudi person';

  const bottleHint = bottleDescription
    ? `The perfume bottle is: ${bottleDescription}. Show it prominently.`
    : `Show a luxury perfume bottle prominently in the scene.`;

  const formatHint = aspectRatio === '9:16'
    ? 'Vertical cinematic video (9:16 portrait format), optimized for Instagram Reels and TikTok.'
    : 'Horizontal cinematic video (16:9 landscape), optimized for YouTube.';

  return `${formatHint}

SCENE: ${scenario}

VISUAL HOOK (first 2 seconds): ${hook}

CHARACTER: ${genderDesc}, confident and charismatic, holding or presenting the perfume bottle.

PERFUME: "${perfumeName}" by ${brand}. ${bottleHint}

VIBE: ${vibe} — luxurious, aspirational, Saudi premium lifestyle.

VISUAL EFFECTS: ${visualFx}

CINEMATIC STYLE: 
- Slow-motion close-ups of perfume bottle with light reflections
- Bokeh background with golden particles
- Smooth camera movement (tracking shot or dolly)
- Color grade: warm golden tones, deep shadows
- Professional studio or outdoor luxury setting
- Arabic calligraphy text overlay: "${perfumeName}"
- Brand watermark: "${brand}"

AUDIO DIRECTION: 
- Dramatic orchestral intro (first 2 seconds)
- Smooth Arabic background music
- Professional voiceover in Saudi Riyadh dialect

OUTPUT: Cinematic, ready-to-publish social media video. No watermarks. 4K quality.`;
}
