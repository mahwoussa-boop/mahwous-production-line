'use client';

import { useState } from 'react';
import { Copy, Check, Video, Zap, Mic, Target } from 'lucide-react';
import type { VideoScenario } from '@/lib/types';

interface ScenarioDisplayProps {
  scenarios: VideoScenario[];
}

const PLATFORM_COLORS: Record<string, string> = {
  'TikTok': '#010101',
  'Instagram Reels': '#E1306C',
  'YouTube Shorts': '#FF0000',
};

const PLATFORM_ICONS: Record<string, string> = {
  'TikTok': '🎵',
  'Instagram Reels': '📸',
  'YouTube Shorts': '▶️',
};

function ScenarioCard({ scenario }: { scenario: VideoScenario }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const color = PLATFORM_COLORS[scenario.platform] || '#888';
  const icon = PLATFORM_ICONS[scenario.platform] || '🎬';

  return (
    <div className="glass-card p-5 space-y-4 border border-[var(--obsidian-border)] rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h4 className="font-bold text-[var(--text-primary)]">{scenario.platform}</h4>
          <p className="text-xs text-[var(--text-muted)]">سيناريو ترند احترافي</p>
        </div>
      </div>

      {/* Hook */}
      <div className="bg-black/20 rounded-xl p-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-yellow-400">
            <Zap size={12} />
            <span>الهوك (أول 3 ثواني)</span>
          </div>
          <button
            onClick={() => copyToClipboard(scenario.hook, 'hook')}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors flex items-center gap-1"
          >
            {copied === 'hook' ? <Check size={10} /> : <Copy size={10} />}
            {copied === 'hook' ? 'تم' : 'نسخ'}
          </button>
        </div>
        <p className="text-sm text-white font-medium">{scenario.hook}</p>
      </div>

      {/* Action */}
      <div className="bg-black/20 rounded-xl p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-blue-400">
          <Video size={12} />
          <span>الحركة والمشهد</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{scenario.action}</p>
      </div>

      {/* Voiceover */}
      <div className="bg-black/20 rounded-xl p-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Mic size={12} />
            <span>نص الصوت (صوت عربي سعودي)</span>
          </div>
          <button
            onClick={() => copyToClipboard(scenario.voiceover, 'voiceover')}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors flex items-center gap-1"
          >
            {copied === 'voiceover' ? <Check size={10} /> : <Copy size={10} />}
            {copied === 'voiceover' ? 'تم' : 'نسخ'}
          </button>
        </div>
        <p className="text-sm text-white">{scenario.voiceover}</p>
      </div>

      {/* CTA */}
      <div className="bg-black/20 rounded-xl p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-orange-400">
          <Target size={12} />
          <span>نداء الفعل (CTA)</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{scenario.cta}</p>
      </div>
    </div>
  );
}

export default function ScenarioDisplay({ scenarios }: ScenarioDisplayProps) {
  if (!scenarios || scenarios.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="gold-divider flex-1" />
        <p className="section-label mb-0 px-2">سيناريوهات الفيديو الترند</p>
        <div className="gold-divider flex-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario, i) => (
          <ScenarioCard key={i} scenario={scenario} />
        ))}
      </div>
    </div>
  );
}
