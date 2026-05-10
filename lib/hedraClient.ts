// ============================================================
// lib/hedraClient.ts  — v5 (VERIFIED + OPTIMIZED)
//
// CONFIRMED WORKING FLOW (tested live 2026-03-06):
//   1. POST /assets + POST /assets/{id}/upload → image_asset_id
//   2. POST /generations {type:"text_to_speech"} → wait → audio_asset_id
//   3. POST /generations {type:"video", audio_id, start_keyframe_id}
//   4. GET /generations/{id}/status → url when complete
//
// KEY FACTS:
//   - audio_generation embedded in video request → always 400 error
//   - Must generate audio FIRST as separate generation, use audio_id
//   - generated_video_inputs has NO ai_model_id (it's at root level)
//   - Video URL is in status.url (not in asset)
// ============================================================

const HEDRA_API_KEY = process.env.HEDRA_API_KEY;
const HEDRA_BASE_URL = 'https://api.hedra.com/web-app/public';

export const ARABIC_VOICE_ID = '61d27b32-834c-4797-b9ff-4b0febed07f6'; // Omar (عمر) — Arabic
export const HEDRA_AVATAR_MODEL = '26f0fc66-152b-40ab-abed-76c43df99bc8'; // Hedra Avatar

export type VideoAspectRatio = '9:16' | '16:9' | '1:1';

export interface HedraGenerationResponse {
  id: string;
  status: 'queued' | 'pending' | 'processing' | 'finalizing' | 'complete' | 'failed' | 'error';
  asset_id?: string;
  progress?: number;
  eta_sec?: number;
  error?: string;
  error_message?: string;
  url?: string;
  download_url?: string;
}

export interface HedraAsset {
  id: string;
  type: string;
  url?: string;
  download_url?: string;
  thumbnail_url?: string;
  asset?: { url?: string; type?: string };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function getHeaders(json = true): Record<string, string> {
  if (!HEDRA_API_KEY) throw new Error('HEDRA_API_KEY is not set.');
  const h: Record<string, string> = { 'X-API-Key': HEDRA_API_KEY };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64, 'base64');
  }
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Step 1: Upload image to Hedra ─────────────────────────────────────────
export async function uploadImageToHedra(imageUrl: string): Promise<string> {
  console.log(`[Hedra] Uploading image (len=${imageUrl.length})`);

  // Create asset placeholder
  const createRes = await fetch(`${HEDRA_BASE_URL}/assets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name: `perfume_${Date.now()}.jpg`, type: 'image' }),
  });
  if (!createRes.ok) throw new Error(`Create asset failed: ${createRes.status} — ${await createRes.text()}`);
  const { id: assetId } = await createRes.json();

  // Download image buffer
  const imageBuffer = await fetchImageBuffer(imageUrl);

  // Upload via multipart
  const boundary = `----HedraUpload${Date.now()}`;
  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="perfume.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([header, imageBuffer, footer]);

  const uploadRes = await fetch(`${HEDRA_BASE_URL}/assets/${assetId}/upload`, {
    method: 'POST',
    headers: { ...getHeaders(false), 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} — ${await uploadRes.text()}`);

  console.log(`[Hedra] Image uploaded → asset: ${assetId}`);
  return assetId;
}

// ── Step 2: Generate TTS audio and wait for completion ────────────────────
export async function generateSharedAudio(text: string): Promise<string> {
  console.log(`[Hedra] Generating TTS (voice: ${ARABIC_VOICE_ID})`);

  const res = await fetch(`${HEDRA_BASE_URL}/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: 'text_to_speech',
      voice_id: ARABIC_VOICE_ID,
      text,
      language: 'auto',
    }),
  });
  if (!res.ok) throw new Error(`TTS generation failed: ${res.status} — ${await res.text()}`);

  const data = await res.json();
  console.log(`[Hedra] TTS response: ${JSON.stringify(data).substring(0, 200)}`);

  // NEW API: asset_id returned directly in response (no polling needed)
  if (data.asset_id) {
    console.log(`[Hedra] TTS audio asset (direct): ${data.asset_id}`);
    return data.asset_id as string;
  }

  // LEGACY: poll by generation id
  const genId: string = data.id;
  if (!genId) {
    throw new Error(`TTS: no id or asset_id in response: ${JSON.stringify(data).substring(0, 200)}`);
  }
  console.log(`[Hedra] TTS gen ID: ${genId} — polling...`);

  // Poll until complete (max 60s)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(`${HEDRA_BASE_URL}/generations/${genId}/status`, {
      headers: getHeaders(false),
    });
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    console.log(`[Hedra] TTS status: ${status.status} (attempt ${i + 1})`);
    if (status.status === 'complete') {
      const assetId = status.asset_id || status.audio_asset_id;
      console.log(`[Hedra] TTS audio asset: ${assetId}`);
      return assetId as string;
    }
    if (status.status === 'error' || status.status === 'failed') {
      throw new Error(`TTS failed: ${status.error || status.error_message}`);
    }
  }
  throw new Error('TTS generation timed out after 60s');
}

// ── Step 3: Create video generation with pre-built assets ─────────────────
export async function createHedraVideoWithAssets(params: {
  imageAssetId: string;
  audioAssetId: string;
  textPrompt: string;
  aspectRatio: VideoAspectRatio;
}): Promise<HedraGenerationResponse> {
  const { imageAssetId, audioAssetId, textPrompt, aspectRatio } = params;

  console.log(`[Hedra] Creating ${aspectRatio} video (img=${imageAssetId}, audio=${audioAssetId})`);

  const res = await fetch(`${HEDRA_BASE_URL}/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: 'video',
      ai_model_id: HEDRA_AVATAR_MODEL,
      start_keyframe_id: imageAssetId,
      audio_id: audioAssetId,
      generated_video_inputs: {
        text_prompt: textPrompt,
        resolution: '1080p',
        aspect_ratio: aspectRatio,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hedra video generation failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  console.log(`[Hedra] Video gen started: ${data.id} (${data.status})`);
  return data as HedraGenerationResponse;
}

// ── Legacy wrapper (kept for backward compatibility) ──────────────────────
export async function createHedraVideo(params: {
  imageUrl: string;
  textPrompt: string;
  voiceoverText: string;
  aspectRatio: VideoAspectRatio;
  durationMs?: number;
}): Promise<HedraGenerationResponse> {
  const imageAssetId = await uploadImageToHedra(params.imageUrl);
  const audioAssetId = await generateSharedAudio(params.voiceoverText);
  return createHedraVideoWithAssets({
    imageAssetId,
    audioAssetId,
    textPrompt: params.textPrompt,
    aspectRatio: params.aspectRatio,
  });
}

// ── Poll video status ─────────────────────────────────────────────────────
export async function getHedraVideoStatus(generationId: string): Promise<HedraGenerationResponse> {
  const res = await fetch(`${HEDRA_BASE_URL}/generations/${generationId}/status`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error(`Status check failed: ${res.status} — ${await res.text()}`);
  return res.json() as Promise<HedraGenerationResponse>;
}

// ── Get asset ─────────────────────────────────────────────────────────────
export async function getHedraAsset(assetId: string): Promise<HedraAsset> {
  const res = await fetch(`${HEDRA_BASE_URL}/assets/${assetId}`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error(`Asset fetch failed: ${res.status} — ${await res.text()}`);
  return res.json() as Promise<HedraAsset>;
}
