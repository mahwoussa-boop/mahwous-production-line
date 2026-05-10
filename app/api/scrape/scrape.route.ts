// ============================================================
// app/api/scrape/route.ts
// POST /api/scrape
// 1. Scrapes a perfume product URL for structured data
// 2. Uses AI (Anthropic → Gemini fallback) to determine vibe + attire
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { scrapeProductPage } from '@/lib/scraper';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const VIBE_OPTIONS = [
  'royal_luxury', 'modern_corporate', 'winter_cabin', 'classic_library',
  'desert_sunset', 'oriental_palace', 'modern_minimalist', 'ocean_breeze',
];
const ATTIRE_OPTIONS = [
  'white_thobe_black_bisht', 'charcoal_suit_gold_tie', 'white_thobe_only',
  'navy_suit', 'beige_thobe_brown_bisht',
];

const DEFAULT_REC = {
  vibe: 'royal_luxury',
  attire: 'white_thobe_black_bisht',
  reasoning: 'Default fallback selection.',
};

function buildAnalysisPrompt(product: object): string {
  return `You are a luxury perfume brand marketing director with 20 years of experience.

Analyze this perfume product data and select the most visually compelling and commercially effective vibe and attire combination for a 3D CGI promotional image featuring an Arab male brand ambassador.

Product Data:
${JSON.stringify(product, null, 2)}

Available vibe options: ${VIBE_OPTIONS.join(', ')}
Available attire options: ${ATTIRE_OPTIONS.join(', ')}

Reasoning guide:
- Oud/oriental notes → oriental_palace or desert_sunset + white_thobe_black_bisht
- Fresh/aquatic/marine → ocean_breeze + navy_suit
- Woody/tobacco/leather → classic_library + charcoal_suit_gold_tie or white_thobe_black_bisht
- Citrus/green/sport → modern_corporate + navy_suit
- Vanilla/amber/warm → winter_cabin + beige_thobe_brown_bisht
- Ultra-luxury/royal → royal_luxury + white_thobe_black_bisht
- Minimalist/designer → modern_minimalist + white_thobe_only or charcoal_suit_gold_tie

Respond ONLY with a valid JSON object (no markdown fences, no extra text):
{"vibe":"<vibe_key>","attire":"<attire_key>","reasoning":"<one concise English sentence>"}`;
}

function parseRecommendation(rawText: string) {
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    const rec = JSON.parse(clean);
    if (!VIBE_OPTIONS.includes(rec.vibe)) rec.vibe = DEFAULT_REC.vibe;
    if (!ATTIRE_OPTIONS.includes(rec.attire)) rec.attire = DEFAULT_REC.attire;
    return rec;
  } catch {
    return DEFAULT_REC;
  }
}

// ─── Provider 1: Anthropic ────────────────────────────────────────────────────
async function analyzeWithAnthropic(product: object): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    messages: [{ role: 'user', content: buildAnalysisPrompt(product) }],
  });
  return response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
}

// ─── Provider 2: Gemini ───────────────────────────────────────────────────────
async function analyzeWithGemini(product: object): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildAnalysisPrompt(product) }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required.' }, { status: 400 });
    }

    // Step 1: Scrape
    const product = await scrapeProductPage(url);

    // Step 2: AI analysis with fallback
    let rawText = '';
    let providerUsed = 'none';

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        rawText = await analyzeWithAnthropic(product);
        providerUsed = 'anthropic';
      } catch (err) {
        console.warn('[scrape] Anthropic failed:', (err as Error).message);
      }
    }

    if (!rawText && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        rawText = await analyzeWithGemini(product);
        providerUsed = 'gemini';
      } catch (err) {
        console.warn('[scrape] Gemini also failed:', (err as Error).message);
      }
    }

    const recommendation = rawText ? parseRecommendation(rawText) : DEFAULT_REC;
    console.log(`[scrape] Provider: ${providerUsed}`);

    return NextResponse.json({ product, recommendation, provider: providerUsed }, { status: 200 });
  } catch (error: unknown) {
    console.error('[scrape] Error:', error);
    const message = error instanceof Error ? error.message : 'Scraping failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
