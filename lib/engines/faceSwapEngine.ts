// ============================================================
// lib/engines/faceSwapEngine.ts — Face Consistency Engine
// ثبات ملامح الشخصية عبر تقنيات تبديل الوجوه
// Uses Fal.ai face-swap models for consistent character appearance
// ============================================================

import type { FaceSwapConfig } from '../pipeline/pipelineTypes';
import type { GeneratedImage } from '../types';

const FAL_API_BASE = 'https://queue.fal.run';

// ── Face Swap via Fal.ai ───────────────────────────────────────────────────

export async function applyFaceSwap(
  targetImageUrl: string,
  config: FaceSwapConfig,
  format: GeneratedImage['format']
): Promise<{ swappedImageUrl: string; success: boolean; error?: string }> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return { swappedImageUrl: targetImageUrl, success: false, error: 'FAL_KEY not configured' };
  }

  if (!config.enabled || (!config.referenceImageUrl && !config.referenceImageBase64)) {
    return { swappedImageUrl: targetImageUrl, success: false, error: 'No reference face provided' };
  }

  try {
    // Use fal.ai face-swap model
    const response = await fetch(`${FAL_API_BASE}/fal-ai/face-swap`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_image_url: targetImageUrl,
        swap_image_url: config.referenceImageUrl || config.referenceImageBase64,
        // Higher fidelity for consistency
        ...(config.consistency === 'high' && {
          blend_amount: 0.9,
        }),
        ...(config.consistency === 'medium' && {
          blend_amount: 0.7,
        }),
        ...(config.consistency === 'low' && {
          blend_amount: 0.5,
        }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FaceSwap] API error: ${response.status}`, errorText);
      return { swappedImageUrl: targetImageUrl, success: false, error: `API error: ${response.status}` };
    }

    const result = await response.json();

    // Handle queue-based response
    if (result.request_id) {
      const swappedUrl = await pollFalResult(result.request_id, falKey);
      if (swappedUrl) {
        return { swappedImageUrl: swappedUrl, success: true };
      }
      return { swappedImageUrl: targetImageUrl, success: false, error: 'Polling timed out' };
    }

    // Direct result
    if (result.image?.url) {
      return { swappedImageUrl: result.image.url, success: true };
    }

    return { swappedImageUrl: targetImageUrl, success: false, error: 'No image in response' };
  } catch (error) {
    console.error('[FaceSwap] Error:', error);
    return {
      swappedImageUrl: targetImageUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ── Batch Face Swap ────────────────────────────────────────────────────────

export async function applyFaceSwapBatch(
  images: GeneratedImage[],
  config: FaceSwapConfig
): Promise<GeneratedImage[]> {
  if (!config.enabled) return images;

  const results = await Promise.allSettled(
    images.map(async (img) => {
      const result = await applyFaceSwap(img.url, config, img.format);
      if (result.success) {
        return { ...img, url: result.swappedImageUrl };
      }
      console.warn(`[FaceSwap] Failed for ${img.format}: ${result.error}`);
      return img; // Return original on failure
    })
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return images[i]; // Return original on rejection
  });
}

// ── Poll Fal.ai Queue ──────────────────────────────────────────────────────

async function pollFalResult(requestId: string, falKey: string, maxAttempts = 30): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));

    try {
      const response = await fetch(`${FAL_API_BASE}/fal-ai/face-swap/requests/${requestId}/status`, {
        headers: { 'Authorization': `Key ${falKey}` },
      });

      if (!response.ok) continue;
      const status = await response.json();

      if (status.status === 'COMPLETED') {
        // Fetch the result
        const resultRes = await fetch(`${FAL_API_BASE}/fal-ai/face-swap/requests/${requestId}`, {
          headers: { 'Authorization': `Key ${falKey}` },
        });
        if (resultRes.ok) {
          const result = await resultRes.json();
          return result.image?.url || null;
        }
      }

      if (status.status === 'FAILED') {
        console.error('[FaceSwap] Queue failed:', status.error);
        return null;
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ── Upload Reference Face ──────────────────────────────────────────────────

export async function uploadReferenceImage(base64Image: string): Promise<string | null> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) return null;

  try {
    // Upload to fal.ai storage
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(imageData, 'base64');

    const response = await fetch('https://fal.run/fal-ai/storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'image/png',
      },
      body: buffer,
    });

    if (response.ok) {
      const data = await response.json();
      return data.url || null;
    }
  } catch (error) {
    console.error('[FaceSwap] Upload error:', error);
  }
  return null;
}

// ── Estimate Cost ──────────────────────────────────────────────────────────

export function estimateFaceSwapCost(imageCount: number): number {
  // Fal.ai face-swap: ~$0.02 per image
  return imageCount * 0.02;
}
