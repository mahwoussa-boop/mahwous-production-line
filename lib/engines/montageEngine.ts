// ============================================================
// lib/engines/montageEngine.ts — Automated Montage Engine
// المونتاج الآلي — نصوص ديناميكية + موسيقى + مؤثرات
// Supports Remotion (local) and Creatomate (API)
// ============================================================

import type { MontageConfig, MontageResult } from '../pipeline/pipelineTypes';

const CREATOMATE_API_BASE = 'https://api.creatomate.com/v1';

// ── Caption Styles ─────────────────────────────────────────────────────────

export const CAPTION_STYLES = {
  tiktok: {
    id: 'tiktok',
    name: 'ستايل تيك توك',
    fontFamily: 'Noto Sans Arabic',
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: '8px 16px',
    position: 'bottom-center',
    animation: 'word-by-word',
    highlightColor: '#FFD700',
  },
  minimal: {
    id: 'minimal',
    name: 'بسيط وأنيق',
    fontFamily: 'Noto Naskh Arabic',
    fontSize: 36,
    fontWeight: 'normal',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: '4px 8px',
    position: 'bottom-center',
    animation: 'fade',
    highlightColor: '#C9A84C',
  },
  cinematic: {
    id: 'cinematic',
    name: 'سينمائي',
    fontFamily: 'Noto Naskh Arabic',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#C9A84C',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: '12px 24px',
    position: 'center',
    animation: 'typewriter',
    highlightColor: '#FFFFFF',
  },
  bold: {
    id: 'bold',
    name: 'عريض وواضح',
    fontFamily: 'Noto Sans Arabic',
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: '#C9A84C',
    borderRadius: 12,
    padding: '10px 20px',
    position: 'bottom-center',
    animation: 'pop',
    highlightColor: '#000000',
  },
} as const;

// ── Background Music Library ───────────────────────────────────────────────

export const MUSIC_TRACKS = [
  {
    id: 'luxury_ambient',
    name: 'أجواء فاخرة',
    category: 'ambient',
    bpm: 80,
    mood: 'luxury',
    url: '', // Will be provided by user or fetched from library
  },
  {
    id: 'energetic_arabic',
    name: 'حماسي عربي',
    category: 'upbeat',
    bpm: 120,
    mood: 'energetic',
    url: '',
  },
  {
    id: 'soft_oud',
    name: 'عود هادئ',
    category: 'traditional',
    bpm: 70,
    mood: 'warm',
    url: '',
  },
  {
    id: 'modern_trap',
    name: 'تراب حديث',
    category: 'modern',
    bpm: 140,
    mood: 'trendy',
    url: '',
  },
];

// ── Sound Effects Library ──────────────────────────────────────────────────

export const SOUND_EFFECTS = {
  whoosh: { name: 'انتقال سريع', duration: 0.5 },
  sparkle: { name: 'بريق', duration: 1.0 },
  spray: { name: 'رش العطر', duration: 1.5 },
  reveal: { name: 'كشف', duration: 0.8 },
  ding: { name: 'تنبيه', duration: 0.3 },
  bass_drop: { name: 'بيس دروب', duration: 1.0 },
} as const;

// ── Creatomate Montage ─────────────────────────────────────────────────────

export async function createMontageWithCreatomate(params: {
  videoUrl: string;
  audioUrl?: string;
  voiceoverScript: string;
  config: MontageConfig;
  aspectRatio: '9:16' | '1:1' | '16:9';
  perfumeName: string;
}): Promise<MontageResult> {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    throw new Error('CREATOMATE_API_KEY is not configured');
  }

  const captionStyle = CAPTION_STYLES[params.config.captionStyle] || CAPTION_STYLES.tiktok;

  // Build Creatomate render request
  const renderRequest = buildCreatomateRequest({
    videoUrl: params.videoUrl,
    audioUrl: params.audioUrl,
    script: params.voiceoverScript,
    captionStyle,
    config: params.config,
    aspectRatio: params.aspectRatio,
    perfumeName: params.perfumeName,
  });

  const response = await fetch(`${CREATOMATE_API_BASE}/renders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(renderRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Creatomate error: ${response.status} — ${errorText}`);
  }

  const renderData = await response.json();
  const renderId = Array.isArray(renderData) ? renderData[0]?.id : renderData.id;

  if (!renderId) {
    throw new Error('No render ID returned from Creatomate');
  }

  // Poll for completion
  const result = await pollCreatomateRender(renderId, apiKey);

  return {
    videoUrl: result.url,
    aspectRatio: params.aspectRatio,
    duration: result.duration || 0,
    withCaptions: true,
    withMusic: params.config.backgroundMusic,
  };
}

// ── Build Creatomate Request ───────────────────────────────────────────────

