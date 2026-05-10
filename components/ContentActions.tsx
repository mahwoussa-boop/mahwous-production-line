'use client';

// ============================================================
// components/ContentActions.tsx
// Save to queue, schedule, export CSV, download bundle
// ============================================================

import { useState } from 'react';
import {
  Save,
  Calendar,
  Download,
  FileSpreadsheet,
  Check,
  Clock,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  PerfumeData,
  GeneratedImage,
  PlatformCaptions,
  HedraVideoInfo,
  VideoPlatformCaptions,
} from '@/lib/types';
import {
  addToQueue,
  getQueue,
  downloadCSV,
  ALL_PLATFORMS,
  type QueuedPost,
} from '@/lib/contentQueue';

interface ContentActionsProps {
  perfumeData: PerfumeData;
  productUrl: string;
  images: GeneratedImage[];
  captions: PlatformCaptions | Record<string, string> | null;
  videoInfos: HedraVideoInfo[];
  videoCaptions: VideoPlatformCaptions | null;
}

export default function ContentActions({
  perfumeData,
  productUrl,
  images,
  captions,
  videoInfos,
  videoCaptions,
}: ContentActionsProps) {
  const [saved, setSaved] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    ALL_PLATFORMS.map(p => p.id)
  );

  const storyImg = images.find(i => i.format === 'story')?.url || '';
  const postImg = images.find(i => i.format === 'post')?.url || '';
  const landscapeImg = images.find(i => i.format === 'landscape')?.url || '';
  const verticalVideo = videoInfos.find(v => v.aspectRatio === '9:16' && v.videoUrl)?.videoUrl || '';
  const horizontalVideo = videoInfos.find(v => v.aspectRatio === '16:9' && v.videoUrl)?.videoUrl || '';

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // ── Save to queue ──────────────────────────────────────────────────────────
  const handleSave = (scheduled: boolean = false) => {
    let scheduledTime: string | null = null;
    if (scheduled && scheduleDate && scheduleTime) {
      scheduledTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    const post: Omit<QueuedPost, 'id' | 'timestamp' | 'sheetsExported'> = {
      perfumeName: perfumeData.name,
      perfumeBrand: perfumeData.brand,
      productUrl,
      storyImageUrl: storyImg,
      postImageUrl: postImg,
      landscapeImageUrl: landscapeImg,
      verticalVideoUrl: verticalVideo || '',
      horizontalVideoUrl: horizontalVideo || '',
      verticalVoiceover: videoInfos.find(v => v.aspectRatio === '9:16')?.voiceoverText || '',
      horizontalVoiceover: videoInfos.find(v => v.aspectRatio === '16:9')?.voiceoverText || '',
      captions: (captions || {}) as Record<string, string>,
      videoCaptions: (videoCaptions || {}) as Record<string, string>,
      scheduledTime,
      platforms: selectedPlatforms,
      status: scheduled ? 'scheduled' : 'draft',
    };

    addToQueue(post);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    if (scheduled) {
      toast.success(`تم جدولة المنشور — ${scheduleDate} الساعة ${scheduleTime}`);
    } else {
      toast.success('تم حفظ المنشور في قائمة المحتوى');
    }
  };

  // ── Export all queue to CSV ────────────────────────────────────────────────
  const handleExportCSV = () => {
    const queue = getQueue();
    if (queue.length === 0) {
      toast.error('لا توجد منشورات محفوظة للتصدير');
      return;
    }
    downloadCSV(queue);
    toast.success(`تم تصدير ${queue.length} منشور إلى ملف CSV`);
  };

  // ── Download all media bundle ──────────────────────────────────────────────
  const handleDownloadBundle = () => {
    const urls: { url: string; name: string }[] = [];
    const safeName = perfumeData.name.replace(/\s+/g, '-').substring(0, 30);

    if (storyImg) urls.push({ url: storyImg, name: `${safeName}-story-9x16.jpg` });
    if (postImg) urls.push({ url: postImg, name: `${safeName}-post-1x1.jpg` });
    if (landscapeImg) urls.push({ url: landscapeImg, name: `${safeName}-landscape-16x9.jpg` });
    if (verticalVideo) urls.push({ url: verticalVideo, name: `${safeName}-video-vertical.mp4` });
    if (horizontalVideo) urls.push({ url: horizontalVideo, name: `${safeName}-video-horizontal.mp4` });

    if (urls.length === 0) {
      toast.error('لا توجد ملفات للتحميل');
      return;
    }

    // Open each in new tab for download
    urls.forEach(({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });

    toast.success(`جاري تحميل ${urls.length} ملفات — تحقق من التنزيلات`);
  };

  // ── Download captions as text file ─────────────────────────────────────────
  const handleDownloadCaptions = () => {
    const allCaptions = { ...(captions || {}), ...(videoCaptions || {}) };
    const lines: string[] = [];
    lines.push(`كابشنات عطر: ${perfumeData.name}`);
    lines.push(`العلامة: ${perfumeData.brand}`);
    lines.push(`الرابط: ${productUrl}`);
    lines.push('═'.repeat(50));

    for (const [key, value] of Object.entries(allCaptions)) {
      if (value && typeof value === 'string') {
        const platformName = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        lines.push(`\n▸ ${platformName}:\n${value}`);
        lines.push('─'.repeat(40));
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahwous-captions-${perfumeData.name.replace(/\s+/g, '-').substring(0, 30)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('تم تحميل ملف الكابشنات');
  };

  const queueCount = typeof window !== 'undefined' ? getQueue().length : 0;

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--gold)] flex items-center gap-2">
          <Package size={16} />
          إدارة المحتوى والنشر
        </h3>
        {queueCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold)]">
            {queueCount} منشور محفوظ
          </span>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Save to Queue */}
        <button
          onClick={() => handleSave(false)}
          disabled={saved}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--obsidian-border)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all text-center"
        >
          {saved ? <Check size={18} className="text-green-400" /> : <Save size={18} className="text-[var(--gold)]" />}
          <span className="text-[10px] text-[var(--text-secondary)]">
            {saved ? 'تم الحفظ!' : 'حفظ المنشور'}
          </span>
        </button>

        {/* Schedule */}
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--obsidian-border)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all text-center"
        >
          <Calendar size={18} className="text-blue-400" />
          <span className="text-[10px] text-[var(--text-secondary)]">جدولة النشر</span>
        </button>

        {/* Download Bundle */}
        <button
          onClick={handleDownloadBundle}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--obsidian-border)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all text-center"
        >
          <Download size={18} className="text-green-400" />
          <span className="text-[10px] text-[var(--text-secondary)]">تحميل الكل</span>
        </button>

        {/* Download Captions */}
        <button
          onClick={handleDownloadCaptions}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--obsidian-border)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all text-center"
        >
          <FileSpreadsheet size={18} className="text-purple-400" />
          <span className="text-[10px] text-[var(--text-secondary)]">تحميل الكابشنات</span>
        </button>
      </div>

      {/* Export CSV Row */}
      <div className="flex gap-2">
        <button
          onClick={handleExportCSV}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[var(--obsidian-border)] hover:border-green-500 hover:bg-green-500/5 transition-all text-xs text-[var(--text-secondary)]"
        >
          <FileSpreadsheet size={14} className="text-green-400" />
          تصدير CSV للأرشفة
        </button>
      </div>

      {/* Schedule Panel */}
      {showSchedule && (
        <div className="space-y-3 p-3 rounded-xl bg-black/20 border border-[var(--obsidian-border)]">
          <p className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-2">
            <Clock size={14} className="text-blue-400" />
            جدولة النشر
          </p>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              className="luxury-input text-xs py-2"
              dir="ltr"
            />
            <input
              type="time"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              className="luxury-input text-xs py-2"
              dir="ltr"
            />
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <p className="text-[10px] text-[var(--text-muted)]">اختر المنصات:</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]'
                      : 'border-[var(--obsidian-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (!scheduleDate || !scheduleTime) {
                toast.error('يرجى تحديد التاريخ والوقت');
                return;
              }
              handleSave(true);
              setShowSchedule(false);
            }}
            className="w-full btn-gold py-2 text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Calendar size={14} />
            جدولة المنشور
          </button>

          <p className="text-[9px] text-[var(--text-muted)] text-center">
            سيتم حفظ المنشور مع وقت النشر. استخدم النشر الذكي عبر Metricool للنشر التلقائي.
          </p>
        </div>
      )}
    </div>
  );
}
