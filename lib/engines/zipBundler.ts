// ============================================================
// lib/engines/zipBundler.ts — ZIP Bundle Generator
// حزم التحميل — 3 مقاسات + كابشنات + ميتاداتا
// ============================================================

import type { DistributionPackage, ZipBundle } from '../pipeline/pipelineTypes';
import type { PerfumeData, GeneratedImage, PlatformCaptions, VideoPlatformCaptions } from '../types';

// ── Distribution Package Builder ───────────────────────────────────────────

export function buildDistributionPackages(params: {
  images: GeneratedImage[];
  captions: PlatformCaptions | null;
  videoCaptions: VideoPlatformCaptions | null;
  videoUrls?: { vertical?: string; horizontal?: string };
  montageUrls?: { vertical?: string; square?: string; horizontal?: string };
  abVariants?: Record<string, { variantA: string; variantB: string }>;
}): DistributionPackage[] {
  const packages: DistributionPackage[] = [];

  // ── 9:16 Vertical Package ─────────────────────────────────
  const storyImage = params.images.find(i => i.format === 'story');
  if (storyImage) {
    const verticalCaptions: Record<string, string | undefined> = {
      instagram_story: params.captions?.instagram_story,
      snapchat: params.captions?.snapchat,
      tiktok: params.captions?.tiktok,
      youtube_shorts: params.captions?.youtube_shorts,
      facebook_story: params.captions?.facebook_story,
      whatsapp: params.captions?.whatsapp,
      pinterest: params.captions?.pinterest,
    };

    const primaryCaption = verticalCaptions.tiktok || verticalCaptions.instagram_story || '';

    packages.push({
      format: '9:16',
      label: 'Vertical (Stories/Reels/TikTok)',
      labelAr: 'عمودي (ستوري/ريلز/تيك توك)',
      imageUrl: storyImage.url,
      videoUrl: params.videoUrls?.vertical,
      montageVideoUrl: params.montageUrls?.vertical,
      caption: primaryCaption,
      captionVariantB: params.abVariants?.tiktok?.variantB,
      hashtags: ['#عطور', '#تيك_توك', '#ريلز', '#مهووس'],
      platforms: ['instagram_story', 'snapchat', 'tiktok', 'youtube_shorts', 'facebook_story', 'whatsapp', 'pinterest'],
    });
  }

  // ── 1:1 Square Package ────────────────────────────────────
  const postImage = params.images.find(i => i.format === 'post');
  if (postImage) {
    const squareCaptions: Record<string, string | undefined> = {
      instagram_post: params.captions?.instagram_post,
      facebook_post: params.captions?.facebook_post,
      telegram: params.captions?.telegram,
      haraj: params.captions?.haraj,
      truth_social: params.captions?.truth_social,
    };

    const primaryCaption = squareCaptions.instagram_post || squareCaptions.facebook_post || '';

    packages.push({
      format: '1:1',
      label: 'Square (Feed Posts)',
      labelAr: 'مربع (منشورات الفيد)',
      imageUrl: postImage.url,
      montageVideoUrl: params.montageUrls?.square,
      caption: primaryCaption,
      captionVariantB: params.abVariants?.instagram_post?.variantB,
      hashtags: ['#عطور', '#انستقرام', '#فيسبوك', '#مهووس'],
      platforms: ['instagram_post', 'facebook_post', 'telegram', 'haraj', 'truth_social'],
    });
  }

  // ── 16:9 Horizontal Package ───────────────────────────────
  const landscapeImage = params.images.find(i => i.format === 'landscape');
  if (landscapeImage) {
    const horizontalCaptions: Record<string, string | undefined> = {
      twitter: params.captions?.twitter,
      linkedin: params.captions?.linkedin,
      youtube_thumbnail: params.captions?.youtube_thumbnail,
    };

    const primaryCaption = horizontalCaptions.twitter || horizontalCaptions.linkedin || '';

    packages.push({
      format: '16:9',
      label: 'Horizontal (YouTube/Twitter/LinkedIn)',
      labelAr: 'أفقي (يوتيوب/تويتر/لينكدإن)',
      imageUrl: landscapeImage.url,
      videoUrl: params.videoUrls?.horizontal,
      montageVideoUrl: params.montageUrls?.horizontal,
      caption: primaryCaption,
      captionVariantB: params.abVariants?.twitter?.variantB,
      hashtags: ['#عطور', '#يوتيوب', '#لينكدإن', '#مهووس'],
      platforms: ['twitter', 'linkedin', 'youtube_thumbnail'],
    });
  }

  return packages;
}

// ── ZIP Bundle Manifest ────────────────────────────────────────────────────

