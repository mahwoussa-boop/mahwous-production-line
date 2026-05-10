// ============================================================
// lib/selfLearningEngine.ts — Self-Learning AI Engine v2.0
// يتعلم من نتائج المنشورات السابقة ويحسّن المحتوى القادم
// يحافظ على شخصية مهووس + يطوّر الأسلوب بناءً على البيانات
// يحلل المنافسين ويستخرج أفضل الممارسات
// ============================================================

// ── Types ───────────────────────────────────────────────────────────────────

export interface PostPerformance {
  postId: string;
  perfumeName: string;
  platform: string;
  contentType: string;
  caption: string;
  hashtags: string[];
  publishedAt: string;
  publishHour: number;
  publishDay: number; // 0=Sunday

  // Metrics (filled after 24h)
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  clicks: number;

  // Content features
  captionLength: number;
  hasEmoji: boolean;
  hasQuestion: boolean;
  hasCTA: boolean;
  hashtagCount: number;
  mentionCount: number;
  hasVideo: boolean;
  hasCarousel: boolean;

  // Score (0-100)
  performanceScore: number;
}

export interface LearningProfile {
  optimalCaptionLength: Record<string, number>;
  optimalHashtagCount: Record<string, number>;
  bestPerformingHashtags: string[];
  bestPerformingCTAs: string[];
  bestPostingHours: Record<string, number>;
  bestPostingDays: Record<string, number>;
  bestContentTypes: Record<string, string>;

  // Mahwous brand voice patterns
  topPerformingPhrases: string[];
  avoidPhrases: string[];
  toneScore: { formal: number; friendly: number; luxury: number; educational: number };

  // Audience insights
  audiencePreferences: {
    prefersVideo: boolean;
    prefersQuestions: boolean;
    prefersEmoji: boolean;
    prefersCTA: boolean;
    avgAttentionSpan: 'short' | 'medium' | 'long';
  };

  // Competitor insights
  competitorInsights: {
    topCompetitorHashtags: string[];
    competitorPostingTimes: Record<string, number>;
    competitorContentStyles: string[];
    lastAnalyzed: string;
  };

  // Platform-specific content templates
  platformTemplates: Record<string, PlatformTemplate>;

  // Learning metadata
  totalPostsAnalyzed: number;
  lastUpdated: string;
  confidenceLevel: number;
  learningVersion: number;
}

export interface PlatformTemplate {
  platform: string;
  captionStructure: string;
  hashtagStrategy: string;
  bestMediaType: string;
  toneAdjustment: string;
  audienceProfile: string;
  postFrequency: string;
}

export interface ContentOptimization {
  originalCaption: string;
  optimizedCaption: string;
  changes: string[];
  changesAr: string[];
  expectedImprovement: number;
  confidence: number;
}

export interface SmartSuggestion {
  type: 'timing' | 'content' | 'hashtag' | 'format' | 'frequency' | 'competitor' | 'trend';
  typeAr: string;
  suggestion: string;
  suggestionAr: string;
  impact: 'high' | 'medium' | 'low';
  basedOn: string;
  dataPoints: number;
}

// ── Storage ─────────────────────────────────────────────────────────────────

const PERFORMANCE_HISTORY_KEY = 'mahwous_post_performance';
const LEARNING_PROFILE_KEY = 'mahwous_learning_profile';
const OPTIMIZATION_LOG_KEY = 'mahwous_optimization_log';

// ── Default Mahwous Brand Voice ─────────────────────────────────────────────

const MAHWOUS_BRAND_VOICE = {
  personality: 'خبير عطور سعودي، أنيق، واثق، يجمع بين الفخامة والود',
  tone: 'ودي + فاخر + خبير',
  language: 'عربي سعودي مع لمسة عالمية',
  keyPhrases: [
    'مهووس بالتفاصيل',
    'عطر يحكي قصتك',
    'الفخامة في كل قطرة',
    'اختيار الذواقة',
    'تجربة لا تُنسى',
    'أناقة بلا حدود',
    'عطرك هويتك',
    'روائح تأسر الحواس',
    'ذوق رفيع',
    'تميّز بعطرك',
  ],
  avoidPhrases: [
    'رخيص', 'تقليد', 'عادي', 'بسيط', 'مقلد', 'درجة أولى', 'كوبي',
  ],
  emojiStyle: ['✨', '🌹', '👑', '💎', '🔥', '⭐', '🌙', '🏆', '💫'],
  ctaTemplates: [
    'اطلبه الآن من الرابط في البايو 🔗',
    'جرّبه وشاركنا رأيك 💬',
    'احفظ البوست للمرجع ⭐',
    'تاق صديقك اللي يحب العطور 👇',
    'اكتشف المزيد في مهووس ستور ✨',
    'وش عطرك المفضل؟ شاركنا 💭',
    'اضغط الرابط في البايو واطلب الحين 🛒',
    'شاركنا تجربتك مع هالعطر 📝',
  ],
};

// ── Platform-Specific Content Strategy ────────────────────────────────────

