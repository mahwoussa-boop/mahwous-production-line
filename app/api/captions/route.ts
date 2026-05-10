// ============================================================
// app/api/captions/route.ts
// POST /api/captions
// v4: Hybrid approach — mahwousCaptionEngine + Gemini/OpenAI/Claude enhancement
// Priority: CaptionEngine + Gemini → CaptionEngine + OpenAI → CaptionEngine + Claude → CaptionEngine only
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { PerfumeData, PlatformCaptions } from '@/lib/types';
import {
  generateAllCaptions,
  generateAllHashtags,
  analyzePerfume,
  buildGeminiEnhancementPrompt,
  MAHWOUS_IDENTITY,
} from '@/lib/mahwousCaptionEngine';
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

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

interface CaptionRequest {
  perfumeData: PerfumeData;
  vibe: string;
  attire: string;
  productUrl: string;
  viralMode?: ContentMode;
  viralPlatform?: ViralPlatform;
}

// ─── In-memory cache (24h TTL) ──────────────────────────────
// يقلل استدعاءات الـ AI للمنتجات المكررة. يتصفّر مع كل cold start.
interface CacheEntry {
  body: unknown;
  expiresAt: number;
}
const CAPTION_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

function cacheKey(req: CaptionRequest): string {
  const p = req.perfumeData;
  const notes = typeof p.notes === 'string' ? p.notes : '';
  return [
    (p.name || '').trim().toLowerCase(),
    (p.brand || '').trim().toLowerCase(),
    (p.gender || '').trim().toLowerCase(),
    notes.trim().toLowerCase().slice(0, 120),
    (req.vibe || '').trim().toLowerCase(),
    (req.viralMode || '').trim().toLowerCase(),
    (req.viralPlatform || '').trim().toLowerCase(),
  ].join('|');
}

function cacheGet(key: string): unknown | null {
  const hit = CAPTION_CACHE.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    CAPTION_CACHE.delete(key);
    return null;
  }
  return hit.body;
}

