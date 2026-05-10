// ============================================================
// app/api/scrape/route.ts
// POST /api/scrape
// 1. Scrapes a perfume product URL for structured data
// 2. Uses AI to determine ideal vibe + attire
// Priority: OpenAI → Claude → Smart Rule-Based Fallback
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { scrapeProductPage } from '@/lib/scraper';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const VIBE_OPTIONS = [
  'rose_garden',
  'majlis',
  'royal_luxury',
  'modern_corporate',
  'winter_cabin',
  'classic_library',
  'desert_sunset',
  'oriental_palace',
  'modern_minimalist',
  'ocean_breeze',
];

const ATTIRE_OPTIONS = [
  'black_suit_gold_details',
  'saudi_bisht',
  'white_thobe_black_bisht',
  'charcoal_suit_gold_tie',
  'white_thobe_only',
  'navy_suit',
  'beige_thobe_brown_bisht',
];

// Smart rule-based fallback — no AI needed
function smartRecommendation(product: Record<string, unknown>): { vibe: string; attire: string; reasoning: string } {
  const text = [
    String(product.name || ''),
    String(product.notes || ''),
    String(product.description || ''),
  ].join(' ').toLowerCase();

  // Floral / Rose
  if (/ورد|rose|floral|jasmine|ياسمين|بتلة|زهر/.test(text)) {
    return { vibe: 'rose_garden', attire: 'black_suit_gold_details', reasoning: 'Floral notes → rose garden setting' };
  }
  // Oud / Oriental / Arabic
  if (/عود|oud|oriental|شرقي|مسك|musk|بخور|incense/.test(text)) {
    return { vibe: 'oriental_palace', attire: 'saudi_bisht', reasoning: 'Oriental oud notes → palace setting' };
  }
  // Fresh / Aquatic / Marine
  if (/fresh|aqua|marine|ocean|بحر|منعش|citrus|citron|bergamot/.test(text)) {
    return { vibe: 'ocean_breeze', attire: 'navy_suit', reasoning: 'Fresh aquatic notes → ocean setting' };
  }
  // Woody / Tobacco / Leather
  if (/wood|cedar|sandalwood|tobacco|leather|خشب|صندل/.test(text)) {
    return { vibe: 'classic_library', attire: 'charcoal_suit_gold_tie', reasoning: 'Woody notes → classic library' };
  }
  // Vanilla / Amber / Sweet
  if (/vanilla|amber|عنبر|فانيليا|sweet|warm|musk|tonka/.test(text)) {
    return { vibe: 'winter_cabin', attire: 'beige_thobe_brown_bisht', reasoning: 'Warm sweet notes → cozy cabin' };
  }
  // Sport / Green / Citrus
  if (/sport|green|citrus|lime|lemon|limon|أخضر/.test(text)) {
    return { vibe: 'modern_corporate', attire: 'navy_suit', reasoning: 'Fresh citrus notes → modern corporate' };
  }
  // Default: Royal luxury
  return { vibe: 'royal_luxury', attire: 'white_thobe_black_bisht', reasoning: 'Luxury perfume → royal palace setting' };
}

