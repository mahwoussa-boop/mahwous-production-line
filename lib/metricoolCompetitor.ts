// ============================================================
// lib/metricoolCompetitor.ts — Competitor Analysis Engine
// تحليل المنافسين عبر Metricool + استخلاص أفكار المحتوى
// يتعلم من نجاحات المنافسين ويقترح محتوى أفضل
// ============================================================

import { getMetricoolCredentials, isMetricoolConfigured } from './metricoolClient';

// ── Types ───────────────────────────────────────────────────────────────────

export interface CompetitorProfile {
  id: string;
  name: string;
  platform: string;
  handle: string;
  followers: number;
  avgEngagement: number;
  postFrequency: number; // posts per week
  topContentTypes: string[];
  addedAt: string;
}

export interface CompetitorPost {
  id: string;
  competitorId: string;
  text: string;
  type: string;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  publishedAt: string;
  mediaUrl: string;
  hashtags: string[];
}

export interface CompetitorInsight {
  category: string;
  categoryAr: string;
  insight: string;
  insightAr: string;
  actionable: string;
  actionableAr: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
}

export interface ContentIdea {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  platform: string;
  contentType: string;
  hashtags: string[];
  estimatedEngagement: 'high' | 'medium' | 'low';
  inspiredBy: string;
}

export interface CompetitorComparison {
  metric: string;
  metricAr: string;
  ourValue: number;
  avgCompetitorValue: number;
  bestCompetitorValue: number;
  bestCompetitorName: string;
  status: 'winning' | 'average' | 'losing';
  recommendation: string;
}

// ── Storage ─────────────────────────────────────────────────────────────────

const COMPETITORS_KEY = 'mahwous_competitors';
const COMPETITOR_INSIGHTS_KEY = 'mahwous_competitor_insights';
const CONTENT_IDEAS_KEY = 'mahwous_content_ideas';

// ── Competitor Management ───────────────────────────────────────────────────

export function getCompetitors(): CompetitorProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(COMPETITORS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addCompetitor(competitor: Omit<CompetitorProfile, 'id' | 'addedAt'>): CompetitorProfile {
  const competitors = getCompetitors();
  const newCompetitor: CompetitorProfile = {
    ...competitor,
    id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    addedAt: new Date().toISOString(),
  };
  competitors.push(newCompetitor);
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
  }
  return newCompetitor;
}

export function removeCompetitor(id: string): void {
  const competitors = getCompetitors().filter(c => c.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
  }
}

// ── Default Perfume Industry Competitors (Saudi Market) ─────────────────────

export const DEFAULT_COMPETITORS: Array<Omit<CompetitorProfile, 'id' | 'addedAt'>> = [
  {
    name: 'عبدالصمد القرشي',
    platform: 'instagram',
    handle: '@abdulsamadqurashi',
    followers: 0,
    avgEngagement: 0,
    postFrequency: 7,
    topContentTypes: ['reels', 'post'],
  },
  {
    name: 'العربية للعود',
    platform: 'instagram',
    handle: '@arabianoud',
    followers: 0,
    avgEngagement: 0,
    postFrequency: 5,
    topContentTypes: ['reels', 'story'],
  },
  {
    name: 'قصر الأواني',
    platform: 'instagram',
    handle: '@qasralawani',
    followers: 0,
    avgEngagement: 0,
    postFrequency: 4,
    topContentTypes: ['post', 'reels'],
  },
  {
    name: 'الرصاصي',
    platform: 'instagram',
    handle: '@rasasi_perfumes',
    followers: 0,
    avgEngagement: 0,
    postFrequency: 3,
    topContentTypes: ['post', 'video'],
  },
];

// ── Analyze Competitor Data from Metricool ──────────────────────────────────

export async function analyzeCompetitorFromMetricool(
  competitorHandle: string,
  platform: string
): Promise<CompetitorPost[]> {
  if (!isMetricoolConfigured()) return [];

  const creds = getMetricoolCredentials();

  try {
    // Metricool competitor analysis endpoint
    const endDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0].replace(/-/g, '');

    const res = await fetch(
      `https://app.metricool.com/api/stats/competitors/${platform}?` +
      `blogId=${creds.blogId}&userId=${creds.userId}&start=${startDate}&end=${endDate}`,
      { headers: { 'X-Mc-Auth': creds.userToken } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.data) return [];

    return data.data.map((post: any) => ({
      id: post.id || `${Date.now()}`,
      competitorId: competitorHandle,
      text: post.text || post.caption || '',
      type: post.type || 'post',
      engagement: post.engagement || 0,
      likes: post.likes || post.reactions || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      impressions: post.impressions || 0,
      publishedAt: post.dateTime || post.publishedAt || '',
      mediaUrl: post.picture || post.mediaUrl || '',
      hashtags: extractHashtags(post.text || post.caption || ''),
    }));
  } catch (error) {
    console.error('[Competitor] Analysis failed:', error);
    return [];
  }
}