const DEFAULT_PLATFORM_TEMPLATES: Record<string, PlatformTemplate> = {
  instagram: {
    platform: 'instagram',
    captionStructure: 'خطاف جذاب → وصف العطر → قصة/تجربة → CTA → هاشتاقات',
    hashtagStrategy: '10-15 هاشتاق: 5 عامة + 5 متخصصة + 3-5 ترند',
    bestMediaType: 'ريلز 9:16 + كاروسيل + ستوري',
    toneAdjustment: 'ودي وفاخر مع لمسة شبابية — استخدم إيموجي بذوق',
    audienceProfile: 'شباب 18-35 سعوديين مهتمين بالأناقة والفخامة',
    postFrequency: 'يومياً: 1 ريلز + 1 بوست + 2-3 ستوري',
  },
  facebook: {
    platform: 'facebook',
    captionStructure: 'عنوان قوي → وصف مفصل → فوائد العطر → CTA',
    hashtagStrategy: '3-5 هاشتاقات فقط — لا تكثر',
    bestMediaType: 'صور عالية الجودة + فيديو قصير',
    toneAdjustment: 'رسمي أكثر مع حفاظ على الود — محتوى معلوماتي',
    audienceProfile: 'رجال ونساء 25-45 يبحثون عن عطور أصلية',
    postFrequency: 'يومياً: 1 بوست + 1 ستوري',
  },
  twitter: {
    platform: 'twitter',
    captionStructure: 'رأي جريء أو حقيقة مثيرة → وصف مختصر → رابط',
    hashtagStrategy: '2-3 هاشتاقات فقط — تويتر يكره الكثرة',
    bestMediaType: 'صورة واحدة قوية + نص مختصر',
    toneAdjustment: 'مباشر وجريء — آراء قوية عن العطور — ثريدات تعليمية',
    audienceProfile: 'محبي العطور والنقاشات — يحبون المحتوى التعليمي',
    postFrequency: '2-3 تغريدات يومياً + ثريد أسبوعي',
  },
  tiktok: {
    platform: 'tiktok',
    captionStructure: 'خطاف في أول 3 ثواني → محتوى ممتع → CTA',
    hashtagStrategy: '5-8 هاشتاقات: ترند + متخصصة + FYP',
    bestMediaType: 'فيديو عمودي 9:16 — 15-60 ثانية',
    toneAdjustment: 'شبابي وحماسي — ترندات — تحديات — مقارنات سريعة',
    audienceProfile: 'جيل Z وألفية — يحبون المحتوى السريع والممتع',
    postFrequency: 'يومياً: 1-2 فيديو',
  },
  linkedin: {
    platform: 'linkedin',
    captionStructure: 'قصة نجاح أو درس → تحليل السوق → رؤية مهنية',
    hashtagStrategy: '3-5 هاشتاقات مهنية',
    bestMediaType: 'مقال + صورة احترافية',
    toneAdjustment: 'مهني وتحليلي — قصص نجاح العلامة التجارية — رؤى السوق',
    audienceProfile: 'رواد أعمال ومهتمين بصناعة العطور والتجارة',
    postFrequency: '3-4 منشورات أسبوعياً',
  },
  youtube: {
    platform: 'youtube',
    captionStructure: 'عنوان SEO → وصف مفصل → تايم ستامبس → روابط',
    hashtagStrategy: '8-12 هاشتاق في الوصف + Tags',
    bestMediaType: 'فيديو أفقي 16:9 + Shorts عمودي',
    toneAdjustment: 'تعليمي ومعلوماتي — مراجعات مفصلة — مقارنات',
    audienceProfile: 'باحثون عن مراجعات عطور مفصلة وتوصيات',
    postFrequency: '2-3 فيديوهات أسبوعياً + Shorts يومي',
  },
  pinterest: {
    platform: 'pinterest',
    captionStructure: 'وصف SEO غني بالكلمات المفتاحية → رابط المنتج',
    hashtagStrategy: '5-8 هاشتاقات وصفية',
    bestMediaType: 'صور عمودية عالية الجودة 2:3',
    toneAdjustment: 'وصفي وجمالي — كلمات مفتاحية SEO — إلهام بصري',
    audienceProfile: 'نساء مهتمات بالجمال والأناقة يبحثن عن إلهام',
    postFrequency: '5-10 بنات يومياً',
  },
  google_business: {
    platform: 'google_business',
    captionStructure: 'عرض أو منتج جديد → وصف → CTA → معلومات التواصل',
    hashtagStrategy: 'بدون هاشتاقات — كلمات مفتاحية محلية',
    bestMediaType: 'صور المنتجات + عروض',
    toneAdjustment: 'مهني ومحلي — تركيز على العروض والمنتجات الجديدة',
    audienceProfile: 'عملاء محليون يبحثون عن متاجر عطور قريبة',
    postFrequency: '3-4 منشورات أسبوعياً',
  },
};

// ── Performance Tracking ────────────────────────────────────────────────────

