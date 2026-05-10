// ============================================================
// lib/videoPlatformMap.ts — Video Platform Distribution Map v2
// Maps 2 generated videos → 9 platform usages
// ============================================================

import type { VideoPlatformUsage, VideoAspectRatio } from './types';

export const VIDEO_PLATFORM_MAP: VideoPlatformUsage[] = [
  // ── Vertical Video (9:16) ─────────────────────────────────────────────────
  {
    id: 'instagram_reels',
    platform: 'Instagram',
    platformAr: 'انستقرام',
    usage: 'Reels',
    usageAr: 'ريلز',
    aspectRatio: '9:16',
    icon: 'instagram',
    color: '#E1306C',
    captionKey: 'instagram_reels',
  },
  {
    id: 'tiktok_video',
    platform: 'TikTok',
    platformAr: 'تيك توك',
    usage: 'Video',
    usageAr: 'فيديو',
    aspectRatio: '9:16',
    icon: 'tiktok',
    color: '#010101',
    captionKey: 'tiktok_video',
  },
  {
    id: 'snapchat_video',
    platform: 'Snapchat',
    platformAr: 'سناب شات',
    usage: 'Spotlight / Story',
    usageAr: 'سبوتلايت / ستوري',
    aspectRatio: '9:16',
    icon: 'snapchat',
    color: '#FFFC00',
    captionKey: 'snapchat_video',
  },
  {
    id: 'youtube_shorts_video',
    platform: 'YouTube',
    platformAr: 'يوتيوب',
    usage: 'Shorts',
    usageAr: 'شورتس',
    aspectRatio: '9:16',
    icon: 'youtube',
    color: '#FF0000',
    captionKey: 'youtube_shorts_video',
  },
  {
    id: 'facebook_stories_video',
    platform: 'Facebook',
    platformAr: 'فيسبوك',
    usage: 'Stories / Reels',
    usageAr: 'ستوريز / ريلز',
    aspectRatio: '9:16',
    icon: 'facebook',
    color: '#1877F2',
    captionKey: 'facebook_stories_video',
  },

  // ── Horizontal Video (16:9) ───────────────────────────────────────────────
  {
    id: 'youtube_video',
    platform: 'YouTube',
    platformAr: 'يوتيوب',
    usage: 'Video',
    usageAr: 'فيديو',
    aspectRatio: '16:9',
    icon: 'youtube',
    color: '#FF0000',
    captionKey: 'youtube_video',
  },
  {
    id: 'twitter_video',
    platform: 'Twitter / X',
    platformAr: 'تويتر / إكس',
    usage: 'Video Tweet',
    usageAr: 'تغريدة فيديو',
    aspectRatio: '16:9',
    icon: 'twitter',
    color: '#1DA1F2',
    captionKey: 'twitter_video',
  },
  {
    id: 'linkedin_video',
    platform: 'LinkedIn',
    platformAr: 'لينكد إن',
    usage: 'Video Post',
    usageAr: 'بوست فيديو',
    aspectRatio: '16:9',
    icon: 'linkedin',
    color: '#0A66C2',
    captionKey: 'linkedin_video',
  },
  {
    id: 'facebook_video',
    platform: 'Facebook',
    platformAr: 'فيسبوك',
    usage: 'Video Post',
    usageAr: 'بوست فيديو',
    aspectRatio: '16:9',
    icon: 'facebook',
    color: '#1877F2',
    captionKey: 'facebook_video',
  },
];

// Group video platforms by aspect ratio
export function groupVideoByAspectRatio(
  map: VideoPlatformUsage[]
): Record<VideoAspectRatio, VideoPlatformUsage[]> {
  return {
    '9:16': map.filter((p) => p.aspectRatio === '9:16'),
    '16:9': map.filter((p) => p.aspectRatio === '16:9'),
  };
}
