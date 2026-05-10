// ============================================================
// lib/metricoolAnalytics.ts — Metricool Analytics Engine
// قراءة نتائج المنشورات + تحليل الأداء + اقتراح أفضل الأوقات
// يقرأ البيانات من Metricool ويحللها لتحسين المحتوى القادم
// ============================================================

import { getMetricoolCredentials, isMetricoolConfigured, updateBestTimes } from './metricoolClient';

// ── Types ───────────────────────────────────────────────────────────────────

export interface PostAnalytics {
  postId: string;
  blogId: number;
  pageId: string;
  text: string;
  type: string; // 'image', 'video', 'carousel', 'reel'
  link: string;
  picture: string;
  timestamp: number;
  dateTime: string;

  // Engagement metrics
  likes: number;
  comments: number;
  shares: number;
  reactions: number;
  clicks: number;
  linkClicks: number;
  engagement: number;

  // Reach metrics
  impressions: number;
  impressionsOrganic: number;
  impressionsPaid: number;
  impressionsUnique: number;
  impressionsUniqueOrganic: number;
  impressionsUniquePaid: number;

  // Video metrics
  videoViews: number;
  videoViewsOrganic: number;
  videoViewsPaid: number;
  videoTimeWatched: number;

  // Calculated
  engagementRate: number;
  platform: string;
  speed: number;
}

export interface PlatformOverview {
  platform: string;
  platformAr: string;
  followers: number;
  followersGrowth: number;
  totalPosts: number;
  avgEngagement: number;
  avgReach: number;
  bestPostTime: string;
  topPostType: string;
  period: string;
}

export interface EngagementTrend {
  date: string;
  engagement: number;
  impressions: number;
  followers: number;
}

export interface BestTimeSlot {
  hour: number;
  dayOfWeek: number; // 0=Sunday
  avgEngagement: number;
  postCount: number;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalEngagement: number;
  totalImpressions: number;
  avgEngagementRate: number;
  bestPerformingPost: PostAnalytics | null;
  worstPerformingPost: PostAnalytics | null;
  bestPostingTimes: Record<string, string>;
  topContentType: string;
  recommendations: string[];
}

// ── Metricool API Base ──────────────────────────────────────────────────────

const METRICOOL_BASE = 'https://app.metricool.com/api';

async function analyticsRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const creds = getMetricoolCredentials();
  if (!creds.userToken) throw new Error('Metricool not configured');

  const queryParams = new URLSearchParams({
    blogId: creds.blogId,
    userId: creds.userId,
    ...params,
  });

  const res = await fetch(`${METRICOOL_BASE}${endpoint}?${queryParams}`, {
    headers: { 'X-Mc-Auth': creds.userToken },
  });

  if (!res.ok) {
    throw new Error(`Metricool API error: ${res.status}`);
  }

  return res.json();
}

// ── Get Post Analytics ──────────────────────────────────────────────────────

export async function getPostAnalytics(
  platform: string,
  startDate: string,
  endDate: string
): Promise<PostAnalytics[]> {
  if (!isMetricoolConfigured()) return [];

  try {
    // Format dates for Metricool API
    const from = `${startDate}T00:00:00+03:00`;
    const to = `${endDate}T23:59:59+03:00`;

    const data = await analyticsRequest(`/stats/${platform}`, { from, to });

    if (!data?.data) return [];

    return data.data.map((post: any) => ({
      postId: post.postId || '',
      blogId: post.blogId || 0,
      pageId: post.pageId || '',
      text: post.text || '',
      type: post.type || 'unknown',
      link: post.link || '',
      picture: post.picture || '',
      timestamp: post.timestamp || 0,
      dateTime: post.created?.dateTime || '',

      likes: post.reactions || post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      reactions: post.reactions || 0,
      clicks: post.clicks || 0,
      linkClicks: post.linkClicks || 0,
      engagement: post.engagement || 0,

      impressions: post.impressions || 0,
      impressionsOrganic: post.impressionsOrganic || 0,
      impressionsPaid: post.impressionsPaid || 0,
      impressionsUnique: post.impressionsUnique || 0,
      impressionsUniqueOrganic: post.impressionsUniqueOrganic || 0,
      impressionsUniquePaid: post.impressionsUniquePaid || 0,

      videoViews: post.videoViews || 0,
      videoViewsOrganic: post.videoViewsOrganic || 0,
      videoViewsPaid: post.videoViewsPaid || 0,
      videoTimeWatched: post.videoTimeWatched || 0,

      engagementRate: post.engagement || 0,
      platform: platform,
      speed: post.speed || 0,
    }));
  } catch (error) {
    console.error(`[Analytics] Failed to get ${platform} analytics:`, error);
    return [];
  }
}

// ── Get All Platforms Analytics ─────────────────────────────────────────────

