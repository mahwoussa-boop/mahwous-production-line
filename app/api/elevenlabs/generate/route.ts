// ============================================================
// app/api/elevenlabs/generate/route.ts — ElevenLabs TTS API
// توليد صوت بشري بلهجة سعودية عبر ElevenLabs
// ============================================================

import { NextResponse } from 'next/server';
import { generateSpeech, getUsageInfo, estimateAudioCost, VOICE_PRESETS } from '@/lib/engines/elevenLabsClient';
import type { AudioConfig } from '@/lib/pipeline/pipelineTypes';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, aspectRatio = '9:16', config } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'النص مطلوب لتوليد الصوت' }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        error: 'ELEVENLABS_API_KEY غير مُعَد. يرجى إضافته في ملف .env.local',
        fallback: 'hedra',
      }, { status: 400 });
    }

    // Check usage quota
    const usage = await getUsageInfo();
    const estimatedCost = estimateAudioCost(text);

    if (usage.remainingCharacters > 0 && usage.remainingCharacters < text.length) {
      return NextResponse.json({
        error: `الرصيد المتبقي (${usage.remainingCharacters} حرف) لا يكفي للنص المطلوب (${text.length} حرف)`,
        usage,
      }, { status: 400 });
    }

    const audioConfig: AudioConfig = {
      provider: 'elevenlabs',
      dialect: config?.dialect || 'saudi',
      speed: config?.speed || 1.0,
      stability: config?.stability || 0.7,
      similarityBoost: config?.similarityBoost || 0.8,
      voiceId: config?.voiceId,
    };

    const audio = await generateSpeech(text, audioConfig, aspectRatio);

    return NextResponse.json({
      success: true,
      audio: {
        id: audio.id,
        url: audio.url,
        script: audio.script,
        provider: audio.provider,
        aspectRatio: audio.aspectRatio,
      },
      estimatedCost,
      usage,
    });
  } catch (error) {
    console.error('[ElevenLabs] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'فشل توليد الصوت',
        fallback: 'hedra',
      },
      { status: 500 }
    );
  }
}

// ── GET: Voice list & usage info ───────────────────────────────────────────

export async function GET() {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        configured: false,
        message: 'ElevenLabs غير مُعَد',
      });
    }

    const usage = await getUsageInfo();

    return NextResponse.json({
      configured: true,
      presets: Object.entries(VOICE_PRESETS).map(([key, preset]) => ({
        id: key,
        voiceId: preset.id,
        name: preset.name,
        description: preset.description,
      })),
      usage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get ElevenLabs info' },
      { status: 500 }
    );
  }
}
