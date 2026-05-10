// ══════════════════════════════════════════════════════════════════════════════
// app/api/generate-video-veo/route.ts — FAL Veo 2 / Veo 3 Video Generation
//
// المحرك الأساسي: FAL.AI Veo 3 (أو Veo 2 كـ fallback)
// - يعتمد على FAL API مباشرة (نفس مفتاح FAL_KEY المستخدم للصور)
// - Veo 3: الافتراضي — جودة أعلى + صوت
// - Veo 2: fallback تلقائي إذا فشل Veo 3
// - الشخصية الموحدة MAHWOUS_MAN مدمجة في كل prompt
// - يدعم توليد 9:16 و 16:9 بالتوازي
// ══════════════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import {
  generateFalVeoVideo,
  isFalVeoAvailable,
  MAHWOUS_CHARACTER_DESC,
  type FalVeoModel,
  type FalVeoRequest,
} from '@/lib/falVeoClient';
import { generateVideoContents } from '@/lib/mahwousVideoEngine';
import { getScenarioByType, type ScenarioType } from '@/lib/talkingObjectScenarios';
import type { PerfumeData } from '@/lib/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ── LoRA constants ────────────────────────────────────────────────────────────
const MAHWOUS_LORA_URL =
  'https://v3b.fal.media/files/b/0a90eba7/OiQI7NS6N3neTl50fJHcC_pytorch_lora_weights.safetensors';
const MAHWOUS_TRIGGER = 'MAHWOUS_MAN';

// ── Request type ──────────────────────────────────────────────────────────────
interface VideoVeoRequest {
  perfumeData: PerfumeData;
  imageUrl?: string;
  landscapeImageUrl?: string;
  vibe?: string;
  videoEngine?: 'veo3' | 'veo3_fast' | 'veo2' | 'auto';
  durationSeconds?: 5 | 6 | 7 | 8;
  scenarioType?: ScenarioType;  // نوع السيناريو المطلوب
  bottleAnalysis?: {
    description: string;
    videoDescription?: string;
    loraPromptAddition?: string;
    shape?: string;
    color?: string;
    capDesign?: string;
  };
}

// ── Cost estimates ────────────────────────────────────────────────────────────
const COST_ESTIMATES: Record<string, string> = {
  veo3: '$0.35 per second × 2 videos',
  veo3_fast: '$0.20 per second × 2 videos',
  veo2: '$0.50 per 5-second video × 2',
  auto: '$0.35 per second × 2 videos (Veo 3)',
};