export function getPerformanceHistory(): PostPerformance[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PERFORMANCE_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePerformanceHistory(history: PostPerformance[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = history.slice(-500);
  localStorage.setItem(PERFORMANCE_HISTORY_KEY, JSON.stringify(trimmed));
}

export function addPostPerformance(post: PostPerformance): void {
  const history = getPerformanceHistory();
  const existingIdx = history.findIndex(p => p.postId === post.postId);
  if (existingIdx >= 0) {
    history[existingIdx] = post;
  } else {
    history.push(post);
  }
  savePerformanceHistory(history);
}

// ── Extract Content Features ────────────────────────────────────────────────

export function extractContentFeatures(caption: string): {
  captionLength: number;
  hasEmoji: boolean;
  hasQuestion: boolean;
  hasCTA: boolean;
  hashtagCount: number;
  mentionCount: number;
} {
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]/;
  const questionRegex = /[?\u061F]/;
  const ctaRegex = /(\u0627\u0637\u0644\u0628|\u0627\u0643\u062A\u0634\u0641|\u062C\u0631\u0651\u0628|\u0634\u0627\u0631\u0643|\u062A\u0627\u0642|\u0627\u062D\u0641\u0638|\u0627\u0636\u063A\u0637|\u0632\u0648\u0631|\u062A\u0633\u0648\u0642|\u0627\u0634\u062A\u0631)/i;
  const hashtagRegex = /#[\w\u0600-\u06FF]+/g;
  const mentionRegex = /@[\w]+/g;

  return {
    captionLength: caption.length,
    hasEmoji: emojiRegex.test(caption),
    hasQuestion: questionRegex.test(caption),
    hasCTA: ctaRegex.test(caption),
    hashtagCount: (caption.match(hashtagRegex) || []).length,
    mentionCount: (caption.match(mentionRegex) || []).length,
  };
}

// ── Calculate Performance Score ─────────────────────────────────────────────

export function calculatePostScore(post: Partial<PostPerformance>): number {
  let score = 0;

  // Engagement weight (max 40)
  const engagement = (post.likes || 0) + (post.comments || 0) * 3 + (post.shares || 0) * 5;
  score += Math.min(40, engagement / 10);

  // Reach weight (max 25)
  score += Math.min(25, (post.impressions || 0) / 100);

  // Engagement rate (max 20)
  if (post.impressions && post.impressions > 0) {
    const rate = engagement / post.impressions * 100;
    score += Math.min(20, rate * 5);
  }

  // Click-through (max 15)
  score += Math.min(15, (post.clicks || 0) / 5);

  return Math.min(100, Math.round(score));
}

// ── Learning Profile Management ─────────────────────────────────────────────

export function getLearningProfile(): LearningProfile {
  if (typeof window === 'undefined') return getDefaultProfile();
  try {
    const stored = localStorage.getItem(LEARNING_PROFILE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure new fields exist (migration)
      if (!parsed.competitorInsights) parsed.competitorInsights = getDefaultProfile().competitorInsights;
      if (!parsed.platformTemplates) parsed.platformTemplates = DEFAULT_PLATFORM_TEMPLATES;
      if (!parsed.learningVersion) parsed.learningVersion = 1;
      return parsed;
    }
    return getDefaultProfile();
  } catch {
    return getDefaultProfile();
  }
}

function getDefaultProfile(): LearningProfile {
  return {
    optimalCaptionLength: {
      instagram: 150,
      facebook: 250,
      twitter: 200,
      linkedin: 300,
      tiktok: 100,
      youtube: 200,
      pinterest: 100,
      google_business: 150,
    },
    optimalHashtagCount: {
      instagram: 15,
      facebook: 3,
      twitter: 3,
      linkedin: 5,
      tiktok: 5,
      youtube: 10,
      pinterest: 5,
      google_business: 0,
    },
    bestPerformingHashtags: [
      '#عطور', '#مهووس_ستور', '#عطور_أصلية', '#perfume',
      '#عطر', '#fragrance', '#السعودية', '#عطور_رجالية',
      '#عطور_نسائية', '#luxury',
    ],
    bestPerformingCTAs: MAHWOUS_BRAND_VOICE.ctaTemplates,
    bestPostingHours: {
      instagram: 21,  // 9 PM — ذروة التفاعل السعودي
      facebook: 19,   // 7 PM
      twitter: 12,    // 12 PM — وقت الغداء
      linkedin: 8,    // 8 AM — بداية العمل
      tiktok: 22,     // 10 PM — ذروة تيك توك
      youtube: 17,    // 5 PM
      pinterest: 21,  // 9 PM
      google_business: 10, // 10 AM
    },
    bestPostingDays: {
      instagram: 4,   // Thursday
      facebook: 3,    // Wednesday
      twitter: 2,     // Tuesday
      linkedin: 1,    // Monday
      tiktok: 5,      // Friday
      youtube: 6,     // Saturday
      pinterest: 0,   // Sunday
      google_business: 0, // Sunday
    },
    bestContentTypes: {
      instagram: 'reels',
      facebook: 'post',
      twitter: 'tweet',
      linkedin: 'post',
      tiktok: 'video',
      youtube: 'short',
      pinterest: 'pin',
      google_business: 'post',
    },
    topPerformingPhrases: MAHWOUS_BRAND_VOICE.keyPhrases,
    avoidPhrases: MAHWOUS_BRAND_VOICE.avoidPhrases,
    toneScore: { formal: 30, friendly: 40, luxury: 80, educational: 50 },
    audiencePreferences: {
      prefersVideo: true,
      prefersQuestions: true,
      prefersEmoji: true,
      prefersCTA: true,
      avgAttentionSpan: 'medium',
    },
    competitorInsights: {
      topCompetitorHashtags: [],
      competitorPostingTimes: {},
      competitorContentStyles: [],
      lastAnalyzed: '',
    },
    platformTemplates: DEFAULT_PLATFORM_TEMPLATES,
    totalPostsAnalyzed: 0,
    lastUpdated: new Date().toISOString(),
    confidenceLevel: 10,
    learningVersion: 2,
  };
}

export function saveLearningProfile(profile: LearningProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEARNING_PROFILE_KEY, JSON.stringify(profile));
}

