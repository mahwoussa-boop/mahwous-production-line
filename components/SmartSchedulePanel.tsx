'use client';

// ============================================================
// components/SmartSchedulePanel.tsx
// Smart scheduling UI: suggests times, bulk/single schedule,
// daily plan generation, calendar view
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Zap,
  CheckCircle,
  Send,
  Download,
  ChevronLeft,
  ChevronRight,
  Layers,
  Target,
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
  PLATFORM_SCHEDULES,
  CONTENT_TYPE_LABELS,
  getNextAvailableDate,
  suggestBestTime,
  generateDailyPlan,
  scheduleAll,
  scheduleSingle,
  getScheduledItems,
  removeScheduledItem,
  markAsPublished,
  exportScheduleCSV,
  type ScheduledItem,
  type ContentType,
  type PlatformSchedule,
} from '@/lib/smartScheduler';

interface SmartSchedulePanelProps {
  perfumeData: PerfumeData;
  productUrl: string;
  images: GeneratedImage[];
  captions: PlatformCaptions | Record<string, string> | null;
  videoInfos: HedraVideoInfo[];
  videoCaptions: VideoPlatformCaptions | null;
}

export default function SmartSchedulePanel({
  perfumeData,
  productUrl,
  images,
  captions,
  videoInfos,
  videoCaptions,
}: SmartSchedulePanelProps) {
  const [mode, setMode] = useState<'suggest' | 'schedule' | 'calendar'>('suggest');
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyPlan, setDailyPlan] = useState<ScheduledItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduledItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Initialize with suggested date
  useEffect(() => {
    const nextDate = getNextAvailableDate(perfumeData.name);
    setSelectedDate(nextDate);
    refreshSchedule();
  }, [perfumeData.name]);

  const refreshSchedule = () => {
    setSchedule(getScheduledItems());
  };

  // Get image URLs
  const storyImg = images.find(i => i.format === 'story')?.url || '';
  const postImg = images.find(i => i.format === 'post')?.url || '';
  const landscapeImg = images.find(i => i.format === 'landscape')?.url || '';
  const verticalVideo = videoInfos.find(v => v.aspectRatio === '9:16' && v.videoUrl)?.videoUrl || '';
  const horizontalVideo = videoInfos.find(v => v.aspectRatio === '16:9' && v.videoUrl)?.videoUrl || '';

  // ── Generate Daily Plan ─────────────────────────────────────────────────────
  const handleGeneratePlan = () => {
    if (!selectedDate) {
      toast.error('يرجى اختيار تاريخ');
      return;
    }

    const plan = generateDailyPlan(
      perfumeData.name,
      perfumeData.brand,
      productUrl,
      selectedDate,
      { story: storyImg, post: postImg, landscape: landscapeImg },
      { vertical: verticalVideo, horizontal: horizontalVideo },
      (captions || {}) as Record<string, string>,
      (videoCaptions || {}) as Record<string, string>,
    );

    setDailyPlan(plan);
    setSelectedItems(new Set(plan.map(item => item.id)));
    setMode('schedule');

    toast.success(`تم إنشاء خطة نشر بـ ${plan.length} منشور لـ ${selectedDate}`);
  };

  // ── Schedule Selected Items ─────────────────────────────────────────────────
  const handleScheduleSelected = () => {
    const items = dailyPlan.filter(item => selectedItems.has(item.id));
    if (items.length === 0) {
      toast.error('يرجى اختيار منشور واحد على الأقل');
      return;
    }

    scheduleAll(items);
    refreshSchedule();
    setMode('calendar');
    toast.success(`تم جدولة ${items.length} منشور بنجاح!`);
  };

  // ── Schedule Single Item ────────────────────────────────────────────────────
  const handleScheduleSingle = (item: ScheduledItem) => {
    scheduleSingle(item);
    refreshSchedule();
    toast.success(`تم جدولة ${CONTENT_TYPE_LABELS[item.contentType].ar} على ${
      PLATFORM_SCHEDULES.find(p => p.platformId === item.platformId)?.platformNameAr || item.platformId
    }`);
  };

  // ── Toggle Item Selection ───────────────────────────────────────────────────
  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === dailyPlan.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(dailyPlan.map(item => item.id)));
    }
  };

  // ── Group daily plan by platform ────────────────────────────────────────────
  const groupedPlan = useMemo(() => {
    const groups: Record<string, { platform: PlatformSchedule; items: ScheduledItem[] }> = {};
    for (const item of dailyPlan) {
      if (!groups[item.platformId]) {
        const platform = PLATFORM_SCHEDULES.find(p => p.platformId === item.platformId);
        if (platform) {
          groups[item.platformId] = { platform, items: [] };
        }
      }
      groups[item.platformId]?.items.push(item);
    }
    return Object.values(groups);
  }, [dailyPlan]);

  // ── Scheduled items grouped by date ─────────────────────────────────────────
  const scheduledByDate = useMemo(() => {
    const groups: Record<string, ScheduledItem[]> = {};
    for (const item of schedule) {
      if (!groups[item.scheduledDate]) groups[item.scheduledDate] = [];
      groups[item.scheduledDate].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [schedule]);

  // ── Format date for display ─────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'اليوم';
    if (date.getTime() === tomorrow.getTime()) return 'غداً';

    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--gold)] flex items-center gap-2">
          <Zap size={16} />
          الجدولة الذكية
        </h3>
        <div className="flex gap-1">
          {(['suggest', 'schedule', 'calendar'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[10px] px-2.5 py-1 rounded-full transition-all ${
                mode === m
                  ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]'
                  : 'text-[var(--text-muted)] border border-[var(--obsidian-border)] hover:border-[var(--text-muted)]'
              }`}
            >
              {m === 'suggest' ? 'اقتراح' : m === 'schedule' ? 'الخطة' : 'السجل'}
            </button>
          ))}
        </div>
      </div>

      {/* ── SUGGEST MODE ── */}
      {mode === 'suggest' && (
        <div className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <Calendar size={12} className="text-blue-400" />
              اختر تاريخ النشر (مقترح تلقائياً):
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="luxury-input text-xs py-2 flex-1"
                dir="ltr"
              />
              <button
                onClick={() => setSelectedDate(getNextAvailableDate(perfumeData.name))}
                className="text-[10px] px-3 py-2 rounded-xl border border-[var(--obsidian-border)] hover:border-[var(--gold)] text-[var(--text-muted)] hover:text-[var(--gold)] transition-all"
              >
                التاريخ المقترح
              </button>
            </div>
            {selectedDate && (
              <p className="text-[10px] text-[var(--gold)]">
                {formatDate(selectedDate)} — {
                  schedule.filter(s => s.scheduledDate === selectedDate).length > 0
                    ? `${schedule.filter(s => s.scheduledDate === selectedDate).length} منشور مجدول`
                    : 'لا توجد منشورات مجدولة'
                }
              </p>
            )}
          </div>

          {/* Best Times Preview */}
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <Clock size={12} className="text-green-400" />
              أفضل أوقات النشر لكل منصة:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
              {PLATFORM_SCHEDULES.map(platform => {
                const bestTime = suggestBestTime(platform.platformId, selectedDate);
                return (
                  <div
                    key={platform.platformId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-[var(--obsidian-border)]"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: platform.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[var(--text-primary)] truncate">
                        {platform.platformNameAr}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)]">
                        {bestTime
                          ? `${String(bestTime.hour).padStart(2, '0')}:${String(bestTime.minute).padStart(2, '0')} — ${bestTime.label}`
                          : 'غير متاح'}
                      </p>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      bestTime?.engagementLevel === 'peak'
                        ? 'bg-green-500/20 text-green-400'
                        : bestTime?.engagementLevel === 'high'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {bestTime?.engagementLevel === 'peak' ? 'ذروة' : bestTime?.engagementLevel === 'high' ? 'عالي' : 'متوسط'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Plan Button */}
          <div className="flex gap-2">
            <button
              onClick={handleGeneratePlan}
              className="flex-1 btn-gold py-2.5 text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Layers size={14} />
              إنشاء خطة نشر يومية كاملة
            </button>
          </div>

          <p className="text-[9px] text-[var(--text-muted)] text-center">
            سيتم إنشاء خطة نشر تشمل Story + Post + Reels + Video لكل منصة متاحة
          </p>
        </div>
      )}

      {/* ── SCHEDULE MODE ── */}
      {mode === 'schedule' && dailyPlan.length > 0 && (
        <div className="space-y-3">
          {/* Header with select all */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)]">
              خطة نشر {formatDate(selectedDate)} — {dailyPlan.length} منشور
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAll}
                className="text-[10px] px-2 py-1 rounded-lg border border-[var(--obsidian-border)] hover:border-[var(--gold)] text-[var(--text-muted)] transition-all"
              >
                {selectedItems.size === dailyPlan.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </button>
              <span className="text-[10px] text-[var(--gold)]">
                {selectedItems.size} محدد
              </span>
            </div>
          </div>

          {/* Grouped by platform */}
          <div className="max-h-80 overflow-y-auto space-y-3 scrollbar-thin">
            {groupedPlan.map(({ platform, items }) => (
              <div key={platform.platformId} className="space-y-1.5">
                <div className="flex items-center gap-2 sticky top-0 bg-[var(--obsidian)] py-1 z-10">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-[11px] font-medium text-[var(--text-primary)]">
                    {platform.platformNameAr}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)]">
                    ({items.length} {items.length === 1 ? 'منشور' : 'منشورات'})
                  </span>
                </div>

                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedItems.has(item.id)
                        ? 'border-[var(--gold)] bg-[var(--gold)]/5'
                        : 'border-[var(--obsidian-border)] bg-black/20 hover:border-[var(--text-muted)]'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      selectedItems.has(item.id)
                        ? 'border-[var(--gold)] bg-[var(--gold)]'
                        : 'border-[var(--obsidian-border)]'
                    }`}>
                      {selectedItems.has(item.id) && (
                        <CheckCircle size={10} className="text-black" />
                      )}
                    </div>

                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-[var(--text-muted)]">
                      {CONTENT_TYPE_LABELS[item.contentType]?.ar || item.contentType}
                    </span>

                    <span className="text-[10px] text-[var(--text-secondary)] flex-1 truncate">
                      {item.imageUrl ? 'صورة' : ''}{item.videoUrl ? 'فيديو' : ''}
                      {item.caption ? ` + كابشن` : ''}
                    </span>

                    <span className="text-[10px] text-[var(--text-muted)]" dir="ltr">
                      {item.scheduledTime}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleSingle(item);
                      }}
                      className="p-1 rounded-lg hover:bg-[var(--gold)]/10 transition-all"
                      title="جدولة هذا فقط"
                    >
                      <Send size={10} className="text-[var(--gold)]" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleScheduleSelected}
              disabled={selectedItems.size === 0}
              className="flex-1 btn-gold py-2 text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Target size={14} />
              جدولة {selectedItems.size} منشور
            </button>
            <button
              onClick={() => {
                const items = dailyPlan.filter(item => selectedItems.has(item.id));
                exportScheduleCSV(items);
                toast.success('تم تصدير الخطة إلى CSV');
              }}
              disabled={selectedItems.size === 0}
              className="px-4 py-2 text-xs rounded-xl border border-green-500/30 hover:bg-green-500/10 text-green-400 transition-all disabled:opacity-40"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      )}

      {mode === 'schedule' && dailyPlan.length === 0 && (
        <div className="text-center py-6 space-y-2">
          <Layers size={32} className="mx-auto text-[var(--text-muted)] opacity-40" />
          <p className="text-xs text-[var(--text-muted)]">لم يتم إنشاء خطة نشر بعد</p>
          <button
            onClick={() => setMode('suggest')}
            className="text-[10px] text-[var(--gold)] hover:underline"
          >
            اذهب لإنشاء خطة
          </button>
        </div>
      )}

      {/* ── CALENDAR MODE ── */}
      {mode === 'calendar' && (
        <div className="space-y-3">
          {schedule.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Calendar size={32} className="mx-auto text-[var(--text-muted)] opacity-40" />
              <p className="text-xs text-[var(--text-muted)]">لا توجد منشورات مجدولة</p>
            </div>
          ) : (
            <>
              {/* Export All */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-secondary)]">
                  {schedule.length} منشور مجدول
                </p>
                <button
                  onClick={() => {
                    exportScheduleCSV(schedule);
                    toast.success('تم تصدير الجدول كاملاً');
                  }}
                  className="text-[10px] px-3 py-1 rounded-lg border border-green-500/30 hover:bg-green-500/10 text-green-400 transition-all flex items-center gap-1"
                >
                  <Download size={10} />
                  تصدير CSV
                </button>
              </div>

              {/* Grouped by date */}
              <div className="max-h-96 overflow-y-auto space-y-3 scrollbar-thin">
                {scheduledByDate.map(([date, items]) => (
                  <div key={date} className="space-y-1.5">
                    <div className="flex items-center gap-2 sticky top-0 bg-[var(--obsidian)] py-1 z-10">
                      <Calendar size={12} className="text-blue-400" />
                      <span className="text-[11px] font-medium text-[var(--text-primary)]">
                        {formatDate(date)}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">
                        ({items.length} منشور)
                      </span>
                    </div>

                    {items.map(item => {
                      const platform = PLATFORM_SCHEDULES.find(p => p.platformId === item.platformId);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-[var(--obsidian-border)]"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: platform?.color || '#666' }}
                          />
                          <span className="text-[10px] text-[var(--text-primary)] flex-shrink-0">
                            {platform?.platformNameAr || item.platformId}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 text-[var(--text-muted)]">
                            {CONTENT_TYPE_LABELS[item.contentType]?.ar || item.contentType}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] flex-1" dir="ltr">
                            {item.scheduledTime}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                markAsPublished(item.id);
                                refreshSchedule();
                                toast.success('تم تحديث الحالة');
                              }}
                              className="p-1 rounded hover:bg-green-500/10 transition-all"
                              title="تم النشر"
                            >
                              <CheckCircle size={10} className="text-green-400" />
                            </button>
                            <button
                              onClick={() => {
                                removeScheduledItem(item.id);
                                refreshSchedule();
                                toast.success('تم الحذف');
                              }}
                              className="p-1 rounded hover:bg-red-500/10 transition-all"
                              title="حذف"
                            >
                              <span className="text-red-400 text-[10px]">x</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Clear All */}
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من حذف جميع المنشورات المجدولة؟')) {
                    const { clearSchedule } = require('@/lib/smartScheduler');
                    clearSchedule();
                    refreshSchedule();
                    toast.success('تم مسح الجدول');
                  }
                }}
                className="w-full text-[10px] py-1.5 text-red-400 hover:text-red-300 transition-all"
              >
                مسح الجدول بالكامل
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
