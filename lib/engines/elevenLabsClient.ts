// ============================================================
// lib/engines/elevenLabsClient.ts — ElevenLabs TTS Integration
// توليد تعليق صوتي بلهجة سعودية احترافية
// ============================================================

import type { AudioConfig, GeneratedAudio } from '../pipeline/pipelineTypes';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// ── Saudi Arabic Voice Presets ─────────────────────────────────────────────
export const VOICE_PRESETS = {
  saudi_male_professional: {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam - deep male
    name: 'صوت رجالي احترافي',
    description: 'صوت رجالي عربي احترافي بلهجة خليجية',
  },
  saudi_male_young: {
    id: 'VR6AewLTigWG4xSOukaG', // Arnold
    name: 'صوت شبابي حماسي',
    description: 'صوت شاب عربي حماسي للمحتوى القصير',
  },
  saudi_female_elegant: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella
    name: 'صوت نسائي أنيق',
    description: 'صوت نسائي عربي أنيق ودافئ',
  },
  narrator: {
    id: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    name: 'راوي محترف',
    description: 'صوت راوي هادئ للمحتوى التثقيفي',
  },
} as const;

export type VoicePresetId = keyof typeof VOICE_PRESETS;

// ── Generate Speech ────────────────────────────────────────────────────────

export async function generateSpeech(
  text: string,
  config: AudioConfig,
  aspectRatio: '9:16' | '16:9'
): Promise<GeneratedAudio> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  // Select voice based on aspect ratio and content type
  const voiceId = config.voiceId || selectVoiceForContent(aspectRatio);

  const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: config.stability ?? 0.7,
        similarity_boost: config.similarityBoost ?? 0.8,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} — ${errorBody}`);
  }

  // Get audio as buffer
  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

  return {
    id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    url: audioDataUrl,
    script: text,
    provider: 'elevenlabs',
    aspectRatio,
  };
}

// ── Upload Audio for Hedra ─────────────────────────────────────────────────

export async function generateAndUploadForHedra(
  text: string,
  config: AudioConfig,
  aspectRatio: '9:16' | '16:9'
): Promise<{ audioUrl: string; audioId: string; duration?: number }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  const voiceId = config.voiceId || selectVoiceForContent(aspectRatio);

  const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: config.stability ?? 0.7,
        similarity_boost: config.similarityBoost ?? 0.8,
        style: 0.5,
        use_speaker_boost: true,
      },
      output_format: 'mp3_44100_128',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ElevenLabs stream error: ${response.status} — ${errorBody}`);
  }

  const audioBuffer = await response.arrayBuffer();

  // Upload to a temporary hosting for Hedra to consume
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const uploadedUrl = await uploadAudioToHost(audioBlob);

  return {
    audioUrl: uploadedUrl,
    audioId: `el_${Date.now()}`,
  };
}

// ── Voice Selection Logic ──────────────────────────────────────────────────

function selectVoiceForContent(aspectRatio: '9:16' | '16:9'): string {
  // 9:16 (TikTok/Reels) → energetic young voice
  // 16:9 (YouTube) → professional narrator voice
  if (aspectRatio === '9:16') {
    return VOICE_PRESETS.saudi_male_young.id;
  }
  return VOICE_PRESETS.narrator.id;
}

// ── Get Available Voices ───────────────────────────────────────────────────

export async function getAvailableVoices(): Promise<Array<{ voice_id: string; name: string; labels: Record<string, string> }>> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      headers: { 'xi-api-key': apiKey },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.voices || [];
  } catch {
    return [];
  }
}

// ── Get Usage/Quota ────────────────────────────────────────────────────────

export async function getUsageInfo(): Promise<{
  characterCount: number;
  characterLimit: number;
  remainingCharacters: number;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { characterCount: 0, characterLimit: 0, remainingCharacters: 0 };
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/user/subscription`, {
      headers: { 'xi-api-key': apiKey },
    });
    if (!response.ok) throw new Error('Failed to get usage');
    const data = await response.json();
    return {
      characterCount: data.character_count || 0,
      characterLimit: data.character_limit || 0,
      remainingCharacters: (data.character_limit || 0) - (data.character_count || 0),
    };
  } catch {
    return { characterCount: 0, characterLimit: 0, remainingCharacters: 0 };
  }
}

// ── Audio Upload Helper ────────────────────────────────────────────────────

async function uploadAudioToHost(audioBlob: Blob): Promise<string> {
  // Try catbox.moe for audio hosting
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', audioBlob, 'voiceover.mp3');

  try {
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const url = await response.text();
      if (url.startsWith('https://')) return url.trim();
    }
  } catch { /* fallback below */ }

  // Return base64 data URL as fallback
  const buffer = await audioBlob.arrayBuffer();
  return `data:audio/mpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

// ── Estimate Cost ──────────────────────────────────────────────────────────

export function estimateAudioCost(text: string): number {
  const characters = text.length;
  // ElevenLabs pricing: ~$0.30 per 1000 characters for Creator plan
  return (characters / 1000) * 0.30;
}
