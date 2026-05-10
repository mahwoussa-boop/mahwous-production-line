// ============================================================
// lib/engines/trendAnalyzer.ts
// محرك تحليل الترندات — يربط منتجات مهووس بترندات فيروسية مناسبة
// Additive: لا يعدّل أي ملف موجود.
// ============================================================

import type { PerfumeData } from '../types';
import type { ViralPlatform } from './viralContentEngine';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TrendUrgency = 'now' | 'this_week' | 'evergreen';
export type TrendContext = 'seasonal' | 'cultural' | 'social' | 'viral_format';
export type SeasonKey = 'ramadan' | 'summer' | 'winter' | 'eid' | 'back_to_school' | 'national_day';
export type CulturalKey = 'saudi_pride' | 'hospitality' | 'confidence' | 'gifting';
export type ViralFormatKey =
  | 'get_ready_with_me'
  | 'rate_my_collection'
  | 'honest_review'
  | 'gifting_guide'
  | 'scent_memory'
  | 'blind_test';

export interface TrendableContent {
  perfumeName: string;
  trendContext: TrendContext;
  trendKey: string;
  arabicAngle: string;
  contentIdea: string;
  hook: string;
  platforms: ViralPlatform[];
  urgency: TrendUrgency;
  score: number; // 0-100 viral potential
}

export interface SeasonalTrend {
  themes: readonly string[];
  contentTypes: readonly string[];
  hook: string;
  platforms: readonly ViralPlatform[];
  monthsActive: readonly number[]; // 1..12
}

export interface CulturalTrend {
  hook: string;
  angle: string;
  platforms: readonly ViralPlatform[];
}

export interface ViralFormatTrend {
  arabicName: string;
  template: string;
  hook: string;
  platforms: readonly ViralPlatform[];
  bestFor: readonly string[]; // perfume categories
}

// ─────────────────────────────────────────────────────────────
// Evergreen Trend Library
// ─────────────────────────────────────────────────────────────

export const SEASONAL_TRENDS: Readonly<Record<SeasonKey, SeasonalTrend>> = {
  ramadan: {
    themes: ['عطر رمضان', 'ريحة الليالي', 'عطر السحور', 'هدية رمضان'],
    contentTypes: ['مقارنة', 'هدايا', 'عطور العائلة', 'ذكريات رمضان'],
    hook: 'ما فيه شي يجيب روحة رمضان مثل',
    platforms: ['instagram', 'tiktok', 'snapchat', 'whatsapp_status', 'telegram'],
    monthsActive: [2, 3, 4],
  },
  summer: {
    themes: ['عطر الصيف', 'fresh', 'ثبات رغم الحر', 'عطر بحر'],
    contentTypes: ['مقارنة', 'تجربة شخصية', 'نصائح'],
    hook: 'في الحر هذا — هذا العطر الوحيد اللي',
    platforms: ['tiktok', 'instagram', 'snapchat', 'twitter'],
    monthsActive: [5, 6, 7, 8, 9],
  },
  winter: {
    themes: ['عطر الشتاء', 'عود', 'warmth', 'أجواء المطر'],
    contentTypes: ['مزاج', 'قصة', 'مراجعة'],
    hook: 'لما الجو يبرد — جسمك يطلب',
    platforms: ['instagram', 'pinterest', 'tiktok', 'twitter'],
    monthsActive: [11, 12, 1, 2],
  },
  eid: {
    themes: ['عطر العيد', 'هدية العيد', 'تحضيرات العيد'],
    contentTypes: ['هدايا', 'تجهيز', 'عائلة'],
    hook: 'ما يكتمل العيد إلا بـ',
    platforms: ['instagram', 'tiktok', 'snapchat', 'whatsapp_status'],
    monthsActive: [4, 5, 6],
  },
  back_to_school: {
    themes: ['عطر الجامعة', 'أول يوم', 'انطباع أول'],
    contentTypes: ['نصائح', 'مقارنة', 'دليل'],
    hook: 'أول يوم في الجامعة — العطر هو',
    platforms: ['tiktok', 'instagram', 'snapchat'],
    monthsActive: [8, 9],
  },
  national_day: {
    themes: ['اليوم الوطني', 'هويتنا', 'فخر سعودي'],
    contentTypes: ['تراث', 'هوية', 'احتفال'],
    hook: 'في اليوم الوطني — عطر يحكي قصتنا',
    platforms: ['instagram', 'twitter', 'tiktok', 'snapchat'],
    monthsActive: [9],
  },
} as const;

