import { NextRequest, NextResponse } from 'next/server';

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/metricool/smart-publish — النشر الذكي عبر Metricool API
// V6: نشر كل الصور والفيديوهات على كل المنصات مع كابشنات مخصصة
// ══════════════════════════════════════════════════════════════════════════════

const METRICOOL_V2_BASE = 'https://app.metricool.com/api/v2';
const METRICOOL_V1_BASE = 'https://app.metricool.com/api';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

// ── جلب بيانات Metricool من البيئة ──────────────────────────────────────────
function getServerCredentials() {
  return {
    token: process.env.METRICOOL_API_TOKEN || '',
    blogId: process.env.METRICOOL_BLOG_ID || '',
    userId: process.env.METRICOOL_USER_ID || '',
  };
}

// ── جلب blogId تلقائياً ──────────────────────────────────────────────────────
async function ensureBlogId(token: string, blogId: string): Promise<{ blogId: string; userId: string; connectedNetworks: string[] }> {
  if (blogId) return { blogId, userId: '', connectedNetworks: [] };

  try {
    const res = await fetch(`${METRICOOL_V1_BASE}/admin/simpleProfiles`, {
      headers: { 'X-Mc-Auth': token },
    });

    if (res.ok) {
      const profiles = await res.json();
      if (Array.isArray(profiles) && profiles.length > 0) {
        const p = profiles[0];
        return {
          blogId: String(p.id || p.blogId || ''),
          userId: String(p.userId || p.user_id || ''),
          connectedNetworks: p.networks || p.connectedNetworks || [],
        };
      }
      if (profiles && typeof profiles === 'object' && !Array.isArray(profiles)) {
        return {
          blogId: String(profiles.id || profiles.blogId || ''),
          userId: String(profiles.userId || profiles.user_id || ''),
          connectedNetworks: profiles.networks || profiles.connectedNetworks || [],
        };
      }
    }
  } catch (e) {
    console.error('[Smart Publish] Failed to fetch blogId:', e);
  }

  return { blogId: '', userId: '', connectedNetworks: [] };
}

// ══════════════════════════════════════════════════════════════════════════════
// تحويل base64 إلى URL عام — Multi-provider with fallback
// ══════════════════════════════════════════════════════════════════════════════

function isBase64(url: string): boolean {
  return url.startsWith('data:') || url.startsWith('/9j/') || url.startsWith('iVBOR');
}

function base64ToUint8Array(base64: string): { data: Uint8Array; mimeType: string } {
  const match = base64.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  const raw = match ? match[2] : base64;
  const mime = match ? match[1] : 'image/png';
  const buf = Buffer.from(raw, 'base64');
  return {
    data: new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
    mimeType: mime,
  };
}

async function uploadToImgbb(base64Data: string): Promise<string | null> {
  if (!IMGBB_API_KEY) return null;
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z+]+;base64,/i, '');
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', cleanBase64);
    formData.append('name', `mahwous_${Date.now()}`);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data?.data?.url || data?.data?.display_url || null;
    }
  } catch (e) {
    console.warn('[upload] imgbb error:', e);
  }
  return null;
}

async function uploadToFreeimage(base64Data: string): Promise<string | null> {
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z+]+;base64,/i, '');
    const formData = new URLSearchParams();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    formData.append('source', cleanBase64);
    formData.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data?.image?.url || data?.image?.display_url || null;
    }
  } catch (e) {
    console.warn('[upload] freeimage error:', e);
  }
  return null;
}

async function uploadToCatbox(base64Data: string): Promise<string | null> {
  try {
    const { data, mimeType } = base64ToUint8Array(base64Data);
    const ext = mimeType.split('/')[1] || 'png';
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', new Blob([data as BlobPart], { type: mimeType }), `mahwous_${Date.now()}.${ext}`);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith('https://')) return url.trim();
    }
  } catch (e) {
    console.warn('[upload] catbox error:', e);
  }
  return null;
}

async function convertBase64ToPublicUrl(base64: string): Promise<string> {
  if (!isBase64(base64)) return base64;

  console.log('[Smart Publish] Converting base64 to public URL...');

  const url1 = await uploadToImgbb(base64);
  if (url1) { console.log(`[Smart Publish] imgbb: ${url1}`); return url1; }

  const url2 = await uploadToFreeimage(base64);
  if (url2) { console.log(`[Smart Publish] freeimage: ${url2}`); return url2; }

  const url3 = await uploadToCatbox(base64);
  if (url3) { console.log(`[Smart Publish] catbox: ${url3}`); return url3; }

  console.error('[Smart Publish] All upload providers failed!');
  return base64;
}

