'use client';

// ============================================================
// components/ViralLearningInsights.tsx
// لوحة تعرض ما تعلمه النظام من سجلات الأداء:
//  - أعلى hook categories
//  - أعلى personas
//  - أعلى hooks مباشرة
//  - hint للتوصية القادمة
// تستهلك GET /api/learning/record
// Additive: مكوّن مستقل، يُستورد عند الحاجة.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Skeleton, { SkeletonGroup } from './Skeleton';

type ViralPlatform =
  | 'instagram' | 'tiktok' | 'twitter' | 'snapchat' | 'youtube_shorts'
  | 'threads' | 'pinterest' | 'telegram' | 'whatsapp_status'
  | 'google_business' | 'linkedin' | 'facebook';

interface BucketStat<K extends string> {
  // الحقل الأول يكون category/persona/mode/platform حسب النوع
  avgScore: number;
  count: number;
  [k: string]: K | number | string;
}

interface InsightsResponse {
  insights: {
    bestHookCategories: BucketStat<string>[];
    bestPersonas: BucketStat<string>[];
    bestContentModes: BucketStat<string>[];
    bestPlatforms: BucketStat<string>[];
    topHooks: Array<{ hook: string; score: number; platform: string }>;
    sampleSize: number;
  };
  hint: {
    preferredHookCategory: string | null;
    preferredPersona: string | null;
    preferredMode: string | null;
    confidence: number;
    rationale: string;
  } | null;
}

interface ViralLearningInsightsProps {
  defaultPlatform?: ViralPlatform | '';
  pollIntervalMs?: number;
}

const PLATFORMS: ReadonlyArray<{ key: ViralPlatform | ''; label: string }> = [
  { key: '', label: 'الكل' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'X' },
  { key: 'snapchat', label: 'Snapchat' },
  { key: 'youtube_shorts', label: 'YT Shorts' },
];

export default function ViralLearningInsights({
  defaultPlatform = '',
  pollIntervalMs,
}: ViralLearningInsightsProps) {
  const [platform, setPlatform] = useState<ViralPlatform | ''>(defaultPlatform);
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ mode: 'insights' });
      if (platform) qs.set('platform', platform);
      const res = await fetch(`/api/learning/record?${qs.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as InsightsResponse;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const t = setInterval(() => { void load(); }, pollIntervalMs);
    return () => clearInterval(t);
  }, [load, pollIntervalMs]);

  return (
    <div
      dir="rtl"
      className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-950 to-black p-5 text-amber-50 shadow-xl"
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-amber-300">ما تعلّمه مهووس</h3>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-amber-200/80 hover:bg-zinc-800"
        >
          تحديث
        </button>
      </header>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {PLATFORMS.map((p) => {
          const active = p.key === platform;
          return (
            <button
              key={p.key || 'all'}
              type="button"
              onClick={() => setPlatform(p.key)}
              className={[
                'rounded-md px-2.5 py-1 text-[11px] transition',
                active
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-amber-200',
              ].join(' ')}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 p-2 text-xs text-red-300">{error}</p>
      )}

      {loading && !data && (
        <div className="space-y-3">
          <Skeleton height="0.9rem" width="40%" />
          <SkeletonGroup count={4} height="2.2rem" />
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <p className="text-[11px] text-amber-400/60">
            عينة الدراسة: {data.insights.sampleSize} منشور
          </p>

          {data.hint && data.hint.confidence > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="mb-1 text-xs text-amber-300">توصية النظام للجيل القادم</p>
              <p className="text-xs text-amber-100/80">
                <span className="font-semibold">Hook:</span> {data.hint.preferredHookCategory ?? '—'}
                <span className="mx-2">•</span>
                <span className="font-semibold">Voice:</span> {data.hint.preferredPersona ?? '—'}
                <span className="mx-2">•</span>
                <span className="font-semibold">Mode:</span> {data.hint.preferredMode ?? '—'}
              </p>
              <p className="mt-1 text-[10px] text-amber-200/50">
                ثقة {Math.round(data.hint.confidence * 100)}% — {data.hint.rationale}
              </p>
            </div>
          )}

          <Section title="أعلى Hook Categories" rows={data.insights.bestHookCategories} labelKey="category" />
          <Section title="أعلى Personas" rows={data.insights.bestPersonas} labelKey="persona" />
          <Section title="أعلى Content Modes" rows={data.insights.bestContentModes} labelKey="mode" />

          {data.insights.topHooks.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs text-amber-400/80">أفضل Hooks فعلياً</h4>
              <div className="space-y-1.5">
                {data.insights.topHooks.slice(0, 5).map((h, i) => (
                  <div
                    key={`${h.hook}-${i}`}
                    className="flex items-start justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-2"
                  >
                    <p className="text-xs text-amber-100/85">{h.hook}</p>
                    <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                      {h.score} · {h.platform}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  rows: BucketStat<string>[];
  labelKey: string;
}

function Section({ title, rows, labelKey }: SectionProps) {
  if (!rows || rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.avgScore), 1);
  return (
    <div>
      <h4 className="mb-2 text-xs text-amber-400/80">{title}</h4>
      <div className="space-y-1.5">
        {rows.slice(0, 5).map((r, i) => {
          const pct = Math.round((r.avgScore / max) * 100);
          const label = String(r[labelKey] ?? '—');
          return (
            <div key={`${label}-${i}`} className="rounded-md bg-zinc-900/50 p-2">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-amber-100/85">{label}</span>
                <span className="text-amber-300/80">
                  {r.avgScore.toFixed(1)} <span className="text-zinc-500">({r.count})</span>
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
