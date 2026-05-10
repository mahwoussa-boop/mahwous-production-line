// ============================================================
// app/api/pipeline/status/route.ts — Pipeline Status Check
// حالة خط الإنتاج
// ============================================================

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pipelineId } = body;

    if (!pipelineId) {
      return NextResponse.json({ error: 'Pipeline ID is required' }, { status: 400 });
    }

    // Pipeline state is managed client-side via localStorage
    // This endpoint serves as a health check and for server-side state queries
    return NextResponse.json({
      pipelineId,
      serverStatus: 'ok',
      timestamp: new Date().toISOString(),
      apis: {
        falAi: !!process.env.FAL_KEY,
        gemini: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        hedra: !!process.env.HEDRA_API_KEY,
        elevenLabs: !!process.env.ELEVENLABS_API_KEY,
        creatomate: !!process.env.CREATOMATE_API_KEY,
        metricool: !!process.env.METRICOOL_API_TOKEN,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    );
  }
}