// ══════════════════════════════════════════════════════════════════════════════
// خريطة النشر الذكية — كل منصة مع نوع المحتوى والكابشن المناسب
// ══════════════════════════════════════════════════════════════════════════════

interface PublishTarget {
  platform: string;          // اسم المنصة في Metricool
  captionKey: string;        // مفتاح الكابشن من captions
  videoCaptionKey?: string;  // مفتاح كابشن الفيديو
  mediaType: 'image' | 'video' | 'both';
  imageFormat: 'story' | 'post' | 'landscape';
  videoFormat?: 'vertical' | 'horizontal';
  metricoolNetwork: string;  // اسم الشبكة في Metricool API
  platformData?: Record<string, unknown>;
  optimalHour: number;       // أفضل ساعة للنشر (توقيت السعودية)
}

// خريطة النشر الكاملة — 15 منصة × أنواع محتوى مختلفة
const PUBLISH_TARGETS: PublishTarget[] = [
  // ═══ صور عمودية (9:16) — Stories ═══
  {
    platform: 'Instagram Story',
    captionKey: 'instagram_story',
    mediaType: 'image',
    imageFormat: 'story',
    metricoolNetwork: 'instagram',
    platformData: { instagramData: { autoPublish: true, type: 'STORY' } },
    optimalHour: 21,
  },
  {
    platform: 'Facebook Story',
    captionKey: 'facebook_story',
    mediaType: 'image',
    imageFormat: 'story',
    metricoolNetwork: 'facebook',
    platformData: { facebookData: { type: 'STORY' } },
    optimalHour: 19,
  },
  {
    platform: 'TikTok Cover',
    captionKey: 'tiktok',
    mediaType: 'image',
    imageFormat: 'story',
    metricoolNetwork: 'tiktok',
    platformData: { tiktokData: {} },
    optimalHour: 22,
  },

  // ═══ صور مربعة (1:1) — Posts ═══
  {
    platform: 'Instagram Post',
    captionKey: 'instagram_post',
    mediaType: 'image',
    imageFormat: 'post',
    metricoolNetwork: 'instagram',
    platformData: { instagramData: { autoPublish: true } },
    optimalHour: 20,
  },
  {
    platform: 'Facebook Post',
    captionKey: 'facebook_post',
    mediaType: 'image',
    imageFormat: 'post',
    metricoolNetwork: 'facebook',
    platformData: { facebookData: { type: 'POST' } },
    optimalHour: 18,
  },

  // ═══ صور أفقية (16:9) — Tweets & Covers ═══
  {
    platform: 'Twitter/X Tweet',
    captionKey: 'twitter',
    mediaType: 'image',
    imageFormat: 'landscape',
    metricoolNetwork: 'twitter',
    optimalHour: 12,
  },
  {
    platform: 'LinkedIn Post',
    captionKey: 'linkedin',
    mediaType: 'image',
    imageFormat: 'landscape',
    metricoolNetwork: 'linkedin',
    platformData: { linkedinData: {} },
    optimalHour: 8,
  },
  {
    platform: 'Pinterest Pin',
    captionKey: 'pinterest',
    mediaType: 'image',
    imageFormat: 'story',
    metricoolNetwork: 'pinterest',
    platformData: { pinterestData: { newPinFormat: true } },
    optimalHour: 21,
  },


  // ═══ فيديو عمودي (9:16) ═══
  {
    platform: 'Instagram Reels',
    captionKey: 'instagram_reels',
    videoCaptionKey: 'instagram_reels',
    mediaType: 'video',
    imageFormat: 'story',
    videoFormat: 'vertical',
    metricoolNetwork: 'instagram',
    platformData: { instagramData: { autoPublish: true, type: 'REELS' } },
    optimalHour: 21,
  },
  {
    platform: 'TikTok Video',
    captionKey: 'tiktok_video',
    videoCaptionKey: 'tiktok_video',
    mediaType: 'video',
    imageFormat: 'story',
    videoFormat: 'vertical',
    metricoolNetwork: 'tiktok',
    platformData: { tiktokData: {} },
    optimalHour: 22,
  },
  {
    platform: 'YouTube Shorts',
    captionKey: 'youtube_shorts_video',
    videoCaptionKey: 'youtube_shorts_video',
    mediaType: 'video',
    imageFormat: 'story',
    videoFormat: 'vertical',
    metricoolNetwork: 'youtube',
    platformData: {
      youtubeData: {
        privacy: 'PUBLIC',
        madeForKids: false,
        type: 'SHORT',
        category: '22',
      },
    },
    optimalHour: 17,
  },
  {
    platform: 'Facebook Reels',
    captionKey: 'facebook_stories_video',
    videoCaptionKey: 'facebook_stories_video',
    mediaType: 'video',
    imageFormat: 'story',
    videoFormat: 'vertical',
    metricoolNetwork: 'facebook',
    platformData: { facebookData: { type: 'REEL' } },
    optimalHour: 19,
  },

  // ═══ فيديو أفقي (16:9) ═══
  {
    platform: 'YouTube Video',
    captionKey: 'youtube_video',
    videoCaptionKey: 'youtube_video',
    mediaType: 'video',
    imageFormat: 'landscape',
    videoFormat: 'horizontal',
    metricoolNetwork: 'youtube',
    platformData: {
      youtubeData: {
        privacy: 'PUBLIC',
        madeForKids: false,
        type: 'VIDEO',
        category: '22',
      },
    },
    optimalHour: 17,
  },
  {
    platform: 'Twitter/X Video',
    captionKey: 'twitter_video',
    videoCaptionKey: 'twitter_video',
    mediaType: 'video',
    imageFormat: 'landscape',
    videoFormat: 'horizontal',
    metricoolNetwork: 'twitter',
    platformData: {},
    optimalHour: 13,
  },
  {
    platform: 'LinkedIn Video',
    captionKey: 'linkedin_video',
    videoCaptionKey: 'linkedin_video',
    mediaType: 'video',
    imageFormat: 'landscape',
    videoFormat: 'horizontal',
    metricoolNetwork: 'linkedin',
    platformData: { linkedinData: {} },
    optimalHour: 9,
  },
  {
    platform: 'Facebook Video',
    captionKey: 'facebook_video',
    videoCaptionKey: 'facebook_video',
    mediaType: 'video',
    imageFormat: 'post',
    videoFormat: 'horizontal',
    metricoolNetwork: 'facebook',
    platformData: { facebookData: { type: 'POST' } },
    optimalHour: 19,
  },
];

