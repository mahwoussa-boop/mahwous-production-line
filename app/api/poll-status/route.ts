// app/api/poll-status/route.ts
// Polls fal.ai for the status of pending image generation requests
// Called repeatedly by the client until all images are COMPLETED

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const FAL_BASE = 'https://queue.fal.run';

interface PendingImage {
  format: string;
  label: string;
  dimensions: { width: number; height: number };
  requestId: string;
  model: string;
}

interface PollRequest {
  pendingImages: PendingImage[];
}

function getAuthHeader(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY is not set in environment variables.');
  return `Key ${key}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: PollRequest = await request.json();
    const { pendingImages } = body;

    if (!pendingImages || !Array.isArray(pendingImages)) {
      return NextResponse.json({ error: 'pendingImages array required' }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: 'FAL_KEY is not configured.' }, { status: 500 });
    }

    const auth = getAuthHeader();

    // Check status of each pending image
    const results = await Promise.all(
      pendingImages.map(async (img) => {
        const statusUrl = `${FAL_BASE}/${img.model}/requests/${img.requestId}/status`;
        const resultUrl = `${FAL_BASE}/${img.model}/requests/${img.requestId}`;

        try {
          const statusRes = await fetch(statusUrl, {
            headers: { Authorization: auth },
          });

          if (!statusRes.ok) {
            return { ...img, status: 'IN_QUEUE', imageUrl: null };
          }

          const statusData = await statusRes.json();
          const queueStatus: string = statusData?.status ?? 'IN_QUEUE';

          if (queueStatus === 'COMPLETED') {
            // Fetch the actual result
            const resultRes = await fetch(resultUrl, {
              headers: { Authorization: auth },
            });

            if (!resultRes.ok) {
              return { ...img, status: 'FAILED', imageUrl: null };
            }

            const result = await resultRes.json();
            const imageUrl: string | undefined =
              result?.images?.[0]?.url ?? result?.image?.url;

            if (!imageUrl) {
              return { ...img, status: 'FAILED', imageUrl: null };
            }

            return { ...img, status: 'COMPLETED', imageUrl };
          }

          if (queueStatus === 'FAILED') {
            return { ...img, status: 'FAILED', imageUrl: null };
          }

          return { ...img, status: queueStatus, imageUrl: null };
        } catch {
          return { ...img, status: 'IN_QUEUE', imageUrl: null };
        }
      })
    );

    const allCompleted = results.every((r) => r.status === 'COMPLETED');
    const anyFailed = results.some((r) => r.status === 'FAILED');

    return NextResponse.json({
      results,
      allCompleted,
      anyFailed,
    });
  } catch (error: unknown) {
    console.error('[/api/poll-status] Error:', error);
    const message = error instanceof Error ? error.message : 'Poll failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
