// ============================================================
// lib/mahwousCaptionEngine.ts — محرك كابشنات مهووس v3
// 15 منصة مخصصة + تحليل ذكي للعطر والجمهور المستهدف
// ============================================================

// ─── هوية مهووس الثابتة ────────────────────────────────────────
export const MAHWOUS_IDENTITY = {
  name: 'مهووس ستور',
  nameEn: 'Mahwous Store',
  tagline: 'نبيع عطور ماركات عالمية أصلية 100%',
  personality: 'خبير عطور سعودي، ودود، واثق، يتكلم بلهجة سعودية طبيعية',
  tone: 'ودي، حماسي، خبير، قريب من الناس',
  note: 'نحن نبيع ماركات عالمية أصلية — المنتجات متوفرة لدينا ولدى المنافسين، ميزتنا الخدمة والتجربة',
  whatsapp: '+966553964135',
  whatsappLink: 'https://wa.me/966553964135',
  storeUrl: 'https://mahwous.com',
};

// ─── كلمات SEO الأكثر بحثاً ───────────────────────────────────
export const SEO_KEYWORDS = {
  primary: [
    'عطور أصلية', 'عطر رجالي', 'عطر نسائي', 'أفضل عطر',
    'عطور ماركات', 'عطور فخمة', 'عطر يثبت', 'عطر يفوح',
    'perfume', 'fragrance', 'original perfume', 'luxury perfume',
  ],
  secondary: [
    'هدية عطر', 'عطر مناسبات', 'عطر يومي', 'عطر صيفي', 'عطر شتوي',
    'عطر مسائي', 'عطر للعمل', 'عطر للسهرة', 'توصيل عطور',
    'عطور السعودية', 'عطور الرياض', 'عطور جدة',
  ],
  trending2026: [
    'عطر_الموسم', 'عطر_اليوم', 'عطري_المفضل', 'عطور_2026',
    'PerfumeTok', 'FragranceCommunity', 'PerfumeCollection',
    'SaudiPerfume', 'ArabPerfume', 'NicheFragrance',
    'ScentOfTheDay', 'PerfumeAddict', 'FragranceLover',
  ],
};

// ─── تحليل ذكي للعطر والجمهور المستهدف ────────────────────────
export interface PerfumeAnalysis {
  genderLabel: string;
  genderLabelEn: string;
  targetAudience: string;
  targetAudienceEn: string;
  occasion: string;
  season: string;
  personality: string;
  ageRange: string;
  notesAr: string;
  priceFormatted: string;
}