// ── Extract Hashtags ────────────────────────────────────────────────────────

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u0600-\u06FF]+/g);
  return matches || [];
}

// ── Generate Competitor Insights ────────────────────────────────────────────

export function generateCompetitorInsights(
  competitorPosts: CompetitorPost[],
  ourPosts: any[]
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];

  if (competitorPosts.length === 0) {
    return [{
      category: 'data',
      categoryAr: 'البيانات',
      insight: 'No competitor data available yet',
      insightAr: 'لا تتوفر بيانات منافسين بعد',
      actionable: 'Add competitors in Metricool to start tracking',
      actionableAr: 'أضف المنافسين في Metricool لبدء التتبع',
      priority: 'high',
      source: 'system',
    }];
  }

  // Analyze posting frequency
  const competitorFreq = competitorPosts.length / 30; // posts per day
  const ourFreq = ourPosts.length / 30;

  if (competitorFreq > ourFreq * 1.5) {
    insights.push({
      category: 'frequency',
      categoryAr: 'معدل النشر',
      insight: `Competitors post ${competitorFreq.toFixed(1)}x/day vs your ${ourFreq.toFixed(1)}x/day`,
      insightAr: `المنافسون ينشرون ${competitorFreq.toFixed(1)} مرة/يوم مقابل ${ourFreq.toFixed(1)} مرة/يوم لك`,
      actionable: 'Increase posting frequency to match competitors',
      actionableAr: 'زد معدل النشر ليتناسب مع المنافسين',
      priority: 'high',
      source: 'frequency_analysis',
    });
  }

  // Analyze top hashtags
  const allHashtags = competitorPosts.flatMap(p => p.hashtags);
  const hashtagCounts = new Map<string, number>();
  for (const tag of allHashtags) {
    hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
  }
  const topHashtags = Array.from(hashtagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  if (topHashtags.length > 0) {
    insights.push({
      category: 'hashtags',
      categoryAr: 'الهاشتاقات',
      insight: `Top competitor hashtags: ${topHashtags.slice(0, 5).join(', ')}`,
      insightAr: `أكثر هاشتاقات المنافسين: ${topHashtags.slice(0, 5).join(', ')}`,
      actionable: 'Use these trending hashtags in your posts',
      actionableAr: 'استخدم هذه الهاشتاقات الرائجة في منشوراتك',
      priority: 'medium',
      source: 'hashtag_analysis',
    });
  }

  // Analyze content types
  const typeCounts = new Map<string, { count: number; totalEngagement: number }>();
  for (const post of competitorPosts) {
    const existing = typeCounts.get(post.type) || { count: 0, totalEngagement: 0 };
    existing.count += 1;
    existing.totalEngagement += post.engagement;
    typeCounts.set(post.type, existing);
  }

  const bestType = Array.from(typeCounts.entries())
    .sort((a, b) => (b[1].totalEngagement / b[1].count) - (a[1].totalEngagement / a[1].count))[0];

  if (bestType) {
    insights.push({
      category: 'content_type',
      categoryAr: 'نوع المحتوى',
      insight: `Best performing content type for competitors: ${bestType[0]}`,
      insightAr: `أفضل نوع محتوى عند المنافسين: ${bestType[0]}`,
      actionable: `Focus on creating more ${bestType[0]} content`,
      actionableAr: `ركّز على إنتاج المزيد من محتوى ${bestType[0]}`,
      priority: 'high',
      source: 'content_analysis',
    });
  }

  // Analyze posting times
  const hourCounts = new Map<number, { count: number; engagement: number }>();
  for (const post of competitorPosts) {
    if (!post.publishedAt) continue;
    const hour = new Date(post.publishedAt).getHours();
    const existing = hourCounts.get(hour) || { count: 0, engagement: 0 };
    existing.count += 1;
    existing.engagement += post.engagement;
    hourCounts.set(hour, existing);
  }

  const bestHour = Array.from(hourCounts.entries())
    .sort((a, b) => (b[1].engagement / b[1].count) - (a[1].engagement / a[1].count))[0];

  if (bestHour) {
    insights.push({
      category: 'timing',
      categoryAr: 'التوقيت',
      insight: `Competitors get most engagement at ${bestHour[0]}:00`,
      insightAr: `المنافسون يحققون أعلى تفاعل الساعة ${bestHour[0]}:00`,
      actionable: `Schedule your posts around ${bestHour[0]}:00 for better engagement`,
      actionableAr: `جدول منشوراتك حول الساعة ${bestHour[0]}:00 لتفاعل أفضل`,
      priority: 'medium',
      source: 'timing_analysis',
    });
  }

  return insights;
}

