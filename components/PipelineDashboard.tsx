'use client';

import { useState } from 'react';
import {
  Image, Video, FileText, Send, Download, Package,
  CheckCircle2, Eye, Grid3X3, LayoutList,
} from 'lucide-react';
import type { GeneratedImage, PlatformCaptions, VideoPlatformCaptions, HedraVideoInfo } from '@/lib/types';
import type { DistributionPackage, ABTestResult, MontageResult } from '@/lib/pipeline/pipelineTypes';

interface PipelineDashboardProps {
  perfumeName: string;
  perfumeBrand: string;
  images: GeneratedImage[];
  videos: HedraVideoInfo[];
  captions: PlatformCaptions | null;
  videoCaptions: VideoPlatformCaptions | null;
  montages: MontageResult[];
  abTests: ABTestResult[];
  distributionPackages: DistributionPackage[];
  onScheduleAll: () => void;
  onDownloadBundle: () => void;
}

// ── Platform Configuration ─────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, {
  name: string;
  nameAr: string;
  color: string;
  formats: Array<{ type: 'image' | 'video' | 'montage'; ratio: '9:16' | '1:1' | '16:9'; label: string }>;
}> = {
  instagram: {
    name: 'Instagram', nameAr: 'انستقرام', color: '#E4405F',
    formats: [
      { type: 'image', ratio: '9:16', label: 'ستوري صورة' },
      { type: 'image', ratio: '1:1', label: 'بوست مربع' },
      { type: 'video', ratio: '9:16', label: 'ريلز فيديو' },
    ],
  },
  facebook: {
    name: 'Facebook', nameAr: 'فيسبوك', color: '#1877F2',
    formats: [
      { type: 'image', ratio: '1:1', label: 'بوست مربع' },
      { type: 'video', ratio: '9:16', label: 'ريلز فيديو' },
      { type: 'image', ratio: '9:16', label: 'ستوري صورة' },
    ],
  },
  tiktok: {
    name: 'TikTok', nameAr: 'تيك توك', color: '#000000',
    formats: [
      { type: 'video', ratio: '9:16', label: 'فيديو عمودي' },
      { type: 'image', ratio: '9:16', label: 'صورة عمودية' },
    ],
  },
  twitter: {
    name: 'Twitter/X', nameAr: 'تويتر', color: '#1DA1F2',
    formats: [
      { type: 'image', ratio: '16:9', label: 'صورة أفقية' },
      { type: 'video', ratio: '16:9', label: 'فيديو أفقي' },
    ],
  },
  youtube: {
    name: 'YouTube', nameAr: 'يوتيوب', color: '#FF0000',
    formats: [
      { type: 'video', ratio: '9:16', label: 'شورتس' },
      { type: 'video', ratio: '16:9', label: 'فيديو طويل' },
      { type: 'image', ratio: '16:9', label: 'صورة مصغرة' },
    ],
  },
  linkedin: {
    name: 'LinkedIn', nameAr: 'لينكدإن', color: '#0A66C2',
    formats: [
      { type: 'image', ratio: '16:9', label: 'بوست أفقي' },
      { type: 'video', ratio: '16:9', label: 'فيديو أفقي' },
    ],
  },
  snapchat: {
    name: 'Snapchat', nameAr: 'سناب شات', color: '#FFFC00',
    formats: [
      { type: 'image', ratio: '9:16', label: 'ستوري صورة' },
      { type: 'video', ratio: '9:16', label: 'ستوري فيديو' },
    ],
  },
  pinterest: {
    name: 'Pinterest', nameAr: 'بنترست', color: '#BD081C',
    formats: [
      { type: 'image', ratio: '9:16', label: 'بن عمودي' },
    ],
  },
  threads: {
    name: 'Threads', nameAr: 'ثريدز', color: '#000000',
    formats: [
      { type: 'image', ratio: '1:1', label: 'بوست مربع' },
    ],
  },
  telegram: {
    name: 'Telegram', nameAr: 'تيليقرام', color: '#26A5E4',
    formats: [
      { type: 'image', ratio: '1:1', label: 'بوست' },
      { type: 'video', ratio: '9:16', label: 'فيديو' },
    ],
  },
  haraj: {
    name: 'Haraj', nameAr: 'حراج', color: '#2ECC71',
    formats: [
      { type: 'image', ratio: '1:1', label: 'صورة المنتج' },
    ],
  },
};