export async function getAllPlatformAnalytics(
  startDate: string,
  endDate: string
): Promise<Record<string, PostAnalytics[]>> {
  const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'];
  const results: Record<string, PostAnalytics[]> = {};

  for (const platform of platforms) {
    try {
      results[platform] = await getPostAnalytics(platform, startDate, endDate);
    } catch {
      results[platform] = [];
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

// ── Get Aggregated Stats ────────────────────────────────────────────────────

export async function getAggregatedStats(
  startDate: string,
  endDate: string
): Promise<Record<string, any>> {
  if (!isMetricoolConfigured()) return {};

  try {
    const from = `${startDate}T00:00:00+03:00`;
    const to = `${endDate}T23:59:59+03:00`;

    const data = await analyticsRequest('/stats/aggregation', { from, to });
    return data || {};
  } catch (error) {
    console.error('[Analytics] Failed to get aggregated stats:', error);
    return {};
  }
}

// ── Get Followers Timeline ──────────────────────────────────────────────────

export async function getFollowersTimeline(
  platform: string,
  startDate: string,
  endDate: string
): Promise<EngagementTrend[]> {
  if (!isMetricoolConfigured()) return [];

  try {
    const endpoint = platform === 'instagram'
      ? '/stats/timeling/igFollowers'
      : `/stats/timeline/${platform}`;

    const data = await analyticsRequest(endpoint, {
      start: startDate.replace(/-/g, ''),
      end: endDate.replace(/-/g, ''),
    });

    if (!data?.data) return [];

    return data.data.map((item: any) => ({
      date: item.date || item.dateTime || '',
      engagement: item.engagement || 0,
      impressions: item.impressions || 0,
      followers: item.followers || item.value || 0,
    }));
  } catch (error) {
    console.error(`[Analytics] Failed to get ${platform} timeline:`, error);
    return [];
  }
}

// ── Analyze Best Posting Times ──────────────────────────────────────────────

export function analyzeBestPostingTimes(posts: PostAnalytics[]): BestTimeSlot[] {
  const timeSlots = new Map<string, { totalEngagement: number; count: number; hour: number; day: number }>();

  for (const post of posts) {
    if (!post.timestamp) continue;

    const date = new Date(post.timestamp * 1000);
    const hour = date.getHours();
    const day = date.getDay();
    const key = `${day}-${hour}`;

    const existing = timeSlots.get(key) || { totalEngagement: 0, count: 0, hour, day };
    existing.totalEngagement += post.engagement || (post.likes + post.comments + post.shares);
    existing.count += 1;
    timeSlots.set(key, existing);
  }

  return Array.from(timeSlots.values())
    .map(slot => ({
      hour: slot.hour,
      dayOfWeek: slot.day,
      avgEngagement: slot.count > 0 ? slot.totalEngagement / slot.count : 0,
      postCount: slot.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// ── Generate Analytics Summary ──────────────────────────────────────────────

export function generateAnalyticsSummary(
  allPosts: Record<string, PostAnalytics[]>
): AnalyticsSummary {
  const flatPosts = Object.values(allPosts).flat();

  if (flatPosts.length === 0) {
    return {
      totalPosts: 0,
      totalEngagement: 0,
      totalImpressions: 0,
      avgEngagementRate: 0,
      bestPerformingPost: null,
      worstPerformingPost: null,
      bestPostingTimes: {},
      topContentType: 'unknown',
      recommendations: ['لا توجد بيانات كافية. ابدأ بنشر المحتوى لتحصل على تحليلات.'],
    };
  }

  // Total metrics
  const totalEngagement = flatPosts.reduce((sum, p) =>
    sum + (p.engagement || p.likes + p.comments + p.shares), 0);
  const totalImpressions = flatPosts.reduce((sum, p) => sum + p.impressions, 0);
  const avgEngagementRate = totalImpressions > 0
    ? (totalEngagement / totalImpressions) * 100
    : 0;

  // Best and worst posts
  const sortedByEngagement = [...flatPosts].sort((a, b) =>
    (b.engagement || b.likes + b.comments) - (a.engagement || a.likes + a.comments));
  const bestPerformingPost = sortedByEngagement[0] || null;
  const worstPerformingPost = sortedByEngagement[sortedByEngagement.length - 1] || null;

  // Best posting times per platform
  const bestPostingTimes: Record<string, string> = {};
  for (const [platform, posts] of Object.entries(allPosts)) {
    if (posts.length === 0) continue;
    const bestSlots = analyzeBestPostingTimes(posts);
    if (bestSlots.length > 0) {
      const best = bestSlots[0];
      bestPostingTimes[platform] = `${String(best.hour).padStart(2, '0')}:00`;
    }
  }

  // Update stored best times
  if (Object.keys(bestPostingTimes).length > 0) {
    updateBestTimes(bestPostingTimes);
  }

  // Top content type
  const typeCounts = new Map<string, number>();
  for (const post of flatPosts) {
    const count = typeCounts.get(post.type) || 0;
    typeCounts.set(post.type, count + (post.engagement || post.likes + post.comments));
  }
  const topContentType = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  // Generate recommendations
  const recommendations = generateRecommendations(allPosts, bestPostingTimes, topContentType);

  return {
    totalPosts: flatPosts.length,
    totalEngagement,
    totalImpressions,
    avgEngagementRate,
    bestPerformingPost,
    worstPerformingPost,
    bestPostingTimes,
    topContentType,
    recommendations,
  };
}

// ── Smart Recommendations ───────────────────────────────────────────────────

function generateRecommendations(
  allPosts: Record<string, PostAnalytics[]>,
  bestTimes: Record<string, string>,
  topType: string
): string[] {
  const recommendations: string[] = [];

  // Check posting frequency
  const totalPosts = Object.values(allPosts).flat().length;
  if (totalPosts < 7) {
    recommendations.push('📈 زد معدل النشر — المنشور اليومي يزيد التفاعل بنسبة 40%');
  }

  // Check platform coverage
  const activePlatforms = Object.entries(allPosts).filter(([, posts]) => posts.length > 0);
  if (activePlatforms.length < 3) {
    recommendations.push('🌐 وسّع تواجدك — انشر على 3 منصات على الأقل لزيادة الوصول');
  }

  // Content type recommendation
  if (topType === 'video' || topType === 'reel') {
    recommendations.push('🎬 محتوى الفيديو يحقق أفضل أداء — استمر في إنتاج الريلز والفيديوهات');
  } else {
    recommendations.push('🎥 جرّب محتوى الفيديو والريلز — عادةً يحقق تفاعل أعلى بـ 3 أضعاف');
  }

  // Best times
  if (Object.keys(bestTimes).length > 0) {
    const timesList = Object.entries(bestTimes)
      .map(([platform, time]) => `${platform}: ${time}`)
      .join(' | ');
    recommendations.push(`⏰ أفضل أوقات النشر: ${timesList}`);
  }

  // Engagement tips
  recommendations.push('💡 استخدم الهاشتاقات الترند + كابشن يبدأ بسؤال لزيادة التعليقات');
  recommendations.push('🔄 أعد نشر المحتوى الأفضل أداءً بصيغة مختلفة كل أسبوعين');

  return recommendations;
}

// ── Performance Score (0-100) ────────────────────────────────────────────────

export function calculatePerformanceScore(summary: AnalyticsSummary): number {
  if (summary.totalPosts === 0) return 0;

  let score = 0;

  // Engagement rate (max 30 points)
  score += Math.min(30, summary.avgEngagementRate * 10);

  // Posting frequency (max 20 points) — ideal is 1+ per day
  const postsPerDay = summary.totalPosts / 30; // assuming 30-day period
  score += Math.min(20, postsPerDay * 20);

  // Total impressions (max 25 points)
  const impressionsPerPost = summary.totalImpressions / summary.totalPosts;
  score += Math.min(25, (impressionsPerPost / 1000) * 5);

  // Content variety (max 15 points)
  if (summary.topContentType !== 'unknown') score += 10;
  if (Object.keys(summary.bestPostingTimes).length >= 3) score += 5;

  // Consistency bonus (max 10 points)
  if (summary.totalPosts >= 20) score += 10;
  else if (summary.totalPosts >= 10) score += 5;

  return Math.min(100, Math.round(score));
}

// ── Get Last 30 Days Summary ────────────────────────────────────────────────

export async function getLast30DaysSummary(): Promise<AnalyticsSummary> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const allPosts = await getAllPlatformAnalytics(startDate, endDate);
  return generateAnalyticsSummary(allPosts);
}

// ── Store Analytics History ─────────────────────────────────────────────────

const ANALYTICS_HISTORY_KEY = 'mahwous_analytics_history';

export function storeAnalyticsSnapshot(summary: AnalyticsSummary): void {
  if (typeof window === 'undefined') return;

  try {
    const history = JSON.parse(localStorage.getItem(ANALYTICS_HISTORY_KEY) || '[]');
    history.push({
      date: new Date().toISOString(),
      score: calculatePerformanceScore(summary),
      totalPosts: summary.totalPosts,
      totalEngagement: summary.totalEngagement,
      avgEngagementRate: summary.avgEngagementRate,
    });

    // Keep last 90 days
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const filtered = history.filter((h: any) => new Date(h.date).getTime() > cutoff);

    localStorage.setItem(ANALYTICS_HISTORY_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
}

export function getAnalyticsHistory(): Array<{
  date: string;
  score: number;
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
}> {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}
