'use client';

// ============================================================
// components/VideoDisplay.tsx — v2 (MAHWOUS CONTENT ENGINE)
// Displays generated videos with per-video voiceover text,
// scenario name, hook, and platform-specific captions.
// ============================================================

import { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Video,
  AlertCircle,
  Mic,
  Zap,
  BookOpen,
} from 'lucide-react';
import type { HedraVideoInfo, VideoAspectRatio, VideoPlatformCaptions } from '@/lib/types';
import { VIDEO_PLATFORM_MAP, groupVideoByAspectRatio } from '@/lib/videoPlatformMap';

// ─── Props ──────────────────────────────────────────────────────────────────

interface VideoDisplayProps {
  videos: HedraVideoInfo[];
  captions: VideoPlatformCaptions | Record<string, string> | null;
  voiceoverText: string;
  perfumeName?: string;
}

// ─── Platform Icons ────────────────────────────────────────────────────────

function PlatformIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  const icons: Record<string, JSX.Element> = {
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    twitter: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    snapchat: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.166 2C9.44 2 7.3 3.23 6.3 5.14c-.5.93-.6 1.9-.6 2.86v1.5c-.3.1-.6.14-.9.14-.5 0-.8-.1-1-.2l-.1-.05-.1.05c-.2.1-.3.3-.3.5 0 .4.4.7.9.9.1.05.2.05.3.1-.1.3-.4.6-.9.8-.5.2-.8.5-.8.9 0 .3.2.6.5.8.1.05.2.1.3.1.4.1.8.2 1.2.4.1.05.2.1.3.2.1.1.1.2.1.3-.1.2-.3.4-.5.6-.3.3-.6.7-.6 1.2 0 .9.8 1.6 2.2 1.9.1.3.2.7.5.9.2.1.4.2.7.2.3 0 .6-.1.9-.2.5-.2 1-.3 1.5-.3.5 0 1 .1 1.5.3.3.1.6.2.9.2.3 0 .5-.1.7-.2.3-.2.4-.6.5-.9 1.4-.3 2.2-1 2.2-1.9 0-.5-.3-.9-.6-1.2-.2-.2-.4-.4-.5-.6 0-.1 0-.2.1-.3.1-.1.2-.15.3-.2.4-.2.8-.3 1.2-.4.1 0 .2-.05.3-.1.3-.2.5-.5.5-.8 0-.4-.3-.7-.8-.9-.5-.2-.8-.5-.9-.8.1-.05.2-.05.3-.1.5-.2.9-.5.9-.9 0-.2-.1-.4-.3-.5l-.1-.05-.1.05c-.2.1-.5.2-1 .2-.3 0-.6-.04-.9-.14v-1.5c0-.96-.1-1.93-.6-2.86C16.7 3.23 14.56 2 12.166 2z"/>
      </svg>
    ),
    tiktok: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
    youtube: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    linkedin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  };
  return icons[icon] || <span className="text-xs font-bold">{icon[0]?.toUpperCase()}</span>;
}

// ─── Caption Block ──────────────────────────────────────────────────────────