export const CULTURAL_TRENDS: Readonly<Record<CulturalKey, CulturalTrend>> = {
  saudi_pride: {
    hook: 'عطر يحكي هويتنا السعودية',
    angle: 'ربط العطر بالتراث والهوية الوطنية',
    platforms: ['instagram', 'tiktok', 'twitter', 'snapchat'],
  },
  hospitality: {
    hook: 'ضيوفك ما ينسون ريحة بيتك لو',
    angle: 'ثقافة الضيافة والكرم وعطر البيت',
    platforms: ['instagram', 'pinterest', 'tiktok', 'telegram'],
  },
  confidence: {
    hook: 'العطر السلاح السري للواثق',
    angle: 'الثقة والشخصية والانطباع الأول',
    platforms: ['linkedin', 'instagram', 'twitter', 'tiktok'],
  },
  gifting: {
    hook: 'أفضل هدية ما تحتار فيها',
    angle: 'ثقافة الهدايا حسب المناسبة والشخصية',
    platforms: ['pinterest', 'instagram', 'whatsapp_status', 'telegram'],
  },
} as const;

export const VIRAL_FORMATS: Readonly<Record<ViralFormatKey, ViralFormatTrend>> = {
  get_ready_with_me: {
    arabicName: 'جهزوني معكم',
    template: 'GRWM + {perfume} = طقس صباحي',
    hook: 'جهزوني معكم وكيف اخترت عطر اليوم',
    platforms: ['tiktok', 'instagram', 'snapchat'],
    bestFor: ['fresh', 'sweet', 'floral'],
  },
  rate_my_collection: {
    arabicName: 'قيّم مجموعتي',
    template: 'استعراض مجموعة + سؤال للجمهور',
    hook: 'قيّموا مجموعة عطوري — أكيد عندكم رأي',
    platforms: ['tiktok', 'instagram', 'snapchat', 'twitter'],
    bestFor: ['oud', 'leather', 'sweet', 'fresh'],
  },
  honest_review: {
    arabicName: 'مراجعة صريحة',
    template: 'مراجعة بعد فترة استخدام طويلة',
    hook: 'مراجعتي الصريحة لـ{perfume} بعد شهر',
    platforms: ['tiktok', 'instagram', 'youtube_shorts', 'twitter'],
    bestFor: ['oud', 'leather', 'fresh', 'sweet', 'floral', 'generic'],
  },
  gifting_guide: {
    arabicName: 'دليل الهدايا',
    template: 'اختيار حسب الشخصية والمناسبة',
    hook: 'دليل اختيار عطر الهدية حسب الشخصية',
    platforms: ['instagram', 'pinterest', 'tiktok', 'telegram'],
    bestFor: ['oud', 'sweet', 'floral'],
  },
  scent_memory: {
    arabicName: 'ذاكرة العطر',
    template: 'كل ريحة بتجيب لك ذكرى',
    hook: 'كل ريحة تجيب لي ذكرى — {perfume} يجيبني',
    platforms: ['twitter', 'instagram', 'tiktok'],
    bestFor: ['floral', 'sweet', 'oud'],
  },
  blind_test: {
    arabicName: 'اختبار العمياء',
    template: 'مقارنة بدون رؤية الزجاجة',
    hook: 'حطيت 3 عطور على ذراعي — أي ريحة أحسن؟',
    platforms: ['tiktok', 'instagram', 'snapchat'],
    bestFor: ['fresh', 'sweet', 'floral', 'oud'],
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Perfume Classification (محلي للملف لتفادي الاعتماد المتبادل)
// ─────────────────────────────────────────────────────────────

type PerfumeClass = 'oud' | 'fresh' | 'sweet' | 'leather' | 'floral' | 'generic';

function classify(p: PerfumeData): PerfumeClass {
  const blob = `${p.notes || ''} ${p.description || ''}`.toLowerCase();
  if (/oud|عود|amber|عنبر/.test(blob)) return 'oud';
  if (/leather|tobacco|جلد|تبغ/.test(blob)) return 'leather';
  if (/fresh|aquatic|citrus|منعش|حمضي/.test(blob)) return 'fresh';
  if (/vanilla|sweet|caramel|فانيلا|حلو/.test(blob)) return 'sweet';
  if (/rose|jasmine|floral|ورد|ياسمين|زهري/.test(blob)) return 'floral';
  return 'generic';
}

function currentMonth(now: Date = new Date()): number {
  return now.getMonth() + 1;
}

function urgencyForMonths(activeMonths: readonly number[], now: Date = new Date()): TrendUrgency {
  const m = currentMonth(now);
  if (activeMonths.includes(m)) return 'now';
  const next = activeMonths.find((x) => x > m) ?? activeMonths[0];
  const distance = next > m ? next - m : 12 - m + next;
  if (distance <= 1) return 'this_week';
  return 'evergreen';
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * يربط منتج عطر بالترندات الأنسب له، مرتّبة حسب إمكانية الانتشار.
 * يرجع قائمة أفكار محتوى جاهزة للتنفيذ.
 */
export function matchProductToTrend(
  perfumeData: PerfumeData,
  options: { now?: Date; limit?: number } = {},
): TrendableContent[] {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 5;
  const cls = classify(perfumeData);
  const out: TrendableContent[] = [];

  // 1) Seasonal
  for (const [key, t] of Object.entries(SEASONAL_TRENDS) as [SeasonKey, SeasonalTrend][]) {
    const urgency = urgencyForMonths(t.monthsActive, now);
    const baseScore =
      urgency === 'now' ? 92 :
      urgency === 'this_week' ? 78 : 55;
    const categoryBoost =
      (key === 'winter' && (cls === 'oud' || cls === 'leather')) ? 6 :
      (key === 'summer' && cls === 'fresh') ? 6 :
      (key === 'ramadan' && cls === 'oud') ? 5 : 0;
    out.push({
      perfumeName: perfumeData.name,
      trendContext: 'seasonal',
      trendKey: key,
      arabicAngle: t.themes.join(' • '),
      contentIdea: `${t.hook} ${perfumeData.name}`,
      hook: `${t.hook} ${perfumeData.name}`,
      platforms: [...t.platforms],
      urgency,
      score: Math.min(100, baseScore + categoryBoost),
    });
  }

  // 2) Cultural
  for (const [key, t] of Object.entries(CULTURAL_TRENDS) as [CulturalKey, CulturalTrend][]) {
    out.push({
      perfumeName: perfumeData.name,
      trendContext: 'cultural',
      trendKey: key,
      arabicAngle: t.angle,
      contentIdea: `${t.hook} — ${perfumeData.name}`,
      hook: t.hook,
      platforms: [...t.platforms],
      urgency: 'evergreen',
      score: 70,
    });
  }

  // 3) Viral Formats
  for (const [key, f] of Object.entries(VIRAL_FORMATS) as [ViralFormatKey, ViralFormatTrend][]) {
    if (!f.bestFor.includes(cls)) continue;
    out.push({
      perfumeName: perfumeData.name,
      trendContext: 'viral_format',
      trendKey: key,
      arabicAngle: f.template,
      contentIdea: f.hook.replace('{perfume}', perfumeData.name),
      hook: f.hook.replace('{perfume}', perfumeData.name),
      platforms: [...f.platforms],
      urgency: 'evergreen',
      score: 75,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** ترشيح الترندات النشطة فعلياً الآن (urgency === 'now') */
export function getActiveTrends(perfumeData: PerfumeData, now: Date = new Date()): TrendableContent[] {
  return matchProductToTrend(perfumeData, { now, limit: 20 }).filter((t) => t.urgency === 'now');
}

/** بناء جزء prompt جاهز لإطعام محرك الكابشنات */
export function trendToPromptFragment(t: TrendableContent): string {
  return [
    `[TREND]`,
    `Context: ${t.trendContext} | Key: ${t.trendKey} | Urgency: ${t.urgency}`,
    `Angle: ${t.arabicAngle}`,
    `Suggested Hook: ${t.hook}`,
    `Best Platforms: ${t.platforms.join(', ')}`,
    `Viral Score: ${t.score}/100`,
  ].join('\n');
}

/** تنبؤ بسيط بإمكانية الانتشار قبل النشر */
export function predictViralScore(input: {
  hookWordCount: number;
  hasStarInsight: boolean;
  matchesActiveTrend: boolean;
  platformFit: number; // 0..1
}): number {
  let score = 50;
  if (input.hookWordCount > 0 && input.hookWordCount <= 8) score += 18;
  else if (input.hookWordCount <= 12) score += 8;
  else score -= 6;
  if (input.hasStarInsight) score += 10;
  if (input.matchesActiveTrend) score += 14;
  score += Math.round(input.platformFit * 8);
  return Math.max(0, Math.min(100, score));
}
