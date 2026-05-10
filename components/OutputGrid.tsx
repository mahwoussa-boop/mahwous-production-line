'use client';

// ============================================================
// components/OutputGrid.tsx — V2
// عرض الصور المولّدة مع أزرار تحميل ونسخ واضحة لكل صورة وكابشن
// ============================================================

import { useState } from 'react';
import { Download, Expand, Copy, Check, ChevronDown, ChevronUp, FileText, Share2 } from 'lucide-react';
// Using regular img tags for cross-domain compatibility
import type { GeneratedImage, PlatformCaptions, SourceFormat } from '@/lib/types';
import { PLATFORM_MAP, groupBySourceFormat } from '@/lib/platformMap';

interface OutputGridProps {
  images: GeneratedImage[];
  captions?: PlatformCaptions | Record<string, string> | null;
  perfumeName?: string;
}

// ─── Platform Icons ──────────────────────────────────────────────────────────

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
    pinterest: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
      </svg>
    ),
    whatsapp: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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
    telegram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    haraj: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">حراج</text>
      </svg>
    ),
    truth: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  };
  return icons[icon] || <span className="text-xs font-bold">{icon[0]?.toUpperCase()}</span>;
}

// ─── Caption Block with Copy ────────────────────────────────────────────────

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
          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all font-medium"
        >
          {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
          {copied ? 'تم النسخ!' : 'نسخ الكابشن'}
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

// ─── Safe download ───────────────────────────────────────────────────────────

function safeDownload(url: string, filename: string): void {
  if (url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  const isCrossDomain = url.includes('fal.media') || url.includes('fal.run') || url.includes('cdn.') || !url.startsWith('/');
  if (isCrossDomain) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Download All Captions as Text ──────────────────────────────────────────

function downloadAllCaptions(captions: Record<string, string>, perfumeName: string) {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════════════');
  lines.push(`  مهووس ستور — كابشنات ${perfumeName}`);
  lines.push(`  ${new Date().toLocaleDateString('ar-SA')}`);
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');

  Object.entries(captions).forEach(([key, value]) => {
    if (value && value !== '—') {
      lines.push(`── ${key} ──`);
      lines.push(value);
      lines.push('');
    }
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mahwous-captions-${perfumeName.replace(/\s+/g, '-').substring(0, 20)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Format Labels ───────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<SourceFormat, { title: string; subtitle: string; aspect: string }> = {
  story: { title: 'الصورة العمودية', subtitle: '9:16 — Stories & Pins', aspect: 'aspect-[9/16]' },
  post: { title: 'الصورة المربعة', subtitle: '1:1 — Posts & Ads', aspect: 'aspect-square' },
  landscape: { title: 'الصورة الأفقية', subtitle: '16:9 — Tweets & Covers', aspect: 'aspect-video' },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OutputGrid({ images, captions, perfumeName = 'perfume' }: OutputGridProps) {
  const safeName = (perfumeName || 'perfume').replace(/\s+/g, '-').toLowerCase();
  const grouped = groupBySourceFormat(PLATFORM_MAP);
  const captionsMap = (captions || {}) as Record<string, string>;

  // Find image URL by format
  const getImageUrl = (format: SourceFormat): string => {
    const img = images.find(i => i.format === format);
    return img?.url || '';
  };

  const formatOrder: SourceFormat[] = ['story', 'post', 'landscape'];

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* ── أزرار سريعة في الأعلى ── */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => images.forEach(img => {
            if (img.url) safeDownload(img.url, `mahwous-${safeName}-${img.format}.jpg`);
          })}
          className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
        >
          <Download size={14} />
          تحميل جميع الصور ({images.filter(i => i.url).length})
        </button>

        {Object.keys(captionsMap).length > 0 && (
          <button
            onClick={() => downloadAllCaptions(captionsMap, perfumeName)}
            className="btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--obsidian-border)] hover:border-[var(--gold)]"
          >
            <FileText size={14} />
            تحميل جميع الكابشنات
          </button>
        )}
      </div>

      {formatOrder.map(format => {
        const imageUrl = getImageUrl(format);
        const platforms = grouped[format];
        const formatInfo = FORMAT_LABELS[format];
        // عرض placeholder إذا لم تكن الصورة متاحة بعد
        if (!imageUrl) {
          return (
            <div key={format} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="gold-divider flex-1" />
                <div className="text-center px-4">
                  <p className="section-label mb-0 text-sm">{formatInfo.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatInfo.subtitle}</p>
                </div>
                <div className="gold-divider flex-1" />
              </div>
              <div className={`${formatInfo.aspect} max-w-xs mx-auto bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] rounded-xl flex items-center justify-center`}>
                <p className="text-xs text-[var(--text-muted)]">جاري توليد الصورة...</p>
              </div>
            </div>
          );
        }

        return (
          <div key={format} className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="gold-divider flex-1" />
              <div className="text-center px-4">
                <p className="section-label mb-0 text-sm">{formatInfo.title}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{formatInfo.subtitle}</p>
              </div>
              <div className="gold-divider flex-1" />
            </div>

            {/* ── زر تحميل الصورة الأصلية ── */}
            <div className="flex justify-center">
              <button
                onClick={() => safeDownload(imageUrl, `mahwous-${safeName}-${format}-original.jpg`)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30 hover:bg-[var(--gold)]/20 transition-all"
              >
                <Download size={14} />
                تحميل الصورة الأصلية ({formatInfo.title})
              </button>
            </div>

            {/* Platform Cards Grid */}
            <div className={`grid gap-4 ${format === 'story' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : format === 'post' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {platforms.map((platform, i) => {
                const caption = captionsMap[platform.captionKey] || '';
                const filename = `mahwous-${safeName}-${platform.id}.jpg`;

                return (
                  <div
                    key={platform.id}
                    className="glass-card overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {/* Platform Header */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--obsidian-border)]">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: platform.color + '22', color: platform.color }}
                      >
                        <PlatformIcon icon={platform.icon} size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {platform.platformAr}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">{platform.usageAr}</p>
                      </div>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: platform.color + '22', color: platform.color }}
                      >
                        {platform.usage}
                      </span>
                    </div>

                    {/* Image */}
                    <div className={`relative w-full ${formatInfo.aspect} bg-[var(--obsidian)] overflow-hidden`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`${platform.platformAr} ${platform.usageAr}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-gray-500">تعذّر تحميل الصورة</div>';
                          }
                        }}
                      />
                      {/* Hover overlay with buttons */}
                      <div className="overlay gap-2">
                        <button
                          onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
                          className="btn-ghost flex items-center gap-1 text-[10px] px-3 py-2 rounded-lg"
                        >
                          <Expand size={12} />
                          عرض
                        </button>
                        <button
                          onClick={() => safeDownload(imageUrl, filename)}
                          className="btn-gold flex items-center gap-1 text-[10px] px-3 py-2 rounded-lg font-bold"
                        >
                          <Download size={12} />
                          تحميل
                        </button>
                      </div>
                    </div>

                    {/* ── أزرار سريعة تحت الصورة ── */}
                    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--obsidian-border)]">
                      <button
                        onClick={() => safeDownload(imageUrl, filename)}
                        className="flex-1 flex items-center justify-center gap-1 text-[9px] py-1.5 rounded-lg text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all font-medium"
                      >
                        <Download size={10} />
                        تحميل الصورة
                      </button>
                      {platform.hasCaption && caption && caption !== '—' && (
                        <button
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(caption);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 text-[9px] py-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-all font-medium"
                        >
                          <Copy size={10} />
                          نسخ الكابشن
                        </button>
                      )}
                    </div>

                    {/* Caption */}
                    {platform.hasCaption && caption && caption !== '—' && (
                      <div className="px-3 pb-3">
                        <CaptionBlock caption={caption} />
                      </div>
                    )}

                    {/* No caption indicator */}
                    {!platform.hasCaption && (
                      <div className="px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] text-center">
                          صورة فقط — بدون كابشن
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Open all images */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => images.forEach(img => window.open(img.url, '_blank', 'noopener,noreferrer'))}
          className="btn-ghost flex items-center gap-2 px-6 py-3 text-sm"
        >
          <Expand size={14} />
          فتح جميع الصور (3 صيغ أصلية)
        </button>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] text-center">
        3 صور مولَّدة → {PLATFORM_MAP.length} استخدام عبر {new Set(PLATFORM_MAP.map(p => p.platform)).size} منصة
      </p>
    </div>
  );
}