// ── Generate Content Ideas from Competitor Analysis ─────────────────────────

export function generateContentIdeas(
  competitorPosts: CompetitorPost[],
  perfumeName?: string
): ContentIdea[] {
  const ideas: ContentIdea[] = [];

  // Sort by engagement to find winning content patterns
  const topPosts = [...competitorPosts]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10);

  // Analyze patterns in top posts
  for (const post of topPosts.slice(0, 3)) {
    const isVideo = post.type === 'video' || post.type === 'reel';
    const hasQuestion = post.text.includes('?') || post.text.includes('؟');

    ideas.push({
      title: `Inspired by top competitor post`,
      titleAr: `مستوحى من أفضل منشور منافس`,
      description: `Create similar content to: "${post.text.substring(0, 100)}..."`,
      descriptionAr: `أنشئ محتوى مشابه لـ: "${post.text.substring(0, 100)}..."`,
      platform: 'instagram',
      contentType: isVideo ? 'reels' : 'post',
      hashtags: post.hashtags.slice(0, 5),
      estimatedEngagement: 'high',
      inspiredBy: post.competitorId,
    });
  }

  // Perfume-specific content ideas
  const perfumeIdeas: ContentIdea[] = [
    {
      title: 'Before & After Unboxing',
      titleAr: 'فتح صندوق العطر — قبل وبعد',
      description: 'Show the unboxing experience with dramatic reveal',
      descriptionAr: 'اعرض تجربة فتح الصندوق مع كشف درامي',
      platform: 'instagram',
      contentType: 'reels',
      hashtags: ['#عطور', '#فتح_صندوق', '#مهووس_ستور', '#عطر_جديد', '#perfume'],
      estimatedEngagement: 'high',
      inspiredBy: 'trend',
    },
    {
      title: 'Perfume Notes Breakdown',
      titleAr: 'تحليل مكونات العطر',
      description: 'Visual breakdown of top, middle, and base notes',
      descriptionAr: 'تحليل بصري لمكونات العطر العليا والوسطى والقاعدة',
      platform: 'instagram',
      contentType: 'post',
      hashtags: ['#عطور', '#مكونات_العطر', '#مهووس', '#perfume_notes'],
      estimatedEngagement: 'medium',
      inspiredBy: 'educational',
    },
    {
      title: 'Day vs Night Perfume',
      titleAr: 'عطر النهار مقابل عطر الليل',
      description: 'Compare day and night perfume choices',
      descriptionAr: 'قارن بين اختيارات عطور النهار والليل',
      platform: 'tiktok',
      contentType: 'video',
      hashtags: ['#عطور', '#عطر_النهار', '#عطر_الليل', '#مهووس_ستور'],
      estimatedEngagement: 'high',
      inspiredBy: 'trend',
    },
    {
      title: 'Customer Review Spotlight',
      titleAr: 'تسليط الضوء على تقييم عميل',
      description: 'Feature a real customer review with the product',
      descriptionAr: 'اعرض تقييم حقيقي من عميل مع المنتج',
      platform: 'instagram',
      contentType: 'story',
      hashtags: ['#تقييم_عملاء', '#مهووس_ستور', '#عطور_أصلية'],
      estimatedEngagement: 'medium',
      inspiredBy: 'social_proof',
    },
    {
      title: 'Perfume Layering Guide',
      titleAr: 'دليل طبقات العطور',
      description: 'Show how to layer perfumes for a unique scent',
      descriptionAr: 'اعرض كيفية تطبيق طبقات العطور للحصول على رائحة فريدة',
      platform: 'youtube',
      contentType: 'video',
      hashtags: ['#عطور', '#طبقات_العطور', '#نصائح_عطور', '#مهووس'],
      estimatedEngagement: 'high',
      inspiredBy: 'educational',
    },
  ];

  ideas.push(...perfumeIdeas);

  return ideas;
}