async function analyzeWithOpenAI(product: Record<string, unknown>): Promise<{ vibe: string; attire: string; reasoning: string }> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const prompt = `You are a luxury perfume marketing director. Analyze this perfume and select the best vibe and attire for a 3D CGI promotional image.

Product: ${JSON.stringify(product, null, 2)}

Available vibes: ${VIBE_OPTIONS.join(', ')}
Available attires: ${ATTIRE_OPTIONS.join(', ')}

Guide:
- Floral/Rose → rose_garden + black_suit_gold_details
- Oud/oriental → oriental_palace + saudi_bisht
- Fresh/aquatic → ocean_breeze + navy_suit
- Woody/tobacco → classic_library + charcoal_suit_gold_tie
- Vanilla/amber → winter_cabin + beige_thobe_brown_bisht
- Luxury/royal → royal_luxury + white_thobe_black_bisht

Respond ONLY with valid JSON (no markdown):
{"vibe":"<key>","attire":"<key>","reasoning":"<one sentence>"}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    max_tokens: 200,
    temperature: 0.3,
    messages: [
      { role: 'system', content: 'Respond only with valid JSON, no markdown.' },
      { role: 'user', content: prompt },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? '{}';
  const parsed = JSON.parse(raw.replace(/```json?/g, '').replace(/```/g, '').trim());
  return {
    vibe: VIBE_OPTIONS.includes(parsed.vibe) ? parsed.vibe : 'royal_luxury',
    attire: ATTIRE_OPTIONS.includes(parsed.attire) ? parsed.attire : 'white_thobe_black_bisht',
    reasoning: parsed.reasoning || '',
  };
}

async function analyzeWithClaude(product: Record<string, unknown>): Promise<{ vibe: string; attire: string; reasoning: string }> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Analyze this perfume and select vibe + attire for a 3D CGI image.
Product: ${JSON.stringify(product, null, 2)}
Vibes: ${VIBE_OPTIONS.join(', ')}
Attires: ${ATTIRE_OPTIONS.join(', ')}
Respond ONLY with JSON: {"vibe":"<key>","attire":"<key>","reasoning":"<sentence>"}`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
  const parsed = JSON.parse(raw.replace(/```json?/g, '').replace(/```/g, '').trim());
  return {
    vibe: VIBE_OPTIONS.includes(parsed.vibe) ? parsed.vibe : 'royal_luxury',
    attire: ATTIRE_OPTIONS.includes(parsed.attire) ? parsed.attire : 'white_thobe_black_bisht',
    reasoning: parsed.reasoning || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required.' }, { status: 400 });
    }
    // ── Step 1: Scrape the product page ────────────────────────────────────────────
    let product = await scrapeProductPage(url);

    // ── Step 1.5: AI Enrichment — if name looks like a slug or is in English ──
    const nameIsSlug = product.name && (
      /^[a-z0-9 ]+$/i.test(product.name) || // All English/numbers
      product.name.length < 10 || // Too short
      /^\d+$/.test(product.name) // Just numbers (e.g. "410")
    );
    if (nameIsSlug && process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENAI_BASE_URL || undefined,
        });
        const enrichPrompt = `You are a perfume expert. Given this URL and product slug, extract the full Arabic product details.
URL: ${url}
Current name (from slug): "${product.name}"

Return ONLY valid JSON (no markdown):
{
  "name": "full Arabic product name",
  "brand": "brand name in English",
  "gender": "men|women|unisex",
  "notes": "likely fragrance notes",
  "description": "brief Arabic description"
}

Examples:
- "valentino born in roma extravaganza uomo edp 100ml for men" → {"name":"فالنتينو بورن إن روما إكسترادوز أومو أو دو بارفيوم 100 مل للرجال","brand":"Valentino","gender":"men","notes":"woody amber vanilla iris","description":"عطر رجالي فاخر من فالنتينو"}
- "dior sauvage edp 200ml" → {"name":"ديور سوفاج أو دو بارفيوم 200 مل","brand":"Dior","gender":"men","notes":"bergamot ambroxan cedar","description":"عطر رجالي عصري من ديور"}`;
        const enrichRes = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          max_tokens: 300,
          temperature: 0.1,
          messages: [
            { role: 'system', content: 'Respond only with valid JSON, no markdown.' },
            { role: 'user', content: enrichPrompt },
          ],
        });
        const raw = enrichRes.choices[0]?.message?.content?.trim() ?? '{}';
        const enriched = JSON.parse(raw.replace(/```json?/g, '').replace(/```/g, '').trim());
        if (enriched.name && enriched.name.length > 5) {
          product = {
            ...product,
            name: enriched.name || product.name,
            brand: enriched.brand || product.brand,
            gender: enriched.gender || product.gender,
            notes: enriched.notes || product.notes,
            description: enriched.description || product.description,
          };
          console.log('[/api/scrape] AI enriched product name:', product.name);
        }
      } catch (e) {
        console.warn('[/api/scrape] AI enrichment failed:', e instanceof Error ? e.message : e);
      }
    }

    // ── Step 2: AI recommends vibe + attire (with fallback chain) ─────────────
    let recommendation = smartRecommendation(product as Record<string, unknown>);
    let aiSource = 'rule-based'; // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        recommendation = await analyzeWithOpenAI(product as Record<string, unknown>);
        aiSource = 'openai';
        console.log('[/api/scrape] Used OpenAI for recommendation');
      } catch (e: unknown) {
        console.warn('[/api/scrape] OpenAI failed:', e instanceof Error ? e.message : e);
      }
    }

    // Try Claude if OpenAI failed
    if (aiSource === 'rule-based' && process.env.ANTHROPIC_API_KEY) {
      try {
        recommendation = await analyzeWithClaude(product as Record<string, unknown>);
        aiSource = 'claude';
        console.log('[/api/scrape] Used Claude for recommendation');
      } catch (e: unknown) {
        console.warn('[/api/scrape] Claude failed:', e instanceof Error ? e.message : e);
      }
    }

    if (aiSource === 'rule-based') {
      console.log('[/api/scrape] Using rule-based recommendation');
    }

    return NextResponse.json({ product, recommendation, aiSource }, { status: 200 });

  } catch (error: unknown) {
    console.error('[/api/scrape] Error:', error);
    const message = error instanceof Error ? error.message : 'Scraping failed.';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[/api/scrape] Stack:', stack);
    return NextResponse.json({ error: message, details: message }, { status: 500 });
  }
}
