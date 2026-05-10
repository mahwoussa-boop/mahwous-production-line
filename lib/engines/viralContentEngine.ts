// ============================================================
// lib/engines/viralContentEngine.ts
// محرك المحتوى الفيروسي — Hooks + Persona Voices + Platform Formulas
// Additive: لا يعدّل أي ملف موجود. آمن للاستيراد عند الحاجة فقط.
// ============================================================

import type { PerfumeData } from '../types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ViralPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'snapchat'
  | 'youtube_shorts'
  | 'threads'
  | 'pinterest'
  | 'telegram'
  | 'whatsapp_status'
  | 'google_business'
  | 'linkedin'
  | 'facebook';

export type HookCategory =
  | 'curiosity'
  | 'controversy'
  | 'story'
  | 'education'
  | 'ugc_bait';

export type ContentMode =
  | 'viral'
  | 'educational'
  | 'story'
  | 'promotional'
  | 'trend';

export type PersonaVoice =
  | 'expert'
  | 'friend'
  | 'hype'
  | 'storyteller'
  | 'educator';

export interface PerfumeContext {
  perfume: string;
  brand?: string;
  category?: string;
  notes?: string;
  hours?: number; // ثبات تقريبي بالساعات
}

export interface ViralHook {
  category: HookCategory;
  text: string;
  wordCount: number;
}

export interface PersonaProfile {
  voice: PersonaVoice;
  openings: readonly string[];
  tone: string;
  signature: string;
}

export interface PlatformFormula {
  platform: ViralPlatform;
  formula: string;
  maxFirstSentenceWords: number;
  hookStyle: HookCategory[];
  notesAr: string;
}

export interface ViralContentBlueprint {
  hook: ViralHook;
  persona: PersonaProfile;
  formula: PlatformFormula;
  starInsight?: string;
  callToAction: string;
}

// ─────────────────────────────────────────────────────────────
// Viral Hook Library
// أنماط Hooks مجرّبة فيروسياً — تُعبّأ بالـ context قبل الاستخدام
// Placeholders: {perfume} {brand} {X} {category}
// ─────────────────────────────────────────────────────────────

export const VIRAL_HOOK_PATTERNS: Readonly<Record<HookCategory, readonly string[]>> = {
  curiosity: [
    'ما أحد يقولك هذا عن {perfume}',
    'اكتشفت سر {brand} اللي يخفونه',
    'لو تعرف هذا عن العطر ما تشتريه من غيرنا',
    'السبب الحقيقي ليش {perfume} يثبت {X} ساعة',
    'تجربة غيّرت رأيي كلياً في {perfume}',
  ],
  controversy: [
    'رأيي الصريح في {perfume} — قد ما يعجبك',
    'ليش أنا ضد شراء {perfume} لهالفئة',
    'الحقيقة المُرّة عن عطور {category}',
    'ليش الناس تكره {perfume} وأنا أحبه',
  ],
  story: [
    'قصة: عطر واحد غيّر نظرة الناس لي',
    'عميل جانا يبكي بسبب {perfume}',
    'قبل وبعد: ردة فعل زوجتي على {perfume}',
    'اليوم اللي تعلمت فيه درس في العطور',
  ],
  education: [
    'الدليل الكامل لـ{perfume} في 60 ثانية',
    'ثلاث أخطاء تدمر عطرك — وقّفها الحين',
    'كيف تفرّق بين الأصلي والتقليد بدقيقة',
    'سر رش العطر اللي ما يعرفه 90% من الناس',
  ],
  ugc_bait: [
    'قل اسم عطرك المفضل بدون ما تذكره',
    'أي فئة أنت؟ تعليق تحت',
    'مين يتذكر أول عطر اشتراه؟',
    'وش تحس لما تشم {perfume}؟',
  ],
} as const;

// ─────────────────────────────────────────────────────────────
// Persona Voices — أصوات مهووس المتعددة
// ─────────────────────────────────────────────────────────────

