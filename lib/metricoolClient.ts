// ============================================================
// lib/metricoolClient.ts — Metricool API Integration Layer
// التطبيق → Metricool API → كل المنصات
// نشر تلقائي + جدولة ذكية + رفع الوسائط
// ============================================================

import { QueuedPost } from './contentQueue';

// ── Metricool API Configuration ─────────────────────────────────────────────

const METRICOOL_BASE_URL = 'https://app.metricool.com/api';
const METRICOOL_V2_BASE_URL = 'https://app.metricool.com/api/v2';

// Storage keys for Metricool credentials
const METRICOOL_TOKEN_KEY = 'mahwous_metricool_token';
const METRICOOL_BLOG_ID_KEY = 'mahwous_metricool_blog_id';
const METRICOOL_USER_ID_KEY = 'mahwous_metricool_user_id';

// ── Credential Management ───────────────────────────────────────────────────

export interface MetricoolCredentials {
  userToken: string;
  blogId: string;
  userId: string;
}

export function getMetricoolCredentials(): MetricoolCredentials {
  if (typeof window === 'undefined') {
    return { userToken: '', blogId: '', userId: '' };
  }
  return {
    userToken: localStorage.getItem(METRICOOL_TOKEN_KEY) || '',
    blogId: localStorage.getItem(METRICOOL_BLOG_ID_KEY) || '',
    userId: localStorage.getItem(METRICOOL_USER_ID_KEY) || '',
  };
}

export function setMetricoolCredentials(creds: MetricoolCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(METRICOOL_TOKEN_KEY, creds.userToken.trim());
  localStorage.setItem(METRICOOL_BLOG_ID_KEY, creds.blogId.trim());
  localStorage.setItem(METRICOOL_USER_ID_KEY, creds.userId.trim());
}

export function isMetricoolConfigured(): boolean {
  const creds = getMetricoolCredentials();
  return !!(creds.userToken && creds.blogId && creds.userId);
}

// ── API Helper ──────────────────────────────────────────────────────────────

