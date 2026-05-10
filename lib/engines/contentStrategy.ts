// ============================================================
// lib/engines/contentStrategy.ts — Content Strategy Engine
// استراتيجية المحتوى — قاعدة 50/50 + اختبارات A/B
// ============================================================

import type { PerfumeData } from '../types';
import type {
  ContentType,
  ContentStrategyConfig,
  ABTestVariant,
  ABTestResult,
} from '../pipeline/pipelineTypes';

// ── Content Type Selection (50/50 Rule) ────────────────────────────────────

const CONTENT_HISTORY_KEY = 'mahwous_content_history';

interface ContentHistoryEntry {
  timestamp: string;
  productUrl: string;
  contentType: ContentType;
}

/**
 * Determines the next content type based on the 50/50 rule:
 * half educational, half promotional
 */
export function determineContentType(): ContentType {
  if (typeof window === 'undefined') {
    // Server-side: alternate based on timestamp
    return Date.now() % 2 === 0 ? 'educational' : 'promotional';
  }

  try {
    const history: ContentHistoryEntry[] = JSON.parse(
      localStorage.getItem(CONTENT_HISTORY_KEY) || '[]'
    );

    // Count last 10 posts
    const recent = history.slice(0, 10);
    const educationalCount = recent.filter(h => h.contentType === 'educational').length;
    const promotionalCount = recent.filter(h => h.contentType === 'promotional').length;

    // Maintain balance: pick the less-used type
    if (educationalCount <= promotionalCount) return 'educational';
    return 'promotional';
  } catch {
    return 'promotional';
  }
}

