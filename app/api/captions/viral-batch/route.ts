// ============================================================
// app/api/captions/viral-batch/route.ts
// POST /api/captions/viral-batch
// استدعاء AI واحد يولّد كابشنات فيروسية لكل المنصات المطلوبة دفعةً واحدة.
// يخفّض تكلفة API ~80% مقارنة بالاستدعاء لكل منصة.
// Additive — مسار جديد، لا يمسّ /api/captions الأصلي.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { PerfumeData } from '@/lib/types';
import { MAHWOUS_IDENTITY, analyzePerfume } from '@/lib/mahwousCaptionEngine';
import {
  buildViralBlueprint,
  blueprintToPromptFragment,
  getStarInsight,
  type ContentMode,
  type ViralPlatform,
} from '@/lib/engines/viralContentEngine';
import {
  getActiveTrends,
  trendToPromptFragment,
} from '@/lib/engines/trendAnalyzer';
import { validate, PERFUME_DATA_SCHEMA, VIRAL_MODE_VALUES, VIRAL_PLATFORM_VALUES, formatIssues, type ValidationResult } from '@/lib/engines/validate';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface BatchRequest {
  perfumeData: PerfumeData;
  mode: ContentMode;
  platforms: ViralPlatform[];
  productUrl?: string;
}

interface BatchCaption {
  platform: ViralPlatform;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

interface BatchResponse {
  captions: Record<string, BatchCaption>;
  analysis: ReturnType<typeof analyzePerfume>;
  meta: { source: string; cached: boolean; trendUsed?: string };
}

// ─── In-memory cache ─────────────────────────────────────────
const BATCH_CACHE = new Map<string, { body: BatchResponse; expiresAt: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;

function cacheKey(req: BatchRequest): string {
  const p = req.perfumeData;
  const notes = typeof p.notes === 'string' ? p.notes : '';
  return [
    (p.name || '').trim().toLowerCase(),
    (p.brand || '').trim().toLowerCase(),
    notes.slice(0, 80).toLowerCase(),
    req.mode,
    [...req.platforms].sort().join(','),
  ].join('|');
}

function cacheGet(k: string): BatchResponse | null {
  const e = BATCH_CACHE.get(k);
  if (!e) return null;
  if (e.expiresAt < Date.now()) { BATCH_CACHE.delete(k); return null; }
  return e.body;
}
function cacheSet(k: string, v: BatchResponse): void {
  if (BATCH_CACHE.size >= MAX_ENTRIES) {
    const first = BATCH_CACHE.keys().next().value;
    if (first) BATCH_CACHE.delete(first);
  }
  BATCH_CACHE.set(k, { body: v, expiresAt: Date.now() + TTL_MS });
}

// ─── Validation ──────────────────────────────────────────────
function validateBatch(body: unknown): ValidationResult<BatchRequest> {
  const top = validate<{ mode: string }>(body, {
    mode: { type: 'string', required: true, enum: VIRAL_MODE_VALUES },
  });
  if (!top.ok) return top;

  const perfume = (body as { perfumeData?: unknown })?.perfumeData;
  const sub = validate(perfume, PERFUME_DATA_SCHEMA);
  if (!sub.ok) {
    return {
      ok: false,
      issues: sub.issues.map((i) => ({ path: `perfumeData.${i.path}`, message: i.message })),
    };
  }

  const platforms = (body as { platforms?: unknown })?.platforms;
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return { ok: false, issues: [{ path: 'platforms', message: 'expected non-empty array' }] };
  }
  for (const p of platforms) {
    if (typeof p !== 'string' || !VIRAL_PLATFORM_VALUES.includes(p as never)) {
      return { ok: false, issues: [{ path: 'platforms', message: `invalid platform: ${String(p)}` }] };
    }
  }

  return { ok: true, value: body as BatchRequest };
}

// ─── Unified prompt builder ──────────────────────────────────
function buildUnifiedPrompt(req: BatchRequest, productUrl: string): string {
  const analysis = analyzePerfume(
    req.perfumeData.gender,
    typeof req.perfumeData.notes === 'string' ? req.perfumeData.notes : '',
    req.perfumeData.description,
    req.perfumeData.price,
  );

  const blueprints = req.platforms.map((pl) => {
    const bp = buildViralBlueprint(req.perfumeData, pl, req.mode);
    return `\n— Platform: ${pl} —\n${blueprintToPromptFragment(bp)}`;
  }).join('\n');

  const trends = getActiveTrends(req.perfumeData).slice(0, 2);
  const trendsBlock = trends.length
    ? `\n[ACTIVE TRENDS — استخدم زاوية مناسبة]\n${trends.map(trendToPromptFragment).join('\n\n')}`
    : '';

  const star = getStarInsight(req.perfumeData);

  return `
أنت ${MAHWOUS_IDENTITY.name} — ${MAHWOUS_IDENTITY.personality}.
ملاحظة: ${MAHWOUS_IDENTITY.note}.
الواتساب: ${MAHWOUS_IDENTITY.whatsapp} | الموقع: ${productUrl}.

[المنتج]
الاسم: ${req.perfumeData.name}
الماركة: ${req.perfumeData.brand ?? '-'}
الجنس: ${analysis.genderLabel}
النوتات: ${analysis.notesAr}
الجمهور: ${analysis.targetAudience}
الشخصية: ${analysis.personality}
المناسبة: ${analysis.occasion}
الموسم: ${analysis.season}

[معلومة لافتة — استعملها في الكابشن التعليمي إن طبّق]
${star}
${trendsBlock}

[القواعد الصارمة]
- اكتب باللهجة السعودية الطبيعية — ممنوع الفصحى الجامدة وممنوع اللهجات الأخرى.
- ممنوع كتابة المكونات بالإنجليزي.
- الجملة الأولى ≤ ${8} كلمات (Thumb-stop).
- لا تذكر "أصلية 100%" بشكل مباشر متكرر — استعمل خبرة مهووس ضمنياً.
- استعمل الـ Hook المُعطى لكل منصة كنواة ثم وسّع بصوت Persona المحدد.

[المنصات والـ Blueprints]
${blueprints}

[المخرجات المطلوبة]
أعد JSON صالح فقط بهذا الشكل بدون أي شرح:
{
  "${req.platforms[0]}": {
    "hook": "string ≤ ${8} كلمات",
    "body": "string — جسم الكابشن باللهجة السعودية",
    "cta": "string — دعوة للفعل",
    "hashtags": ["#hash1", "#hash2"]
  }${req.platforms.length > 1 ? ',\n  ...بقية المنصات بنفس البنية' : ''}
}
`.trim();
}

// ─── AI callers (ترتيب الأولوية: Gemini → OpenAI → Claude) ──
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json',
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text.trim();
}

