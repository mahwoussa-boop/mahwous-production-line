'use client';

// ============================================================
// components/ContentQueuePanel.tsx
// Shows saved posts queue with actions
// ============================================================

import { useState, useEffect } from 'react';
import {
  Inbox,
  Trash2,
  FileSpreadsheet,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getQueue,
  removeFromQueue,
  downloadCSV,
  type QueuedPost,
} from '@/lib/contentQueue';

export default function ContentQueuePanel() {
  const [queue, setQueue] = useState<QueuedPost[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setQueue(getQueue());
  }, []);

  const refreshQueue = () => setQueue(getQueue());

  const handleDelete = (id: string) => {
    removeFromQueue(id);
    refreshQueue();
    toast.success('تم حذف المنشور');
  };

  const handleExportAll = () => {
    if (queue.length === 0) {
      toast.error('لا توجد منشورات للتصدير');
      return;
    }
    downloadCSV(queue);
    toast.success(`تم تصدير ${queue.length} منشور`);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock size={12} className="text-blue-400" />;
      case 'published':
        return <CheckCircle size={12} className="text-green-400" />;
      case 'failed':
        return <AlertCircle size={12} className="text-red-400" />;
      default:
        return <Inbox size={12} className="text-[var(--text-muted)]" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدول';
      case 'published': return 'منشور';
      case 'failed': return 'فشل';
      default: return 'مسودة';
    }
  };

  if (queue.length === 0) return null;

  return (
    <div className="glass-card p-3 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm"
      >
        <span className="flex items-center gap-2 text-[var(--gold)] font-semibold">
          <Inbox size={16} />
          قائمة المحتوى ({queue.length})
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="space-y-2 mt-2">
          {/* Export button */}
          <button
            onClick={handleExportAll}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-green-500/30 hover:bg-green-500/10 transition-all text-xs text-green-400"
          >
            <FileSpreadsheet size={14} />
            تصدير الكل إلى CSV
          </button>

          {/* Queue items */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin">
            {queue.map(post => (
              <div
                key={post.id}
                className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-[var(--obsidian-border)]"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {statusIcon(post.status)}
                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--text-primary)] truncate">
                      {post.perfumeName}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)]">
                      {statusLabel(post.status)}
                      {post.scheduledTime && ` — ${new Date(post.scheduledTime).toLocaleDateString('ar-SA')} ${new Date(post.scheduledTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
