// ============================================================
// lib/makeWebhook.ts — Make.com Webhook Integration v3
// إرسال مباشر: التطبيق → رفع الصور → Make.com Webhook → المنصات
// يرفع الصور base64 تلقائياً للحصول على URL عام قبل الإرسال
// ============================================================

import { QueuedPost } from './contentQueue';

// ── حدود الأحرف لكل منصة ─────────────────────────────────────
export const PLATFORM_LIMITS: Record<string, { maxChars: number; label: string }> = {
  instagram: { maxChars: 2200, label: 'انستقرام' },
  facebook:  { maxChars: 33000, label: 'فيسبوك' },
  twitter:   { maxChars: 280, label: 'تويتر/X' },
  linkedin:  { maxChars: 3000, label: 'لينكدإن' },
  tiktok:    { maxChars: 2200, label: 'تيك توك' },
  youtube:   { maxChars: 5000, label: 'يوتيوب' },
  pinterest: { maxChars: 500, label: 'بنترست' },
  telegram:  { maxChars: 4096, label: 'تيليجرام' },
  snapchat:  { maxChars: 80, label: 'سناب شات' },
};

// ── قص النص حسب حد الأحرف ─────────────────────────────────────
function trimToLimit(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text;
  const trimmed = text.substring(0, maxChars - 3);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > maxChars * 0.7 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
}

// ── رفع صورة base64 للحصول على URL عام ──────────────────────
async function uploadBase64Image(base64Url: string, name: string): Promise<string> {
  if (!base64Url || !base64Url.startsWith('data:image')) {
    return base64Url; // ليست base64 — ارجعها كما هي (URL عادي)
  }

  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Url, name }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url && !data.url.startsWith('data:')) {
        console.log(`[makeWebhook] Image uploaded: ${name} → ${data.provider}`);
        return data.url;
      }
    }
  } catch (err) {
    console.warn(`[makeWebhook] Failed to upload ${name}:`, err);
  }

  return base64Url; // fallback
}

// ── Webhook URL ─────────────────────────────────────────────
const WEBHOOK_URL_KEY = 'mahwous_make_webhook_url';
const DEFAULT_WEBHOOK_URL = 'https://hook.eu2.make.com/kam6szq27bvdtcyux5wqqlek5a743etq';

export function getWebhookUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_WEBHOOK_URL;
  return localStorage.getItem(WEBHOOK_URL_KEY) || DEFAULT_WEBHOOK_URL;
}

export function setWebhookUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WEBHOOK_URL_KEY, url.trim());
}

export function isWebhookConfigured(): boolean {
  const url = getWebhookUrl();
  return url.length > 0 && url.startsWith('https://hook.');
}