async function callOpenAI(prompt: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const r = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    max_tokens: 6000,
    temperature: 0.85,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'أنت خبير عطور سعودي. أجب JSON فقط. ممنوع المكونات بالإنجليزي.' },
      { role: 'user', content: prompt },
    ],
  });
  return r.choices[0]?.message?.content?.trim() ?? '{}';
}

async function callClaude(prompt: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const a = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const r = await a.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });
  return r.content[0].type === 'text' ? r.content[0].text.trim() : '{}';
}

function parseJSON(raw: string): Record<string, unknown> | null {
  try {
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(clean);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function normalizeCaption(raw: unknown, platform: ViralPlatform): BatchCaption {
  if (!raw || typeof raw !== 'object') {
    return { platform, hook: '', body: '', cta: '', hashtags: [] };
  }
  const r = raw as Record<string, unknown>;
  return {
    platform,
    hook: typeof r.hook === 'string' ? r.hook : '',
    body: typeof r.body === 'string' ? r.body : '',
    cta: typeof r.cta === 'string' ? r.cta : '',
    hashtags: Array.isArray(r.hashtags)
      ? r.hashtags.filter((x): x is string => typeof x === 'string')
      : [],
  };
}

function fallbackFromBlueprint(req: BatchRequest, platform: ViralPlatform): BatchCaption {
  const bp = buildViralBlueprint(req.perfumeData, platform, req.mode);
  return {
    platform,
    hook: bp.hook.text,
    body: `${bp.persona.openings[0]}، ${req.perfumeData.name} يستاهل تجربة حقيقية — تواصل معنا واتساب ${MAHWOUS_IDENTITY.whatsapp}.`,
    cta: bp.callToAction,
    hashtags: ['#مهووس', '#عطور', `#${(req.perfumeData.brand || 'مهووس').replace(/\s+/g, '_')}`],
  };
}

// ─── Handler ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const v = validateBatch(raw);
    if (!v.ok) {
      return NextResponse.json(
        { error: 'Invalid request', issues: v.issues, summary: formatIssues(v.issues) },
        { status: 400 },
      );
    }

    const body = v.value;
    const ck = cacheKey(body);
    const hit = cacheGet(ck);
    if (hit) {
      return NextResponse.json({ ...hit, meta: { ...hit.meta, cached: true } }, {
        status: 200, headers: { 'X-Cache': 'HIT' },
      });
    }

    const productUrl = body.productUrl && body.productUrl.length <= 120
      ? body.productUrl
      : MAHWOUS_IDENTITY.storeUrl;

    const prompt = buildUnifiedPrompt(body, productUrl);

    let parsed: Record<string, unknown> | null = null;
    let source = 'fallback_blueprint';

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try { parsed = parseJSON(await callGemini(prompt)); if (parsed) source = 'gemini'; }
      catch (e) { console.warn('[viral-batch] Gemini failed:', e instanceof Error ? e.message : e); }
    }
    if (!parsed && process.env.OPENAI_API_KEY) {
      try { parsed = parseJSON(await callOpenAI(prompt)); if (parsed) source = 'openai'; }
      catch (e) { console.warn('[viral-batch] OpenAI failed:', e instanceof Error ? e.message : e); }
    }
    if (!parsed && process.env.ANTHROPIC_API_KEY) {
      try { parsed = parseJSON(await callClaude(prompt)); if (parsed) source = 'claude'; }
      catch (e) { console.warn('[viral-batch] Claude failed:', e instanceof Error ? e.message : e); }
    }

    const captions: Record<string, BatchCaption> = {};
    for (const platform of body.platforms) {
      const fromAI = parsed?.[platform];
      const normalized = fromAI ? normalizeCaption(fromAI, platform) : null;
      captions[platform] = (normalized && normalized.body)
        ? normalized
        : fallbackFromBlueprint(body, platform);
    }

    const analysis = analyzePerfume(
      body.perfumeData.gender,
      typeof body.perfumeData.notes === 'string' ? body.perfumeData.notes : '',
      body.perfumeData.description,
      body.perfumeData.price,
    );

    const responseBody: BatchResponse = {
      captions,
      analysis,
      meta: { source, cached: false },
    };
    cacheSet(ck, responseBody);
    return NextResponse.json(responseBody, { status: 200, headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('[viral-batch] Unhandled:', error);
    const msg = error instanceof Error ? error.message : 'Batch caption generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