function cacheSet(key: string, body: unknown): void {
  if (CAPTION_CACHE.size >= CACHE_MAX_ENTRIES) {
    const firstKey = CAPTION_CACHE.keys().next().value;
    if (firstKey) CAPTION_CACHE.delete(firstKey);
  }
  CAPTION_CACHE.set(key, { body, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ═══ AI Callers ═══

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json',
        },
        systemInstruction: {
          parts: [{
            text: 'أنت خبير تسويق عطور فاخرة ومتخصص SEO. أجب بـ JSON فقط. ممنوع كتابة مكونات عطرية بالإنجليزي. اكتب بلهجة سعودية واضحة. حدد نوع العطر والجمهور المستهدف في كل كابشن.',
          }],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text.trim();
}

async function callOpenAI(prompt: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    max_tokens: 6000,
    temperature: 0.85,
    messages: [
      {
        role: 'system',
        content: 'أنت خبير تسويق عطور فاخرة ومتخصص SEO. أجب بـ JSON فقط. ممنوع كتابة مكونات عطرية بالإنجليزي. اكتب بلهجة سعودية واضحة. حدد نوع العطر والجمهور المستهدف في كل كابشن.',
      },
      { role: 'user', content: prompt },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? '{}';
}

async function callClaude(prompt: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
}

function parseAIResponse(rawText: string): Record<string, string> | null {
  try {
    const clean = rawText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(clean);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// ═══ Main Handler ═══
export async function POST(request: NextRequest) {
  try {
    const body: CaptionRequest = await request.json();
    const { perfumeData, vibe, attire, productUrl, viralMode, viralPlatform } = body;

    if (!perfumeData?.name) {
      return NextResponse.json({ error: 'perfumeData.name is required.' }, { status: 400 });
    }

    // ── Cache lookup ──
    const ck = cacheKey(body);
    const cached = cacheGet(ck);
    if (cached) {
      return NextResponse.json(cached, { status: 200, headers: { 'X-Cache': 'HIT' } });
    }

    // ── Step 1: تحليل العطر والجمهور المستهدف ──
    const notesStr = typeof perfumeData.notes === 'string' ? perfumeData.notes : '';
    const analysis = analyzePerfume(
      perfumeData.gender,
      notesStr,
      perfumeData.description,
      perfumeData.price,
    );

    console.log('[/api/captions] Perfume analysis:', {
      gender: analysis.genderLabel,
      target: analysis.targetAudience,
      occasion: analysis.occasion,
      season: analysis.season,
      personality: analysis.personality,
    });

    // ── Step 2: توليد كابشنات أساسية من محرك مهووس ──
    const baseCaptions = generateAllCaptions(
      perfumeData.name,
      perfumeData.brand,
      productUrl,
      perfumeData.notes,
      perfumeData.description,
      perfumeData.price,
      perfumeData.gender,
    );

    const baseHashtags = generateAllHashtags(perfumeData.name, perfumeData.brand);

    console.log('[/api/captions] Generated base captions from mahwousCaptionEngine v3');

    // ── Step 3: تحسين بالذكاء الاصطناعي ──
    const smartUrl = (productUrl && productUrl.length <= 80) ? productUrl : MAHWOUS_IDENTITY.storeUrl;
    let enhancementPrompt = buildGeminiEnhancementPrompt(
      perfumeData.name,
      perfumeData.brand,
      baseCaptions,
      analysis,
      smartUrl,
    );

    // ── Viral augmentation (optional) ──
    // يُحقن فقط لو طلب العميل وضع viralMode. غير ذلك لا تغيير عن السلوك السابق.
    if (viralMode) {
      const platform: ViralPlatform = viralPlatform ?? 'tiktok';
      const blueprint = buildViralBlueprint(perfumeData, platform, viralMode);
      const insight = getStarInsight(perfumeData);
      const activeTrends = getActiveTrends(perfumeData).slice(0, 2);
      const trendsBlock = activeTrends.map(trendToPromptFragment).join('\n\n');
      enhancementPrompt = [
        enhancementPrompt,
        '',
        '─── VIRAL AUGMENTATION (use the blueprint below to shape hooks/voice) ───',
        blueprintToPromptFragment(blueprint),
        '',
        `[STAR INSIGHT — embed naturally in educational captions]`,
        insight,
        ...(trendsBlock ? ['', '[ACTIVE TRENDS]', trendsBlock] : []),
      ].join('\n');
    }

    let enhancedCaptions: Record<string, string> | null = null;
    let source = 'mahwous_engine_v3';

    // Try Gemini first (best for Arabic content)
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const rawText = await callGemini(enhancementPrompt);
        enhancedCaptions = parseAIResponse(rawText);
        if (enhancedCaptions) {
          source = 'mahwous_engine_v3+gemini';
          console.log('[/api/captions] Enhanced with Gemini');
        }
      } catch (e) {
        console.warn('[/api/captions] Gemini enhancement failed:', e instanceof Error ? e.message : e);
      }
    }

    // Try OpenAI as fallback
    if (!enhancedCaptions && process.env.OPENAI_API_KEY) {
      try {
        const rawText = await callOpenAI(enhancementPrompt);
        enhancedCaptions = parseAIResponse(rawText);
        if (enhancedCaptions) {
          source = 'mahwous_engine_v3+openai';
          console.log('[/api/captions] Enhanced with OpenAI');
        }
      } catch (e) {
        console.warn('[/api/captions] OpenAI enhancement failed:', e instanceof Error ? e.message : e);
      }
    }

    // Try Claude as last fallback
    if (!enhancedCaptions && process.env.ANTHROPIC_API_KEY) {
      try {
        const rawText = await callClaude(enhancementPrompt);
        enhancedCaptions = parseAIResponse(rawText);
        if (enhancedCaptions) {
          source = 'mahwous_engine_v3+claude';
          console.log('[/api/captions] Enhanced with Claude');
        }
      } catch (e) {
        console.warn('[/api/captions] Claude enhancement failed:', e instanceof Error ? e.message : e);
      }
    }

    // ── Step 4: دمج النتائج ──
    // استخدم AI المحسّن إذا متوفر، وإلا استخدم الأساسي
    const merge = (key: string, fallback: string = ''): string => {
      return enhancedCaptions?.[key] || baseCaptions[key] || fallback;
    };

    const finalCaptions: PlatformCaptions = {
      // صور
      instagram_post: merge('instagram_post'),
      instagram_story: merge('instagram_story'),
      facebook_post: merge('facebook_post'),
      facebook_story: merge('facebook_story'),
      twitter: merge('twitter'),
      linkedin: merge('linkedin'),
      snapchat: merge('snapchat'),
      tiktok: merge('tiktok'),
      pinterest: merge('pinterest'),
      telegram: merge('telegram'),
      haraj: merge('haraj'),
      truth_social: merge('truth_social'),
      whatsapp: merge('whatsapp'),
      youtube_thumbnail: '—',
      youtube_shorts: '—',
    };

    // كابشنات الفيديو (إضافية)
    const videoCaptions: Record<string, string> = {
      instagram_reels: merge('instagram_reels'),
      tiktok_video: merge('tiktok_video'),
      snapchat_video: merge('snapchat_video'),
      youtube_shorts_video: merge('youtube_shorts_video'),
      facebook_stories_video: merge('facebook_stories_video'),
      youtube_video: merge('youtube_video'),
      twitter_video: merge('twitter_video'),
      linkedin_video: merge('linkedin_video'),
      facebook_video: merge('facebook_video'),
    };

    const responseBody = {
      captions: finalCaptions,
      videoCaptions,
      hashtags: baseHashtags,
      analysis: {
        gender: analysis.genderLabel,
        targetAudience: analysis.targetAudience,
        occasion: analysis.occasion,
        season: analysis.season,
        personality: analysis.personality,
        ageRange: analysis.ageRange,
      },
      source,
    };

    cacheSet(ck, responseBody);

    return NextResponse.json(responseBody, { status: 200, headers: { 'X-Cache': 'MISS' } });

  } catch (error: unknown) {
    console.error('[/api/captions] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Caption generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