export const MAHWOUS_PERSONA_VOICES: Readonly<Record<PersonaVoice, PersonaProfile>> = {
  expert: {
    voice: 'expert',
    openings: [
      'كخبير عطور بسنين في المجال',
      'تعلمت من آلاف العملاء إن',
      'هذا اللي ما يقوله أحد بصراحة',
    ],
    tone: 'واثق علمي بسيط',
    signature: 'رأي الخبير',
  },
  friend: {
    voice: 'friend',
    openings: [
      'بيني وبينك',
      'لو صديقي يسألني',
      'والله بقولك الحقيقة',
    ],
    tone: 'ودي صريح حميمي',
    signature: 'من القلب',
  },
  hype: {
    voice: 'hype',
    openings: [
      'يا ناس',
      'والله مو طبيعي',
      'ما تصدق اللي وصلنا',
    ],
    tone: 'حماسي طاقة عالية',
    signature: 'مهووس',
  },
  storyteller: {
    voice: 'storyteller',
    openings: [
      'كان فيه مرة',
      'قبل سنتين',
      'عميل جانا وقال لي',
    ],
    tone: 'سردي مشوّق عاطفي',
    signature: 'قصة حقيقية',
  },
  educator: {
    voice: 'educator',
    openings: [
      'هل تعرف ليش',
      'العلم يقول',
      'السبب وراء هذا',
    ],
    tone: 'تعليمي منظم مفيد',
    signature: 'معلومة تستاهل',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Platform Viral Formulas
// ─────────────────────────────────────────────────────────────

export const PLATFORM_VIRAL_FORMULAS: Readonly<Record<ViralPlatform, PlatformFormula>> = {
  tiktok: {
    platform: 'tiktok',
    formula: 'Hook(3s) -> Problem(5s) -> Solution(15s) -> CTA(5s)',
    maxFirstSentenceWords: 8,
    hookStyle: ['curiosity', 'story', 'controversy'],
    notesAr: 'قصير جداً، صوت مهووس، لقطة أولى تستوقف الإبهام',
  },
  instagram: {
    platform: 'instagram',
    formula: 'Visual hook -> Story beat -> Value -> Save/Share prompt',
    maxFirstSentenceWords: 8,
    hookStyle: ['story', 'education', 'curiosity'],
    notesAr: 'نص أنيق، Carousel-friendly، نهاية تدفع للحفظ',
  },
  snapchat: {
    platform: 'snapchat',
    formula: 'Immediate value -> FOMO -> Action',
    maxFirstSentenceWords: 6,
    hookStyle: ['ugc_bait', 'curiosity'],
    notesAr: 'مباشر بدون مقدمات، يطلع للأصدقاء فوراً',
  },
  twitter: {
    platform: 'twitter',
    formula: 'Opinion -> Evidence -> Question to audience',
    maxFirstSentenceWords: 10,
    hookStyle: ['controversy', 'education', 'ugc_bait'],
    notesAr: 'رأي حاد، يفتح نقاش، يستحق الاقتباس',
  },
  youtube_shorts: {
    platform: 'youtube_shorts',
    formula: 'Thumbnail promise -> Delivery -> Surprise twist',
    maxFirstSentenceWords: 8,
    hookStyle: ['curiosity', 'education'],
    notesAr: 'وعد قوي في أول ثانية + تنفيذ + قلب التوقع',
  },
  threads: {
    platform: 'threads',
    formula: 'Controversial take -> Discussion -> Question',
    maxFirstSentenceWords: 9,
    hookStyle: ['controversy', 'ugc_bait'],
    notesAr: 'منشور قصير ≤150 كلمة، يفتح ردود',
  },
  pinterest: {
    platform: 'pinterest',
    formula: 'Mood -> Occasion -> Benefit -> CTA',
    maxFirstSentenceWords: 10,
    hookStyle: ['story', 'education'],
    notesAr: 'وصف ملهم بصري، كلمات بحثية واضحة',
  },
  telegram: {
    platform: 'telegram',
    formula: 'Exclusive info -> Detailed review -> Community CTA',
    maxFirstSentenceWords: 10,
    hookStyle: ['education', 'story'],
    notesAr: 'تفصيلي، شعور القناة الخاصة، بدون هاشتاقات',
  },
  whatsapp_status: {
    platform: 'whatsapp_status',
    formula: 'Urgency -> Exclusive -> Action',
    maxFirstSentenceWords: 6,
    hookStyle: ['curiosity', 'ugc_bait'],
    notesAr: 'قصير وقوي، 24 ساعة فقط',
  },
  google_business: {
    platform: 'google_business',
    formula: 'Product name -> Benefits -> Location CTA',
    maxFirstSentenceWords: 12,
    hookStyle: ['education'],
    notesAr: 'مُحسّن SEO، كلمات بحثية محلية، نبرة احترافية',
  },
  linkedin: {
    platform: 'linkedin',
    formula: 'Professional insight -> Story -> Lesson',
    maxFirstSentenceWords: 12,
    hookStyle: ['story', 'education'],
    notesAr: 'احترافي بدون فقدان الدفء',
  },
  facebook: {
    platform: 'facebook',
    formula: 'Relatable hook -> Community story -> Engagement question',
    maxFirstSentenceWords: 10,
    hookStyle: ['story', 'ugc_bait'],
    notesAr: 'يخاطب فئة عمرية أوسع، حكاية قصيرة',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Hook Generation
// ─────────────────────────────────────────────────────────────

const PLACEHOLDER_RE = /\{(perfume|brand|X|category)\}/g;

export function fillHookTemplate(template: string, ctx: PerfumeContext): string {
  return template.replace(PLACEHOLDER_RE, (_, key: string) => {
    switch (key) {
      case 'perfume': return ctx.perfume || 'هالعطر';
      case 'brand': return ctx.brand || 'الماركة';
      case 'category': return ctx.category || 'هالفئة';
      case 'X': return ctx.hours ? String(ctx.hours) : '8';
      default: return '';
    }
  }).trim();
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function buildHook(category: HookCategory, ctx: PerfumeContext, seed = 0): ViralHook {
  const pool = VIRAL_HOOK_PATTERNS[category];
  const template = pool[Math.abs(seed) % pool.length];
  const text = fillHookTemplate(template, ctx);
  return { category, text, wordCount: countWords(text) };
}

// ─────────────────────────────────────────────────────────────
// Smart Hook Selector — يختار أفضل Hook حسب المنتج والمنصة والنمط
// ─────────────────────────────────────────────────────────────

function classifyPerfume(p: PerfumeData): {
  category: 'oud' | 'fresh' | 'sweet' | 'leather' | 'floral' | 'generic';
  approxHours: number;
} {
  const blob = `${p.notes || ''} ${p.description || ''}`.toLowerCase();
  if (/oud|عود|amber|عنبر/.test(blob)) return { category: 'oud', approxHours: 12 };
  if (/leather|tobacco|جلد|تبغ/.test(blob)) return { category: 'leather', approxHours: 10 };
  if (/fresh|aquatic|citrus|منعش|حمضي/.test(blob)) return { category: 'fresh', approxHours: 6 };
  if (/vanilla|sweet|caramel|فانيلا|حلو/.test(blob)) return { category: 'sweet', approxHours: 8 };
  if (/rose|jasmine|floral|ورد|ياسمين|زهري/.test(blob)) return { category: 'floral', approxHours: 7 };
  return { category: 'generic', approxHours: 8 };
}

export function selectOptimalHook(
  perfumeData: PerfumeData,
  platform: ViralPlatform,
  mode: ContentMode,
  seed = 0,
): ViralHook {
  const cls = classifyPerfume(perfumeData);
  const ctx: PerfumeContext = {
    perfume: perfumeData.name,
    brand: perfumeData.brand,
    category: cls.category,
    notes: perfumeData.notes,
    hours: cls.approxHours,
  };

  const formula = PLATFORM_VIRAL_FORMULAS[platform];
  const modeMap: Readonly<Record<ContentMode, HookCategory>> = {
    viral: 'curiosity',
    educational: 'education',
    story: 'story',
    promotional: 'ugc_bait',
    trend: 'controversy',
  };

  const preferred = modeMap[mode];
  const category = formula.hookStyle.includes(preferred)
    ? preferred
    : formula.hookStyle[0];

  const hook = buildHook(category, ctx, seed);

  // Thumb-stop guard: لو طلع طويل، جرّب أول pattern أقصر في نفس الفئة
  if (hook.wordCount > formula.maxFirstSentenceWords) {
    const pool = VIRAL_HOOK_PATTERNS[category];
    let best = hook;
    for (let i = 0; i < pool.length; i++) {
      const cand = buildHook(category, ctx, seed + i);
      if (cand.wordCount <= formula.maxFirstSentenceWords) return cand;
      if (cand.wordCount < best.wordCount) best = cand;
    }
    return best;
  }
  return hook;
}

// ─────────────────────────────────────────────────────────────
// A/B Variants
// ─────────────────────────────────────────────────────────────

export function generateHookVariants(
  perfumeData: PerfumeData,
  platform: ViralPlatform,
  mode: ContentMode,
  count = 3,
): ViralHook[] {
  const out: ViralHook[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < count && i < count * 6; i++) {
    const h = selectOptimalHook(perfumeData, platform, mode, i);
    if (!seen.has(h.text)) {
      seen.add(h.text);
      out.push(h);
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Persona Selection
// ─────────────────────────────────────────────────────────────

export function pickPersonaForMode(mode: ContentMode): PersonaProfile {
  const map: Readonly<Record<ContentMode, PersonaVoice>> = {
    viral: 'hype',
    educational: 'educator',
    story: 'storyteller',
    promotional: 'friend',
    trend: 'expert',
  };
  return MAHWOUS_PERSONA_VOICES[map[mode]];
}

// ─────────────────────────────────────────────────────────────
// Blueprint Builder — وحدة جاهزة للتغذية في prompt الـ LLM
// ─────────────────────────────────────────────────────────────

export function buildViralBlueprint(
  perfumeData: PerfumeData,
  platform: ViralPlatform,
  mode: ContentMode,
  seed = 0,
): ViralContentBlueprint {
  const hook = selectOptimalHook(perfumeData, platform, mode, seed);
  const persona = pickPersonaForMode(mode);
  const formula = PLATFORM_VIRAL_FORMULAS[platform];
  const cta = buildCallToAction(platform, mode);
  return { hook, persona, formula, callToAction: cta };
}

function buildCallToAction(platform: ViralPlatform, mode: ContentMode): string {
  if (mode === 'promotional') return 'اطلب الحين عبر واتساب';
  switch (platform) {
    case 'tiktok': return 'تابعنا للمزيد من العطور';
    case 'instagram': return 'احفظ المنشور وارجعله بعدين';
    case 'twitter': return 'وش رأيك؟ شاركنا تحت';
    case 'snapchat': return 'سوايب أب على الموقع';
    case 'youtube_shorts': return 'اشترك للمزيد من المراجعات';
    case 'threads': return 'شاركنا تجربتك';
    case 'pinterest': return 'احفظ الفكرة لمناسبتك';
    case 'telegram': return 'انضم للقناة لعروض حصرية';
    case 'whatsapp_status': return 'كلّمنا قبل ينفد';
    case 'google_business': return 'زورنا أو اطلب أونلاين';
    case 'linkedin': return 'شاركنا رأيك المهني';
    case 'facebook': return 'تفاعل وشاركها مع صديق';
  }
}

// ─────────────────────────────────────────────────────────────
// Star Insight — معلومة لافتة لكل فئة عطر (تُستخدم في المحتوى التعليمي)
// ─────────────────────────────────────────────────────────────

export function getStarInsight(perfumeData: PerfumeData): string {
  const { category } = classifyPerfume(perfumeData);
  const insights: Readonly<Record<string, string>> = {
    oud: 'العود الفاخر يعتق بالزجاجة — كل ما تأخر فتحه، صار أعمق',
    fresh: 'العطور المنعشة تتبخر أسرع، لذلك رشّها على الملابس مش الجلد فقط',
    sweet: 'الفانيلا الحقيقية تختلف عن التركيبية — الأصل يعطيك دفء يدوم',
    leather: 'نوتة الجلد تحتاج جسم دافئ عشان تتفجّر — رشّها قبل الخروج بنص ساعة',
    floral: 'العطور الزهرية أقوى في الصباح وأنعم في المساء — جربها في الوقتين',
    generic: 'العطر الأصلي يتغيّر على بشرتك خلال ساعة — هذا اختبار الأصالة',
  };
  return insights[category] ?? insights.generic;
}

// ─────────────────────────────────────────────────────────────
// LLM Prompt Fragment — تسليم الـ blueprint للـ Caption Engine
// ─────────────────────────────────────────────────────────────

export function blueprintToPromptFragment(bp: ViralContentBlueprint): string {
  return [
    `[VIRAL BLUEPRINT]`,
    `Platform: ${bp.formula.platform}`,
    `Formula: ${bp.formula.formula}`,
    `Hook (use as opener, max ${bp.formula.maxFirstSentenceWords} words): ${bp.hook.text}`,
    `Persona Voice: ${bp.persona.voice} | Tone: ${bp.persona.tone}`,
    `Persona Opening pool: ${bp.persona.openings.join(' / ')}`,
    `Signature line: ${bp.persona.signature}`,
    `CTA: ${bp.callToAction}`,
    `Notes: ${bp.formula.notesAr}`,
  ].join('\n');
}
