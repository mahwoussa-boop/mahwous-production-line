// ══════════════════════════════════════════════════════════════════════════════
// app/api/poll-video-veo/route.ts — Veo 3 Operation Polling
//
// يتحقق من حالة عملية توليد Veo 3
// GET /api/poll-video-veo?operationName=operations/xxx
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { pollVeoOperation } from '@/lib/veoClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationName = searchParams.get('operationName');

  if (!operationName) {
    return NextResponse.json(
      { error: 'operationName is required' },
      { status: 400 }
    );
  }

  try {
    const result = await pollVeoOperation(operationName);

    return NextResponse.json({
      operationName,
      status: result.status,
      videoUrl: result.videoUrl,
      error: result.error,
      done: result.status === 'done' || result.status === 'failed',
    });
  } catch (error: unknown) {
    console.error('[poll-video-veo] Error:', error);
    const message = error instanceof Error ? error.message : 'Polling failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST للتحقق من عدة عمليات دفعة واحدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operationNames } = body;

    if (!Array.isArray(operationNames) || operationNames.length === 0) {
      return NextResponse.json(
        { error: 'operationNames array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      operationNames.map((name: string) => pollVeoOperation(name))
    );

    const statuses = results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return {
          operationName: operationNames[i],
          status: result.value.status,
          videoUrl: result.value.videoUrl,
          error: result.value.error,
          done: result.value.status === 'done' || result.value.status === 'failed',
        };
      }
      return {
        operationName: operationNames[i],
        status: 'failed',
        error: String(result.reason?.message || 'Poll failed'),
        done: true,
      };
    });

    const allDone = statuses.every(s => s.done);

    return NextResponse.json({
      statuses,
      allDone,
    });
  } catch (error: unknown) {
    console.error('[poll-video-veo] POST Error:', error);
    const message = error instanceof Error ? error.message : 'Polling failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