export default function PipelineDashboard({
  perfumeName,
  perfumeBrand,
  images,
  videos,
  captions,
  videoCaptions,
  montages,
  abTests,
  distributionPackages,
  onScheduleAll,
  onDownloadBundle,
}: PipelineDashboardProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(Object.keys(PLATFORM_CONFIG)));

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  const getAssetForFormat = (type: string, ratio: string) => {
    if (type === 'image') {
      const format = ratio === '9:16' ? 'story' : ratio === '1:1' ? 'post' : 'landscape';
      return images.find(i => i.format === format);
    }
    if (type === 'video') {
      return videos.find(v => v.aspectRatio === ratio && v.videoUrl);
    }
    return null;
  };

  const getCaptionForPlatform = (platformKey: string) => {
    if (!captions) return null;
    const captionMap: Record<string, string> = {
      instagram: 'instagram_post',
      facebook: 'facebook_post',
      tiktok: 'tiktok',
      twitter: 'twitter',
      youtube: 'youtube_thumbnail',
      linkedin: 'linkedin',
      snapchat: 'snapchat',
      pinterest: 'pinterest',
      threads: 'instagram_post',
      telegram: 'telegram',
      haraj: 'haraj',
    };
    const key = captionMap[platformKey];
    return key ? (captions as unknown as Record<string, string>)[key] : null;
  };

  const manualPlatforms = ['snapchat', 'telegram', 'haraj'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--gold)]">لوحة المراجعة والتوزيع</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {perfumeName} — {perfumeBrand} | {Object.keys(PLATFORM_CONFIG).length} منصة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'text-[var(--text-muted)]'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'text-[var(--text-muted)]'}`}
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>

      {/* Platform Cards */}
      <div className={viewMode === 'cards' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-2'}>
        {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => {
          const isSelected = selectedPlatforms.has(key);
          const isManual = manualPlatforms.includes(key);
          const caption = getCaptionForPlatform(key);

          return (
            <div
              key={key}
              className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-[var(--gold)]/40 bg-[var(--obsidian-light)]'
                  : 'border-[var(--obsidian-border)] opacity-50'
              }`}
              onClick={() => togglePlatform(key)}
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)]">{platform.nameAr}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isManual && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">يدوي</span>
                  )}
                  {isSelected && <CheckCircle2 size={14} className="text-green-400" />}
                </div>
              </div>

              {/* Format Tags */}
              <div className="px-3 pb-3 flex flex-wrap gap-1">
                {platform.formats.map((fmt, i) => {
                  const hasAsset = !!getAssetForFormat(fmt.type, fmt.ratio);
                  return (
                    <span
                      key={i}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        hasAsset
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-[var(--obsidian-border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {fmt.type === 'image' ? '📷' : '🎬'} {fmt.label}
                    </span>
                  );
                })}
              </div>

              {/* Caption Preview */}
              {caption && viewMode === 'cards' && (
                <div className="px-3 pb-3">
                  <p className="text-[9px] text-[var(--text-muted)] line-clamp-2" dir="rtl">{caption}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Distribution Packages */}
      {distributionPackages.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-[var(--gold)]" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">حزم التوزيع</h4>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {distributionPackages.map((pkg, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] text-center">
                <span className="text-lg">{pkg.format === '9:16' ? '📱' : pkg.format === '1:1' ? '⬜' : '🖥️'}</span>
                <p className="text-[10px] font-bold text-[var(--text-primary)] mt-1">{pkg.labelAr}</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{pkg.platforms.length} منصة</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {pkg.imageUrl && <Image size={10} className="text-green-400" />}
                  {pkg.videoUrl && <Video size={10} className="text-blue-400" />}
                  {pkg.caption && <FileText size={10} className="text-purple-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex gap-3">
        <button
          onClick={onScheduleAll}
          className="flex-1 btn-gold py-3 text-sm flex items-center justify-center gap-2 rounded-xl"
        >
          <Send size={16} />
          جدولة النشر عبر Metricool ({selectedPlatforms.size} منصة)
        </button>
        <button
          onClick={onDownloadBundle}
          className="px-6 py-3 text-sm rounded-xl border border-[var(--obsidian-border)] text-[var(--text-primary)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors flex items-center gap-2"
        >
          <Download size={16} />
          تحميل الحزمة
        </button>
      </div>
    </div>
  );
}