function buildCreatomateRequest(params: {
  videoUrl: string;
  audioUrl?: string;
  script: string;
  captionStyle: typeof CAPTION_STYLES[keyof typeof CAPTION_STYLES];
  config: MontageConfig;
  aspectRatio: '9:16' | '1:1' | '16:9';
  perfumeName: string;
}) {
  const { width, height } = getResolution(params.aspectRatio);

  // Split script into caption segments
  const segments = splitScriptIntoSegments(params.script);

  const elements: Record<string, unknown>[] = [
    // Base video
    {
      type: 'video',
      source: params.videoUrl,
      fit: 'cover',
    },
  ];

  // Add caption overlays
  segments.forEach((segment, index) => {
    elements.push({
      type: 'text',
      text: segment.text,
      font_family: params.captionStyle.fontFamily,
      font_size: `${params.captionStyle.fontSize}px`,
      font_weight: params.captionStyle.fontWeight,
      color: params.captionStyle.color,
      background_color: params.captionStyle.backgroundColor,
      border_radius: `${params.captionStyle.borderRadius}px`,
      x_padding: params.captionStyle.padding,
      y_alignment: params.captionStyle.position === 'center' ? '50%' : '85%',
      x_alignment: '50%',
      time: segment.startTime,
      duration: segment.duration,
      animations: [
        {
          type: params.captionStyle.animation === 'word-by-word' ? 'text-appear' :
                params.captionStyle.animation === 'fade' ? 'fade' :
                params.captionStyle.animation === 'pop' ? 'scale' : 'fade',
          duration: 0.3,
        },
      ],
    });
  });

  // Add background music with auto-ducking
  if (params.config.backgroundMusic && params.audioUrl) {
    elements.push({
      type: 'audio',
      source: params.audioUrl,
      volume: params.config.autoDucking ? '30%' : '50%',
      // Auto-ducking: reduce music volume during speech
      ...(params.config.autoDucking && {
        audio_fade: true,
      }),
    });
  }

  // Add brand watermark
  elements.push({
    type: 'text',
    text: params.perfumeName,
    font_family: 'Noto Naskh Arabic',
    font_size: '18px',
    color: '#C9A84C',
    x_alignment: '50%',
    y_alignment: '5%',
    opacity: '60%',
  });

  return {
    output_format: 'mp4',
    width,
    height,
    elements,
  };
}

// ── Remotion Configuration (for local rendering) ───────────────────────────

export function buildRemotionConfig(params: {
  videoUrl: string;
  audioUrl?: string;
  script: string;
  config: MontageConfig;
  aspectRatio: '9:16' | '1:1' | '16:9';
  perfumeName: string;
}) {
  const { width, height } = getResolution(params.aspectRatio);
  const captionStyle = CAPTION_STYLES[params.config.captionStyle] || CAPTION_STYLES.tiktok;
  const segments = splitScriptIntoSegments(params.script);

  return {
    compositionId: 'PerfumeMontage',
    inputProps: {
      videoUrl: params.videoUrl,
      audioUrl: params.audioUrl,
      perfumeName: params.perfumeName,
      segments,
      captionStyle,
      backgroundMusic: params.config.backgroundMusic,
      autoDucking: params.config.autoDucking,
      soundEffects: params.config.soundEffects,
      transitionStyle: params.config.transitionStyle,
    },
    width,
    height,
    fps: 30,
    durationInFrames: 900, // 30 seconds at 30fps
  };
}

// ── Script Segmentation ────────────────────────────────────────────────────

interface CaptionSegment {
  text: string;
  startTime: number;
  duration: number;
  index: number;
}

function splitScriptIntoSegments(script: string): CaptionSegment[] {
  // Split by punctuation and natural pauses
  const sentences = script
    .split(/[.،!؟\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const avgDuration = 2.5; // seconds per segment
  const gap = 0.2; // gap between segments

  return sentences.map((text, index) => ({
    text,
    startTime: index * (avgDuration + gap),
    duration: avgDuration,
    index,
  }));
}

// ── Resolution Helper ──────────────────────────────────────────────────────

function getResolution(aspectRatio: '9:16' | '1:1' | '16:9'): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16': return { width: 1080, height: 1920 };
    case '1:1': return { width: 1080, height: 1080 };
    case '16:9': return { width: 1920, height: 1080 };
  }
}

// ── Poll Creatomate Render ─────────────────────────────────────────────────

async function pollCreatomateRender(
  renderId: string,
  apiKey: string,
  maxAttempts = 60
): Promise<{ url: string; duration?: number }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));

    const response = await fetch(`${CREATOMATE_API_BASE}/renders/${renderId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) continue;
    const data = await response.json();

    if (data.status === 'succeeded' && data.url) {
      return { url: data.url, duration: data.duration };
    }

    if (data.status === 'failed') {
      throw new Error(`Creatomate render failed: ${data.error_message || 'Unknown error'}`);
    }
  }

  throw new Error('Creatomate render timed out');
}

// ── Estimate Cost ──────────────────────────────────────────────────────────

export function estimateMontageCost(videoCount: number, provider: 'remotion' | 'creatomate'): number {
  if (provider === 'remotion') return 0; // Self-hosted
  // Creatomate: ~$0.05 per render
  return videoCount * 0.05;
}
