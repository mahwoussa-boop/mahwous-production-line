// ============================================================
// app/api/captions/route.ts
// POST /api/captions
// Generates Arabic social media captions using AI.
// PROVIDER FALLBACK: Anthropic Claude → Google Gemini
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { PerfumeData } from '@/lib/types';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

interface CaptionRequest {
  perfumeData: PerfumeData;
  vibe: string;
  attire: string;
}

function buildCaptionPrompt(perfumeData: PerfumeData, vibe: string, attire: string): string {
  const genderLabel =
    perfumeData.gender === 'men' ? 'للرجال' :
    perfumeData.gender === 'women' ? 'للنساء' : 'للجنسين';

  return `أنت خبير تسويق عطور فاخر متخصص في السوق الخليجي والعربي. مهمتك كتابة محتوى تسويقي احترافي ومؤثر باللغة العربية الفصحى المعاصرة.

معلومات العطر:
- الاسم: ${perfumeData.name}
- الماركة: ${perfumeData.brand}
- المستخدم: ${genderLabel}
- الملاحظات العطرية: ${perfumeData.notes || 'غير محدد'}
- الوصف: ${perfumeData.description?.substring(0, 300) || 'لا يوجد'}
- الأجواء المختارة: ${vibe.replace(/_/g, ' ')}
- الزي المختار: ${attire.replace(/_/g, ' ')}

المطلوب: أنشئ كابشن احترافيًا لكل منصة. اجعل النص شعريًا وفاخرًا، يعكس هوية العطر تمامًا.

قواعد:
- انستغرام: 150-250 حرف، يبدأ بجملة شعرية جذابة، يتضمن 5-8 هاشتاقات عربية، إيموجيات أنيقة
- تويتر: 200-250 حرف، مباشر ومؤثر، 3-5 هاشتاقات، إيموجيات
- الهاشتاقات تشمل: اسم الماركة، كلمات عن العطور، السوق الخليجي

أجب بـ JSON فقط بدون أي نص إضافي أو markdown:
{"instagram":"النص الكامل هنا","twitter":"النص الكامل هنا"}`;
}

function fallbackCaptions(perfumeData: PerfumeData) {
  const brand = perfumeData.brand?.replace(/\s/g, '') ?? 'عطور';
  return {
    instagram: `✨ ${perfumeData.name} من ${perfumeData.brand}\nعطرٌ يُجسّد روح الفخامة ويُحكي قصة الأناقة الأصيلة.\n🌸 ${perfumeData.notes || 'نوتات ساحرة تأسر الحواس'}\n\n#${brand} #عطور_فاخرة #عطور_رجالية #perfume #luxury #خليجي`,
    twitter: `✨ ${perfumeData.name} — ${perfumeData.brand}\nأناقةٌ لا تُنسى في كل رشّة 🌸\n#عطور_فاخرة #${brand}`,
  };
}

// ─── Provider 1: Anthropic ────────────────────────────────────────────────────
async function captionsWithAnthropic(prompt: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 700,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
}

// ─── Provider 2: Gemini ───────────────────────────────────────────────────────
async function captionsWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 700, temperature: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { perfumeData, vibe, attire }: CaptionRequest = await request.json();

    if (!perfumeData?.name) {
      return NextResponse.json({ error: 'perfumeData.name is required.' }, { status: 400 });
    }

    const prompt = buildCaptionPrompt(perfumeData, vibe, attire);
    let rawText = '';
    let providerUsed = 'none';

    // Try Anthropic first
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        rawText = await captionsWithAnthropic(prompt);
        providerUsed = 'anthropic';
      } catch (err) {
        console.warn('[captions] Anthropic failed:', (err as Error).message);
      }
    }

    // Fallback: Gemini
    if (!rawText && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        rawText = await captionsWithGemini(prompt);
        providerUsed = 'gemini';
      } catch (err) {
        console.warn('[captions] Gemini also failed:', (err as Error).message);
      }
    }

    // Parse or use fallback
    let captions = fallbackCaptions(perfumeData);
    if (rawText) {
      try {
        const clean = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (parsed.instagram && parsed.twitter) captions = parsed;
      } catch {
        console.warn('[captions] JSON parse failed, using fallback.');
      }
    }

    console.log(`[captions] Provider: ${providerUsed}`);
    return NextResponse.json({ captions, provider: providerUsed }, { status: 200 });
  } catch (error: unknown) {
    console.error('[captions] Error:', error);
    const message = error instanceof Error ? error.message : 'Caption generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
