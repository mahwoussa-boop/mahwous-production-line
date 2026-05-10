// ============================================================
// app/api/montage/create/route.ts — Cloud Montage API
// المونتاج الآلي — كابشنات + موسيقى + مؤثرات
// ============================================================

import { NextResponse } from 'next/server';
import {
  createMontageWithCreatomate,
  buildRemotionConfig,
  CAPTION_STYLES,
  MUSIC_TRACKS,
} from '@/lib/engines/montageEngine';
import type { MontageConfig } from '@/lib/pipeline/pipelineTypes';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl, audioUrl, voiceoverScript, aspectRatio = '9:16', perfumeName, config } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'رابط الفيديو مطلوب' }, { status: 400 });
    }

    if (!voiceoverScript) {
      return NextResponse.json({ error: 'نص التعليق الصوتي مطلوب' }, { status: 400 });
    }

    const montageConfig: MontageConfig = {
      provider: config?.provider || (process.env.CREATOMATE_API_KEY ? 'creatomate' : 'remotion'),
      captionStyle: config?.captionStyle || 'tiktok',
      backgroundMusic: config?.backgroundMusic ?? true,
      musicTrack: config?.musicTrack,
      autoDucking: config?.autoDucking ?? true,
      soundEffects: config?.soundEffects ?? true,
      transitionStyle: config?.transitionStyle || 'cut',
    };

    // ── Creatomate Path ─────────────────────────────────────────
    if (montageConfig.provider === 'creatomate' && process.env.CREATOMATE_API_KEY) {
      try {
        const result = await createMontageWithCreatomate({
          videoUrl,
          audioUrl,
          voiceoverScript,
          config: montageConfig,
          aspectRatio,
          perfumeName: perfumeName || 'عطر مهووس',
        });

        return NextResponse.json({
          success: true,
          provider: 'creatomate',
          montage: result,
        });
      } catch (error) {
        console.error('[Montage] Creatomate error:', error);
        // Fall through to Remotion config
      }
    }

    // ── Remotion Path (returns config for client-side rendering) ──
    const remotionConfig = buildRemotionConfig({
      videoUrl,
      audioUrl,
      script: voiceoverScript,
      config: montageConfig,
      aspectRatio,
      perfumeName: perfumeName || 'عطر مهووس',
    });

    return NextResponse.json({
      success: true,
      provider: 'remotion',
      config: remotionConfig,
      message: 'تم توليد تكوين المونتاج — جاهز للعرض عبر Remotion',
    });
  } catch (error) {
    console.error('[Montage] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'فشل المونتاج' },
      { status: 500 }
    );
  }
}

// ── GET: Available styles & tracks ─────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    captionStyles: Object.entries(CAPTION_STYLES).map(([key, style]) => ({
      id: key,
      name: style.name,
    })),
    musicTracks: MUSIC_TRACKS.map(track => ({
      id: track.id,
      name: track.name,
      category: track.category,
      mood: track.mood,
    })),
    providers: {
      creatomate: !!process.env.CREATOMATE_API_KEY,
      remotion: true, // Always available as fallback
    },
  });
}
