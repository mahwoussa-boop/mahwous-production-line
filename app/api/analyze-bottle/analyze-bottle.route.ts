// ============================================================
// app/api/analyze-bottle/route.ts
// POST /api/analyze-bottle
//
// Uses AI Vision to produce a precise textual description of
// the perfume bottle. This description is injected into the
// generation prompt — key to product fidelity (Layer 1).
//
// PROVIDER FALLBACK CHAIN:
//   1. Anthropic Claude (claude-opus-4-5) — if ANTHROPIC_API_KEY set
//   2. Google Gemini (gemini-1.5-flash)  — if GOOGLE_GENERATIVE_AI_API_KEY set
//   3. Graceful skip — returns empty description, generation continues
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// ─── Shared Vision Prompt ─────────────────────────────────────────────────────
function buildVisionPrompt(perfumeName: string, brandName: string): string {
  return `You are a product photographer describing a perfume bottle for a 3D CGI artist.
Describe the ${perfumeName} by ${brandName} perfume bottle in precise visual terms that a 3D artist can reproduce.

Focus on:
1. Overall bottle shape (cylindrical, rectangular, tapered, angular, round, etc.)
2. Height-to-width proportions (e.g., "tall and slender", "squat and wide")
3. Cap/stopper design and material
4. Glass color and transparency (clear, frosted, tinted, opaque)
5. Label: position, background color, text color, typography style
6. Any unique design elements (cut glass, metallic accents, embossing, etc.)
7. Dominant color palette

Write ONE dense paragraph of 80-120 words. No bullet points. Be specific and visual.
Do NOT include brand opinions or marketing language.`;
}

// ─── Provider 1: Anthropic Claude ────────────────────────────────────────────
async function analyzeWithAnthropic(
  base64Data: string,
  mediaType: string,
  perfumeName: string,
  brandName: string,
): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: base64Data,
            },
          },
          { type: 'text', text: buildVisionPrompt(perfumeName, brandName) },
        ],
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
}

// ─── Provider 2: Google Gemini ────────────────────────────────────────────────
async function analyzeWithGemini(
  base64Data: string,
  mediaType: string,
  perfumeName: string,
  brandName: string,
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mediaType, data: base64Data } },
          { text: buildVisionPrompt(perfumeName, brandName) },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.2,
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.trim();
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { imageBase64, perfumeName, brandName } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required.' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const mediaTypeMatch = imageBase64.match(/^data:(image\/[a-z]+);base64,/);
    const mediaType = mediaTypeMatch?.[1] ?? 'image/jpeg';
    const name = String(perfumeName ?? 'perfume');
    const brand = String(brandName ?? 'this brand');

    let description = '';
    let providerUsed = 'none';

    // ── Try Anthropic first ──────────────────────────────────────────────────
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        description = await analyzeWithAnthropic(base64Data, mediaType, name, brand);
        providerUsed = 'anthropic';
        console.log('[analyze-bottle] Used Anthropic Claude');
      } catch (err) {
        console.warn('[analyze-bottle] Anthropic failed:', (err as Error).message);
      }
    }

    // ── Fallback: Google Gemini ──────────────────────────────────────────────
    if (!description && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        description = await analyzeWithGemini(base64Data, mediaType, name, brand);
        providerUsed = 'gemini';
        console.log('[analyze-bottle] Used Google Gemini (fallback)');
      } catch (err) {
        console.warn('[analyze-bottle] Gemini also failed:', (err as Error).message);
      }
    }

    // ── Graceful skip if no provider worked ─────────────────────────────────
    if (!description) {
      console.warn('[analyze-bottle] No AI provider available. Skipping bottle analysis.');
      return NextResponse.json({ description: '', provider: 'none' }, { status: 200 });
    }

    return NextResponse.json({ description, provider: providerUsed }, { status: 200 });
  } catch (error: unknown) {
    console.error('[analyze-bottle] Error:', error);
    const message = error instanceof Error ? error.message : 'Bottle analysis failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
