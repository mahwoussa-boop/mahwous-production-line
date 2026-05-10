'use client';

import { CheckCircle2, Circle, Loader2, XCircle, SkipForward, DollarSign } from 'lucide-react';
import type { PipelineStep } from '@/lib/pipeline/pipelineTypes';

interface PipelineProgressProps {
  steps: PipelineStep[];
  totalEstimatedCost: number;
  totalActualCost: number;
}

export default function PipelineProgress({ steps, totalEstimatedCost, totalActualCost }: PipelineProgressProps) {
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const activeSteps = steps.filter(s => s.status !== 'skipped').length;
  const percentage = activeSteps > 0 ? Math.round((completedSteps / activeSteps) * 100) : 0;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[var(--gold)]">تقدم خط الإنتاج</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">{completedSteps}/{activeSteps} خطوة</span>
          <span className="text-sm font-bold text-[var(--gold)]">{percentage}%</span>
        </div>
      </div>

      <div className="w-full h-2 bg-[var(--obsidian-light)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--gold)] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2 mt-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
              step.status === 'in_progress' ? 'bg-[var(--gold)]/10 border border-[var(--gold)]/30' :
              step.status === 'completed' ? 'opacity-70' :
              step.status === 'failed' ? 'bg-red-500/10 border border-red-500/30' :
              step.status === 'skipped' ? 'opacity-40' : ''
            }`}
          >
            {/* Status Icon */}
            {step.status === 'completed' && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
            {step.status === 'in_progress' && <Loader2 size={16} className="text-[var(--gold)] animate-spin shrink-0" />}
            {step.status === 'failed' && <XCircle size={16} className="text-red-400 shrink-0" />}
            {step.status === 'skipped' && <SkipForward size={16} className="text-[var(--text-muted)] shrink-0" />}
            {step.status === 'pending' && <Circle size={16} className="text-[var(--text-muted)] shrink-0" />}

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{step.labelAr}</p>
              {step.error && (
                <p className="text-[10px] text-red-400 mt-0.5 truncate">{step.error}</p>
              )}
            </div>

            {/* Cost */}
            {step.costEstimate !== undefined && step.costEstimate > 0 && step.status !== 'skipped' && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                ${step.actualCost?.toFixed(2) || step.costEstimate.toFixed(2)}
              </span>
            )}

            {/* Progress */}
            {step.status === 'in_progress' && step.progress > 0 && (
              <span className="text-[10px] text-[var(--gold)] font-mono shrink-0">{step.progress}%</span>
            )}
          </div>
        ))}
      </div>

      {/* Cost Summary */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--obsidian-border)]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <DollarSign size={12} />
          <span>التكلفة التقديرية</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-[var(--gold)]">${totalActualCost.toFixed(2)}</span>
          <span className="text-[10px] text-[var(--text-muted)]"> / ${totalEstimatedCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
