'use client';

// ============================================================
// components/DownloadButton.tsx
// Individual download button for images, videos, and captions
// ============================================================

import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadButtonProps {
  url: string;
  filename: string;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'icon' | 'full';
}

export default function DownloadButton({
  url,
  filename,
  label = 'تحميل',
  size = 'sm',
  variant = 'icon',
}: DownloadButtonProps) {
  const handleDownload = async () => {
    if (!url) {
      toast.error('الملف غير متاح للتحميل');
      return;
    }

    try {
      // For data URLs or same-origin, use fetch + blob
      if (url.startsWith('data:') || url.startsWith('/')) {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        // For external URLs, open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      toast.success(`جاري تحميل: ${filename}`);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        className={`flex items-center justify-center rounded-lg border border-[var(--obsidian-border)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all ${
          size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
        }`}
        title={label}
      >
        <Download size={size === 'sm' ? 12 : 16} className="text-[var(--gold)]" />
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-1.5 rounded-lg border border-[var(--obsidian-border)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all ${
        size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
      } text-[var(--text-secondary)]`}
    >
      <Download size={size === 'sm' ? 10 : 14} className="text-[var(--gold)]" />
      {label}
    </button>
  );
}

// ── Copy caption to clipboard ────────────────────────────────────────────────
export function CopyButton({ text, label = 'نسخ' }: { text: string; label?: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('تم نسخ الكابشن');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success('تم نسخ الكابشن');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--obsidian-border)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all text-[10px] text-[var(--text-secondary)]"
    >
      {label}
    </button>
  );
}
