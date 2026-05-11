// ============================================================
// app/api/learning/record/route.ts
// POST  → سجّل أداء كابشن فيروسي (in-memory).
// GET   → اقرأ الـ insights الكلية أو لمنصة محددة.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  recordPerformance,
  computeViralScore,
  analyzeTopPerformers,
  buildOptimizationHint,
  getAllRecords,
  type PerformanceMetrics,
} from '@/lib/engines/viralPerformanceTracker';
import {
  validate,
  VIRAL_MODE_VALUES,
  VIRAL_PLATFORM_VALUES,
  formatIssues,
} from '@/lib/engines/validate';

export const dynamic = 'force-dynamic';

const HOOK_CATEGORIES = ['curiosity', 'controversy', 'story', 'education', 'ugc_bait'] as const;
const PERSONA_VOICES = ['expert', 'friend', 'hype', 'storyteller', 'educator'] as const;

interface RecordRequest {
  captionId: string;
  perfumeName: string;
  platform: string;
  hook: string;
  hookCategory: string;
  contentMode: string;
  persona: string;
  metrics: PerformanceMetrics;
  generatedAt?: string;
  viralScore?: number;
}

function validateMetrics(m: unknown): PerformanceMetrics | null {
  if (!m || typeof m !== 'object') return {};
  const r = m as Record<string, unknown>;
  const pick = (k: string): number | undefined => {
    const v = r[k];
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;
  };
  return {
    views: pick('views'),
    likes: pick('likes'),
    comments: pick('comments'),
    shares: pick('shares'),
    saves: pick('saves'),
    clickThrough: pick('clickThrough'),
  };
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const v = validate<RecordRequest>(raw, {
      captionId: { type: 'string', required: true, min: 1, max: 200 },
      perfumeName: { type: 'string', required: true, min: 1, max: 200 },
      platform: { type: 'string', required: true, enum: VIRAL_PLATFORM_VALUES },
      hook: { type: 'string', required: true, min: 1, max: 500 },
      hookCategory: { type: 'string', required: true, enum: HOOK_CATEGORIES },
      contentMode: { type: 'string', required: true, enum: VIRAL_MODE_VALUES },
      persona: { type: 'string', required: true, enum: PERSONA_VOICES },
      generatedAt: { type: 'string', required: false, max: 40 },
      viralScore: { type: 'number', required: false, min: 0, max: 100 },
    });
    if (!v.ok) {
      return NextResponse.json(
        { error: 'Invalid request', issues: v.issues, summary: formatIssues(v.issues) },
        { status: 400 },
      );
    }

    const body = v.value;
    const metrics = validateMetrics((raw as { metrics?: unknown }).metrics) ?? {};
    const viralScore = typeof body.viralScore === 'number' ? body.viralScore : computeViralScore(metrics);

    const saved = recordPerformance({
      captionId: body.captionId,
      perfumeName: body.perfumeName,
      platform: body.platform as never,
      hook: body.hook,
      hookCategory: body.hookCategory as never,
      contentMode: body.contentMode as never,
      persona: body.persona as never,
      metrics,
      viralScore,
      generatedAt: body.generatedAt ?? new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, record: saved, viralScore }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'record failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const insightsOnly = searchParams.get('mode') === 'insights';
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 500);

    const all = getAllRecords();
    const filtered = platform
      ? all.filter((r) => r.platform === platform)
      : all;

    const insights = analyzeTopPerformers(filtered, limit);
    const hint = platform
      ? buildOptimizationHint(platform as never, all)
      : null;

    if (insightsOnly) {
      return NextResponse.json({ insights, hint }, { status: 200 });
    }

    return NextResponse.json({
      total: all.length,
      filteredCount: filtered.length,
      insights,
      hint,
      records: filtered.slice(-limit),
    }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'read failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
