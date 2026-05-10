// ══════════════════════════════════════════════════════════════════════════════
// app/api/poll-video/route.ts — v7 (VEO 3 ENGINE)
// Polls Veo 3 operations for video generation status
// ══════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { pollVeoOperation } from '@/lib/veoClient';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

interface PollVideoRequest {
  videos: Array<{
    id: string;
    operationName?: string;
    aspectRatio: string;
    engine?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { videos }: PollVideoRequest = await request.json();

    if (!videos || !Array.isArray(videos)) {
      return NextResponse.json({ error: 'videos array required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY is not configured.' }, { status: 500 });
    }

    const results = await Promise.all(
      videos.map(async (video) => {
        // Support both operationName (new) and id (legacy)
        const opName = video.operationName || video.id;

        if (!opName) {
          return { ...video, status: 'failed', videoUrl: null, error: 'No operation name' };
        }

        try {
          const result = await pollVeoOperation(opName);

          if (result.status === 'done' && result.videoUrl) {
            return {
              ...video,
              status: 'complete',
              videoUrl: result.videoUrl,
              progress: 100,
            };
          }

          if (result.status === 'failed') {
            return {
              ...video,
              status: 'failed',
              videoUrl: null,
              error: result.error || 'Video generation failed',
            };
          }

          // Still processing
          return {
            ...video,
            status: 'processing',
            videoUrl: null,
            progress: 50,
          };

        } catch (err) {
          console.error(`[poll-video] Error polling ${opName}:`, err);
          return {
            ...video,
            status: 'failed',
            videoUrl: null,
            error: err instanceof Error ? err.message : 'Poll failed',
          };
        }
      })
    );

    return NextResponse.json({ videos: results });

  } catch (error) {
    console.error('[poll-video] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