export function analyzePerfume(
  gender?: string,
  notes?: string,
  description?: string,
  price?: string,
): PerfumeAnalysis {
  const notesLower = (notes || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const combined = `${notesLower} ${descLower}`;

  // تحديد الجنس
  const genderLabel =
    gender === 'men' ? 'للرجال' :
    gender === 'women' ? 'للنساء' : 'للجنسين';
  const genderLabelEn =
    gender === 'men' ? 'For Men' :
    gender === 'women' ? 'For Women' : 'Unisex';

  // تحديد الجمهور المستهدف
  let targetAudience = 'محبي العطور الفاخرة';
  let targetAudienceEn = 'Luxury fragrance lovers';
  if (gender === 'men') {
    if (combined.includes('oud') || combined.includes('leather') || combined.includes('tobacco')) {
      targetAudience = 'الرجل الواثق اللي يحب الفخامة والقوة';
      targetAudienceEn = 'Confident men who love power and luxury';
    } else if (combined.includes('fresh') || combined.includes('citrus') || combined.includes('aquatic')) {
      targetAudience = 'الشباب النشيط اللي يحب الانتعاش والحيوية';
      targetAudienceEn = 'Active young men who love freshness';
    } else {
      targetAudience = 'الرجل الأنيق اللي يهتم بمظهره وريحته';
      targetAudienceEn = 'Elegant men who care about their style';
    }
  } else if (gender === 'women') {
    if (combined.includes('rose') || combined.includes('jasmine') || combined.includes('floral')) {
      targetAudience = 'المرأة الأنيقة اللي تحب الورد والرومانسية';
      targetAudienceEn = 'Elegant women who love florals and romance';
    } else if (combined.includes('vanilla') || combined.includes('sweet') || combined.includes('caramel')) {
      targetAudience = 'البنت العصرية اللي تحب الريحة الحلوة والدافية';
      targetAudienceEn = 'Modern women who love sweet warm scents';
    } else {
      targetAudience = 'المرأة الواثقة اللي تبي ريحة تميزها';
      targetAudienceEn = 'Confident women who want a distinctive scent';
    }
  } else {
    targetAudience = 'كل اللي يحب العطور الفخمة — رجال ونساء';
    targetAudienceEn = 'Everyone who loves luxury fragrances';
  }

  // تحديد المناسبة
  let occasion = 'كل المناسبات';
  if (combined.includes('evening') || combined.includes('night') || combined.includes('oud') || combined.includes('intense')) {
    occasion = 'السهرات والمناسبات الخاصة';
  } else if (combined.includes('fresh') || combined.includes('light') || combined.includes('citrus') || combined.includes('sport')) {
    occasion = 'الدوام والطلعات اليومية';
  } else if (combined.includes('formal') || combined.includes('elegant') || combined.includes('office')) {
    occasion = 'الاجتماعات والمناسبات الرسمية';
  }

  // تحديد الموسم
  let season = 'كل المواسم';
  if (combined.includes('warm') || combined.includes('oud') || combined.includes('amber') || combined.includes('vanilla') || combined.includes('spicy')) {
    season = 'الشتاء والأجواء الباردة';
  } else if (combined.includes('fresh') || combined.includes('citrus') || combined.includes('aquatic') || combined.includes('light')) {
    season = 'الصيف والأجواء الحارة';
  }

  // تحديد الشخصية
  let personality = 'الذواقة';
  if (combined.includes('bold') || combined.includes('intense') || combined.includes('strong') || combined.includes('oud')) {
    personality = 'الجريء والواثق';
  } else if (combined.includes('elegant') || combined.includes('classic') || combined.includes('sophisticated')) {
    personality = 'الكلاسيكي والأنيق';
  } else if (combined.includes('fresh') || combined.includes('sport') || combined.includes('dynamic')) {
    personality = 'النشيط والعصري';
  } else if (combined.includes('romantic') || combined.includes('sweet') || combined.includes('soft')) {
    personality = 'الرومانسي والحالم';
  }

  // تحديد الفئة العمرية
  let ageRange = '25-45';
  if (combined.includes('young') || combined.includes('fresh') || combined.includes('sport') || combined.includes('trendy')) {
    ageRange = '18-30';
  } else if (combined.includes('mature') || combined.includes('classic') || combined.includes('oud') || combined.includes('vintage')) {
    ageRange = '30-55';
  }

  return {
    genderLabel,
    genderLabelEn,
    targetAudience,
    targetAudienceEn,
    occasion,
    season,
    personality,
    ageRange,
    notesAr: translateNotes(notes || ''),
    priceFormatted: price ? price.replace(/SAR/gi, 'ريال') : '',
  };
}

// ─── ترجمة المكونات الإنجليزية إلى عربي ───────────────────────
export function translateNotes(raw: string): string {
  if (!raw) return 'مكونات فاخرة تأسر الحواس';
  const map: Record<string, string> = {
    'oud': 'عود', 'musk': 'مسك', 'amber': 'عنبر', 'vanilla': 'فانيلا',
    'patchouli': 'باتشولي', 'sandalwood': 'صندل', 'bergamot': 'برغموت',
    'jasmine': 'ياسمين', 'rose': 'ورد', 'cedar': 'خشب الأرز', 'vetiver': 'فيتيفر',
    'saffron': 'زعفران', 'cardamom': 'هيل', 'cinnamon': 'قرفة', 'iris': 'زنبق',
    'lavender': 'لافندر', 'tonka': 'تونكا', 'incense': 'بخور', 'leather': 'جلد',
    'tobacco': 'تبغ', 'pepper': 'فلفل', 'ginger': 'زنجبيل', 'lemon': 'ليمون',
    'orange': 'برتقال', 'lime': 'ليم', 'geranium': 'جيرانيوم', 'tuberose': 'مسك الليل',
    'ylang': 'إيلانغ', 'neroli': 'نيرولي', 'benzoin': 'بنزوين', 'myrrh': 'مر',
    'frankincense': 'لبان', 'agarwood': 'دهن العود', 'woody': 'خشبي',
    'floral': 'زهري', 'oriental': 'شرقي', 'fresh': 'منعش', 'citrus': 'حمضي',
    'spicy': 'حار', 'sweet': 'حلو', 'warm': 'دافئ', 'aquatic': 'مائي',
    'caramel': 'كراميل', 'chocolate': 'شوكولاتة', 'coffee': 'قهوة',
    'coconut': 'جوز الهند', 'peach': 'خوخ', 'apple': 'تفاح', 'cherry': 'كرز',
    'raspberry': 'توت', 'strawberry': 'فراولة', 'plum': 'برقوق',
  };
  let result = raw;
  for (const [en, ar] of Object.entries(map)) {
    result = result.replace(new RegExp(`\\b${en}\\b`, 'gi'), ar);
  }
  return result;
}

// ─── هاشتاقات ترند لكل منصة ────────────────────────────────────
export function getTrendingHashtags(platform: string, perfumeName: string, brand: string): string[] {
  const brandTag = `#${brand.replace(/\s+/g, '_')}`;
  const nameTag = `#${perfumeName.replace(/\s+/g, '_')}`;

  const base = [
    '#عطور', '#عطور_أصلية', '#مهووس_ستور', brandTag, nameTag,
    '#perfume', '#fragrance',
  ];

  const platformSpecific: Record<string, string[]> = {
    instagram: [
      '#عطور_انستقرام', '#عطر_اليوم', '#عطري_المفضل',
      '#PerfumeOfTheDay', '#FragranceLover', '#PerfumeAddict',
      '#ScentOfTheDay', '#عطور_فخمة', '#luxury',
      '#السعودية', '#الرياض', '#جدة', '#عطور_ماركات',
      '#Explore', '#Reels', '#InstaFragrance',
    ],
    facebook: [
      '#عطور_فيسبوك', '#عروض_عطور', '#تخفيضات',
      '#عطور_أصلية_للبيع', '#هدايا', '#عطور_رجالية',
      '#عطور_نسائية', '#ماركات_أصلية',
    ],
    twitter: [
      '#عطور', '#عطر', '#السعودية', '#الرياض',
      '#PerfumeTweet', '#Fragrance', '#عطور_تويتر',
    ],
    tiktok: [
      '#PerfumeTok', '#عطور_تيك_توك', '#fyp', '#viral',
      '#foryou', '#trending', '#عطر_اليوم', '#تجربة_عطر',
      '#SmellGood', '#PerfumeReview', '#FragranceTok',
      '#عطور_ماركات', '#أفضل_عطر', '#عطر_يثبت',
    ],
    linkedin: [
      '#Perfume', '#Fragrance', '#LuxuryBrands', '#Retail',
      '#SaudiArabia', '#Ecommerce', '#عطور',
    ],
    youtube: [
      '#عطور', '#مراجعة_عطر', '#PerfumeReview', '#FragranceReview',
      '#BestPerfume', '#TopFragrance', '#عطر_اليوم',
      '#أفضل_عطور', '#عطور_رجالية', '#عطور_نسائية',
    ],
    pinterest: [
      '#Perfume', '#Fragrance', '#LuxuryPerfume', '#PerfumeBottle',
      '#عطور', '#عطور_فخمة', '#PerfumeAesthetic',
    ],
    snapchat: [
      '#عطور', '#سناب_عطور', '#عطر_اليوم', '#fyp',
    ],
    telegram: [
      '#عطور', '#عطور_أصلية', '#عروض', '#تخفيضات',
    ],
    haraj: [
      '#عطور_للبيع', '#عطور_أصلية', '#توصيل', '#ماركات',
    ],
    whatsapp: [],
    truth_social: [
      '#Perfume', '#Luxury', '#Fragrance', '#SaudiArabia',
    ],
    google_business: [
      '#عطور_أصلية', '#متجر_عطور', '#عطور_الرياض',
    ],
  };

  const limit = platform === 'instagram' ? 25 : platform === 'tiktok' ? 15 : platform === 'twitter' ? 5 : 8;
  return [...base, ...(platformSpecific[platform] || [])].slice(0, limit);
}

// ─── أدوات مساعدة ──────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type CaptionFn = (n: string, b: string, a: PerfumeAnalysis) => string;

// ═══════════════════════════════════════════════════════════════
// الصورة العمودية (9:16) — Stories
// ═══════════════════════════════════════════════════════════════

// ─── 1. انستقرام ستوري ────────────────────────────────────────
const INSTAGRAM_STORY: CaptionFn[] = [
  (n, b, a) => `بخة واحدة كفيلة تغير يومك!\n${n} — ${b}\n${a.genderLabel}\n\nللطلب: ${MAHWOUS_IDENTITY.whatsappLink}`,
  (n, b, a) => `عطر اليوم: ${n} من ${b}\n${a.genderLabel} | ${a.occasion}\n\nوش رأيكم؟`,
  (n, b, a) => `جربته اليوم وأقول واو!\n${n} — ${b}\nيناسب ${a.targetAudience}\n\nاسحب فوق للطلب`,
  (n, b) => `سحبة سريعة على ${n}\nمن ${b} — أصلي 100%\n\nمهووس ستور`,
  (n, b, a) => `اللي يبي يسأل عن العطر — هذا هو!\n${n} — ${b}\n${a.genderLabel} | ${a.season}`,
  (n, b, a) => `حاط ${n} اليوم\nمن ${b}\nمناسب لـ${a.occasion}\n\nجربه!`,
  (n, b) => `ريحة تخليك تبتسم\n${n} — ${b}\nأصلي 100%`,
];

// ─── 2. سناب شات ستوري/سناب ──────────────────────────────────
const SNAPCHAT_STORY: CaptionFn[] = [
  (n, b) => `${n} من ${b} 🔥\nعطر يسحر — جربه!`,
  (n, b) => `بخة اليوم ${n} 💨\nمن ${b} — أصلي`,
  (n, b) => `وش حاط اليوم؟ 🤔\n${n} — ${b}`,
  (n, b, a) => `عطر ${a.genderLabel} يجنن 😍\n${n} من ${b}`,
  (n, b) => `ريحة اليوم خرافية 🫡\n${n} — ${b}\nمهووس ستور`,
  (n, b) => `هالعطر مو طبيعي 🤯\n${n} من ${b}`,
];

// ─── 3. بنترست بن ─────────────────────────────────────────────
const PINTEREST_PIN: CaptionFn[] = [
  (n, b, a) => `${n} by ${b} — ${a.genderLabelEn}\n\nLuxury Perfume | Original 100%\nPerfect for ${a.occasion}\n\n${a.notesAr ? `Notes: ${a.notesAr}` : 'Exquisite blend of premium ingredients'}\n\nShop at Mahwous Store\n${MAHWOUS_IDENTITY.storeUrl}`,
  (n, b, a) => `Perfume of the Day: ${n} — ${b}\n${a.genderLabelEn} | ${a.targetAudienceEn}\n\nElegant, Long-lasting, Irresistible\n\nDiscover at Mahwous Store`,
  (n, b, a) => `${b} ${n} — The Perfect Scent ${a.genderLabelEn}\n\nIdeal for: ${a.occasion}\nSeason: ${a.season}\n\nShop luxury fragrances at mahwous.com`,
];

// ─── 4. فيسبوك ستوري ──────────────────────────────────────────
const FACEBOOK_STORY: CaptionFn[] = [
  (n, b) => `عطر اليوم ${n} — ${b}\nمتوفر في مهووس ستور\n\nاطلبه الآن!`,
  (n, b, a) => `${n} من ${b}\n${a.genderLabel} | أصلي 100%\n\nجربه وراح تدمن عليه!`,
  (n, b) => `بخة واحدة = يوم كامل فخامة\n${n} — ${b}\n\nمهووس ستور`,
  (n, b, a) => `عطر يناسب ${a.occasion}\n${n} من ${b}\n\nاطلبه الآن`,
];

// ─── 5. تيك توك غلاف/ستوري ───────────────────────────────────
const TIKTOK_COVER: CaptionFn[] = [
  (n, b, a) => `هذا العطر خلى كل اللي حولي يسألوني وش حاط!\n\n${n} من ${b} | ${a.genderLabel}\n\nأصلي 100% من مهووس ستور`,
  (n, b) => `POV: لقيت عطر يثبت معك من الصبح لآخر الليل\n\n${n} — ${b}`,
  (n, b) => `تحدي: شم هالعطر وقول لي مو حلو! مستحيل\n\n${n} من ${b}`,
  (n, b) => `العطر اللي كل الناس تسأل عنه\n\n${n} — ${b}\n\nالرابط في البايو`,
  (n, b) => `لا تشتري عطر قبل ما تشوف هالفيديو!\n\n${n} من ${b} — راح يغير رأيك`,
  (n, b) => `ردة فعلي لما شميت ${n} أول مرة\n\nمن ${b} — عطر مو طبيعي!`,
  (n, b, a) => `عطر واحد بس يكفي يخلي يومك كامل فخامة\n\n${n} — ${b}\n${a.genderLabel}\n\nجربه وشكرني بعدين`,
  (n, b, a) => `أفضل عطر ${a.genderLabel} لـ${a.season}\n\n${n} من ${b}\n\nرأيكم؟`,
];

// ─── 6. واتساب حالة ───────────────────────────────────────────
const WHATSAPP_STATUS: CaptionFn[] = [
  (n, b, a) => `السلام عليكم\n\nعطر جديد وصلنا:\n\n*${n}* من *${b}*\n${a.genderLabel}\n\nأصلي 100%\nثبات عالي\nتوصيل سريع\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : ''}\n\nللطلب تواصل معنا مباشرة\n${MAHWOUS_IDENTITY.whatsappLink}\n\nمهووس ستور — ذوقك يستاهل الأفضل`,
  (n, b, a) => `مساء الخير\n\nتبي عطر يخلي يومك أحلى؟\n\n*${n}* — *${b}*\n${a.genderLabel}\n\nعطر فخم ${a.priceFormatted ? `بسعر ${a.priceFormatted}` : 'بسعر مناسب'}\n\nتبي تطلب؟ رد علينا\n${MAHWOUS_IDENTITY.whatsappLink}\n\nمهووس ستور`,
  (n, b, a) => `عطر اليوم\n\n*${n}* من *${b}*\n${a.genderLabel}\n\nمن أفضل العطور اللي عندنا!\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : 'السعر: تواصل معنا'}\nالتوصيل: متاح\n\n${MAHWOUS_IDENTITY.whatsappLink}\nمهووس ستور — عطور أصلية`,
];

// ─── 7. يوتيوب غلاف شورتس (صورة فقط) ────────────────────────
// لا يحتاج كابشن — صورة فقط

// ═══════════════════════════════════════════════════════════════
// الصورة المربعة (1:1) — Posts & Ads
// ═══════════════════════════════════════════════════════════════

// ─── 8. انستقرام بوست ─────────────────────────────────────────
const INSTAGRAM_POST: CaptionFn[] = [
  (n, b, a) => `${n} من ${b} — عطر يخليك تحس إنك ملك\n\n${a.genderLabel} | يناسب ${a.targetAudience}\n\nمن أول بخة تعرف إنه مو عادي. ثبات خرافي وفوحان يسحر كل اللي حولك.\n${a.notesAr ? `المكونات: ${a.notesAr}` : ''}\n\nجربه وراح تشكرني بعدين`,
  (n, b, a) => `لو تبي عطر يخلي الناس تسألك "وش حاط؟"\n\nالجواب: ${n} من ${b}\n${a.genderLabel}\n\nعطر يتكلم عنك قبل ما تتكلم. فخامة في كل قطرة.\nيناسب ${a.occasion}`,
  (n, b, a) => `${b} ما يحتاج تعريف، بس ${n} شي ثاني!\n\n${a.genderLabel} | ${a.season}\n\nعطر يناسب كل المناسبات — من الدوام للسهرة. ثباته يوم كامل بدون مبالغة.`,
  (n, b, a) => `سألوني وش أفضل عطر جربته هالسنة؟\n\nبدون تردد: ${n} من ${b}\n${a.genderLabel}\n\nمكوناته فخمة، ثباته عالي، وفوحانه يخطف الأنظار.\n${a.notesAr ? `المكونات: ${a.notesAr}` : ''}`,
  (n, b, a) => `عطرك يحكي شخصيتك — وهذا يحكي فخامة\n\n${n} من ${b}\n${a.genderLabel} | لـ${a.personality}\n\nاختيار الذواقة اللي يعرفون الأصلي من التقليد.`,
  (n, b, a) => `مو كل عطر يستاهل مكان في مجموعتك...\nبس ${n} من ${b} يستاهل يكون النجم\n\n${a.genderLabel} | ${a.occasion}\n\nجربه مرة وراح يصير رفيقك الدائم.`,
  (n, b) => `تبي تترك أثر؟ خل عطرك يتكلم\n\n${n} — ${b}\n\nعطر يخلي الناس تتذكرك حتى بعد ما تمشي.`,
  (n, b) => `الفخامة مو بس في الشكل — الفخامة في الريحة\n\n${n} من ${b}\n\nعطر أصلي 100% — نفس اللي تلقاه في أكبر المحلات العالمية.`,
  (n, b) => `كل يوم عطر جديد؟ لا! كل يوم نفس العطر اللي يسحر\n\n${n} — ${b}\n\nلأن العطر الصح ما تمل منه.`,
  (n, b, a) => `هذا مو مجرد عطر — هذا ستايل حياة\n\n${n} من ${b}\n${a.genderLabel} | ${a.ageRange} سنة\n\nاختيارك يعكس ذوقك. اختار الأفضل.`,
];

// ─── 9. فيسبوك بوست ───────────────────────────────────────────
const FACEBOOK_POST: CaptionFn[] = [
  (n, b, a) => `${n} من ${b}\n${a.genderLabel}\n\nعطر يستاهل يكون في مجموعتك! ثبات عالي وفوحان يملي المكان.\n\nيناسب ${a.targetAudience}\nأفضل لـ${a.occasion}\n\nأصلي 100% — متوفر الآن في مهووس ستور.\n\nاطلبه وجربه بنفسك`,
  (n, b, a) => `هل جربت ${n} من ${b}؟\n\n${a.genderLabel} — واحد من أفضل العطور اللي مرت علينا هالموسم.\n\nمكوناته فخمة وثباته يوم كامل.\n${a.notesAr ? `المكونات: ${a.notesAr}` : ''}\n\nمتوفر الآن — اطلبه قبل ما يخلص!`,
  (n, b, a) => `عطر الأسبوع: ${n} — ${b}\n${a.genderLabel}\n\nليش نحبه؟\nثبات خرافي\nفوحان راقي\nيناسب ${a.occasion}\nأصلي 100%\n\nمتوفر في مهووس ستور`,
  (n, b, a) => `تدور عطر هدية؟\n\n${n} من ${b} — ${a.genderLabel}\n\naختيار ما يخيب! عطر فخم يناسب ${a.targetAudience}.\n\nاطلبه الآن من مهووس ستور.`,
  (n, b) => `${n} — ${b}\n\nمن العطور اللي كل ما جربتها أكثر حبيتها.\n\nالريحة تتطور مع الوقت وتعطيك إحساس مختلف كل ساعة.\n\nجربه وقول لنا رأيك!`,
];

// ─── 10. تلقرام بوست ──────────────────────────────────────────
const TELEGRAM_POST: CaptionFn[] = [
  (n, b, a) => `عطر مميز: ${n} من ${b}\n${a.genderLabel}\n\nأصلي 100%\nثبات عالي\nفوحان راقي\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : ''}\n\nمتوفر الآن في مهووس ستور\n\nللطلب: ${MAHWOUS_IDENTITY.whatsappLink}`,
  (n, b, a) => `${n} — ${b}\n${a.genderLabel}\n\nمن أفضل العطور اللي وصلتنا!\n${a.notesAr ? `المكونات: ${a.notesAr}` : ''}\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : ''}\n\nاطلبه الآن — مهووس ستور\n${MAHWOUS_IDENTITY.whatsappLink}`,
  (n, b, a) => `جديد في مهووس ستور!\n\n${n} من ${b}\n${a.genderLabel}\n\nعطر فخم يناسب ${a.occasion}\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : ''}\n\nللطلب: ${MAHWOUS_IDENTITY.whatsappLink}`,
];

// ─── 11. حراج إعلان ───────────────────────────────────────────
const HARAJ_AD: CaptionFn[] = [
  (n, b, a) => `للبيع: عطر ${n} من ${b}\n${a.genderLabel}\n\nأصلي 100% — ماركة عالمية\nثبات عالي — يوم كامل\nفوحان قوي وراقي\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : 'السعر: تواصل خاص'}\n\nالتوصيل متاح لجميع مناطق المملكة\n\nمهووس ستور — عطور ماركات عالمية أصلية\n\nللتواصل والطلب: ${MAHWOUS_IDENTITY.whatsappLink}`,
  (n, b, a) => `عطر ${n} — ${b}\n${a.genderLabel}\n\nأصلي 100%\nجديد بالكرتون\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : 'السعر: تواصل خاص'}\nالتوصيل: متاح\n\nمهووس ستور\n${MAHWOUS_IDENTITY.whatsappLink}`,
  (n, b, a) => `${n} من ${b} — عطر فخم أصلي\n${a.genderLabel}\n\nماركة عالمية معروفة\nثبات ممتاز\nمناسب لـ${a.occasion}\n${a.priceFormatted ? `السعر: ${a.priceFormatted}` : 'السعر: تواصل خاص'}\n\nللطلب: ${MAHWOUS_IDENTITY.whatsappLink}\n\nمهووس ستور — نوصل لباب بيتك`,
];

// ─── 12. تروث سوشال بوست ──────────────────────────────────────
const TRUTH_SOCIAL_POST: CaptionFn[] = [
  (n, b, a) => `${n} by ${b} — ${a.genderLabelEn}\n\nLuxury fragrance that speaks elegance\nعطر فخم يتكلم عنك\n\n${MAHWOUS_IDENTITY.storeUrl}`,
  (n, b, a) => `Discover ${n} from ${b}\n${a.genderLabelEn} | ${a.targetAudienceEn}\n\nOriginal 100% — Mahwous Store\nعطر أصلي من مهووس ستور`,
  (n, b, a) => `The scent that turns heads: ${n} — ${b}\n${a.genderLabelEn}\n\nAvailable at mahwous.com\nمتوفر في مهووس ستور`,
];

// ═══════════════════════════════════════════════════════════════
// الصورة الأفقية (16:9) — Tweets & Covers
// ═══════════════════════════════════════════════════════════════

// ─── 13. تويتر/إكس تغريدة ─────────────────────────────────────
const TWITTER_TWEET: CaptionFn[] = [
  (n, b, a) => `${n} من ${b} — ${a.genderLabel}\nعطر يخليك تحس بالثقة من أول بخة\nأصلي 100% | مهووس ستور`,
  (n, b) => `سألوني وش حاط؟\n${n} — ${b}\nعطر يتكلم عنك قبل ما تتكلم`,
  (n, b) => `لو عندك عطر واحد بس تختاره — ${n} من ${b}\nثبات يوم كامل + فوحان يسحر`,
  (n, b) => `عطر ${n} من ${b} = الفخامة في قارورة\nجربه مرة وراح يصير المفضل`,
  (n, b, a) => `أفضل عطر ${a.genderLabel} جربته هالشهر:\n${n} — ${b}\nمتوفر في مهووس ستور`,
];

// ─── 14. لينكدإن بوست ─────────────────────────────────────────
const LINKEDIN_POST: CaptionFn[] = [
  (n, b, a) => `In the world of luxury fragrances, quality speaks for itself.\n\n${n} by ${b} — ${a.genderLabelEn}\n\nA fragrance that reflects refined taste and attention to detail.\n\nAt Mahwous Store, we believe your scent is part of your professional and personal identity.\n\nOriginal 100% — Worldwide brands delivered to your door.\n\n${MAHWOUS_IDENTITY.storeUrl}`,
  (n, b, a) => `First impressions start with your fragrance.\n\n${n} — ${b} | ${a.genderLabelEn}\n\nChoosing the right perfume reflects your professionalism and attention to detail.\n\nMahwous Store — Original luxury fragrances.\n\n${MAHWOUS_IDENTITY.storeUrl}`,
  (n, b, a) => `Did you know that 80% of first impressions are influenced by scent?\n\n${n} by ${b} — ${a.genderLabelEn}\nPerfect for: ${a.targetAudienceEn}\n\nA choice worthy of your status.\n\nAvailable at Mahwous Store — 100% Original.\n\n${MAHWOUS_IDENTITY.storeUrl}`,
];

// ─── 15. يوتيوب صورة مصغرة (صورة فقط) ────────────────────────
// لا يحتاج كابشن — صورة فقط

// ═══════════════════════════════════════════════════════════════
// كابشنات الفيديو
// ═══════════════════════════════════════════════════════════════

// فيديو عمودي (9:16)
const VIDEO_INSTAGRAM_REELS: CaptionFn[] = [
  (n, b, a) => `${n} من ${b} — ${a.genderLabel}\n\nعطر يخلي كل اللي حولك يسألونك وش حاط!\n\nأصلي 100% من مهووس ستور`,
  (n, b, a) => `مراجعة سريعة: ${n} — ${b}\n${a.genderLabel} | ${a.occasion}\n\nرأيكم؟`,
  (n, b, a) => `عطر ${a.genderLabel} يستاهل مكان في مجموعتك\n\n${n} من ${b}\n\nجربه وشكرني بعدين`,
];

const VIDEO_TIKTOK: CaptionFn[] = [
  (n, b, a) => `هذا العطر غير قواعد اللعبة!\n\n${n} من ${b} | ${a.genderLabel}\n\nأصلي 100% — مهووس ستور`,
  (n, b, a) => `POV: لقيت عطر ${a.genderLabel} يثبت يوم كامل\n\n${n} — ${b}`,
  (n, b) => `العطر اللي الكل يسأل عنه\n\n${n} من ${b}\n\nالرابط في البايو`,
];

const VIDEO_SNAPCHAT: CaptionFn[] = [
  (n, b, a) => `${n} من ${b} 🔥\n${a.genderLabel} — جربه!`,
  (n, b) => `عطر اليوم ${n} 💨\nمن ${b}`,
];

const VIDEO_YOUTUBE_SHORTS: CaptionFn[] = [
  (n, b, a) => `${n} من ${b} — مراجعة سريعة\n${a.genderLabel}\n\nأصلي 100% — مهووس ستور`,
  (n, b) => `أفضل عطر جربته هالشهر! ${n} من ${b}`,
];

const VIDEO_FACEBOOK_STORIES: CaptionFn[] = [
  (n, b, a) => `${n} — ${b}\n${a.genderLabel}\n\nعطر يستاهل التجربة!\n\nمهووس ستور`,
  (n, b) => `عطر اليوم ${n} من ${b}\nمتوفر الآن — اطلبه!`,
];

// فيديو أفقي (16:9)
const VIDEO_YOUTUBE: CaptionFn[] = [
  (n, b, a) => `مراجعة ${n} من ${b} — ${a.genderLabel} | هل يستاهل السعر؟\n\nفي هالفيديو راح أعطيكم رأيي الصريح:\n- الثبات\n- الفوحان\n- المكونات\n- يناسب مين؟ ${a.targetAudience}\n\nتابعوا للنهاية!\n\nمتوفر في مهووس ستور — أصلي 100%\n${MAHWOUS_IDENTITY.storeUrl}`,
  (n, b, a) => `${n} — ${b} | ${a.genderLabel} | مراجعة كاملة\n\nعطر يستحق مكان في مجموعتك؟\nيناسب ${a.occasion} | ${a.season}\n\nشوف الفيديو وقرر بنفسك!\n\nمهووس ستور — عطور ماركات عالمية أصلية\n${MAHWOUS_IDENTITY.storeUrl}`,
];

const VIDEO_TWITTER: CaptionFn[] = [
  (n, b, a) => `مراجعة ${n} من ${b} — ${a.genderLabel}\nعطر يستاهل التجربة!\nمهووس ستور`,
  (n, b) => `${n} — ${b}\nرأيي الصريح في هالعطر\nشوف الفيديو!`,
];

const VIDEO_LINKEDIN: CaptionFn[] = [
  (n, b, a) => `Fragrance Review: ${n} by ${b} — ${a.genderLabelEn}\n\nA detailed look at one of the most popular fragrances this season.\nPerfect for: ${a.targetAudienceEn}\n\nMahwous Store — Original luxury fragrances\n${MAHWOUS_IDENTITY.storeUrl}`,
];

const VIDEO_FACEBOOK: CaptionFn[] = [
  (n, b, a) => `مراجعة ${n} من ${b}\n${a.genderLabel}\n\nعطر فخم يستاهل مكان في مجموعتك!\nيناسب ${a.targetAudience}\n\nمتوفر في مهووس ستور\n${MAHWOUS_IDENTITY.storeUrl}`,
  (n, b) => `${n} — ${b}\n\nشوف الفيديو وقول لنا رأيك!\n\nمهووس ستور — عطور أصلية`,
];

// ═══════════════════════════════════════════════════════════════
// الدالة الرئيسية: توليد كابشنات لكل المنصات
// ═══════════════════════════════════════════════════════════════

export function generateAllCaptions(
  perfumeName: string,
  brand: string,
  productUrl?: string,
  notes?: string | string[],
  description?: string,
  price?: string,
  gender?: string,
): Record<string, string> {
  const n = perfumeName || 'العطر';
  const b = brand || 'الماركة';
  const url = productUrl || MAHWOUS_IDENTITY.storeUrl;
  const notesStr = typeof notes === 'string' ? notes : Array.isArray(notes) ? notes.join(', ') : '';

  // تحليل العطر والجمهور المستهدف
  const analysis = analyzePerfume(gender, notesStr, description, price);

  // إضافة هاشتاقات ورابط حسب المنصة
  function addExtras(caption: string, platform: string): string {
    const parts = [caption];

    // إضافة رابط المنتج (إذا مو طويل)
    if (['facebook_post', 'linkedin', 'pinterest'].includes(platform)) {
      if (url.length <= 80) {
        parts.push(`\n${url}`);
      }
    }

    // إضافة الهاشتاقات
    const hashPlatform = platform.replace('_post', '').replace('_story', '').replace('_thumbnail', '').replace('_pin', '').replace('_ad', '').replace('_tweet', '');
    const hashtags = getTrendingHashtags(hashPlatform, perfumeName, brand);
    if (['instagram_post', 'facebook_post', 'tiktok', 'twitter', 'pinterest'].includes(platform)) {
      parts.push(`\n${hashtags.join(' ')}`);
    }

    return parts.join('\n');
  }

  const captions: Record<string, string> = {
    // ═══ صورة عمودية (9:16) — Stories ═══
    instagram_story: pick(INSTAGRAM_STORY)(n, b, analysis),
    snapchat: pick(SNAPCHAT_STORY)(n, b, analysis),
    pinterest: addExtras(pick(PINTEREST_PIN)(n, b, analysis), 'pinterest'),
    facebook_story: pick(FACEBOOK_STORY)(n, b, analysis),
    tiktok: addExtras(pick(TIKTOK_COVER)(n, b, analysis), 'tiktok'),
    whatsapp: pick(WHATSAPP_STATUS)(n, b, analysis),
    youtube_shorts: '—', // صورة فقط

    // ═══ صورة مربعة (1:1) — Posts & Ads ═══
    instagram_post: addExtras(pick(INSTAGRAM_POST)(n, b, analysis), 'instagram_post'),
    facebook_post: addExtras(pick(FACEBOOK_POST)(n, b, analysis), 'facebook_post'),
    telegram: pick(TELEGRAM_POST)(n, b, analysis),
    haraj: pick(HARAJ_AD)(n, b, analysis),
    truth_social: pick(TRUTH_SOCIAL_POST)(n, b, analysis),

    // ═══ صورة أفقية (16:9) — Tweets & Covers ═══
    twitter: addExtras(pick(TWITTER_TWEET)(n, b, analysis), 'twitter'),
    linkedin: addExtras(pick(LINKEDIN_POST)(n, b, analysis), 'linkedin'),
    youtube_thumbnail: '—', // صورة فقط

    // ═══ فيديو عمودي (9:16) ═══
    instagram_reels: addExtras(pick(VIDEO_INSTAGRAM_REELS)(n, b, analysis), 'instagram_post'),
    tiktok_video: addExtras(pick(VIDEO_TIKTOK)(n, b, analysis), 'tiktok'),
    snapchat_video: pick(VIDEO_SNAPCHAT)(n, b, analysis),
    youtube_shorts_video: addExtras(pick(VIDEO_YOUTUBE_SHORTS)(n, b, analysis), 'youtube'),
    facebook_stories_video: pick(VIDEO_FACEBOOK_STORIES)(n, b, analysis),

    // ═══ فيديو أفقي (16:9) ═══
    youtube_video: pick(VIDEO_YOUTUBE)(n, b, analysis),
    twitter_video: addExtras(pick(VIDEO_TWITTER)(n, b, analysis), 'twitter'),
    linkedin_video: pick(VIDEO_LINKEDIN)(n, b, analysis),
    facebook_video: pick(VIDEO_FACEBOOK)(n, b, analysis),
  };

  return captions;
}

// ─── توليد هاشتاقات لكل المنصات ────────────────────────────────
export function generateAllHashtags(
  perfumeName: string,
  brand: string
): Record<string, string[]> {
  const platforms = [
    'instagram', 'facebook', 'twitter', 'tiktok',
    'linkedin', 'youtube', 'pinterest', 'snapchat',
    'telegram', 'haraj', 'truth_social', 'google_business',
  ];

  const result: Record<string, string[]> = {};
  for (const p of platforms) {
    result[p] = getTrendingHashtags(p, perfumeName, brand);
  }

  return result;
}

// ─── بناء prompt ذكي لـ Gemini/AI لتحسين الكابشنات ─────────────
export function buildGeminiEnhancementPrompt(
  perfumeName: string,
  brand: string,
  baseCaptions: Record<string, string>,
  analysis: PerfumeAnalysis,
  productUrl: string,
): string {
  return `أنت خبير تسويق عطور فاخرة ومتخصص SEO. مهمتك تحسين الكابشنات التالية.

═══ تحليل العطر ═══
- الاسم: ${perfumeName}
- الماركة: ${brand}
- المستخدم: ${analysis.genderLabel}
- الجمهور المستهدف: ${analysis.targetAudience}
- المناسبة: ${analysis.occasion}
- الموسم: ${analysis.season}
- الشخصية: ${analysis.personality}
- الفئة العمرية: ${analysis.ageRange}
- المكونات: ${analysis.notesAr}
- السعر: ${analysis.priceFormatted || 'غير محدد'}

═══ معلومات التواصل ═══
- واتساب: ${MAHWOUS_IDENTITY.whatsapp}
- رابط واتساب: ${MAHWOUS_IDENTITY.whatsappLink}
- رابط المنتج: ${productUrl}
- المتجر: مهووس (متجر إلكتروني — الطلب أونلاين فقط)

═══ قواعد صارمة ═══
1. ممنوع كتابة أي مكون عطري بالإنجليزي — اكتب كل شيء بالعربي
2. اذكر "مهووس" مرة واحدة فقط في كل كابشن
3. لا تقل "زوروا" — مهووس متجر إلكتروني (اطلب/اطلبه)
4. اكتب بلهجة سعودية واضحة (رياض/قصيم)
5. السعر يُكتب بالعربي: "595 ريال" وليس "595 SAR"
6. حافظ على نفس الطول والأسلوب تقريباً
7. خاطب الجمهور المستهدف مباشرة (${analysis.targetAudience})
8. اذكر نوع العطر (${analysis.genderLabel}) في كل كابشن
9. لينكدإن يكون بالإنجليزي احترافي
10. بنترست يكون بالإنجليزي + كلمات مفتاحية SEO
11. سناب شات يكون عامي سعودي + إيموجي
12. تويتر لا يتجاوز 133 حرف + هاشتاقات
13. حراج يبدأ بـ "للبيع" + أصلي 100% + توصيل
14. تروث سوشال عربي/إنجليزي مختلط

═══ الكابشنات الأساسية (حسّنها) ═══
${JSON.stringify(baseCaptions, null, 2)}

أجب بـ JSON فقط بنفس المفاتيح. لا تضف أي نص خارج الـ JSON.`;
}
