// ══════════════════════════════════════════════════════════════════════════════
// app/api/generate-video/route.ts — v7 (VEO 3 ENGINE)
// VERIFIED: Veo 3 Fast works with predictLongRunning + aspectRatio + durationSeconds(4-8)
// ══════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { generateVeoVideo, enhancePromptWithGemini, VEO_MODELS } from '@/lib/veoClient';
import { generateVideoContents } from '@/lib/mahwousVideoEngine';
import type { PerfumeData } from '@/lib/types';
import {
  retryWithBackoff,
  withCircuit,
  isTransientError,
} from '@/lib/engines/resilience';
import { validate, PERFUME_DATA_SCHEMA, formatIssues } from '@/lib/engines/validate';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// ─── Resilience wrappers ─────────────────────────────────────
// Gemini prompt enhancement: شبكة + rate limits محتملة → retry
async function resilientEnhance(
  voiceText: string, videoPrompt: string, name: string, brand: string,
  bottleDesc?: string, bottleLora?: string,
): Promise<string> {
  return withCircuit('gemini-enhance', () =>
    retryWithBackoff(
      () => enhancePromptWithGemini(voiceText, videoPrompt, name, brand, bottleDesc, bottleLora),
      { maxAttempts: 3, baseDelayMs: 700, perAttemptTimeoutMs: 25_000, shouldRetry: isTransientError },
    ),
  );
}

async function resilientVeoLaunch(
  params: Parameters<typeof generateVeoVideo>[0],
): Promise<Awaited<ReturnType<typeof generateVeoVideo>>> {
  return withCircuit('veo3', () =>
    retryWithBackoff(
      () => generateVeoVideo(params),
      { maxAttempts: 3, baseDelayMs: 1200, perAttemptTimeoutMs: 30_000, shouldRetry: isTransientError },
    ),
  );
}

interface VideoGenerationRequest {
  perfumeData: PerfumeData;
  imageUrl?: string;
  landscapeImageUrl?: string;
  vibe?: string;
  bottleAnalysis?: {
    description: string;
    videoDescription: string;
    loraPromptAddition: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json();
    const { perfumeData, imageUrl, landscapeImageUrl, bottleAnalysis } = body;

    if (!perfumeData?.name) {
      return NextResponse.json({ error: 'Missing required fields: perfumeData' }, { status: 400 });
    }

    const v = validate(perfumeData, PERFUME_DATA_SCHEMA);
    if (!v.ok) {
      return NextResponse.json(
        { error: 'Invalid perfumeData', issues: v.issues, summary: formatIssues(v.issues) },
        { status: 400 },
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY is not configured.' }, { status: 500 });
    }

    // Step 1: Generate content scripts
    console.log('[generate-video] Generating content scripts...');
    const contents = generateVideoContents(perfumeData);
    const { vertical, horizontal } = contents;

    // Step 2: Enhance prompts with Gemini
    console.log('[generate-video] Enhancing prompts...');
    const bottleDesc = bottleAnalysis?.description;
    const bottleLoraAddition = bottleAnalysis?.loraPromptAddition;
    const [verticalPrompt, horizontalPrompt] = await Promise.all([
      resilientEnhance(
        vertical.voiceoverText, vertical.videoPrompt,
        perfumeData.name, perfumeData.brand || 'مهووس',
        bottleDesc, bottleLoraAddition,
      ),
      resilientEnhance(
        horizontal.voiceoverText, horizontal.videoPrompt,
        perfumeData.name, perfumeData.brand || 'مهووس',
        bottleDesc, bottleLoraAddition,
      ),
    ]);

    // Step 3: Launch Veo 3 operations in parallel
    console.log('[generate-video] Launching Veo 3 Fast operations...');
    const [verticalResult, horizontalResult] = await Promise.allSettled([
      resilientVeoLaunch({ prompt: verticalPrompt, imageUrl: imageUrl || undefined, aspectRatio: '9:16', durationSeconds: 6, model: VEO_MODELS.VEO_3_FAST }),
      resilientVeoLaunch({ prompt: horizontalPrompt, imageUrl: landscapeImageUrl || imageUrl || undefined, aspectRatio: '16:9', durationSeconds: 6, model: VEO_MODELS.VEO_3_FAST }),
    ]);

    // Step 4: Build response
    const videos = [];

    if (verticalResult.status === 'fulfilled') {
      videos.push({
        operationName: verticalResult.value.operationName,
        id: verticalResult.value.operationName,
        aspectRatio: '9:16',
        voiceoverText: vertical.voiceoverText,
        hook: vertical.hook,
        scenarioName: vertical.scenarioName,
        visualFx: vertical.visualEffects || '',
        soundFx: vertical.sfxInstructions || '',
        status: 'pending',
        engine: 'veo3',
      });
    } else {
      console.error('[generate-video] Vertical failed:', verticalResult.reason);
      videos.push({
        operationName: '', id: '', aspectRatio: '9:16',
        voiceoverText: vertical.voiceoverText, hook: vertical.hook,
        scenarioName: vertical.scenarioName, visualFx: '', soundFx: '',
        status: 'failed', error: String(verticalResult.reason), engine: 'veo3',
      });
    }

    if (horizontalResult.status === 'fulfilled') {
      videos.push({
        operationName: horizontalResult.value.operationName,
        id: horizontalResult.value.operationName,
        aspectRatio: '16:9',
        voiceoverText: horizontal.voiceoverText,
        hook: horizontal.hook,
        scenarioName: horizontal.scenarioName,
        visualFx: horizontal.visualEffects || '',
        soundFx: horizontal.sfxInstructions || '',
        status: 'pending',
        engine: 'veo3',
      });
    } else {
      console.error('[generate-video] Horizontal failed:', horizontalResult.reason);
      videos.push({
        operationName: '', id: '', aspectRatio: '16:9',
        voiceoverText: horizontal.voiceoverText, hook: horizontal.hook,
        scenarioName: horizontal.scenarioName, visualFx: '', soundFx: '',
        status: 'failed', error: String(horizontalResult.reason), engine: 'veo3',
      });
    }

    const successCount = videos.filter(v => v.status === 'pending').length;
    if (successCount === 0) {
      return NextResponse.json({ error: 'All video generations failed', details: videos.map(v => v.error) }, { status: 500 });
    }

    console.log(`[generate-video] Launched ${successCount}/2 videos with Veo 3 Fast`);
    return NextResponse.json({ videos, engine: 'veo3-fast', voiceoverText: vertical.voiceoverText });

  } catch (error) {
    console.error('[generate-video] Fatal error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
