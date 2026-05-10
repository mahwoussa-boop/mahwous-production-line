'use client';

import { useState } from 'react';
import {
  FileText, CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp,
  Sparkles, DollarSign, AlertTriangle,
} from 'lucide-react';
import type { PlatformCaptions, VideoPlatformCaptions } from '@/lib/types';
import type { ABTestResult } from '@/lib/pipeline/pipelineTypes';

interface DraftReviewProps {
  captions: PlatformCaptions | null;
  videoCaptions: VideoPlatformCaptions | null;
  abTestResults: ABTestResult[];
  estimatedCost: number;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
}

const PLATFORM_NAMES: Record<string, string> = {
  instagram_story: 'انستقرام ستوري',
  instagram_post: 'انستقرام بوست',
  snapchat: 'سناب شات',
  tiktok: 'تيك توك',
  twitter: 'تويتر/إكس',
  facebook_post: 'فيسبوك بوست',
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

export default function DraftReview({
  captions,
  videoCaptions,
  abTestResults,
  estimatedCost,
  onApprove,
  onReject,
  isApproving,
}: DraftReviewProps) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [showABTests, setShowABTests] = useState(false);

  const togglePlatform = (key: string) => {
    setExpandedPlatform(expandedPlatform === key ? null : key);
  };

  const captionEntries = captions ? Object.entries(captions).filter(([, v]) => v && typeof v === 'string') : [];
  const videoCaptionEntries = videoCaptions ? Object.entries(videoCaptions).filter(([, v]) => v && typeof v === 'string') : [];

  return (
    <div className="space-y-4">
      {/* Draft Mode Banner */}
      <div className="glass-card p-4 border-2 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Eye size={20} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-400">وضع المسودة — مراجعة قبل التوليد</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              تمت كتابة النصوص والسيناريوهات. راجعها قبل اعتماد توليد الصور والفيديوهات (لتوفير تكاليف الـ API).
            </p>
          </div>
        </div>
      </div>

      {/* Cost Warning */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
        <span className="text-xs text-[var(--text-muted)]">
          التكلفة التقديرية لتوليد الوسائط:
        </span>
        <span className="text-xs font-bold text-[var(--gold)]">${estimatedCost.toFixed(2)}</span>
        <span className="text-[10px] text-[var(--text-muted)]">(صور + صوت + فيديو + مونتاج)</span>
      </div>

      {/* Image Captions Preview */}
      {captionEntries.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-[var(--gold)]" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">كابشنات الصور ({captionEntries.length} منصة)</h4>
          </div>

          <div className="space-y-1">
            {captionEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border border-[var(--obsidian-border)] overflow-hidden">
                <button
                  onClick={() => togglePlatform(key)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {PLATFORM_NAMES[key] || key}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {(value as string).length} حرف
                    </span>
                    {expandedPlatform === key ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                </button>
                {expandedPlatform === key && (
                  <div className="p-3 pt-0 border-t border-[var(--obsidian-border)]">
                    <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed" dir="rtl">
                      {value as string}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Captions Preview */}
      {videoCaptionEntries.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-purple-400" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">كابشنات الفيديو ({videoCaptionEntries.length} منصة)</h4>
          </div>

          <div className="space-y-1">
            {videoCaptionEntries.map(([key, value]) => (
              <div key={key} className="p-2.5 rounded-lg bg-[var(--obsidian-light)]">
                <p className="text-[10px] font-medium text-purple-400 mb-1">{key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2" dir="rtl">{value as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A/B Test Variants */}
      {abTestResults.length > 0 && (
        <div className="glass-card p-4">
          <button
            onClick={() => setShowABTests(!showABTests)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              <h4 className="text-sm font-bold text-[var(--text-primary)]">اختبارات A/B ({abTestResults.length})</h4>
            </div>
            {showABTests ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showABTests && (
            <div className="mt-3 space-y-3">
              {abTestResults.slice(0, 5).map((test, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">{PLATFORM_NAMES[test.platform] || test.platform}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[10px] font-bold text-blue-400">النسخة A — {test.variantA.style}</span>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-3" dir="rtl">{test.variantA.caption}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-[10px] font-bold text-green-400">النسخة B — {test.variantB.style}</span>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-3" dir="rtl">{test.variantB.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onApprove}
          disabled={isApproving}
          className="flex-1 btn-gold py-3 text-sm flex items-center justify-center gap-2 rounded-xl disabled:opacity-50"
        >
          {isApproving ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              جاري بدء التوليد...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              اعتماد وتوليد الوسائط
              <span className="text-[10px] opacity-70">(~${estimatedCost.toFixed(2)})</span>
            </>
          )}
        </button>
        <button
          onClick={onReject}
          disabled={isApproving}
          className="px-6 py-3 text-sm rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}