function CaptionBlock({ caption }: { caption: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const safeCaption = typeof caption === 'string' ? caption : String(caption ?? '');
  const isLong = safeCaption.length > 200;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(safeCaption).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!safeCaption || safeCaption === '—') return null;

  return (
    <div className="mt-3 bg-black/30 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)] font-mono">{safeCaption.length} حرف</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-[var(--obsidian-border)] text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'تم!' : 'نسخ'}
        </button>
      </div>
      <p className={`caption-text text-xs whitespace-pre-wrap leading-relaxed ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
        {safeCaption}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-[var(--gold)] hover:underline"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {expanded ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      )}
    </div>
  );
}

// ─── Voiceover Card (per-video) ─────────────────────────────────────────────

function VoiceoverCard({
  video,
  type,
}: {
  video: HedraVideoInfo;
  type: 'vertical' | 'horizontal';
}) {
  const [copied, setCopied] = useState(false);
  const text = video.voiceoverText || '';
  if (!text) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVertical = type === 'vertical';
  const Icon = isVertical ? Zap : BookOpen;
  const typeLabel = isVertical ? 'شبابي حماسي — تيك توك + ريلز' : 'ثقافي معلوماتي — يوتيوب';
  const scenarioLabel = video.scenarioName || (isVertical ? 'سيناريو شبابي' : 'سيناريو ثقافي');

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isVertical ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
            <Icon size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)]">{scenarioLabel}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{typeLabel}</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-[var(--obsidian-border)] text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'تم!' : 'نسخ النص'}
        </button>
      </div>

      {/* Hook */}
      {video.hook && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--gold)]/10 rounded-lg border border-[var(--gold)]/20">
          <Zap size={12} className="text-[var(--gold)] shrink-0" />
          <p className="text-xs text-[var(--gold)] font-medium">الهوك: {video.hook}</p>
        </div>
      )}

      {/* Voiceover Text */}
      <div className="flex items-start gap-2">
        <Mic size={14} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── Video Player Card ──────────────────────────────────────────────────────

function VideoPlayerCard({
  video,
  perfumeName,
}: {
  video: HedraVideoInfo;
  perfumeName: string;
}) {
  const isVertical = video.aspectRatio === '9:16';
  const label = isVertical ? 'الفيديو العمودي' : 'الفيديو الأفقي';
  const subtitle = isVertical
    ? '9:16 — Reels, TikTok, Shorts'
    : '16:9 — YouTube, Twitter, LinkedIn';

  const safeName = perfumeName.replace(/\s+/g, '-').toLowerCase();
  const filename = `mahwous-${safeName}-${isVertical ? 'vertical' : 'horizontal'}.mp4`;

  // Status states
  if (video.status === 'failed' || video.status === 'error') {
    return (
      <div className={`glass-card overflow-hidden ${isVertical ? 'max-w-[280px]' : 'max-w-[500px]'}`}>
        <div className="p-4 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-400">{label}</p>
            <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
          </div>
          <p className="text-xs text-red-400/80">{video.error || 'فشل توليد الفيديو'}</p>
        </div>
      </div>
    );
  }

  if (video.status === 'pending' || video.status === 'processing' || video.status === 'queued' || video.status === 'finalizing') {
    return (
      <div className={`glass-card overflow-hidden ${isVertical ? 'max-w-[280px]' : 'max-w-[500px]'}`}>
        <div className="p-6 text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
            <Video size={20} className="absolute inset-0 m-auto text-[var(--gold)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
            <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-[var(--obsidian)] rounded-full h-2">
              <div
                className="bg-[var(--gold)] h-2 rounded-full transition-all duration-500"
                style={{ width: `${video.progress || 5}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              {video.status === 'pending' || video.status === 'queued' ? 'في الانتظار...' :
               video.status === 'finalizing' ? 'جاري التجهيز النهائي...' :
               `جاري التوليد... ${video.progress || 0}%`}
              {video.eta_sec ? ` (${Math.ceil(video.eta_sec)}ث متبقية)` : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Complete — show video
  return (
    <div className={`glass-card overflow-hidden ${isVertical ? 'max-w-[280px]' : 'max-w-[500px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--obsidian-border)]">
        <div>
          <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{subtitle}</p>
        </div>
        {video.videoUrl && (
          <a
            href={video.videoUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg"
          >
            <Download size={10} />
            تحميل
          </a>
        )}
      </div>

      {/* Video Player */}
      <div className={`relative w-full ${isVertical ? 'aspect-[9/16]' : 'aspect-video'} bg-black`}>
        {video.videoUrl ? (
          <video
            src={video.videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
            poster=""
          >
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-[var(--text-muted)]">الفيديو غير متاح</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VideoDisplay({
  videos,
  captions,
  voiceoverText,
  perfumeName = 'perfume',
}: VideoDisplayProps) {
  const grouped = groupVideoByAspectRatio(VIDEO_PLATFORM_MAP);
  const captionsMap = (captions || {}) as Record<string, string>;

  // Find video by aspect ratio
  const getVideo = (ar: VideoAspectRatio): HedraVideoInfo | undefined => {
    return videos.find((v) => v.aspectRatio === ar);
  };

  const verticalVideo = getVideo('9:16');
  const horizontalVideo = getVideo('16:9');

  const allComplete = videos.every(
    (v) => v.status === 'complete' || v.status === 'failed' || v.status === 'error'
  );
  const anyProcessing = videos.some(
    (v) => v.status === 'pending' || v.status === 'processing' || v.status === 'queued' || v.status === 'finalizing'
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Processing indicator */}
      {anyProcessing && (
        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-[var(--gold)]/10 rounded-xl border border-[var(--gold)]/20">
          <Loader2 size={16} className="animate-spin text-[var(--gold)]" />
          <p className="text-sm text-[var(--gold)]">
            جاري توليد الفيديوهات... قد يستغرق الأمر 2-5 دقائق
          </p>
        </div>
      )}

      {/* Per-Video Voiceover Texts */}
      {(verticalVideo?.voiceoverText || horizontalVideo?.voiceoverText) ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="gold-divider flex-1" />
            <div className="text-center px-4">
              <p className="section-label mb-0 text-sm">نصوص التعليق الصوتي</p>
              <p className="text-[10px] text-[var(--text-muted)]">نص مختلف لكل فيديو — لهجة سعودية</p>
            </div>
            <div className="gold-divider flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verticalVideo && <VoiceoverCard video={verticalVideo} type="vertical" />}
            {horizontalVideo && <VoiceoverCard video={horizontalVideo} type="horizontal" />}
          </div>
        </div>
      ) : voiceoverText ? (
        /* Fallback: single voiceover text (legacy) */
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Mic size={16} className="text-[var(--gold)]" />
            <span className="text-xs font-medium text-[var(--text-primary)]">نص التعليق الصوتي</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{voiceoverText}</p>
        </div>
      ) : null}

      {/* Videos Grid */}
      <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
        {verticalVideo && (
          <VideoPlayerCard video={verticalVideo} perfumeName={perfumeName} />
        )}
        {horizontalVideo && (
          <VideoPlayerCard video={horizontalVideo} perfumeName={perfumeName} />
        )}
      </div>

      {/* Platform Distribution with Captions */}
      {allComplete && (
        <>
          {/* Vertical Platforms */}
          {verticalVideo?.status === 'complete' && verticalVideo.videoUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="gold-divider flex-1" />
                <div className="text-center px-4">
                  <p className="section-label mb-0 text-sm">الفيديو العمودي — المنصات</p>
                  <p className="text-[10px] text-[var(--text-muted)]">9:16 — محتوى شبابي حماسي</p>
                </div>
                <div className="gold-divider flex-1" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {grouped['9:16'].map((platform, i) => {
                  const caption = captionsMap[platform.captionKey] || '';
                  return (
                    <div
                      key={platform.id}
                      className="glass-card overflow-hidden animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--obsidian-border)]">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: platform.color + '22', color: platform.color }}
                        >
                          <PlatformIcon icon={platform.icon} size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                            {platform.platformAr}
                          </p>
                          <p className="text-[9px] text-[var(--text-muted)]">{platform.usageAr}</p>
                        </div>
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: platform.color + '22', color: platform.color }}
                        >
                          {platform.usage}
                        </span>
                      </div>
                      {caption && (
                        <div className="px-2 pb-2">
                          <CaptionBlock caption={caption} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Horizontal Platforms */}
          {horizontalVideo?.status === 'complete' && horizontalVideo.videoUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="gold-divider flex-1" />
                <div className="text-center px-4">
                  <p className="section-label mb-0 text-sm">الفيديو الأفقي — المنصات</p>
                  <p className="text-[10px] text-[var(--text-muted)]">16:9 — محتوى ثقافي معلوماتي</p>
                </div>
                <div className="gold-divider flex-1" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {grouped['16:9'].map((platform, i) => {
                  const caption = captionsMap[platform.captionKey] || '';
                  return (
                    <div
                      key={platform.id}
                      className="glass-card overflow-hidden animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--obsidian-border)]">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: platform.color + '22', color: platform.color }}
                        >
                          <PlatformIcon icon={platform.icon} size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                            {platform.platformAr}
                          </p>
                          <p className="text-[9px] text-[var(--text-muted)]">{platform.usageAr}</p>
                        </div>
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: platform.color + '22', color: platform.color }}
                        >
                          {platform.usage}
                        </span>
                      </div>
                      {caption && (
                        <div className="px-2 pb-2">
                          <CaptionBlock caption={caption} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary */}
      <p className="text-[10px] text-[var(--text-muted)] text-center">
        2 فيديو مولَّد (محتوى مختلف) → {VIDEO_PLATFORM_MAP.length} استخدام عبر{' '}
        {new Set(VIDEO_PLATFORM_MAP.map((p) => p.platform)).size} منصة
      </p>
    </div>
  );
}
