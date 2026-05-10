// ============================================================
// app/api/video-captions/route.ts
// POST /api/video-captions
// v2: SEO-optimized video captions with trending hashtags
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { PerfumeData, VideoPlatformCaptions } from '@/lib/types';

export const maxDuration = 20;
export const dynamic = 'force-dynamic';

const WHATSAPP_NUMBER = '+966553964135';
const WHATSAPP_LINK = 'https://wa.me/966553964135';
const STORE_URL = 'https://mahwous.com';
const MAX_URL_LENGTH = 80;

interface VideoCaptionRequest {
  perfumeData: PerfumeData;
  productUrl: string;
  vibe: string;
}

function smartProductLink(productUrl: string): string {
  const url = productUrl || STORE_URL;
  if (url.length > MAX_URL_LENGTH) return STORE_URL;
  return url;
}

function buildVideoCaptionPrompt(perfumeData: PerfumeData, productUrl: string, vibe: string): string {
  const genderLabel =
    perfumeData.gender === 'men' ? 'للرجال' :
    perfumeData.gender === 'women' ? 'للنساء' : 'للجنسين';

  const productLink = smartProductLink(productUrl);

  return `أنت أفضل خبير تسويق فيديو عطور ومتخصص SEO. اكتب كابشنات فيديو مُحسّنة للبحث والظهور.

═══ معلومات العطر ═══
- الاسم: ${perfumeData.name}
- الماركة: ${perfumeData.brand}
- المستخدم: ${genderLabel}
- المكونات: ${perfumeData.notes || 'غير محدد'}
- السعر: ${perfumeData.price || 'غير محدد'}

═══ معلومات التواصل ═══
- واتساب: ${WHATSAPP_NUMBER}
- رابط واتساب: ${WHATSAPP_LINK}
- رابط المنتج: ${productLink}
- المتجر: مهووس (متجر إلكتروني — الطلب أونلاين فقط)

═══ قواعد SEO مهمة — التزم بها 100% ═══
- ممنوع كتابة أي كلمة إنجليزية في نص الكابشن (ما عدا الهاشتاقات)
- المكونات العطرية تُكتب بالعربي فقط: عود، مسك، عنبر، فانيلا، باتشولي، صندل، برغموت، ياسمين، ورد، زعفران، بخور
- ممنوع كتابة: oud, amber, musk, vanilla, patchouli, sandalwood, bergamot, jasmine
- لو المكونات فيها كلمات إنجليزية، ترجمها للعربي
- استخدم الهاشتاقات الأكثر بحثاً وتصدراً في كل منصة
- أضف كلمات مفتاحية طبيعية (اسم العطر، الماركة، نوع العطر)
- لا تضع رابط المنتج إذا كان طويلاً — استخدم واتساب أو رابط المتجر
- اذكر "مهووس" مرة واحدة فقط — لا تكرار
- لا تقل "زوروا" — مهووس متجر إلكتروني (اطلب/اطلبه)
- السعر يُكتب بالعربي: مثلاً "595 ريال" وليس "595 SAR"
- الفيديو العمودي (ريلز/تيك توك/شورتس) = محتوى شبابي حماسي بهوك
- الفيديو الأفقي (يوتيوب/تويتر/لينكدإن) = محتوى ثقافي معلوماتي

═══ المطلوب: كابشن فيديو لكل منصة ═══

1. instagram_reels: هوك قوي أول سطر + 10-12 هاشتاق ترند (#perfumetok #fyp #عطور) + CTA.
2. tiktok_video: هوك أول 3 كلمات + هاشتاقات الأكثر بحثاً في تيك توك + شبابي.
3. snapchat_video: قصير جداً بلهجة سعودية + رابط واتساب.
4. youtube_shorts: عنوان جذاب + وصف قصير + هاشتاقات + CTA.
5. facebook_stories_video: جملة قصيرة + CTA + رابط.
6. youtube_video: عنوان SEO + وصف متوسط فيه كلمات مفتاحية + CTA + هاشتاقات.
7. twitter_video: تغريدة قصيرة (أقل من 280 حرف) + هاشتاقات ترند.
8. linkedin_video: كابشن مهني بالإنجليزي + هاشتاقات إنجليزية.
9. facebook_video: كابشن تفاعلي + سؤال + CTA.

أجب بـ JSON فقط:
{
  "instagram_reels": "...",
  "tiktok_video": "...",
  "snapchat_video": "...",
  "youtube_shorts": "...",
  "facebook_stories_video": "...",
  "youtube_video": "...",
  "twitter_video": "...",
  "linkedin_video": "...",
  "facebook_video": "..."
}`;
}