// ── Map engine name to FalVeoModel ────────────────────────────────────────────
function mapEngine(engine: string): FalVeoModel {
  switch (engine) {
    case 'veo3': return 'veo3';
    case 'veo3_fast': return 'veo3_fast';
    case 'veo2': return 'veo2';
    default: return 'veo3'; // auto → veo3
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: VideoVeoRequest = await request.json();

    // ── Validation ────────────────────────────────────────────────────────────
    if (!body.perfumeData?.name?.trim() || !body.perfumeData?.brand?.trim()) {
      return NextResponse.json(
        { error: 'perfumeData.name and perfumeData.brand are required.' },
        { status: 400 },
      );
    }

    if (!isFalVeoAvailable()) {
      return NextResponse.json(
        { error: 'FAL_KEY is not configured. Please add it to your environment variables.' },
        { status: 500 },
      );
    }

    const {
      perfumeData,
      vibe,
      videoEngine = 'auto',
      durationSeconds = 8,
      bottleAnalysis,
      scenarioType,
    } = body;

    const model = mapEngine(videoEngine);
    const costEstimate = COST_ESTIMATES[videoEngine] ?? COST_ESTIMATES.auto;

    console.log(`[generate-video-veo] Starting FAL Veo generation`);
    console.log(`[generate-video-veo] Product: ${perfumeData.name} by ${perfumeData.brand}`);
    console.log(`[generate-video-veo] Engine: FAL ${model.toUpperCase()}, Duration: ${durationSeconds}s`);

    // ── Generate video content/scripts using Advanced Scenario Engine ─────────
    interface ContentItem { voiceoverText: string; scenarioName: string; hook: string; veoPrompt?: string; }
    let contents: { vertical: ContentItem; horizontal: ContentItem; };

    if (scenarioType) {
      try {
        const adv = getScenarioByType(perfumeData, scenarioType);
        console.log(`[generate-video-veo] Using advanced scenario: ${adv.typeLabel}`);
        contents = {
          vertical: { voiceoverText: adv.voiceoverScript, scenarioName: adv.type, hook: adv.hook, veoPrompt: adv.veoPrompt },
          horizontal: { voiceoverText: adv.voiceoverScript, scenarioName: adv.type, hook: adv.hook, veoPrompt: adv.veoPromptLandscape },
        };
      } catch {
        const fb = getScenarioByType(perfumeData, 'classic_mahwous');
        contents = {
          vertical: { voiceoverText: fb.voiceoverScript, scenarioName: 'classic_mahwous', hook: fb.hook, veoPrompt: fb.veoPrompt },
          horizontal: { voiceoverText: fb.voiceoverScript, scenarioName: 'classic_mahwous', hook: fb.hook, veoPrompt: fb.veoPromptLandscape },
        };
      }
    } else {
      try {
        const base = generateVideoContents(perfumeData);
        contents = {
          vertical: { voiceoverText: base.vertical.voiceoverText, scenarioName: base.vertical.scenarioName, hook: base.vertical.hook },
          horizontal: { voiceoverText: base.horizontal.voiceoverText, scenarioName: base.horizontal.scenarioName, hook: base.horizontal.hook },
        };
      } catch {
        contents = {
          vertical: { voiceoverText: `${perfumeData.name} — ${perfumeData.brand}. عطر يجسّد الفخامة السعودية الأصيلة.`, scenarioName: 'luxury_desert', hook: `اكتشف ${perfumeData.name}` },
          horizontal: { voiceoverText: `${perfumeData.name} by ${perfumeData.brand}. A fragrance that defines Saudi luxury.`, scenarioName: 'palace_cinematic', hook: `Experience ${perfumeData.name}` },
        };
      }
    }

    // ── Build FAL Veo request ─────────────────────────────────────────────────
    const falVeoReq: FalVeoRequest = {
      productName: perfumeData.name,
      brandName: perfumeData.brand,
      bottleDescription: bottleAnalysis?.videoDescription || bottleAnalysis?.description,
      bottleLoraAddition: bottleAnalysis?.loraPromptAddition,
      scent: Array.isArray(perfumeData.notes)
        ? (perfumeData.notes as string[]).join(', ')
        : (perfumeData.notes as string | undefined),
      vibe,
      duration: durationSeconds,
      model,
      generateAudio: model === 'veo3',
      // Override prompts with scenario-specific ones if available
      customPromptPortrait: contents.vertical.veoPrompt,
      customPromptLandscape: contents.horizontal.veoPrompt,
    };

    console.log('[generate-video-veo] Launching FAL Veo generation (parallel 9:16 + 16:9)...');

    // ── Generate both formats in parallel ────────────────────────────────────
    const [portraitResult, landscapeResult] = await Promise.allSettled([
      generateFalVeoVideo(falVeoReq, '9:16'),
      generateFalVeoVideo(falVeoReq, '16:9'),
    ]);

    // ── Build response videos array ───────────────────────────────────────────
    const videos = [];

    // Portrait 9:16
    if (portraitResult.status === 'fulfilled') {
      videos.push({
        id: `fal_veo_portrait_${Date.now()}`,
        videoUrl: portraitResult.value.videoUrl,
        aspectRatio: '9:16',
        status: 'completed',
        engine: `FAL ${model.toUpperCase()}`,
        model: portraitResult.value.model,
        duration: portraitResult.value.duration,
        voiceoverText: contents.vertical.voiceoverText,
        scenarioName: contents.vertical.scenarioName,
        hook: contents.vertical.hook,
        characterConsistency: 'MAHWOUS_MAN LoRA — unified character',
        loraUrl: MAHWOUS_LORA_URL,
        trigger: MAHWOUS_TRIGGER,
      });
      console.log(`[generate-video-veo] Portrait 9:16 ready: ${portraitResult.value.videoUrl.substring(0, 60)}...`);
    } else {
      console.error('[generate-video-veo] Portrait 9:16 failed:', portraitResult.reason);
      if (model !== 'veo2') {
        console.log('[generate-video-veo] Trying Veo 2 fallback for 9:16...');
        try {
          const fallback = await generateFalVeoVideo({ ...falVeoReq, model: 'veo2' }, '9:16');
          videos.push({
            id: `fal_veo2_portrait_${Date.now()}`,
            videoUrl: fallback.videoUrl,
            aspectRatio: '9:16',
            status: 'completed',
            engine: 'FAL VEO2 (fallback)',
            model: fallback.model,
            duration: fallback.duration,
            voiceoverText: contents.vertical.voiceoverText,
            scenarioName: contents.vertical.scenarioName,
            hook: contents.vertical.hook,
            note: 'Fallback to Veo 2',
          });
        } catch {
          videos.push({
            id: '',
            aspectRatio: '9:16',
            status: 'failed',
            engine: `FAL ${model.toUpperCase()}`,
            error: String((portraitResult as PromiseRejectedResult).reason?.message || 'Portrait generation failed'),
            voiceoverText: contents.vertical.voiceoverText,
            scenarioName: contents.vertical.scenarioName,
            hook: contents.vertical.hook,
          });
        }
      } else {
        videos.push({
          id: '',
          aspectRatio: '9:16',
          status: 'failed',
          engine: `FAL ${model.toUpperCase()}`,
          error: String((portraitResult as PromiseRejectedResult).reason?.message || 'Portrait generation failed'),
          voiceoverText: contents.vertical.voiceoverText,
          scenarioName: contents.vertical.scenarioName,
          hook: contents.vertical.hook,
        });
      }
    }

    // Landscape 16:9
    if (landscapeResult.status === 'fulfilled') {
      videos.push({
        id: `fal_veo_landscape_${Date.now()}`,
        videoUrl: landscapeResult.value.videoUrl,
        aspectRatio: '16:9',
        status: 'completed',
        engine: `FAL ${model.toUpperCase()}`,
        model: landscapeResult.value.model,
        duration: landscapeResult.value.duration,
        voiceoverText: contents.horizontal.voiceoverText,
        scenarioName: contents.horizontal.scenarioName,
        hook: contents.horizontal.hook,
        characterConsistency: 'MAHWOUS_MAN LoRA — unified character',
        loraUrl: MAHWOUS_LORA_URL,
        trigger: MAHWOUS_TRIGGER,
      });
      console.log(`[generate-video-veo] Landscape 16:9 ready: ${landscapeResult.value.videoUrl.substring(0, 60)}...`);
    } else {
      console.error('[generate-video-veo] Landscape 16:9 failed:', landscapeResult.reason);
      if (model !== 'veo2') {
        console.log('[generate-video-veo] Trying Veo 2 fallback for 16:9...');
        try {
          const fallback = await generateFalVeoVideo({ ...falVeoReq, model: 'veo2' }, '16:9');
          videos.push({
            id: `fal_veo2_landscape_${Date.now()}`,
            videoUrl: fallback.videoUrl,
            aspectRatio: '16:9',
            status: 'completed',
            engine: 'FAL VEO2 (fallback)',
            model: fallback.model,
            duration: fallback.duration,
            voiceoverText: contents.horizontal.voiceoverText,
            scenarioName: contents.horizontal.scenarioName,
            hook: contents.horizontal.hook,
            note: 'Fallback to Veo 2',
          });
        } catch {
          videos.push({
            id: '',
            aspectRatio: '16:9',
            status: 'failed',
            engine: `FAL ${model.toUpperCase()}`,
            error: String((landscapeResult as PromiseRejectedResult).reason?.message || 'Landscape generation failed'),
            voiceoverText: contents.horizontal.voiceoverText,
            scenarioName: contents.horizontal.scenarioName,
            hook: contents.horizontal.hook,
          });
        }
      } else {
        videos.push({
          id: '',
          aspectRatio: '16:9',
          status: 'failed',
          engine: `FAL ${model.toUpperCase()}`,
          error: String((landscapeResult as PromiseRejectedResult).reason?.message || 'Landscape generation failed'),
          voiceoverText: contents.horizontal.voiceoverText,
          scenarioName: contents.horizontal.scenarioName,
          hook: contents.horizontal.hook,
        });
      }
    }

    const completedCount = videos.filter((v) => v.status === 'completed').length;
    console.log(`[generate-video-veo] ${completedCount}/2 videos completed successfully`);

    if (completedCount === 0) {
      return NextResponse.json(
        { error: 'فشل توليد الفيديو. يرجى التحقق من رصيد FAL.AI ومفتاح API.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      videos,
      engine: `FAL ${model.toUpperCase()}`,
      characterConsistency: {
        method: 'MAHWOUS_MAN LoRA',
        loraUrl: MAHWOUS_LORA_URL,
        trigger: MAHWOUS_TRIGGER,
        characterDesc: MAHWOUS_CHARACTER_DESC.trim(),
      },
      voiceoverText: contents.vertical.voiceoverText,
      costEstimate,
      completedCount,
      note: `Videos generated via FAL.AI ${model.toUpperCase()}. Character unified using MAHWOUS_MAN LoRA description.`,
    });

  } catch (error: unknown) {
    console.error('[/api/generate-video-veo] Error:', error);
    const message = error instanceof Error ? error.message : 'Video generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
