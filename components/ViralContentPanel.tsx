'use client';

// ============================================================
// components/ViralContentPanel.tsx
// لوحة تحكم المحتوى الفيروسي — اختيار النمط/المنصة، معاينة Hooks،
// ربط بترند نشط، تنبؤ Viral Score.
// Additive: مكون مستقل، اختيار العميل في الاستيراد.
// ============================================================

import { useMemo, useState } from 'react';
import type { PerfumeData } from '@/lib/types';
import {
  generateHookVariants,
  buildViralBlueprint,
  getStarInsight,
  type ContentMode,
  type ViralPlatform,
  type ViralHook,
} from '@/lib/engines/viralContentEngine';
import {
  matchProductToTrend,
  predictViralScore,
  type TrendableContent,
} from '@/lib/engines/trendAnalyzer';

interface ViralContentPanelProps {
  perfumeData: PerfumeData;
  onApply?: (selection: ViralSelection) => void;
}

export interface ViralSelection {
  mode: ContentMode;
  platform: ViralPlatform;
  hook: ViralHook;
  trend: TrendableContent | null;
  starInsight: string;
  predictedScore: number;
}

const MODES: ReadonlyArray<{ key: ContentMode; label: string; emoji: string }> = [
  { key: 'viral', label: 'فيروسي', emoji: '🔥' },
  { key: 'educational', label: 'تعليمي', emoji: '📚' },
  { key: 'story', label: 'قصة', emoji: '📖' },
  { key: 'promotional', label: 'ترويجي', emoji: '🎯' },
  { key: 'trend', label: 'ترند', emoji: '🌟' },
];

const PLATFORMS: ReadonlyArray<{ key: ViralPlatform; label: string }> = [
  { key: 'tiktok', label: 'TikTok' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'snapchat', label: 'Snapchat' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'youtube_shorts', label: 'YouTube Shorts' },
  { key: 'threads', label: 'Threads' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'whatsapp_status', label: 'WhatsApp Status' },
];

export default function ViralContentPanel({ perfumeData, onApply }: ViralContentPanelProps) {
  const [mode, setMode] = useState<ContentMode>('viral');
  const [platform, setPlatform] = useState<ViralPlatform>('tiktok');
  const [hookIndex, setHookIndex] = useState(0);
  const [trendKey, setTrendKey] = useState<string | null>(null);

  const hooks = useMemo<ViralHook[]>(
    () => generateHookVariants(perfumeData, platform, mode, 3),
    [perfumeData, platform, mode],
  );

  const trends = useMemo(
    () => matchProductToTrend(perfumeData, { limit: 5 }),
    [perfumeData],
  );

  const selectedHook = hooks[Math.min(hookIndex, hooks.length - 1)] ?? hooks[0];
  const selectedTrend = trends.find((t) => t.trendKey === trendKey) ?? null;
  const starInsight = useMemo(() => getStarInsight(perfumeData), [perfumeData]);
  const blueprint = useMemo(
    () => buildViralBlueprint(perfumeData, platform, mode, hookIndex),
    [perfumeData, platform, mode, hookIndex],
  );

  const predictedScore = useMemo(
    () =>
      predictViralScore({
        hookWordCount: selectedHook?.wordCount ?? 0,
        hasStarInsight: mode === 'educational',
        matchesActiveTrend: selectedTrend?.urgency === 'now',
        platformFit: 0.85,
      }),
    [selectedHook, mode, selectedTrend],
  );

  const handleApply = (): void => {
    if (!selectedHook) return;
    onApply?.({
      mode,
      platform,
      hook: selectedHook,
      trend: selectedTrend,
      starInsight,
      predictedScore,
    });
  };

  return (
    <div
      dir="rtl"
      className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-950 to-black p-5 text-amber-50 shadow-xl"
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-wide text-amber-300">
          لوحة المحتوى الفيروسي
        </h3>
        <span className="text-xs text-amber-400/70">{perfumeData.name}</span>
      </header>

      {/* Mode selector */}
      <section className="mb-4">
        <label className="mb-2 block text-xs text-amber-400/80">اختر نمط المحتوى</label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const active = m.key === mode;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setHookIndex(0); }}
                className={[
                  'rounded-full px-3 py-1.5 text-sm transition',
                  active
                    ? 'bg-amber-500 text-black font-semibold shadow'
                    : 'bg-zinc-900 text-amber-200/80 hover:bg-zinc-800',
                ].join(' ')}
              >
                <span className="ml-1">{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Platform selector */}
      <section className="mb-4">
        <label className="mb-2 block text-xs text-amber-400/80">المنصة المستهدفة</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = p.key === platform;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => { setPlatform(p.key); setHookIndex(0); }}
                className={[
                  'rounded-md px-3 py-1 text-xs transition',
                  active
                    ? 'border border-amber-400 bg-amber-500/10 text-amber-200'
                    : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-amber-500/40',
                ].join(' ')}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Hook preview */}
      <section className="mb-4">
        <label className="mb-2 block text-xs text-amber-400/80">معاينة الـ Hook</label>
        <div className="space-y-2">
          {hooks.map((h, i) => {
            const active = i === hookIndex;
            return (
              <button
                key={`${h.text}-${i}`}
                type="button"
                onClick={() => setHookIndex(i)}
                className={[
                  'w-full rounded-lg border p-3 text-right text-sm transition',
                  active
                    ? 'border-amber-400 bg-amber-500/10 text-amber-100'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-amber-500/30',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{h.text}</span>
                  <span className="text-[10px] text-amber-400/60">{h.wordCount} كلمة</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trends */}
      {trends.length > 0 && (
        <section className="mb-4">
          <label className="mb-2 block text-xs text-amber-400/80">ربط بترند</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTrendKey(null)}
              className={[
                'rounded-md px-2 py-1 text-xs',
                trendKey === null
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-amber-200',
              ].join(' ')}
            >
              بدون ترند
            </button>
            {trends.map((t) => {
              const active = trendKey === t.trendKey;
              return (
                <button
                  key={t.trendKey}
                  type="button"
                  onClick={() => setTrendKey(t.trendKey)}
                  className={[
                    'rounded-md px-2 py-1 text-xs transition',
                    active
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'bg-zinc-900 text-amber-200/70 hover:bg-zinc-800',
                  ].join(' ')}
                  title={`Score ${t.score}/100 • ${t.urgency}`}
                >
                  {t.trendKey}
                  <span className="mr-1 text-[10px] text-amber-400/70">({t.score})</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Predicted score + insight */}
      <section className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-amber-400/80">
          <span>تنبؤ Viral Score</span>
          <span className="font-semibold text-amber-200">{predictedScore}/100</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all"
            style={{ width: `${predictedScore}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-amber-100/70">
          <span className="text-amber-300">معلومة لافتة:</span> {starInsight}
        </p>
        <p className="mt-1 text-[11px] text-zinc-500">
          الصوت: {blueprint.persona.voice} • الصيغة: {blueprint.formula.formula}
        </p>
      </section>

      <button
        type="button"
        onClick={handleApply}
        disabled={!selectedHook}
        className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      >
        تطبيق الإعداد على التوليد
      </button>
    </div>
  );
}