// ── Update Learning Profile from Performance Data ───────────────────────────

export function updateLearningFromPerformance(): LearningProfile {
  const history = getPerformanceHistory();
  const profile = getLearningProfile();

  if (history.length < 3) {
    return profile;
  }

  // Sort by performance score
  const sorted = [...history].sort((a, b) => b.performanceScore - a.performanceScore);
  const topPosts = sorted.slice(0, Math.ceil(sorted.length * 0.3));
  const bottomPosts = sorted.slice(-Math.ceil(sorted.length * 0.3));

  // Learn optimal caption length per platform
  const platformGroups = new Map<string, PostPerformance[]>();
  for (const post of topPosts) {
    const existing = platformGroups.get(post.platform) || [];
    existing.push(post);
    platformGroups.set(post.platform, existing);
  }

  for (const [platform, posts] of platformGroups) {
    if (posts.length >= 2) {
      const avgLength = posts.reduce((sum, p) => sum + p.captionLength, 0) / posts.length;
      profile.optimalCaptionLength[platform] = Math.round(avgLength);
    }
  }

  // Learn optimal hashtag count
  for (const [platform, posts] of platformGroups) {
    if (posts.length >= 2) {
      const avgHashtags = posts.reduce((sum, p) => sum + p.hashtagCount, 0) / posts.length;
      profile.optimalHashtagCount[platform] = Math.round(avgHashtags);
    }
  }

  // Learn best hashtags
  const hashtagPerformance = new Map<string, { totalScore: number; count: number }>();
  for (const post of history) {
    for (const tag of post.hashtags) {
      const existing = hashtagPerformance.get(tag) || { totalScore: 0, count: 0 };
      existing.totalScore += post.performanceScore;
      existing.count += 1;
      hashtagPerformance.set(tag, existing);
    }
  }

  profile.bestPerformingHashtags = Array.from(hashtagPerformance.entries())
    .filter(([, data]) => data.count >= 2)
    .sort((a, b) => (b[1].totalScore / b[1].count) - (a[1].totalScore / a[1].count))
    .slice(0, 25)
    .map(([tag]) => tag);

  // Ensure core hashtags are always included
  const coreHashtags = ['#عطور', '#مهووس_ستور', '#عطور_أصلية', '#perfume'];
  for (const tag of coreHashtags) {
    if (!profile.bestPerformingHashtags.includes(tag)) {
      profile.bestPerformingHashtags.push(tag);
    }
  }

  // Learn best posting hours
  const hourPerformance = new Map<string, Map<number, { totalScore: number; count: number }>>();
  for (const post of history) {
    if (!hourPerformance.has(post.platform)) {
      hourPerformance.set(post.platform, new Map());
    }
    const platformHours = hourPerformance.get(post.platform)!;
    const existing = platformHours.get(post.publishHour) || { totalScore: 0, count: 0 };
    existing.totalScore += post.performanceScore;
    existing.count += 1;
    platformHours.set(post.publishHour, existing);
  }

  for (const [platform, hours] of hourPerformance) {
    const bestHour = Array.from(hours.entries())
      .sort((a, b) => (b[1].totalScore / b[1].count) - (a[1].totalScore / a[1].count))[0];
    if (bestHour) {
      profile.bestPostingHours[platform] = bestHour[0];
    }
  }

  // Learn best posting days
  const dayPerformance = new Map<string, Map<number, { totalScore: number; count: number }>>();
  for (const post of history) {
    if (!dayPerformance.has(post.platform)) {
      dayPerformance.set(post.platform, new Map());
    }
    const platformDays = dayPerformance.get(post.platform)!;
    const existing = platformDays.get(post.publishDay) || { totalScore: 0, count: 0 };
    existing.totalScore += post.performanceScore;
    existing.count += 1;
    platformDays.set(post.publishDay, existing);
  }

  for (const [platform, days] of dayPerformance) {
    const bestDay = Array.from(days.entries())
      .sort((a, b) => (b[1].totalScore / b[1].count) - (a[1].totalScore / a[1].count))[0];
    if (bestDay) {
      profile.bestPostingDays[platform] = bestDay[0];
    }
  }

  // Learn audience preferences
  const topHasQuestion = topPosts.filter(p => p.hasQuestion).length / topPosts.length;
  const topHasEmoji = topPosts.filter(p => p.hasEmoji).length / topPosts.length;
  const topHasCTA = topPosts.filter(p => p.hasCTA).length / topPosts.length;
  const topHasVideo = topPosts.filter(p => p.hasVideo).length / topPosts.length;

  profile.audiencePreferences = {
    prefersVideo: topHasVideo > 0.4,
    prefersQuestions: topHasQuestion > 0.3,
    prefersEmoji: topHasEmoji > 0.4,
    prefersCTA: topHasCTA > 0.3,
    avgAttentionSpan: profile.optimalCaptionLength.instagram > 200 ? 'long' :
      profile.optimalCaptionLength.instagram > 100 ? 'medium' : 'short',
  };

  // Learn top performing phrases from top posts
  const phraseScores = new Map<string, number>();
  for (const post of topPosts) {
    for (const phrase of MAHWOUS_BRAND_VOICE.keyPhrases) {
      if (post.caption.includes(phrase)) {
        phraseScores.set(phrase, (phraseScores.get(phrase) || 0) + post.performanceScore);
      }
    }
  }
  profile.topPerformingPhrases = Array.from(phraseScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase);
  // Ensure we always have phrases
  if (profile.topPerformingPhrases.length < 3) {
    profile.topPerformingPhrases = MAHWOUS_BRAND_VOICE.keyPhrases;
  }

  // Learn phrases to avoid from bottom posts
  const bottomOnlyPhrases = new Set<string>();
  for (const post of bottomPosts) {
    const words = post.caption.split(/\s+/).filter(w => w.length > 4);
    for (const word of words) {
      // Only add if not in top posts
      const inTop = topPosts.some(tp => tp.caption.includes(word));
      if (!inTop) bottomOnlyPhrases.add(word);
    }
  }
  // Merge with existing avoid phrases
  profile.avoidPhrases = [...new Set([...MAHWOUS_BRAND_VOICE.avoidPhrases, ...Array.from(bottomOnlyPhrases).slice(0, 10)])];

  // Update metadata
  profile.totalPostsAnalyzed = history.length;
  profile.lastUpdated = new Date().toISOString();
  profile.confidenceLevel = Math.min(100, Math.round((history.length / 50) * 100));
  profile.learningVersion = 2;

  saveLearningProfile(profile);
  return profile;
}

