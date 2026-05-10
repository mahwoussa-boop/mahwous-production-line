'use client';

import { useState } from 'react';
import { Copy, Check, Instagram, Twitter } from 'lucide-react';

interface CaptionDisplayProps {
  instagram: string;
  twitter: string;
  tiktok?: string;
  snapchat?: string;
}

function CaptionCard({
  platform,
  icon: Icon,
  color,
  caption,
}: {
  platform: string;
  icon: React.ElementType;
  color: string;
  caption: string;
}) {
  const [copied, setCopied] = useState(false);
  // Guard: ensure caption is always a string
  const safeCaption = typeof caption === 'string' ? caption : String(caption ?? '');

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(safeCaption).catch(() => {
        // Fallback for browsers that block clipboard
      });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)]">{platform}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                     border border-[var(--obsidian-border)] text-[var(--text-muted)]
                     hover:border-[var(--gold)] hover:text-[var(--gold)]
                     transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'تم النسخ!' : 'نسخ'}
        </button>
      </div>

      {/* Caption */}
      <div className="bg-black/20 rounded-xl p-4 min-h-[80px]">
        <p className="caption-text text-sm whitespace-pre-wrap">{safeCaption}</p>
      </div>

      {/* Char count */}
      <p className="text-[10px] text-[var(--text-muted)] text-right font-mono">
        {safeCaption.length} حرف
      </p>
    </div>
  );
}

// TikTok icon (custom SVG since lucide doesn't have it)
function TikTokIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  );
}

// Snapchat icon (custom SVG)
function SnapchatIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12.166 2C9.44 2 7.3 3.23 6.3 5.14c-.5.93-.6 1.9-.6 2.86v1.5c-.3.1-.6.14-.9.14-.5 0-.8-.1-1-.2l-.1-.05-.1.05c-.2.1-.3.3-.3.5 0 .4.4.7.9.9.1.05.2.05.3.1-.1.3-.4.6-.9.8-.5.2-.8.5-.8.9 0 .3.2.6.5.8.1.05.2.1.3.1.4.1.8.2 1.2.4.1.05.2.1.3.2.1.1.1.2.1.3-.1.2-.3.4-.5.6-.3.3-.6.7-.6 1.2 0 .9.8 1.6 2.2 1.9.1.3.2.7.5.9.2.1.4.2.7.2.3 0 .6-.1.9-.2.5-.2 1-.3 1.5-.3.5 0 1 .1 1.5.3.3.1.6.2.9.2.3 0 .5-.1.7-.2.3-.2.4-.6.5-.9 1.4-.3 2.2-1 2.2-1.9 0-.5-.3-.9-.6-1.2-.2-.2-.4-.4-.5-.6 0-.1 0-.2.1-.3.1-.1.2-.15.3-.2.4-.2.8-.3 1.2-.4.1 0 .2-.05.3-.1.3-.2.5-.5.5-.8 0-.4-.3-.7-.8-.9-.5-.2-.8-.5-.9-.8.1-.05.2-.05.3-.1.5-.2.9-.5.9-.9 0-.2-.1-.4-.3-.5l-.1-.05-.1.05c-.2.1-.5.2-1 .2-.3 0-.6-.04-.9-.14v-1.5c0-.96-.1-1.93-.6-2.86C16.7 3.23 14.56 2 12.166 2z"/>
    </svg>
  );
}

export default function CaptionDisplay({ instagram, twitter, tiktok, snapchat }: CaptionDisplayProps) {
  // Guard against undefined/null values
  const safeInstagram = typeof instagram === 'string' ? instagram : '';
  const safeTwitter = typeof twitter === 'string' ? twitter : '';
  const safeTiktok = typeof tiktok === 'string' ? tiktok : '';
  const safeSnapchat = typeof snapchat === 'string' ? snapchat : '';

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="gold-divider flex-1" />
        <p className="section-label mb-0 px-2">كابشنات السوشيال ميديا</p>
        <div className="gold-divider flex-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CaptionCard
          platform="Instagram"
          icon={Instagram}
          color="#E1306C"
          caption={safeInstagram}
        />
        <CaptionCard
          platform="Twitter / X"
          icon={Twitter}
          color="#1DA1F2"
          caption={safeTwitter}
        />
        {safeTiktok && (
          <CaptionCard
            platform="TikTok"
            icon={TikTokIcon as React.ElementType}
            color="#010101"
            caption={safeTiktok}
          />
        )}
        {safeSnapchat && (
          <CaptionCard
            platform="Snapchat"
            icon={SnapchatIcon as React.ElementType}
            color="#FFFC00"
            caption={safeSnapchat}
          />
        )}
      </div>
    </div>
  );
}
