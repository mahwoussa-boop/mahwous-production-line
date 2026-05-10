'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Info, ExternalLink } from 'lucide-react';

interface LoraConfigProps {
  loraPath: string;
  loraTriggerWord: string;
  onLoraPathChange: (v: string) => void;
  onTriggerWordChange: (v: string) => void;
}

export default function LoraConfig({
  loraPath,
  loraTriggerWord,
  onLoraPathChange,
  onTriggerWordChange,
}: LoraConfigProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--obsidian-border)] overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4
                   hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-[var(--gold)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            إعدادات LoRA — ثبات الوجه
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold-muted)] text-[var(--gold)] uppercase tracking-wide">
            متقدم
          </span>
          {loraPath && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              ✓ مُفعَّل
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-[var(--text-muted)]" />
        ) : (
          <ChevronDown size={14} className="text-[var(--text-muted)]" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-[var(--obsidian-border)]">
          {/* Info banner */}
          <div className="flex items-start gap-2 bg-[var(--gold-muted)] rounded-xl p-3 mt-4">
            <Info size={13} className="text-[var(--gold)] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-[var(--gold)]">LoRA على Fal.ai</strong> — درّب نموذجًا على
                وجه الشخصية باستخدام{' '}
                <a
                  href="https://fal.ai/models/fal-ai/flux-lora-fast-training"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--gold)] underline underline-offset-2 inline-flex items-center gap-0.5"
                >
                  Fal.ai LoRA Trainer
                  <ExternalLink size={10} />
                </a>
                {' '}باستخدام 15–20 صورة، ثم الصق رابط الـ LoRA هنا.
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                الرابط يكون بصيغة: https://huggingface.co/.../model.safetensors
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* LoRA URL */}
            <div className="space-y-2">
              <p className="section-label">رابط LoRA (.safetensors)</p>
              <input
                type="url"
                className="luxury-input text-sm font-mono"
                placeholder="https://huggingface.co/you/arab-man-lora/resolve/main/lora.safetensors"
                value={loraPath}
                onChange={(e) => onLoraPathChange(e.target.value)}
                dir="ltr"
              />
            </div>

            {/* Trigger word */}
            <div className="space-y-2">
              <p className="section-label">الكلمة المُحفّزة (Trigger Word)</p>
              <input
                type="text"
                className="luxury-input text-sm"
                placeholder="مثال: arabman, TOK, sks person"
                value={loraTriggerWord}
                onChange={(e) => onTriggerWordChange(e.target.value)}
                dir="ltr"
              />
              <p className="text-[10px] text-[var(--text-muted)]">
                ستُضاف تلقائيًا في <strong className="text-[var(--gold)]">بداية</strong> البرومبت لأعلى تأثير
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