export function recordContentType(productUrl: string, contentType: ContentType): void {
  if (typeof window === 'undefined') return;

  try {
    const history: ContentHistoryEntry[] = JSON.parse(
      localStorage.getItem(CONTENT_HISTORY_KEY) || '[]'
    );

    history.unshift({
      timestamp: new Date().toISOString(),
      productUrl,
      contentType,
    });

    // Keep last 100 entries
    if (history.length > 100) history.splice(100);
    localStorage.setItem(CONTENT_HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

// ── Educational Content Templates ──────────────────────────────────────────

const EDUCATIONAL_TEMPLATES = {
  comparison: {
    id: 'comparison',
    nameAr: 'مقارنة عطور',
    template: (perfume: PerfumeData) =>
      `هل تعرف الفرق بين ${perfume.name} والعطور المشابهة؟ خلّنا نقارن!`,
    hookAr: 'هل تعرف الفرق؟',
  },
  tips: {
    id: 'tips',
    nameAr: 'نصائح العطور',
    template: (perfume: PerfumeData) =>
      `3 نصائح ذهبية لتثبيت ${perfume.name} طول اليوم`,
    hookAr: '3 نصائح ذهبية',
  },
  layering: {
    id: 'layering',
    nameAr: 'طبقات العطر',
    template: (perfume: PerfumeData) =>
      `تعال نفهم طبقات ${perfume.name}: المقدمة والقلب والقاعدة`,
    hookAr: 'اكتشف الطبقات',
  },
  occasions: {
    id: 'occasions',
    nameAr: 'مناسبات العطر',
    template: (perfume: PerfumeData) =>
      `متى تستخدم ${perfume.name}؟ دليلك الكامل للمناسبات`,
    hookAr: 'دليل المناسبات',
  },
  history: {
    id: 'history',
    nameAr: 'قصة العطر',
    template: (perfume: PerfumeData) =>
      `قصة ${perfume.brand}: كيف بدأت رحلة صناعة ${perfume.name}`,
    hookAr: 'القصة وراء العطر',
  },
};

// ── Promotional Content Templates ──────────────────────────────────────────

const PROMOTIONAL_TEMPLATES = {
  unboxing: {
    id: 'unboxing',
    nameAr: 'فتح العلبة',
    template: (perfume: PerfumeData) =>
      `وصلني ${perfume.name} الجديد! تعالوا نشوف التغليف والزجاجة 🎁`,
    hookAr: 'وصلني عطر جديد!',
  },
  review: {
    id: 'review',
    nameAr: 'مراجعة',
    template: (perfume: PerfumeData) =>
      `مراجعتي الصادقة لعطر ${perfume.name} من ${perfume.brand} — يستاهل ولا لا؟`,
    hookAr: 'يستاهل ولا لا؟',
  },
  deal: {
    id: 'deal',
    nameAr: 'عرض خاص',
    template: (perfume: PerfumeData) =>
      `عرض محدود على ${perfume.name}! ${perfume.price ? `بس ${perfume.price}` : 'اطلبه الحين'}`,
    hookAr: 'عرض لا يتكرر!',
  },
  lifestyle: {
    id: 'lifestyle',
    nameAr: 'ستايل حياة',
    template: (perfume: PerfumeData) =>
      `${perfume.name} — العطر اللي يكمّل ستايلك ويعكس شخصيتك`,
    hookAr: 'عطرك يعكس شخصيتك',
  },
  reaction: {
    id: 'reaction',
    nameAr: 'ردة فعل',
    template: (perfume: PerfumeData) =>
      `جربت ${perfume.name} لأول مرة — ردة فعلي كانت... 😱`,
    hookAr: 'ردة فعلي كانت...',
  },
};

export function getContentTemplate(
  contentType: ContentType,
  perfume: PerfumeData,
  usedTemplates: string[] = []
): { templateId: string; hook: string; hookAr: string; caption: string } {
  const templates = contentType === 'educational' ? EDUCATIONAL_TEMPLATES : PROMOTIONAL_TEMPLATES;
  const templateEntries = Object.entries(templates);

  // Avoid recently used templates
  const available = templateEntries.filter(([id]) => !usedTemplates.includes(id));
  const selected = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : templateEntries[Math.floor(Math.random() * templateEntries.length)];

  const [templateId, template] = selected;

  return {
    templateId,
    hook: template.template(perfume),
    hookAr: template.hookAr,
    caption: template.template(perfume),
  };
}

// ── A/B Testing Caption Generation ─────────────────────────────────────────

const CAPTION_STYLES = {
  emotional: {
    id: 'emotional',
    nameAr: 'عاطفي',
    prefix: '💫',
    tone: 'عاطفي ومؤثر',
  },
  informative: {
    id: 'informative',
    nameAr: 'معلوماتي',
    prefix: '📋',
    tone: 'معلوماتي ومفيد',
  },
  humorous: {
    id: 'humorous',
    nameAr: 'فكاهي',
    prefix: '😄',
    tone: 'فكاهي وخفيف',
  },
  urgency: {
    id: 'urgency',
    nameAr: 'استعجالي',
    prefix: '⚡',
    tone: 'عاجل ومحفز',
  },
};

export function generateABTestVariants(
  perfume: PerfumeData,
  platform: string,
  contentType: ContentType,
  baseCaption: string
): ABTestResult {
  // Select two contrasting styles
  const styleKeys = Object.keys(CAPTION_STYLES) as Array<keyof typeof CAPTION_STYLES>;
  const shuffled = styleKeys.sort(() => Math.random() - 0.5);
  const styleA = CAPTION_STYLES[shuffled[0]];
  const styleB = CAPTION_STYLES[shuffled[1]];

  const hashtags = generateHashtags(perfume, contentType);

  const variantA: ABTestVariant = {
    id: 'A',
    caption: transformCaptionStyle(baseCaption, styleA.tone, perfume),
    style: styleA.id,
    hashtags: hashtags.slice(0, 10),
  };

  const variantB: ABTestVariant = {
    id: 'B',
    caption: transformCaptionStyle(baseCaption, styleB.tone, perfume),
    style: styleB.id,
    hashtags: hashtags.slice(0, 10),
  };

  return {
    platform,
    variantA,
    variantB,
  };
}

function transformCaptionStyle(caption: string, tone: string, perfume: PerfumeData): string {
  // Apply tone transformation to caption
  switch (tone) {
    case 'عاطفي ومؤثر':
      return `✨ ${caption}\n\nعطر يلامس الروح ويبقى في الذاكرة... ${perfume.name} مش مجرد عطر، هو إحساس.`;
    case 'معلوماتي ومفيد':
      return `📌 ${caption}\n\nمعلومة: ${perfume.notes ? `مكونات ${perfume.name} تشمل ${perfume.notes}` : `${perfume.name} من أفضل إصدارات ${perfume.brand}`}`;
    case 'فكاهي وخفيف':
      return `${caption}\n\nلما تحط ${perfume.name} والكل يسألك "وش عطرك؟" 😎\nالرابط في البايو 👆`;
    case 'عاجل ومحفز':
      return `🔥 ${caption}\n\n⚡ الكمية محدودة! ${perfume.name} ينفد بسرعة\n🛒 اطلبه الحين قبل لا يخلص!`;
    default:
      return caption;
  }
}

function generateHashtags(perfume: PerfumeData, contentType: ContentType): string[] {
  const base = [
    '#عطور', '#عطر', '#perfume', '#fragrance',
    `#${perfume.brand?.replace(/\s+/g, '_') || 'brand'}`,
    `#${perfume.name?.replace(/\s+/g, '_').substring(0, 20) || 'perfume'}`,
  ];

  if (contentType === 'educational') {
    base.push('#نصائح_عطور', '#معلومات_عطور', '#تعلم', '#ثقافة_عطرية');
  } else {
    base.push('#عرض', '#تسوق', '#هدية', '#ستايل');
  }

  base.push('#مهووس', '#عطور_أصلية', '#السعودية');
  return base;
}

// ── Content Calendar Suggestions ───────────────────────────────────────────

export interface ContentCalendarEntry {
  day: string;
  contentType: ContentType;
  template: string;
  bestTime: string;
  platforms: string[];
}

export function generateWeeklyCalendar(perfume: PerfumeData): ContentCalendarEntry[] {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return days.map((day, index) => {
    const isEducational = index % 2 === 0; // Alternate for 50/50
    const contentType: ContentType = isEducational ? 'educational' : 'promotional';
    const template = getContentTemplate(contentType, perfume);

    return {
      day,
      contentType,
      template: template.hookAr,
      bestTime: getBestTimeForDay(index),
      platforms: getPlatformsForDay(index),
    };
  });
}

function getBestTimeForDay(dayIndex: number): string {
  // Peak engagement times for Saudi audience
  const times = ['21:00', '20:00', '21:30', '19:00', '22:00', '14:00', '20:30'];
  return times[dayIndex] || '21:00';
}

function getPlatformsForDay(dayIndex: number): string[] {
  // Rotate platforms through the week
  const allPlatforms = [
    ['instagram_post', 'tiktok', 'snapchat'],
    ['twitter', 'facebook_post', 'linkedin'],
    ['instagram_story', 'youtube_shorts', 'tiktok'],
    ['instagram_post', 'twitter', 'snapchat'],
    ['tiktok', 'instagram_post', 'youtube_shorts'],
    ['facebook_post', 'instagram_post', 'twitter'],
    ['instagram_story', 'snapchat', 'tiktok'],
  ];
  return allPlatforms[dayIndex] || allPlatforms[0];
}