// ── أوقات النشر المثالية — دائماً في المستقبل ────────────────────────────────
function getOptimalDateTime(hour: number, offsetMinutes: number = 0): {
  dateTime: string;
  timezone: string;
} {
  const now = new Date();
  const saudiOffset = 3 * 60;
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
  const saudiNow = new Date(utcNow + (saudiOffset * 60000));

  const scheduled = new Date(saudiNow);
  scheduled.setHours(hour, offsetMinutes, 0, 0);

  // إذا الوقت فات، جدوله لبكرة
  if (scheduled.getTime() <= saudiNow.getTime()) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  const year = scheduled.getFullYear();
  const month = String(scheduled.getMonth() + 1).padStart(2, '0');
  const day = String(scheduled.getDate()).padStart(2, '0');
  const hours = String(scheduled.getHours()).padStart(2, '0');
  const minutes = String(scheduled.getMinutes()).padStart(2, '0');
  const seconds = String(scheduled.getSeconds()).padStart(2, '0');

  return {
    dateTime: `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`,
    timezone: 'Asia/Riyadh',
  };
}

// ── رفع الوسائط إلى Metricool ────────────────────────────────────────────────
async function uploadMediaToMetricool(
  mediaUrl: string,
  token: string,
  blogId: string
): Promise<string> {
  if (!mediaUrl) return '';

  try {
    const normalizeUrl = `${METRICOOL_V1_BASE}/actions/normalize/image/url?url=${encodeURIComponent(mediaUrl)}&blogId=${blogId}`;
    const res = await fetch(normalizeUrl, {
      headers: { 'X-Mc-Auth': token },
    });

    if (res.ok) {
      const data = await res.json();
      const normalizedUrl = typeof data === 'string' ? data : (data.url || data.normalizedUrl || '');
      if (normalizedUrl) return normalizedUrl;
    }

    return mediaUrl;
  } catch {
    return mediaUrl;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// POST Handler — النشر الذكي V6
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const diagnostics: string[] = [];

  try {
    const body = await req.json();
    const {
      perfumeName,
      perfumeBrand,
      productUrl,
      captions,          // كابشنات الصور (PlatformCaptions)
      videoCaptions,     // كابشنات الفيديو
      imageUrls,         // { story, post, landscape }
      videoUrls,         // { vertical, horizontal }
      hashtags,          // هاشتاقات لكل منصة
      platforms,         // المنصات المطلوبة (اختياري — إذا فارغ ينشر على الكل)
      bestTimes,         // أوقات مخصصة (اختياري)
      publishImages,     // هل ينشر الصور (default: true)
      publishVideos,     // هل ينشر الفيديوهات (default: true)
    } = body;

    diagnostics.push('Request received — Smart Publish V6');

    // ── جلب Token ──
    const serverCreds = getServerCredentials();

    if (!serverCreds.token) {
      return NextResponse.json({
        error: 'METRICOOL_API_TOKEN غير موجود — أضفه في Vercel Environment Variables',
        diagnostics,
      }, { status: 400 });
    }

    diagnostics.push(`Token found (length: ${serverCreds.token.length})`);

    // ── جلب blogId ──
    const { blogId, userId } = await ensureBlogId(serverCreds.token, serverCreds.blogId);

    if (!blogId) {
      return NextResponse.json({
        error: 'لم نتمكن من جلب blogId — تأكد من صحة Token أو أضف METRICOOL_BLOG_ID',
        diagnostics,
      }, { status: 400 });
    }

    const finalUserId = serverCreds.userId || userId;
    diagnostics.push(`blogId: ${blogId}`);

    // ══════════════════════════════════════════════════════════════════
    // تحويل جميع صور base64 إلى URLs عامة
    // ══════════════════════════════════════════════════════════════════
    const convertedImageUrls: Record<string, string> = {};
    if (imageUrls) {
      for (const [key, url] of Object.entries(imageUrls)) {
        if (url && typeof url === 'string') {
          if (isBase64(url as string)) {
            try {
              const publicUrl = await convertBase64ToPublicUrl(url as string);
              convertedImageUrls[key] = publicUrl;
              diagnostics.push(`image.${key}: ${isBase64(publicUrl) ? 'FAILED' : 'converted'}`);
            } catch {
              convertedImageUrls[key] = url as string;
            }
          } else {
            convertedImageUrls[key] = url as string;
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // تحديد المنصات المطلوبة
    // ══════════════════════════════════════════════════════════════════
    const METRICOOL_NETWORKS = ['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin', 'youtube', 'pinterest'];

    const doPublishImages = publishImages !== false;
    const doPublishVideos = publishVideos !== false;

    // فلترة الأهداف حسب الطلب
    let targets = PUBLISH_TARGETS.filter(t => {
      // فلترة حسب نوع المحتوى
      if (t.mediaType === 'image' && !doPublishImages) return false;
      if (t.mediaType === 'video' && !doPublishVideos) return false;

      // فلترة حسب توفر الوسائط — تجاهل الفيديو إذا لم يكتمل التوليد
      if (t.mediaType === 'video') {
        if (t.videoFormat === 'vertical') {
          const vUrl = videoUrls?.vertical;
          if (!vUrl || vUrl.trim() === '') {
            diagnostics.push(`${t.platform}: SKIP — vertical video not ready`);
            return false;
          }
        }
        if (t.videoFormat === 'horizontal') {
          const hUrl = videoUrls?.horizontal;
          if (!hUrl || hUrl.trim() === '') {
            diagnostics.push(`${t.platform}: SKIP — horizontal video not ready`);
            return false;
          }
        }
      }

      if (t.mediaType === 'image') {
        if (!convertedImageUrls[t.imageFormat]) {
          diagnostics.push(`${t.platform}: SKIP — image format ${t.imageFormat} not available`);
          return false;
        }
      }

      // فلترة حسب المنصات المطلوبة (إذا محددة)
      if (platforms && Array.isArray(platforms) && platforms.length > 0) {
        const requestedNetworks = platforms.map((p: string) => p.toLowerCase());
        if (!requestedNetworks.includes(t.metricoolNetwork)) return false;
      }

      // فلترة حسب المنصات المدعومة في Metricool
      if (!METRICOOL_NETWORKS.includes(t.metricoolNetwork)) return false;

      return true;
    });

    diagnostics.push(`Total publish targets: ${targets.length}`);
    diagnostics.push(`Images: ${doPublishImages ? 'YES' : 'NO'}, Videos: ${doPublishVideos ? 'YES' : 'NO'}`);

    if (targets.length === 0) {
      return NextResponse.json({
        error: 'لا توجد أهداف نشر متاحة — تأكد من توفر الصور/الفيديوهات والمنصات',
        diagnostics,
      }, { status: 400 });
    }

    // ══════════════════════════════════════════════════════════════════
    // GROUP targets by dateTime → merge into unified payloads
    // FIX: Previously created separate rows/payloads per platform for
    // the same date/time. Now we group by dateTime and merge providers.
    // ══════════════════════════════════════════════════════════════════
    const results: Array<{
      platform: string;
      type: string;
      success: boolean;
      postId?: string;
      scheduledTime?: string;
      error?: string;
    }> = [];

    // Step A: Build target entries with their resolved dateTime
    interface ResolvedTarget {
      target: PublishTarget;
      dateTime: string;
      timezone: string;
      mediaUrl: string;
      caption: string;
    }

    const resolvedTargets: ResolvedTarget[] = [];
    const platformTimeOffset: Record<string, number> = {};

    // دمج الكابشنات مرة واحدة خارج الحلقة
    const allCaptions: Record<string, string> = { ...(captions || {}), ...(videoCaptions || {}) };

    // تحويل الهاشتاقات إلى نص
    const hashtagText = Array.isArray(hashtags)
      ? hashtags.join(' ')
      : (typeof hashtags === 'string' ? hashtags : '');

    for (const target of targets) {
      // Choose caption — safe fallback to empty string ""
      const allCaptions = { ...captions, ...videoCaptions };
      const rawCaption = allCaptions?.[target.captionKey]
        || allCaptions?.[target.videoCaptionKey || '']
        || captions?.instagram_post
        || captions?.facebook_post
        || `عطر ${perfumeName || ''} من ${perfumeBrand || ''} — اكتشف الفخامة مع مهووس ستور`;

      // Choose media — safe fallback to ""
      let mediaUrl = '';
      if (target.mediaType === 'video') {
        mediaUrl = target.videoFormat === 'vertical'
          ? (videoUrls?.vertical || '')
          : (videoUrls?.horizontal || '');
      } else {
        mediaUrl = convertedImageUrls[target.imageFormat] || '';
      }

      if (!mediaUrl) {
        diagnostics.push(`${target.platform}: SKIP — no media available`);
        continue;
      }

      // Normalize media
      let normalizedMedia = mediaUrl;
      if (!isBase64(mediaUrl)) {
        try {
          normalizedMedia = await uploadMediaToMetricool(mediaUrl, serverCreds.token, blogId);
        } catch {
          normalizedMedia = mediaUrl;
        }
      }

      // Determine scheduling time (stagger same network by 15 min)
      const offset = platformTimeOffset[target.metricoolNetwork] || 0;
      platformTimeOffset[target.metricoolNetwork] = offset + 15;

      const customHour = bestTimes?.[target.metricoolNetwork]
        ? parseInt(bestTimes[target.metricoolNetwork].split(':')[0], 10)
        : target.optimalHour;

      const { dateTime, timezone } = getOptimalDateTime(customHour, offset);

      resolvedTargets.push({
        target,
        dateTime,
        timezone,
        mediaUrl: normalizedMedia || '',
        caption: rawCaption || '',
      });
    }

    // Step B: Send each target individually with its own caption
    diagnostics.push(`Publishing ${resolvedTargets.length} targets individually`);

    for (const rt of resolvedTargets) {
      try {
        // كل منصة تحصل على كابشنها الخاص
        const baseCaption = rt.caption || '';
        const primaryCaption = hashtagText && !baseCaption.includes(hashtagText.split(' ')[0])
          ? `${baseCaption}\n\n${hashtagText}`
          : baseCaption;

        // Build provider — providers يقبل فقط { network } بدون أي fields إضافية
        const providerObj: Record<string, unknown> = { network: rt.target.metricoolNetwork };

        // بيانات المنصة تُضاف في مستوى الـ payload الرئيسي (وليس داخل providers)
        const platformSpecificData: Record<string, unknown> = {};

        if (rt.target.platformData) {
          for (const [key, val] of Object.entries(rt.target.platformData)) {
            // instagramData → instagramData في الـ payload الرئيسي
            platformSpecificData[key] = val;
          }
        }

        // YouTube specific — في الـ payload الرئيسي
        if (rt.target.metricoolNetwork === 'youtube') {
          const ytData: Record<string, unknown> = platformSpecificData.youtubeData as Record<string, unknown> || {};
          ytData.title = `${perfumeName || ''} | ${perfumeBrand || ''} | مهووس ستور`;
          ytData.privacy = 'PUBLIC';
          ytData.madeForKids = false;
          ytData.type = rt.target.platform.includes('Shorts') ? 'SHORT' : 'VIDEO';
          ytData.category = '22';
          const hashtagArr = hashtags || [];
          ytData.tags = (Array.isArray(hashtagArr) ? hashtagArr : []).map((h: string) => h.replace('#', '')).slice(0, 10);
          platformSpecificData.youtubeData = ytData;
        }

        // Pinterest specific — في الـ payload الرئيسي
        if (rt.target.metricoolNetwork === 'pinterest') {
          const pinData: Record<string, unknown> = platformSpecificData.pinterestData as Record<string, unknown> || {};
          pinData.destinationLink = productUrl || '';
          pinData.title = `${perfumeName || ''} by ${perfumeBrand || ''}`;
          pinData.newPinFormat = true;
          platformSpecificData.pinterestData = pinData;
        }

        // نشر فوري — الوقت = الآن + 2 دقيقة (Metricool يحتاج وقت مستقبلي)
        const now = new Date();
        now.setMinutes(now.getMinutes() + 2);
        const saudiOffset = 3 * 60 * 60 * 1000;
        const saudiTime = new Date(now.getTime() + saudiOffset + (now.getTimezoneOffset() * 60000));
        const publishDateTime = `${saudiTime.getFullYear()}-${String(saudiTime.getMonth() + 1).padStart(2, '0')}-${String(saudiTime.getDate()).padStart(2, '0')}T${String(saudiTime.getHours()).padStart(2, '0')}:${String(saudiTime.getMinutes()).padStart(2, '0')}:00`;

        const scheduledPost: Record<string, unknown> = {
          publicationDate: { dateTime: publishDateTime, timezone: 'Asia/Riyadh' },
          text: primaryCaption,
          providers: [providerObj],
          autoPublish: true,
          saveExternalMediaFiles: true,
          shortener: false,
          draft: false,
          media: rt.mediaUrl ? [rt.mediaUrl] : [],
          // بيانات المنصات في المستوى الرئيسي (وليس داخل providers)
          ...platformSpecificData,
        };

        console.log(`[Smart Publish V8] ${rt.target.platform} → POST (${publishDateTime})`);

        const url = `${METRICOOL_V2_BASE}/scheduler/posts?blogId=${blogId}${finalUserId ? `&userId=${finalUserId}` : ''}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Mc-Auth': serverCreds.token,
          },
          body: JSON.stringify(scheduledPost),
        });

        const responseText = await response.text();

        if (response.ok) {
          let apiResult;
          try { apiResult = JSON.parse(responseText); } catch { apiResult = {}; }
          results.push({
            platform: rt.target.platform,
            type: rt.target.mediaType,
            success: true,
            postId: apiResult.id || apiResult.postId || 'published',
            scheduledTime: publishDateTime,
          });
          diagnostics.push(`${rt.target.platform}: SUCCESS at ${publishDateTime}`);
        } else {
          results.push({
            platform: rt.target.platform,
            type: rt.target.mediaType,
            success: false,
            error: `HTTP ${response.status}: ${responseText.substring(0, 300)}`,
          });
          diagnostics.push(`${rt.target.platform}: FAILED — ${response.status}: ${responseText.substring(0, 100)}`);
        }

        // تأخير بين الطلبات لتجنب rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (targetError) {
        results.push({
          platform: rt.target.platform,
          type: rt.target.mediaType,
          success: false,
          error: targetError instanceof Error ? targetError.message : 'خطأ غير معروف',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const imageResults = results.filter(r => r.type === 'image');
    const videoResults = results.filter(r => r.type === 'video');

    return NextResponse.json({
      success: successCount > 0,
      message: successCount > 0
        ? `تم جدولة ${successCount} منشور بنجاح${failCount > 0 ? ` (${failCount} فشل)` : ''}`
        : 'فشل النشر على جميع المنصات',
      summary: {
        totalScheduled: successCount,
        totalFailed: failCount,
        imagesScheduled: imageResults.filter(r => r.success).length,
        videosScheduled: videoResults.filter(r => r.success).length,
      },
      results,
      diagnostics,
    });
  } catch (error) {
    console.error('[Smart Publish V6] Server error:', error);
    return NextResponse.json({
      error: 'خطأ في الخادم',
      details: error instanceof Error ? error.message : 'Unknown',
      diagnostics,
    }, { status: 500 });
  }
}
