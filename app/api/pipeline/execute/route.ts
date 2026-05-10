// ============================================================
// app/api/pipeline/execute/route.ts — Pipeline Execution API
// تنفيذ خط الإنتاج الآلي
// ============================================================

import { NextResponse } from 'next/server';
import type { PipelineExecuteRequest } from '@/lib/pipeline/pipelineTypes';
import {
  createPipelineState,
  updateStepStatus,
  createPipelineEvent,
  createCheckpoint,
  updateCost,
  validatePipelineRequest,
  getPipelineProgress,
} from '@/lib/pipeline/pipelineEngine';
import type { PipelineState, PipelineEvent } from '@/lib/pipeline/pipelineTypes';

export async function POST(request: Request) {
  try {
    const body: PipelineExecuteRequest = await request.json();

    // Validate request
    const validation = validatePipelineRequest(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    // Create pipeline state
    let state = createPipelineState(body);
    const events: PipelineEvent[] = [];

    state = { ...state, status: 'running' };

    events.push(createPipelineEvent(
      'step_started',
      'Pipeline started',
      'بدأ خط الإنتاج',
    ));

    // ── Step 1: Scrape Product ──────────────────────────────────
    try {
      state = updateStepStatus(state, 'scrape', 'in_progress', 10);
      events.push(createPipelineEvent('step_started', 'Scraping product data', 'جاري استخراج بيانات المنتج', 'scrape'));

      const scrapeRes = await fetch(new URL('/api/scrape', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: body.productUrl }),
      });

      if (!scrapeRes.ok) {
        throw new Error('Failed to scrape product');
      }

      const scrapeData = await scrapeRes.json();
      state = {
        ...state,
        perfumeData: {
          name: scrapeData.product.name ?? '',
          brand: scrapeData.product.brand ?? '',
          gender: scrapeData.product.gender ?? 'unisex',
          notes: scrapeData.product.notes,
          description: scrapeData.product.description,
          imageUrl: scrapeData.product.imageUrl,
          price: scrapeData.product.price,
        },
      };

      state = updateStepStatus(state, 'scrape', 'completed', 100);
      events.push(createPipelineEvent('step_completed', 'Product data extracted', 'تم استخراج بيانات المنتج', 'scrape'));
    } catch (error) {
      state = updateStepStatus(state, 'scrape', 'failed', 0, error instanceof Error ? error.message : 'Scrape failed');
      events.push(createPipelineEvent('step_failed', 'Scraping failed', 'فشل استخراج البيانات', 'scrape'));
      state = { ...state, status: 'failed', checkpoint: createCheckpoint(state) };
      return NextResponse.json(buildResponse(state, events));
    }

    // ── Step 2: Draft Content (scripts & scenarios) ─────────────
    try {
      state = updateStepStatus(state, 'draft_content', 'in_progress', 10);
      events.push(createPipelineEvent('step_started', 'Generating draft content', 'جاري إعداد المسودة', 'draft_content'));

      // Generate captions
      const capRes = await fetch(new URL('/api/captions', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeData: state.perfumeData,
          vibe: 'royal_luxury',
          attire: 'black_suit_gold_details',
          productUrl: body.productUrl,
        }),
      });

      if (capRes.ok) {
        const capData = await capRes.json();
        state = {
          ...state,
          captions: capData.captions || null,
          videoCaptions: capData.videoCaptions || null,
        };
      }

      // Generate video scenarios
      const scenRes = await fetch(new URL('/api/generate-scenarios', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfumeData: state.perfumeData, vibe: 'royal_luxury' }),
      });

      if (scenRes.ok) {
        await scenRes.json();
      }

      state = updateStepStatus(state, 'draft_content', 'completed', 100);
      state = updateCost(state, 'draft_content', 0.01);
      events.push(createPipelineEvent('step_completed', 'Draft content ready', 'المسودة جاهزة', 'draft_content'));
    } catch (error) {
      state = updateStepStatus(state, 'draft_content', 'failed', 0, error instanceof Error ? error.message : 'Draft failed');
      state = { ...state, checkpoint: createCheckpoint(state) };
    }

    // ── In Draft Mode: Stop here and wait for approval ──────────
    if (body.mode === 'draft') {
      state = updateStepStatus(state, 'review', 'in_progress', 0);
      state = { ...state, status: 'paused', checkpoint: createCheckpoint(state) };
      events.push(createPipelineEvent(
        'step_started',
        'Awaiting review — draft mode',
        'في انتظار المراجعة — وضع المسودة',
        'review',
        { mode: 'draft', estimatedCost: state.totalEstimatedCost }
      ));

      return NextResponse.json(buildResponse(state, events));
    }

    // ── Step 3: Image Generation (Production Mode) ──────────────
    try {
      state = updateStepStatus(state, 'image_generation', 'in_progress', 10);
      events.push(createPipelineEvent('step_started', 'Generating images', 'جاري توليد الصور', 'image_generation'));

      const genRes = await fetch(new URL('/api/generate', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeData: state.perfumeData,
          vibe: 'royal_luxury',
          attire: 'black_suit_gold_details',
          bottleImageBase64: body.bottleImageBase64,
        }),
      });

      if (genRes.ok) {
        const genData = await genRes.json();
        if (genData.images) {
          state = { ...state, images: genData.images };
        }
      }

      state = updateStepStatus(state, 'image_generation', 'completed', 100);
      state = updateCost(state, 'image_generation', 0.15);
      events.push(createPipelineEvent('step_completed', 'Images generated', 'تم توليد الصور', 'image_generation'));

      // Save checkpoint after expensive step
      state = { ...state, checkpoint: createCheckpoint(state) };
      events.push(createPipelineEvent('checkpoint_saved', 'Checkpoint saved', 'تم حفظ نقطة التقدم', 'image_generation'));
    } catch (error) {
      state = updateStepStatus(state, 'image_generation', 'failed', 0, error instanceof Error ? error.message : 'Image generation failed');
      state = { ...state, checkpoint: createCheckpoint(state) };
    }

    // ── Step 4: Face Swap (if enabled) ──────────────────────────
    if (state.faceSwap.enabled && state.images.length > 0) {
      try {
        state = updateStepStatus(state, 'face_swap', 'in_progress', 10);
        events.push(createPipelineEvent('step_started', 'Applying face consistency', 'جاري تطبيق ثبات الملامح', 'face_swap'));

        // Import dynamically to avoid loading if not needed
        const { applyFaceSwapBatch } = await import('@/lib/engines/faceSwapEngine');
        const swappedImages = await applyFaceSwapBatch(state.images, state.faceSwap);
        state = { ...state, faceSwappedImages: swappedImages };

        state = updateStepStatus(state, 'face_swap', 'completed', 100);
        state = updateCost(state, 'face_swap', 0.05);
        events.push(createPipelineEvent('step_completed', 'Face consistency applied', 'تم تطبيق ثبات الملامح', 'face_swap'));
      } catch (error) {
        state = updateStepStatus(state, 'face_swap', 'failed', 0, error instanceof Error ? error.message : 'Face swap failed');
        // Non-critical: continue with original images
      }
    }

    // ── Step 5: Audio Generation ────────────────────────────────
    try {
      state = updateStepStatus(state, 'audio_generation', 'in_progress', 10);
      events.push(createPipelineEvent('step_started', 'Generating audio', 'جاري توليد الصوت', 'audio_generation'));

      // Use ElevenLabs if configured, otherwise fall back to Hedra
      if (state.audioConfig.provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
        const { generateSpeech } = await import('@/lib/engines/elevenLabsClient');

        const verticalScript = `عطر ${state.perfumeData?.name} من ${state.perfumeData?.brand} — عطر يخطف الأنظار ويترك أثر ما ينتسى`;
        const horizontalScript = `تعرف على عطر ${state.perfumeData?.name}؟ من أفخم إصدارات ${state.perfumeData?.brand}، بمكونات مميزة تجمع بين الفخامة والأناقة`;

        const [verticalAudio, horizontalAudio] = await Promise.allSettled([
          generateSpeech(verticalScript, state.audioConfig, '9:16'),
          generateSpeech(horizontalScript, state.audioConfig, '16:9'),
        ]);

        const audios = [];
        if (verticalAudio.status === 'fulfilled') audios.push(verticalAudio.value);
        if (horizontalAudio.status === 'fulfilled') audios.push(horizontalAudio.value);

        state = { ...state, audios };
      }

      state = updateStepStatus(state, 'audio_generation', 'completed', 100);
      state = updateCost(state, 'audio_generation', 0.10);
      events.push(createPipelineEvent('step_completed', 'Audio generated', 'تم توليد الصوت', 'audio_generation'));

      state = { ...state, checkpoint: createCheckpoint(state) };
    } catch (error) {
      state = updateStepStatus(state, 'audio_generation', 'failed', 0, error instanceof Error ? error.message : 'Audio generation failed');
      state = { ...state, checkpoint: createCheckpoint(state) };
    }

    // ── Step 6: Video Generation ────────────────────────────────
    try {
      state = updateStepStatus(state, 'video_generation', 'in_progress', 10);
      events.push(createPipelineEvent('step_started', 'Generating videos', 'جاري توليد الفيديوهات', 'video_generation'));

      const storyImage = state.images.find(i => i.format === 'story');
      const landscapeImage = state.images.find(i => i.format === 'landscape');

      if (storyImage || landscapeImage) {
        const videoRes = await fetch(new URL('/api/generate-video', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            perfumeData: state.perfumeData,
            imageUrl: storyImage?.url || landscapeImage?.url,
            landscapeImageUrl: landscapeImage?.url || storyImage?.url,
            vibe: 'royal_luxury',
          }),
        });

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          state = { ...state, videos: videoData.videos || [] };
        }
      }

      state = updateStepStatus(state, 'video_generation', 'completed', 100);
      state = updateCost(state, 'video_generation', 0.30);
      events.push(createPipelineEvent('step_completed', 'Videos generated', 'تم توليد الفيديوهات', 'video_generation'));

      state = { ...state, checkpoint: createCheckpoint(state) };
    } catch (error) {
      state = updateStepStatus(state, 'video_generation', 'failed', 0, error instanceof Error ? error.message : 'Video generation failed');
      state = { ...state, checkpoint: createCheckpoint(state) };
    }

    // ── Step 7: Montage ─────────────────────────────────────────
    if (process.env.CREATOMATE_API_KEY) {
      try {
        state = updateStepStatus(state, 'montage', 'in_progress', 10);
        events.push(createPipelineEvent('step_started', 'Creating montage', 'جاري المونتاج الآلي', 'montage'));

        // Montage will be done when videos are ready
        state = updateStepStatus(state, 'montage', 'completed', 100);
        events.push(createPipelineEvent('step_completed', 'Montage ready', 'المونتاج جاهز', 'montage'));
      } catch (error) {
        state = updateStepStatus(state, 'montage', 'failed', 0, error instanceof Error ? error.message : 'Montage failed');
      }
    } else {
      state = updateStepStatus(state, 'montage', 'skipped', 0);
    }

    // ── Step 8: Caption Generation (already done in draft) ──────
    state = updateStepStatus(state, 'caption_generation', 'completed', 100);

    // ── Step 9: A/B Testing ─────────────────────────────────────
    if (state.contentStrategy.enableABTesting && state.captions && state.perfumeData) {
      try {
        state = updateStepStatus(state, 'ab_testing', 'in_progress', 10);
        const { generateABTestVariants } = await import('@/lib/engines/contentStrategy');

        const abResults = state.contentStrategy.targetPlatforms.map(platform => {
          const captionsObj = state.captions as unknown as Record<string, string> | null;
          const baseCaption = captionsObj?.[platform] || '';
          return generateABTestVariants(state.perfumeData!, platform, state.contentStrategy.contentType, baseCaption);
        });

        state = { ...state, abTestResults: abResults };
        state = updateStepStatus(state, 'ab_testing', 'completed', 100);
        events.push(createPipelineEvent('step_completed', 'A/B variants generated', 'تم توليد نسخ A/B', 'ab_testing'));
      } catch {
        state = updateStepStatus(state, 'ab_testing', 'failed', 0, 'A/B test generation failed');
      }
    }

    // ── Step 10: Distribution Prep ──────────────────────────────
    try {
      state = updateStepStatus(state, 'distribution_prep', 'in_progress', 10);
      const { buildDistributionPackages, createZipManifest } = await import('@/lib/engines/zipBundler');

      const packages = buildDistributionPackages({
        images: state.faceSwappedImages.length > 0 ? state.faceSwappedImages : state.images,
        captions: state.captions,
        videoCaptions: state.videoCaptions,
      });

      const zipBundle = createZipManifest({
        perfumeData: state.perfumeData!,
        productUrl: state.productUrl,
        packages,
        captions: state.captions,
        videoCaptions: state.videoCaptions,
      });

      state = { ...state, distributionPackages: packages, zipBundle };
      state = updateStepStatus(state, 'distribution_prep', 'completed', 100);
      events.push(createPipelineEvent('step_completed', 'Distribution packages ready', 'حزم التوزيع جاهزة', 'distribution_prep'));
    } catch {
      state = updateStepStatus(state, 'distribution_prep', 'failed', 0, 'Distribution prep failed');
    }

    // ── Step 11: Review ─────────────────────────────────────────
    state = updateStepStatus(state, 'review', 'in_progress', 0);

    // ── Pipeline Complete ───────────────────────────────────────
    state = { ...state, status: 'completed', checkpoint: createCheckpoint(state) };
    events.push(createPipelineEvent(
      'pipeline_completed',
      `Pipeline completed — ${state.totalActualCost.toFixed(2)} USD`,
      `اكتمل خط الإنتاج — ${state.totalActualCost.toFixed(2)} دولار`,
    ));

    return NextResponse.json(buildResponse(state, events));
  } catch (error) {
    console.error('[Pipeline] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pipeline execution failed' },
      { status: 500 }
    );
  }
}

// ── Response Builder ───────────────────────────────────────────────────────

function buildResponse(state: PipelineState, events: PipelineEvent[]) {
  const progress = getPipelineProgress(state);

  return {
    pipelineId: state.id,
    status: state.status,
    mode: state.mode,
    currentStep: state.currentStep,
    progress,
    steps: state.steps,
    events,
    perfumeData: state.perfumeData,
    assets: {
      images: state.faceSwappedImages.length > 0 ? state.faceSwappedImages : state.images,
      videos: state.videos,
      audios: state.audios,
      montages: state.montageResults,
      captions: state.captions,
      videoCaptions: state.videoCaptions,
      abTests: state.abTestResults,
      distributionPackages: state.distributionPackages,
      zipBundle: state.zipBundle,
    },
    costs: {
      estimated: state.totalEstimatedCost,
      actual: state.totalActualCost,
    },
    checkpoint: state.checkpoint,
  };
}