// ── Store Insights ──────────────────────────────────────────────────────────

export function storeInsights(insights: CompetitorInsight[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPETITOR_INSIGHTS_KEY, JSON.stringify({
    insights,
    updatedAt: new Date().toISOString(),
  }));
}

export function getStoredInsights(): { insights: CompetitorInsight[]; updatedAt: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(COMPETITOR_INSIGHTS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ── Fetch Trending Intel for Elite Director ─────────────────────────────────

export interface TrendingIntel {
  trending_keywords: string[];
  market_vibe: string;
  best_posting_time: string;
  competitor_insights: string;
  top_hashtags: string[];
}

export async function fetchTrendingIntel(): Promise<TrendingIntel | null> {
  try {
    if (!isMetricoolConfigured()) {
      return getDefaultIntel();
    }

    const creds = getMetricoolCredentials();
    const endDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0].replace(/-/g, '');

    const res = await fetch(
      `https://app.metricool.com/api/stats/instagram?blogId=${creds.blogId}&userId=${creds.userId}&start=${startDate}&end=${endDate}`,
      { headers: { 'X-Mc-Auth': creds.userToken } }
    );

    if (res.ok) {
      const data = await res.json();
      const posts = data?.posts || data?.data || [];

      const allText = posts.map((p: { text?: string; caption?: string }) => p.text || p.caption || '').join(' ');
      const words = allText.split(/\s+/).filter((w: string) => w.length > 3);
      const wordCounts = new Map<string, number>();
      for (const w of words) {
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      }
      const trending = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word]) => word);

      const hashtags = allText.match(/#[\w\u0600-\u06FF]+/g) || [];
      const hashtagCounts = new Map<string, number>();
      for (const h of hashtags) {
        hashtagCounts.set(h, (hashtagCounts.get(h) || 0) + 1);
      }
      const topHashtags = Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      const hourEngagement = new Map<number, { total: number; count: number }>();
      for (const post of posts) {
        const dateStr = post.dateTime || post.publishedAt;
        if (!dateStr) continue;
        const hour = new Date(dateStr).getHours();
        const existing = hourEngagement.get(hour) || { total: 0, count: 0 };
        existing.total += (post.engagement || post.likes || 0);
        existing.count += 1;
        hourEngagement.set(hour, existing);
      }
      const bestHour = Array.from(hourEngagement.entries())
        .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))?.[0]?.[0] || 21;

      return {
        trending_keywords: trending.length > 0 ? trending : getDefaultIntel().trending_keywords,
        market_vibe: posts.length > 0
          ? `${posts.length} posts analyzed - audience is ${posts.reduce((s: number, p: { engagement?: number }) => s + (p.engagement || 0), 0) / posts.length > 300 ? 'highly active' : 'growing'}`
          : getDefaultIntel().market_vibe,
        best_posting_time: `${bestHour}:00`,
        competitor_insights: `${posts.length} posts from last 7 days`,
        top_hashtags: topHashtags.length > 0 ? topHashtags : getDefaultIntel().top_hashtags,
      };
    }
  } catch (err) {
    console.warn('[metricoolCompetitor] fetchTrendingIntel failed:', err);
  }

  return getDefaultIntel();
}

function getDefaultIntel(): TrendingIntel {
  return {
    trending_keywords: [
      'عطور_فاخرة', 'عطر_رجالي', 'عطر_نسائي', 'مهووس_ستور',
      'عطور_أصلية', 'parfum', 'luxury_perfume', 'عود', 'بخور',
    ],
    market_vibe: 'Saudi perfume market trending toward luxury oriental and niche fragrances',
    best_posting_time: '21:00',
    competitor_insights: 'Default Saudi perfume market data',
    top_hashtags: [
      '#عطور', '#عطور_فاخرة', '#مهووس_ستور', '#عطر', '#perfume',
      '#عطور_أصلية', '#عود', '#بخور', '#هدية_عطر', '#luxury',
    ],
  };
}

// ── Store Content Ideas ─────────────────────────────────────────────────────

export function storeContentIdeas(ideas: ContentIdea[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONTENT_IDEAS_KEY, JSON.stringify({
    ideas,
    updatedAt: new Date().toISOString(),
  }));
}

export function getStoredContentIdeas(): { ideas: ContentIdea[]; updatedAt: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(CONTENT_IDEAS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