// ── إرسال منشور واحد إلى Make.com → المنصات مباشرة ──────────
export async function sendToMakeWebhook(post: QueuedPost): Promise<{
  success: boolean;
  message: string;
}> {
  const webhookUrl = getWebhookUrl();
  
  if (!webhookUrl) {
    return {
      success: false,
      message: 'لم يتم إعداد رابط Make.com Webhook. أضف الرابط في الإعدادات.',
    };
  }

  try {
    // ── الخطوة 1: رفع الصور base64 للحصول على URL عام ──
    const perfumeName = (post.perfumeName || 'perfume').replace(/\s+/g, '_');
    
    const [storyUrl, postUrl, landscapeUrl] = await Promise.all([
      uploadBase64Image(post.storyImageUrl || '', `${perfumeName}_story`),
      uploadBase64Image(post.postImageUrl || '', `${perfumeName}_post`),
      uploadBase64Image(post.landscapeImageUrl || '', `${perfumeName}_landscape`),
    ]);

    // ── الخطوة 2: تجهيز الكابشنات ──
    const igCaption = post.captions?.instagram_post || post.captions?.instagram_story || '';
    const fbCaption = post.captions?.facebook_post || post.captions?.facebook_story || '';
    const twCaption = post.captions?.twitter || '';
    const liCaption = post.captions?.linkedin || '';
    const tkCaption = post.captions?.tiktok || post.videoCaptions?.tiktok_video || '';
    const ytCaption = post.captions?.youtube_thumbnail || post.videoCaptions?.youtube_video || '';
    const piCaption = post.captions?.pinterest || '';
    const tgCaption = post.captions?.whatsapp || '';
    const scCaption = post.captions?.snapchat || '';

    // ── الخطوة 3: إرسال البيانات إلى Make.com ──
    const payload = {
      perfumeName: post.perfumeName || '',
      perfumeBrand: post.perfumeBrand || '',
      productUrl: post.productUrl || '',

      // صور بـ URL عام (مرفوعة)
      storyImageUrl: storyUrl,
      postImageUrl: postUrl,
      landscapeImageUrl: landscapeUrl,

      // فيديو
      verticalVideoUrl: post.verticalVideoUrl || '',
      horizontalVideoUrl: post.horizontalVideoUrl || '',

      mediaType: (post.verticalVideoUrl || post.horizontalVideoUrl) ? 'video' : 'image',

      // كابشنات مقصوصة حسب حد كل منصة
      instagramCaption: trimToLimit(igCaption, PLATFORM_LIMITS.instagram.maxChars),
      facebookCaption: trimToLimit(fbCaption, PLATFORM_LIMITS.facebook.maxChars),
      twitterCaption: trimToLimit(twCaption, PLATFORM_LIMITS.twitter.maxChars),
      linkedinCaption: trimToLimit(liCaption, PLATFORM_LIMITS.linkedin.maxChars),
      tiktokCaption: trimToLimit(tkCaption, PLATFORM_LIMITS.tiktok.maxChars),
      youtubeCaption: trimToLimit(ytCaption, PLATFORM_LIMITS.youtube.maxChars),
      pinterestCaption: trimToLimit(piCaption, PLATFORM_LIMITS.pinterest.maxChars),
      telegramCaption: trimToLimit(tgCaption, PLATFORM_LIMITS.telegram.maxChars),
      snapchatCaption: trimToLimit(scCaption, PLATFORM_LIMITS.snapchat.maxChars),

      // أعلام النشر
      postToInstagram: post.platforms.includes('instagram') ? 'TRUE' : 'FALSE',
      postToFacebook: post.platforms.includes('facebook') ? 'TRUE' : 'FALSE',
      postToTwitter: post.platforms.includes('twitter') ? 'TRUE' : 'FALSE',
      postToLinkedIn: post.platforms.includes('linkedin') ? 'TRUE' : 'FALSE',
      postToTikTok: post.platforms.includes('tiktok') ? 'TRUE' : 'FALSE',
      postToYouTube: post.platforms.includes('youtube') ? 'TRUE' : 'FALSE',
      postToPinterest: post.platforms.includes('pinterest') ? 'TRUE' : 'FALSE',
      postToTelegram: post.platforms.includes('telegram') ? 'TRUE' : 'FALSE',
      postToSnapchat: post.platforms.includes('snapchat') ? 'TRUE' : 'FALSE',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // تحقق هل الصور رُفعت بنجاح
      const hasPublicImages = !postUrl.startsWith('data:');
      return {
        success: true,
        message: hasPublicImages 
          ? 'تم إرسال المنشور إلى Make.com — جاري النشر على المنصات'
          : 'تم الإرسال لكن الصور لم تُرفع كـ URL عام — Instagram قد لا يعمل. أضف IMGBB_API_KEY',
      };
    } else {
      return {
        success: false,
        message: `خطأ من Make.com: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `خطأ في الاتصال: ${error instanceof Error ? error.message : 'غير معروف'}`,
    };
  }
}

// ── إرسال عدة منشورات دفعة واحدة ───────────────────────────
export async function sendBatchToMakeWebhook(posts: QueuedPost[]): Promise<{
  total: number;
  success: number;
  failed: number;
  results: Array<{ postId: string; perfumeName: string; success: boolean; message: string }>;
}> {
  const results: Array<{ postId: string; perfumeName: string; success: boolean; message: string }> = [];
  let successCount = 0;
  let failedCount = 0;

  for (const post of posts) {
    const result = await sendToMakeWebhook(post);
    results.push({
      postId: post.id,
      perfumeName: post.perfumeName,
      success: result.success,
      message: result.message,
    });
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
    if (posts.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return {
    total: posts.length,
    success: successCount,
    failed: failedCount,
    results,
  };
}
