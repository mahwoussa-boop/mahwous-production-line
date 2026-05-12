// ============================================================
// app/api/admin/health/route.ts
// GET  → نظرة شاملة على صحة الأنظمة:
//   - حالة كل Circuit Breaker (open/closed/half_open + متى انفتح)
//   - نوع التخزين المُستخدم (memory|kv)
//   - وجود متغيرات البيئة الحرجة (boolean فقط — لا قيم)
//   - sample size من سجلات الأداء
// DELETE → reset all circuits (للطوارئ / النشر اليدوي)
//
// Additive: لا يلمس أي شيء موجود.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { listCircuits, resetCircuit } from '@/lib/engines/resilience';
import { getStorage } from '@/lib/engines/storage';
import { getAllRecords } from '@/lib/engines/viralPerformanceTracker';

export const dynamic = 'force-dynamic';

const SECRETS_TO_CHECK = [
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'FAL_KEY',
  'HEDRA_API_KEY',
  'ELEVENLABS_API_KEY',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

export async function GET(_request: NextRequest) {
  const circuits = listCircuits();
  const storage = getStorage();
  const recs = getAllRecords();

  const envFlags: Record<string, boolean> = {};
  for (const k of SECRETS_TO_CHECK) envFlags[k] = Boolean(process.env[k]);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: storage.kind,
    circuits,
    openCircuits: circuits.filter((c) => c.state === 'open').map((c) => c.key),
    performance: {
      inMemoryRecords: recs.length,
    },
    env: envFlags,
    notes: {
      ifAllOpen: 'تحقق من API keys وحدود المعدل لكل مزود',
      resetCmd: 'DELETE /api/admin/health → يصفّر كل الـ circuits',
    },
  }, { status: 200 });
}

export async function DELETE(_request: NextRequest) {
  const before = listCircuits();
  for (const c of before) resetCircuit(c.key);
  return NextResponse.json({
    status: 'reset',
    cleared: before.length,
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}