function buildFallbackVideoCaptions(perfumeData: PerfumeData, productUrl: string): VideoPlatformCaptions {
  const brand = perfumeData.brand?.replace(/\s/g, '') || 'mahwous';
  const productLink = smartProductLink(productUrl);
  const price = perfumeData.price || '';

  return {
    instagram_reels: `هالريحة خلت الكل يسالني وش حاط!\n${perfumeData.name} من ${perfumeData.brand}\n\nاطلبه من مهووس: ${WHATSAPP_LINK}\n\n#عطور #perfumetok #${brand} #fyp #foryou #عطور_فاخرة #viral #scentoftheday #ريلز #عطر_اليوم #trending #fragrance`,
    tiktok_video: `انتبه لا تشتري عطر قبل ما تعرف هالمعلومة!\n${perfumeData.name} من ${perfumeData.brand}\n\nاطلبه: ${WHATSAPP_LINK}\n\n#عطور #perfumetok #${brand} #fyp #foryou #عطور_فاخرة #viral #trending #scentoftheday #عطر_اليوم`,
    snapchat_video: `${perfumeData.name} وصل!\nريحة فخمة من ${perfumeData.brand}\nاطلبه الحين\n${WHATSAPP_LINK}`,
    youtube_shorts_video: `${perfumeData.name} من ${perfumeData.brand} | مراجعة سريعة\n\nعطر فاخر يستحق التجربة!\n${price ? `السعر: ${price}\n` : ''}اطلب: ${productLink}\n\n#عطور #${brand} #shorts #perfume #عطور_فاخرة #scentoftheday`,
    facebook_stories_video: `${perfumeData.name}\n${perfumeData.brand}\n\nاطلبه الحين\n${WHATSAPP_LINK}`,
    youtube_video: `${perfumeData.name} من ${perfumeData.brand} | قصة العطر ومراجعة كاملة | مهووس\n\nاكتشف قصة عطر ${perfumeData.name} الفاخر من ${perfumeData.brand}.\n${price ? `السعر: ${price}\n` : ''}\nاطلب الان: ${productLink}\nواتساب: ${WHATSAPP_LINK}\n\n#عطور_فاخرة #${brand} #perfume #luxury #fragrance #عطور #مراجعة_عطور #nicheperfume`,
    twitter_video: `${perfumeData.name} من ${perfumeData.brand}\n\nريحة فخمة وثبات خرافي\n\n${WHATSAPP_LINK}\n\n#عطور #${brand} #perfume #عطور_فاخرة`,
    linkedin_video: `Introducing ${perfumeData.name} by ${perfumeData.brand}\n\nA masterpiece of modern perfumery.\n\nDiscover more: ${productLink}\n\n#Luxury #Perfume #${brand} #Fragrance #NichePerfume`,
    facebook_video: `${perfumeData.name} من ${perfumeData.brand}\n\nشاهد الفيديو وقولوا لنا رايكم!\n\nللطلب: ${WHATSAPP_LINK}\n${productLink}\n\n#عطور_فاخرة #${brand} #عطور #perfume #fragrance`,
  };
}

async function callOpenAI(prompt: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    max_tokens: 3000,
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content: 'أنت خبير تسويق فيديو عطور ومتخصص SEO. أجب بـ JSON فقط. استخدم الهاشتاقات الأكثر بحثاً. لا تكرر كلمة مهووس. مهووس متجر إلكتروني فقط. ممنوع كتابة أي مكون عطري بالإنجليزي — اكتب كل شيء بالعربي. السعر يُكتب بالعربي مثل: 595 ريال.',
      },
      { role: 'user', content: prompt },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? '{}';
}

export async function POST(request: NextRequest) {
  try {
    const { perfumeData, productUrl, vibe }: VideoCaptionRequest = await request.json();

    if (!perfumeData?.name) {
      return NextResponse.json({ error: 'perfumeData.name is required.' }, { status: 400 });
    }

    const prompt = buildVideoCaptionPrompt(perfumeData, productUrl, vibe);
    const fallback = buildFallbackVideoCaptions(perfumeData, productUrl);

    let captions: VideoPlatformCaptions = fallback;
    let source = 'fallback';

    // Try OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const rawText = await callOpenAI(prompt);
        const clean = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(clean);
        captions = {
          instagram_reels: parsed.instagram_reels || fallback.instagram_reels,
          tiktok_video: parsed.tiktok_video || fallback.tiktok_video,
          snapchat_video: parsed.snapchat_video || fallback.snapchat_video,
          youtube_shorts_video: parsed.youtube_shorts_video || parsed.youtube_shorts || fallback.youtube_shorts_video,
          facebook_stories_video: parsed.facebook_stories_video || fallback.facebook_stories_video,
          youtube_video: parsed.youtube_video || fallback.youtube_video,
          twitter_video: parsed.twitter_video || fallback.twitter_video,
          linkedin_video: parsed.linkedin_video || fallback.linkedin_video,
          facebook_video: parsed.facebook_video || fallback.facebook_video,
        };
        source = 'openai';
      } catch (err) {
        console.warn('[video-captions] OpenAI failed:', err);
      }
    }

    return NextResponse.json({ captions, source });
  } catch (error: unknown) {
    console.error('[/api/video-captions] Error:', error);
    const message = error instanceof Error ? error.message : 'Video caption generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