export function createZipManifest(params: {
  perfumeData: PerfumeData;
  productUrl: string;
  packages: DistributionPackage[];
  captions: PlatformCaptions | null;
  videoCaptions: VideoPlatformCaptions | null;
}): ZipBundle {
  const images: string[] = [];
  const videos: string[] = [];

  params.packages.forEach(pkg => {
    if (pkg.imageUrl) images.push(pkg.imageUrl);
    if (pkg.videoUrl) videos.push(pkg.videoUrl);
    if (pkg.montageVideoUrl) videos.push(pkg.montageVideoUrl);
  });

  // Build captions text file content
  const captionsText = buildCaptionsFile(params.perfumeData, params.captions, params.videoCaptions);

  // Build metadata JSON
  const metadata = JSON.stringify({
    perfume: params.perfumeData,
    productUrl: params.productUrl,
    generatedAt: new Date().toISOString(),
    packages: params.packages.map(p => ({
      format: p.format,
      label: p.label,
      platforms: p.platforms,
      hasImage: !!p.imageUrl,
      hasVideo: !!p.videoUrl,
      hasMontage: !!p.montageVideoUrl,
    })),
  }, null, 2);

  return {
    id: `zip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    contents: {
      images,
      videos,
      captions: captionsText,
      metadata,
    },
    createdAt: new Date().toISOString(),
  };
}

// ── Build Captions File ────────────────────────────────────────────────────

function buildCaptionsFile(
  perfume: PerfumeData,
  captions: PlatformCaptions | null,
  videoCaptions: VideoPlatformCaptions | null
): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════════════');
  lines.push(`  كابشنات عطر: ${perfume.name}`);
  lines.push(`  العلامة التجارية: ${perfume.brand}`);
  lines.push(`  تاريخ التوليد: ${new Date().toLocaleDateString('ar-SA')}`);
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');

  if (captions) {
    lines.push('━━━ كابشنات الصور ━━━');
    lines.push('');

    const platformNames: Record<string, string> = {
      instagram_story: 'انستقرام ستوري',
      instagram_post: 'انستقرام بوست',
      snapchat: 'سناب شات',
      tiktok: 'تيك توك',
      twitter: 'تويتر/إكس',
      facebook_post: 'فيسبوك',
      facebook_story: 'فيسبوك ستوري',
      linkedin: 'لينكدإن',
      youtube_shorts: 'يوتيوب شورتس',
      youtube_thumbnail: 'يوتيوب',
      pinterest: 'بنترست',
      telegram: 'تيليقرام',
      whatsapp: 'واتساب',
      haraj: 'حراج',
      truth_social: 'تروث سوشال',
    };

    for (const [key, value] of Object.entries(captions)) {
      if (value && typeof value === 'string') {
        const name = platformNames[key] || key;
        lines.push(`▸ ${name}:`);
        lines.push(value);
        lines.push('─'.repeat(40));
        lines.push('');
      }
    }
  }

  if (videoCaptions) {
    lines.push('');
    lines.push('━━━ كابشنات الفيديو ━━━');
    lines.push('');

    for (const [key, value] of Object.entries(videoCaptions)) {
      if (value && typeof value === 'string') {
        lines.push(`▸ ${key.replace(/_/g, ' ')}:`);
        lines.push(value);
        lines.push('─'.repeat(40));
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

// ── Client-side ZIP Download ───────────────────────────────────────────────

export function downloadAllAssets(bundle: ZipBundle, perfumeName: string): void {
  if (typeof window === 'undefined') return;

  // Download images
  bundle.contents.images.forEach((url, i) => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${perfumeName}_image_${i + 1}.png`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  // Download videos
  bundle.contents.videos.forEach((url, i) => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${perfumeName}_video_${i + 1}.mp4`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  // Download captions text
  const captionsBlob = new Blob([bundle.contents.captions], { type: 'text/plain;charset=utf-8' });
  const captionsUrl = URL.createObjectURL(captionsBlob);
  const captionsLink = document.createElement('a');
  captionsLink.href = captionsUrl;
  captionsLink.download = `${perfumeName}_captions.txt`;
  document.body.appendChild(captionsLink);
  captionsLink.click();
  document.body.removeChild(captionsLink);
  URL.revokeObjectURL(captionsUrl);

  // Download metadata JSON
  const metaBlob = new Blob([bundle.contents.metadata], { type: 'application/json' });
  const metaUrl = URL.createObjectURL(metaBlob);
  const metaLink = document.createElement('a');
  metaLink.href = metaUrl;
  metaLink.download = `${perfumeName}_metadata.json`;
  document.body.appendChild(metaLink);
  metaLink.click();
  document.body.removeChild(metaLink);
  URL.revokeObjectURL(metaUrl);
}