async function metricoolFetch(
  endpoint: string,
  options: RequestInit = {},
  useV2 = false
): Promise<Response> {
  const creds = getMetricoolCredentials();
  if (!creds.userToken) {
    throw new Error('Metricool API token not configured');
  }

  const baseUrl = useV2 ? METRICOOL_V2_BASE_URL : METRICOOL_BASE_URL;
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseUrl}${endpoint}${separator}blogId=${creds.blogId}&userId=${creds.userId}`;

  const headers: Record<string, string> = {
    'X-Mc-Auth': creds.userToken,
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface MetricoolProfile {
  blogId: number;
  name: string;
  networks: string[];
}

export interface MetricoolScheduledPost {
  id?: string;
  publicationDate: {
    dateTime: string;
    timezone: string;
  };
  text: string;
  firstCommentText?: string;
  providers: Array<{ network: string }>;
  media?: string[];
  autoPublish: boolean;
  saveExternalMediaFiles?: boolean;
  shortener?: boolean;
  draft?: boolean;
  facebookData?: { type: string };
  instagramData?: { autoPublish: boolean; showReelsInFeed?: boolean };
  twitterData?: Record<string, unknown>;
  linkedinData?: Record<string, unknown>;
  tiktokData?: Record<string, unknown>;
  youtubeData?: Record<string, unknown>;
  pinterestData?: Record<string, unknown>;
  gmbData?: Record<string, unknown>;
}

export interface MetricoolPostResult {
  success: boolean;
  postId?: string;
  message: string;
  platform?: string;
}

export interface NormalizedMediaResult {
  url: string;
  success: boolean;
}

// ── Platform Mapping (App → Metricool network names) ────────────────────────

const PLATFORM_TO_METRICOOL: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  twitter: 'twitter',
  linkedin: 'linkedin',
  tiktok: 'tiktok',
  youtube: 'youtube',
  pinterest: 'pinterest',
  // snapchat, whatsapp, telegram, haraj — not supported by Metricool API
};

// Platforms that need manual export (not supported by Metricool)
export const MANUAL_PLATFORMS = ['snapchat', 'whatsapp', 'telegram', 'haraj'];

// ── Media Upload (Normalize URL on Metricool servers) ───────────────────────

export async function normalizeMediaUrl(mediaUrl: string): Promise<NormalizedMediaResult> {
  try {
    // If it's a base64 image, first upload to get a public URL
    if (mediaUrl.startsWith('data:image')) {
      // Use the app's upload-image API first
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: mediaUrl, name: `metricool_${Date.now()}` }),
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        if (data.url && !data.url.startsWith('data:')) {
          mediaUrl = data.url;
        } else {
          return { url: '', success: false };
        }
      }
    }

    // Normalize on Metricool servers
    const res = await metricoolFetch(
      `/actions/normalize/image/url?url=${encodeURIComponent(mediaUrl)}`
    );

    if (res.ok) {
      const data = await res.json();
      return { url: data.url || data, success: true };
    }

    // If normalization fails, return original URL (might still work)
    return { url: mediaUrl, success: true };
  } catch (error) {
    console.error('[Metricool] Media normalization failed:', error);
    return { url: mediaUrl, success: false };
  }
}

// ── Get Connected Profiles ──────────────────────────────────────────────────

export async function getConnectedProfiles(): Promise<MetricoolProfile[]> {
  try {
    const res = await metricoolFetch('/admin/simpleProfiles');
    if (res.ok) {
      const data = await res.json();
      return data.data || data || [];
    }
    return [];
  } catch (error) {
    console.error('[Metricool] Failed to get profiles:', error);
    return [];
  }
}

// ── Schedule a Post via Metricool ───────────────────────────────────────────

export async function schedulePost(
  post: QueuedPost,
  scheduledDateTime: string,
  timezone: string = 'Asia/Riyadh'
): Promise<MetricoolPostResult[]> {
  const results: MetricoolPostResult[] = [];

  // Filter to only Metricool-supported platforms
  const metricoolPlatforms = post.platforms
    .filter(p => PLATFORM_TO_METRICOOL[p])
    .map(p => PLATFORM_TO_METRICOOL[p]);

  if (metricoolPlatforms.length === 0) {
    return [{
      success: false,
      message: 'لا توجد منصات مدعومة من Metricool في القائمة المحددة',
    }];
  }

  try {
    // Step 1: Normalize media URLs on Metricool servers
    const mediaUrls: string[] = [];

    // Choose the best image based on platform
    const primaryImage = post.postImageUrl || post.storyImageUrl || post.landscapeImageUrl;
    if (primaryImage) {
      const normalized = await normalizeMediaUrl(primaryImage);
      if (normalized.success && normalized.url) {
        mediaUrls.push(normalized.url);
      }
    }

    // Step 2: Prepare platform-specific captions
    const getCaptionForPlatform = (platform: string): string => {
      switch (platform) {
        case 'instagram':
          return post.captions?.instagram_post || post.captions?.instagram_story || '';
        case 'facebook':
          return post.captions?.facebook_post || post.captions?.facebook_story || '';
        case 'twitter':
          return post.captions?.twitter || '';
        case 'linkedin':
          return post.captions?.linkedin || '';
        case 'tiktok':
          return post.captions?.tiktok || post.videoCaptions?.tiktok_video || '';
        case 'youtube':
          return post.captions?.youtube_thumbnail || post.videoCaptions?.youtube_video || '';
        case 'pinterest':
          return post.captions?.pinterest || '';
        default:
          return post.captions?.instagram_post || '';
      }
    };

    // Step 3: Build the scheduled post payload
    // Use the longest caption as the main text
    const mainCaption = getCaptionForPlatform(metricoolPlatforms[0]);

    const scheduledPost: MetricoolScheduledPost = {
      publicationDate: {
        dateTime: scheduledDateTime,
        timezone: timezone,
      },
      text: mainCaption,
      providers: metricoolPlatforms.map(network => ({ network })),
      media: mediaUrls,
      autoPublish: true,
      saveExternalMediaFiles: true,
      shortener: false,
      draft: false,
    };

    // Add platform-specific data
    if (metricoolPlatforms.includes('facebook')) {
      scheduledPost.facebookData = { type: 'POST' };
    }
    if (metricoolPlatforms.includes('instagram')) {
      scheduledPost.instagramData = {
        autoPublish: true,
        showReelsInFeed: true,
      };
    }

    // Step 4: Send to Metricool API
    const res = await metricoolFetch('/scheduler/posts', {
      method: 'POST',
      body: JSON.stringify(scheduledPost),
    }, true);

    if (res.ok) {
      const data = await res.json();
      results.push({
        success: true,
        postId: data.id || data.postId,
        message: `تم جدولة المنشور بنجاح على ${metricoolPlatforms.join(', ')}`,
        platform: metricoolPlatforms.join(', '),
      });
    } else {
      const errorText = await res.text();
      results.push({
        success: false,
        message: `فشل الجدولة: ${res.status} — ${errorText}`,
      });
    }
  } catch (error) {
    results.push({
      success: false,
      message: `خطأ في الاتصال بـ Metricool: ${error instanceof Error ? error.message : 'غير معروف'}`,
    });
  }

  return results;
}

// ── Publish Now (Schedule for immediate) ────────────────────────────────────

export async function publishNow(post: QueuedPost): Promise<MetricoolPostResult[]> {
  // Schedule 2 minutes from now to allow processing
  const now = new Date();
  now.setMinutes(now.getMinutes() + 2);
  const dateTime = now.toISOString().replace('Z', '').split('.')[0];

  return schedulePost(post, dateTime, 'Asia/Riyadh');
}

// ── Smart Auto-Schedule (Best time for each platform) ───────────────────────

export async function autoSchedulePost(
  post: QueuedPost,
  targetDate?: string
): Promise<MetricoolPostResult[]> {
  const results: MetricoolPostResult[] = [];

  // Use target date or next available date
  const date = targetDate || getNextSmartDate();

  // Get best times from analytics (or use defaults)
  const bestTimes = await getBestPostingTimes();

  // Group platforms by their best posting time
  const timeGroups = new Map<string, string[]>();

  for (const platform of post.platforms) {
    if (!PLATFORM_TO_METRICOOL[platform]) continue;

    const bestTime = bestTimes[platform] || getDefaultBestTime(platform);
    const dateTime = `${date}T${bestTime}:00`;

    if (!timeGroups.has(dateTime)) {
      timeGroups.set(dateTime, []);
    }
    timeGroups.get(dateTime)!.push(platform);
  }

  // Schedule each time group
  for (const [dateTime, platforms] of timeGroups) {
    const groupPost = { ...post, platforms };
    const groupResults = await schedulePost(groupPost, dateTime);
    results.push(...groupResults);

    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return results;
}

// ── Get Best Posting Times from Analytics ───────────────────────────────────

async function getBestPostingTimes(): Promise<Record<string, string>> {
  const stored = getStoredBestTimes();
  if (stored) return stored;

  // Default best times (Saudi Arabia timezone)
  return {
    instagram: '21:00',
    facebook: '19:00',
    twitter: '12:00',
    linkedin: '08:00',
    tiktok: '22:00',
    youtube: '17:00',
    pinterest: '21:00',
  };
}

function getDefaultBestTime(platform: string): string {
  const defaults: Record<string, string> = {
    instagram: '21:00',
    facebook: '19:00',
    twitter: '12:00',
    linkedin: '08:00',
    tiktok: '22:00',
    youtube: '17:00',
    pinterest: '21:00',
    snapchat: '20:00',
    whatsapp: '18:00',
    telegram: '20:00',
  };
  return defaults[platform] || '12:00';
}

function getNextSmartDate(): string {
  const now = new Date();
  // If it's past 6 PM, schedule for tomorrow
  if (now.getHours() >= 18) {
    now.setDate(now.getDate() + 1);
  }
  return now.toISOString().split('T')[0];
}

// ── Best Times Storage ──────────────────────────────────────────────────────

const BEST_TIMES_KEY = 'mahwous_best_posting_times';
const BEST_TIMES_UPDATED_KEY = 'mahwous_best_times_updated';

function getStoredBestTimes(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const updated = localStorage.getItem(BEST_TIMES_UPDATED_KEY);
    if (updated) {
      const lastUpdate = new Date(updated);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      // Refresh every 7 days
      if (hoursSinceUpdate > 168) return null;
    }
    const data = localStorage.getItem(BEST_TIMES_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function updateBestTimes(times: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(times));
  localStorage.setItem(BEST_TIMES_UPDATED_KEY, new Date().toISOString());
}

// ── Get Scheduled Posts List ────────────────────────────────────────────────

export async function getScheduledPosts(
  startDate?: string,
  endDate?: string
): Promise<MetricoolScheduledPost[]> {
  try {
    let endpoint = '/scheduler/posts';
    const params: string[] = [];

    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;

    const res = await metricoolFetch(endpoint, {}, true);
    if (res.ok) {
      const data = await res.json();
      return data.data || data || [];
    }
    return [];
  } catch (error) {
    console.error('[Metricool] Failed to get scheduled posts:', error);
    return [];
  }
}

// ── Delete a Scheduled Post ─────────────────────────────────────────────────

export async function deleteScheduledPost(postId: string): Promise<boolean> {
  try {
    const res = await metricoolFetch(`/scheduler/posts/${postId}`, {
      method: 'DELETE',
    }, true);
    return res.ok;
  } catch {
    return false;
  }
}

// ── Generate Manual Export Package ──────────────────────────────────────────
// For platforms not supported by Metricool (WhatsApp, Snapchat, Haraj, Telegram)

export interface ManualExportPackage {
  platform: string;
  platformAr: string;
  caption: string;
  images: string[];
  videos: string[];
  instructions: string;
}

export function generateManualExport(post: QueuedPost): ManualExportPackage[] {
  const packages: ManualExportPackage[] = [];

  const manualPlatforms = post.platforms.filter(p => MANUAL_PLATFORMS.includes(p));

  for (const platform of manualPlatforms) {
    let caption = '';
    let images: string[] = [];
    let videos: string[] = [];
    let instructions = '';

    switch (platform) {
      case 'whatsapp':
        caption = post.captions?.whatsapp || post.captions?.instagram_post || '';
        images = [post.storyImageUrl, post.postImageUrl].filter(Boolean);
        videos = [post.verticalVideoUrl].filter(Boolean);
        instructions = '1. افتح واتساب\n2. اذهب إلى الحالة\n3. أضف الصورة/الفيديو\n4. الصق الكابشن\n5. انشر';
        packages.push({
          platform: 'whatsapp',
          platformAr: 'واتساب',
          caption,
          images,
          videos,
          instructions,
        });
        break;

      case 'snapchat':
        caption = post.captions?.snapchat || '';
        images = [post.storyImageUrl].filter(Boolean);
        videos = [post.verticalVideoUrl].filter(Boolean);
        instructions = '1. افتح سناب شات\n2. أضف الصورة/الفيديو\n3. أضف النص\n4. انشر كقصة';
        packages.push({
          platform: 'snapchat',
          platformAr: 'سناب شات',
          caption,
          images,
          videos,
          instructions,
        });
        break;

      case 'haraj':
        caption = post.captions?.haraj || post.captions?.instagram_post || '';
        images = [post.postImageUrl, post.landscapeImageUrl].filter(Boolean);
        videos = [];
        instructions = '1. افتح حراج\n2. أضف إعلان جديد\n3. اختر القسم المناسب\n4. أضف الصور والوصف\n5. انشر';
        packages.push({
          platform: 'haraj',
          platformAr: 'حراج',
          caption,
          images,
          videos,
          instructions,
        });
        break;

      case 'telegram':
        caption = post.captions?.telegram || post.captions?.whatsapp || '';
        images = [post.postImageUrl].filter(Boolean);
        videos = [post.verticalVideoUrl].filter(Boolean);
        instructions = '1. افتح تلقرام\n2. اذهب إلى القناة\n3. أضف الصورة/الفيديو\n4. الصق الكابشن\n5. أرسل';
        packages.push({
          platform: 'telegram',
          platformAr: 'تلقرام',
          caption,
          images,
          videos,
          instructions,
        });
        break;
    }
  }

  return packages;
}

// ── Download Manual Export as ZIP-ready data ─────────────────────────────────

export function generateManualExportText(packages: ManualExportPackage[]): string {
  let output = '═══════════════════════════════════════════\n';
  output += '  📦 حزمة النشر اليدوي — مهووس ستور\n';
  output += '═══════════════════════════════════════════\n\n';

  for (const pkg of packages) {
    output += `\n━━━ ${pkg.platformAr} (${pkg.platform}) ━━━\n\n`;
    output += `📝 الكابشن:\n${pkg.caption}\n\n`;

    if (pkg.images.length > 0) {
      output += `🖼️ الصور:\n`;
      pkg.images.forEach((img, i) => {
        output += `  ${i + 1}. ${img}\n`;
      });
      output += '\n';
    }

    if (pkg.videos.length > 0) {
      output += `🎥 الفيديوهات:\n`;
      pkg.videos.forEach((vid, i) => {
        output += `  ${i + 1}. ${vid}\n`;
      });
      output += '\n';
    }

    output += `📋 خطوات النشر:\n${pkg.instructions}\n\n`;
  }

  return output;
}
