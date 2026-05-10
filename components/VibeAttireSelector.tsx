'use client';

import { getVibeOptions, getAttireOptions } from '@/lib/vibeOptions';
import { Palette, Shirt } from 'lucide-react';

interface VibeAttireSelectorProps {
  vibe: string;
  attire: string;
  onVibeChange: (value: string) => void;
  onAttireChange: (value: string) => void;
}

export default function VibeAttireSelector({
  vibe,
  attire,
  onVibeChange,
  onAttireChange,
}: VibeAttireSelectorProps) {
  const vibeOptions = getVibeOptions();
  const attireOptions = getAttireOptions();

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Vibe selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette size={13} className="text-[var(--gold)]" />
          <p className="section-label mb-0">الأجواء والخلفية</p>
        </div>
        <select
          className="luxury-input"
          value={vibe}
          onChange={(e) => onVibeChange(e.target.value)}
        >
          {vibeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.arabicLabel} — {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Attire selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shirt size={13} className="text-[var(--gold)]" />
          <p className="section-label mb-0">الزي والمظهر</p>
        </div>
        <select
          className="luxury-input"
          value={attire}
          onChange={(e) => onAttireChange(e.target.value)}
        >
          {attireOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.arabicLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
