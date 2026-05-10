'use client';

// ============================================================
// components/PostHistory.tsx
// Beautiful post history log with filtering and stats
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getHistory,
  getScheduledItems,
  clearHistory,
  PLATFORM_SCHEDULES,
  CONTENT_TYPE_LABELS,
  type ScheduledItem,
} from '@/lib/smartScheduler';

export default function PostHistory() {
  const [history, setHistory] = useState<ScheduledItem[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');

  useEffect(() => {
    setHistory(getHistory());
    setScheduled(getScheduledItems());
  }, []);

  const refresh = () => {
    setHistory(getHistory());
    setScheduled(getScheduledItems());
  };

  // Combine history + scheduled for full view
  const allItems = useMemo(() => {
    const combined = [
      ...scheduled.map(item => ({ ...item })),
      ...history,
    ];

    if (filter === 'all') return combined;
    return combined.filter(item => item.status === filter);
  }, [history, scheduled, filter]);

  // Stats
  const stats = useMemo(() => {
    const total = scheduled.length + history.length;
    const published = history.filter(h => h.status === 'published').length;
    const scheduledCount = scheduled.filter(s => s.status === 'scheduled').length;
    const drafts = scheduled.filter(s => s.status === 'draft').length;

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    for (const item of [...scheduled, ...history]) {
      platformCounts[item.platformId] = (platformCounts[item.platformId] || 0) + 1;
    }

    // Content type breakdown
    const typeCounts: Record<string, number> = {};
    for (const item of [...scheduled, ...history]) {
      typeCounts[item.contentType] = (typeCounts[item.contentType] || 0) + 1;
    }

    return { total, published, scheduledCount, drafts, platformCounts, typeCounts };
  }, [history, scheduled]);

  if (stats.total === 0) return null;

  return (
    <div className="glass-card p-3 space-y-2">
      {/* Toggle Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm"
      >
        <span className="flex items-center gap-2 text-[var(--gold)] font-semibold">
          <History size={16} />
          سجل المنشورات ({stats.total})
        </span>
        <div className="flex items-center gap-2">
          {/* Mini stats */}
          <div className="flex items-center gap-1.5">
            {stats.published > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-green-400">
                <CheckCircle size={8} /> {stats.published}
              </span>
            )}
            {stats.scheduledCount > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-blue-400">
                <Clock size={8} /> {stats.scheduledCount}
              </span>
            )}
            {stats.drafts > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-[var(--text-muted)]">
                <FileText size={8} /> {stats.drafts}
              </span>
            )}
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 mt-2">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'الكل', value: stats.total, color: 'text-[var(--gold)]', bg: 'bg-[var(--gold)]/10' },
              { label: 'منشور', value: stats.published, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'مجدول', value: stats.scheduledCount, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'مسودة', value: stats.drafts, color: 'text-gray-400', bg: 'bg-gray-500/10' },
            ].map(stat => (
              <div
                key={stat.label}
                className={`text-center p-2 rounded-lg ${stat.bg} border border-[var(--obsidian-border)]`}
              >
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] text-[var(--text-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Platform Breakdown */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <BarChart3 size={10} />
              توزيع المنصات:
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.platformCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([platformId, count]) => {
                  const platform = PLATFORM_SCHEDULES.find(p => p.platformId === platformId);
                  return (
                    <span
                      key={platformId}
                      className="text-[9px] px-2 py-0.5 rounded-full border border-[var(--obsidian-border)] text-[var(--text-muted)]"
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                        style={{ backgroundColor: platform?.color || '#666' }}
                      />
                      {platform?.platformNameAr || platformId} ({count})
                    </span>
                  );
                })}
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={10} className="text-[var(--text-muted)]" />
            {(['all', 'published', 'scheduled', 'draft'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${
                  filter === f
                    ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]'
                    : 'text-[var(--text-muted)] border border-[var(--obsidian-border)]'
                }`}
              >
                {f === 'all' ? 'الكل' : f === 'published' ? 'منشور' : f === 'scheduled' ? 'مجدول' : 'مسودة'}
              </button>
            ))}
          </div>

          {/* Items List */}
          <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
            {allItems.length === 0 ? (
              <p className="text-center text-[10px] text-[var(--text-muted)] py-4">
                لا توجد منشورات بهذا الفلتر
              </p>
            ) : (
              allItems.map(item => {
                const platform = PLATFORM_SCHEDULES.find(p => p.platformId === item.platformId);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-[var(--obsidian-border)]"
                  >
                    {/* Status Icon */}
                    {item.status === 'published' && <CheckCircle size={10} className="text-green-400 flex-shrink-0" />}
                    {item.status === 'scheduled' && <Clock size={10} className="text-blue-400 flex-shrink-0" />}
                    {item.status === 'draft' && <FileText size={10} className="text-gray-400 flex-shrink-0" />}
                    {item.status === 'failed' && <AlertCircle size={10} className="text-red-400 flex-shrink-0" />}

                    {/* Platform dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: platform?.color || '#666' }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[var(--text-primary)] truncate">
                          {item.perfumeName}
                        </span>
                        <span className="text-[8px] px-1 py-0 rounded bg-black/30 text-[var(--text-muted)]">
                          {CONTENT_TYPE_LABELS[item.contentType]?.ar || item.contentType}
                        </span>
                      </div>
                      <p className="text-[8px] text-[var(--text-muted)]">
                        {platform?.platformNameAr} — {item.scheduledDate} {item.scheduledTime}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Clear History */}
          {history.length > 0 && (
            <button
              onClick={() => {
                clearHistory();
                refresh();
                toast.success('تم مسح السجل');
              }}
              className="w-full flex items-center justify-center gap-1 text-[10px] py-1.5 text-red-400 hover:text-red-300 transition-all"
            >
              <Trash2 size={10} />
              مسح السجل
            </button>
          )}
        </div>
      )}
    </div>
  );
}