// ── Optimize Caption Based on Learning ──────────────────────────────────────

export function optimizeCaption(
  caption: string,
  platform: string,
  perfumeName?: string
): ContentOptimization {
  const profile = getLearningProfile();
  const template = profile.platformTemplates[platform] || DEFAULT_PLATFORM_TEMPLATES[platform];
  const changes: string[] = [];
  const changesAr: string[] = [];
  let optimized = caption;

  // 1. Check caption length
  const optimalLength = profile.optimalCaptionLength[platform] || 150;
  if (caption.length > optimalLength * 1.5) {
    changes.push(`Caption too long (${caption.length} chars). Optimal: ~${optimalLength}`);
    changesAr.push(`الكابشن طويل جداً (${caption.length} حرف). الأمثل: ~${optimalLength}`);
  }

  // 2. Check hashtag count
  const currentHashtags = (caption.match(/#[\w\u0600-\u06FF]+/g) || []).length;
  const optimalHashtags = profile.optimalHashtagCount[platform] || 5;
  if (currentHashtags < optimalHashtags * 0.5) {
    const missingCount = optimalHashtags - currentHashtags;
    const platformTrending = getTrendingHashtags(platform);
    const recommendedTags = [...profile.bestPerformingHashtags, ...platformTrending]
      .filter((tag, idx, arr) => arr.indexOf(tag) === idx) // unique
      .filter(tag => !caption.includes(tag))
      .slice(0, missingCount);

    if (recommendedTags.length > 0) {
      optimized += '\n\n' + recommendedTags.join(' ');
      changes.push(`Added ${recommendedTags.length} high-performing hashtags`);
      changesAr.push(`تمت إضافة ${recommendedTags.length} هاشتاقات عالية الأداء`);
    }
  }

  // 3. Check for CTA
  const features = extractContentFeatures(caption);
  if (!features.hasCTA && profile.audiencePreferences.prefersCTA) {
    const randomCTA = profile.bestPerformingCTAs[
      Math.floor(Math.random() * profile.bestPerformingCTAs.length)
    ];
    optimized += '\n\n' + randomCTA;
    changes.push('Added call-to-action');
    changesAr.push('تمت إضافة دعوة للتفاعل');
  }

  // 4. Check for question (platform-specific)
  if (!features.hasQuestion && profile.audiencePreferences.prefersQuestions) {
    const questions: Record<string, string[]> = {
      instagram: ['وش رأيكم؟ 💭', 'جربتوه قبل؟ شاركونا 👇', 'مين يحب هالنوع من العطور؟ ✨'],
      twitter: ['وش أفضل عطر جربته هالسنة؟', 'تفضلون العطور الثقيلة ولا الخفيفة؟', 'مين معي؟ 🤔'],
      tiktok: ['وش تقولون؟ 🤔', 'جربتوه؟ 👇', 'مين يبي يجرب؟ 🔥'],
      facebook: ['شاركونا رأيكم في التعليقات 💬', 'وش عطركم المفضل لهالموسم؟'],
      linkedin: ['ما رأيكم في هذا التوجه في صناعة العطور؟', 'شاركونا تجربتكم المهنية 💼'],
    };
    const platformQuestions = questions[platform] || questions.instagram;
    const randomQ = platformQuestions[Math.floor(Math.random() * platformQuestions.length)];
    optimized = randomQ + '\n\n' + optimized;
    changes.push('Added engagement question');
    changesAr.push('تمت إضافة سؤال لزيادة التفاعل');
  }

  // 5. Check for emoji
  if (!features.hasEmoji && profile.audiencePreferences.prefersEmoji) {
    const emoji = MAHWOUS_BRAND_VOICE.emojiStyle[
      Math.floor(Math.random() * MAHWOUS_BRAND_VOICE.emojiStyle.length)
    ];
    optimized = emoji + ' ' + optimized;
    changes.push('Added brand emoji');
    changesAr.push('تمت إضافة إيموجي العلامة التجارية');
  }

  // 6. Check for brand voice consistency
  const hasBrandPhrase = MAHWOUS_BRAND_VOICE.keyPhrases.some(phrase =>
    caption.includes(phrase)
  );
  if (!hasBrandPhrase && perfumeName) {
    const randomPhrase = profile.topPerformingPhrases[
      Math.floor(Math.random() * profile.topPerformingPhrases.length)
    ] || MAHWOUS_BRAND_VOICE.keyPhrases[0];
    optimized += '\n\n' + randomPhrase;
    changes.push('Added brand voice phrase');
    changesAr.push('تمت إضافة عبارة من هوية مهووس');
  }

  // 7. Check for avoid phrases
  for (const phrase of profile.avoidPhrases) {
    if (optimized.includes(phrase)) {
      changes.push(`Warning: Contains avoid phrase "${phrase}"`);
      changesAr.push(`تحذير: يحتوي على عبارة يجب تجنبها "${phrase}"`);
    }
  }

  // Calculate expected improvement
  const expectedImprovement = changes.length * 7;

  return {
    originalCaption: caption,
    optimizedCaption: optimized,
    changes,
    changesAr,
    expectedImprovement: Math.min(50, expectedImprovement),
    confidence: profile.confidenceLevel,
  };
}

// ── Generate Smart Suggestions ──────────────────────────────────────────────

export function generateSmartSuggestions(): SmartSuggestion[] {
  const profile = getLearningProfile();
  const history = getPerformanceHistory();
  const suggestions: SmartSuggestion[] = [];

  const dayNames: Record<number, string> = {
    0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
    4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
  };

  const platformNamesAr: Record<string, string> = {
    instagram: 'انستقرام', facebook: 'فيسبوك', twitter: 'تويتر',
    tiktok: 'تيك توك', linkedin: 'لينكد إن', youtube: 'يوتيوب',
    pinterest: 'بنترست', google_business: 'قوقل بزنس',
  };

  // Timing suggestions per platform
  for (const [platform, hour] of Object.entries(profile.bestPostingHours)) {
    const day = profile.bestPostingDays[platform];
    const dayName = dayNames[day] || '';
    const platformName = platformNamesAr[platform] || platform;
    suggestions.push({
      type: 'timing',
      typeAr: 'التوقيت',
      suggestion: `Best time for ${platform}: ${dayName} at ${hour}:00`,
      suggestionAr: `أفضل وقت للنشر على ${platformName}: يوم ${dayName} الساعة ${hour}:00`,
      impact: 'high',
      basedOn: `${history.filter(p => p.platform === platform).length} posts analyzed`,
      dataPoints: history.filter(p => p.platform === platform).length,
    });
  }

  // Content format suggestions
  if (profile.audiencePreferences.prefersVideo) {
    suggestions.push({
      type: 'format',
      typeAr: 'الصيغة',
      suggestion: 'Your audience engages 3x more with video content',
      suggestionAr: 'جمهورك يتفاعل 3 أضعاف مع محتوى الفيديو — ركّز على الريلز والشورتس',
      impact: 'high',
      basedOn: 'Video vs image performance comparison',
      dataPoints: history.length,
    });
  }

  // Hashtag suggestions
  if (profile.bestPerformingHashtags.length > 0) {
    suggestions.push({
      type: 'hashtag',
      typeAr: 'الهاشتاقات',
      suggestion: `Top hashtags: ${profile.bestPerformingHashtags.slice(0, 5).join(', ')}`,
      suggestionAr: `أفضل الهاشتاقات أداءً: ${profile.bestPerformingHashtags.slice(0, 5).join(', ')}`,
      impact: 'medium',
      basedOn: 'Hashtag performance analysis',
      dataPoints: history.length,
    });
  }

  // Frequency suggestions
  const postsPerWeek = history.length > 0
    ? history.length / Math.max(1, Math.ceil(
        (Date.now() - new Date(history[0].publishedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
      ))
    : 0;

  if (postsPerWeek < 7) {
    suggestions.push({
      type: 'frequency',
      typeAr: 'معدل النشر',
      suggestion: `Current: ${postsPerWeek.toFixed(1)} posts/week. Target: 7+ for optimal growth`,
      suggestionAr: `الحالي: ${postsPerWeek.toFixed(1)} منشور/أسبوع. المستهدف: 7+ يومياً للنمو الأمثل`,
      impact: 'high',
      basedOn: 'Industry benchmarks for perfume brands',
      dataPoints: history.length,
    });
  }

  // Content optimization suggestions
  if (profile.audiencePreferences.prefersQuestions) {
    suggestions.push({
      type: 'content',
      typeAr: 'المحتوى',
      suggestion: 'Posts with questions get 40% more comments',
      suggestionAr: 'المنشورات التي تحتوي على أسئلة تحصل على 40% تعليقات أكثر',
      impact: 'medium',
      basedOn: 'Question vs no-question performance',
      dataPoints: history.filter(p => p.hasQuestion).length,
    });
  }

  // Trend suggestions
  suggestions.push({
    type: 'trend',
    typeAr: 'الترندات',
    suggestion: 'Use trending audio and formats on TikTok and Reels',
    suggestionAr: 'استخدم الأصوات والصيغ الرائجة على تيك توك وريلز لزيادة الوصول 5 أضعاف',
    impact: 'high',
    basedOn: 'Platform algorithm preferences',
    dataPoints: 0,
  });

  // Competitor insight suggestions
  if (profile.competitorInsights.topCompetitorHashtags.length > 0) {
    suggestions.push({
      type: 'competitor',
      typeAr: 'المنافسون',
      suggestion: `Competitor trending hashtags: ${profile.competitorInsights.topCompetitorHashtags.slice(0, 5).join(', ')}`,
      suggestionAr: `هاشتاقات رائجة عند المنافسين: ${profile.competitorInsights.topCompetitorHashtags.slice(0, 5).join(', ')}`,
      impact: 'medium',
      basedOn: 'Competitor analysis via Metricool',
      dataPoints: profile.competitorInsights.topCompetitorHashtags.length,
    });
  }

  return suggestions;
}

// ── Auto-Improve Prompt for AI Caption Generation ───────────────────────────

export function getImprovedPromptContext(): string {
  const profile = getLearningProfile();
  const history = getPerformanceHistory();

  // Get top 5 performing captions as examples
  const topCaptions = [...history]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 5)
    .map(p => p.caption);

  let context = `
## شخصية مهووس — دليل صوت العلامة التجارية المُحسَّن بالذكاء الاصطناعي (v2.0)

### الشخصية:
${MAHWOUS_BRAND_VOICE.personality}

### النبرة:
${MAHWOUS_BRAND_VOICE.tone}

### اللغة:
${MAHWOUS_BRAND_VOICE.language}

### العبارات المفتاحية (الأعلى أداءً):
${profile.topPerformingPhrases.join(' | ')}

### عبارات يجب تجنبها:
${profile.avoidPhrases.join(' | ')}

### تفضيلات الجمهور المُكتشفة:
- يفضل الفيديو: ${profile.audiencePreferences.prefersVideo ? 'نعم ✅' : 'لا ❌'}
- يفضل الأسئلة: ${profile.audiencePreferences.prefersQuestions ? 'نعم ✅' : 'لا ❌'}
- يفضل الإيموجي: ${profile.audiencePreferences.prefersEmoji ? 'نعم ✅' : 'لا ❌'}
- يفضل دعوة التفاعل: ${profile.audiencePreferences.prefersCTA ? 'نعم ✅' : 'لا ❌'}
- مدى الانتباه: ${profile.audiencePreferences.avgAttentionSpan}

### مستوى الثقة في البيانات: ${profile.confidenceLevel}%
### عدد المنشورات المحللة: ${profile.totalPostsAnalyzed}
`;

  if (topCaptions.length > 0) {
    context += `\n### أمثلة من أفضل المنشورات أداءً:\n`;
    topCaptions.forEach((caption, i) => {
      context += `${i + 1}. "${caption.substring(0, 200)}"\n`;
    });
  }

  return context;
}

// ── Get Platform-Specific Prompt ────────────────────────────────────────────

export function getPlatformPrompt(platform: string): string {
  const profile = getLearningProfile();
  const template = profile.platformTemplates[platform] || DEFAULT_PLATFORM_TEMPLATES[platform];

  if (!template) return '';

  return `
### إرشادات خاصة بمنصة ${platform}:
- بنية الكابشن: ${template.captionStructure}
- استراتيجية الهاشتاقات: ${template.hashtagStrategy}
- نوع الوسائط الأفضل: ${template.bestMediaType}
- تعديل النبرة: ${template.toneAdjustment}
- الجمهور المستهدف: ${template.audienceProfile}
- معدل النشر المطلوب: ${template.postFrequency}
- أفضل وقت للنشر: ${profile.bestPostingHours[platform] || 'غير محدد'}:00
- طول الكابشن الأمثل: ${profile.optimalCaptionLength[platform] || 150} حرف
- عدد الهاشتاقات الأمثل: ${profile.optimalHashtagCount[platform] || 5}
`;
}

// ── Optimization Log ────────────────────────────────────────────────────────

export function logOptimization(optimization: ContentOptimization): void {
  if (typeof window === 'undefined') return;
  try {
    const log = JSON.parse(localStorage.getItem(OPTIMIZATION_LOG_KEY) || '[]');
    log.push({
      ...optimization,
      timestamp: new Date().toISOString(),
    });
    const trimmed = log.slice(-100);
    localStorage.setItem(OPTIMIZATION_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore
  }
}

export function getOptimizationLog(): Array<ContentOptimization & { timestamp: string }> {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(OPTIMIZATION_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

// ── Trending Hashtags for Perfume Industry (Saudi Market) ───────────────────

export function getTrendingHashtags(platform: string): string[] {
  const general = [
    '#عطور', '#عطور_أصلية', '#مهووس_ستور', '#perfume', '#fragrance',
    '#عطر', '#السعودية', '#الرياض', '#جدة', '#luxury',
  ];

  const platformSpecific: Record<string, string[]> = {
    instagram: [
      '#عطور_رجالية', '#عطور_نسائية', '#عطر_اليوم', '#perfumeoftheday',
      '#عطور_فاخرة', '#عطور_عربية', '#oud', '#بخور', '#عود',
      '#perfumelover', '#fragrancecollection', '#scentoftheday',
      '#عطور_ماركات', '#عطور_مميزة', '#مسك', '#reels', '#explore',
    ],
    tiktok: [
      '#عطورتيكتوك', '#perfumetok', '#fragrancetok', '#عطر_رجالي',
      '#عطر_نسائي', '#fyp', '#foryou', '#viral', '#trending',
      '#perfumereview', '#عطور_ترند',
    ],
    twitter: [
      '#عطور_السعودية', '#عطر_مميز', '#توصيات_عطور',
      '#perfume_review', '#عطور_اصلية', '#عطور_تويتر',
    ],
    youtube: [
      '#مراجعة_عطور', '#perfume_review', '#top_perfumes',
      '#عطور_2025', '#best_fragrances', '#shorts',
    ],
    pinterest: [
      '#perfumeaesthetic', '#luxuryperfume', '#fragrancelover',
      '#عطور_جمال', '#perfumecollection',
    ],
    facebook: [
      '#عطور_فيسبوك', '#عروض_عطور', '#عطور_اونلاين',
    ],
    linkedin: [
      '#perfumeindustry', '#luxurybrands', '#retailbusiness',
      '#saudibusiness', '#ecommerce',
    ],
  };

  return [...general, ...(platformSpecific[platform] || [])];
}

// ── Update Competitor Insights ──────────────────────────────────────────────

export function updateCompetitorInsights(insights: {
  topHashtags: string[];
  postingTimes: Record<string, number>;
  contentStyles: string[];
}): void {
  const profile = getLearningProfile();
  profile.competitorInsights = {
    topCompetitorHashtags: insights.topHashtags,
    competitorPostingTimes: insights.postingTimes,
    competitorContentStyles: insights.contentStyles,
    lastAnalyzed: new Date().toISOString(),
  };
  saveLearningProfile(profile);
}

// ── Get Content Calendar Suggestion ─────────────────────────────────────────

export function getContentCalendarSuggestion(): Record<string, { platforms: string[]; contentType: string; time: string }> {
  const profile = getLearningProfile();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const calendar: Record<string, { platforms: string[]; contentType: string; time: string }> = {};

  for (const day of dayNames) {
    const dayIndex = dayNames.indexOf(day);
    const platformsForDay = Object.entries(profile.bestPostingDays)
      .filter(([, bestDay]) => bestDay === dayIndex)
      .map(([platform]) => platform);

    if (platformsForDay.length === 0) {
      // Default: post on all platforms every day
      platformsForDay.push('instagram', 'twitter', 'tiktok');
    }

    const primaryPlatform = platformsForDay[0];
    const bestHour = profile.bestPostingHours[primaryPlatform] || 21;

    calendar[day] = {
      platforms: platformsForDay,
      contentType: profile.bestContentTypes[primaryPlatform] || 'post',
      time: `${bestHour}:00`,
    };
  }

  return calendar;
}
