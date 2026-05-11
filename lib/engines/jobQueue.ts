// ============================================================
// lib/engines/jobQueue.ts
// Background Jobs Engine — يحفظ حالة المهام الطويلة في StorageAdapter
// يحل: Vercel HTTP timeout (60s) عند توليد فيديو يأخذ 3-5 دقائق
//
// الفكرة:
//   1. POST يبدأ المهمة → يرجع jobId فوراً (HTTP 202)
//   2. المهمة تعمل في الخلفية (waitUntil/setTimeout)
//   3. GET /api/jobs/{id} يعطي الحالة الحالية
//   4. الواجهة تعمل polling خفيف
//
// Additive: لا يلمس أي client موجود.
// ============================================================

import { getStorage } from './storage';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type JobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface JobRecord<TResult = unknown, TInput = unknown> {
  id: string;
  kind: string;
  status: JobStatus;
  progress: number; // 0..100
  message?: string;
  input?: TInput;
  result?: TResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RunJobContext<TInput = unknown> {
  jobId: string;
  input: TInput;
  /** يحدّث progress + message بدون انتظار. */
  report: (progress: number, message?: string) => Promise<void>;
  /** يرمي لو المستخدم ألغى. */
  checkCancelled: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────

const TTL_SECONDS = 24 * 60 * 60;

const jobKey = (id: string): string => `mahwous:job:${id}`;

function nowIso(): string {
  return new Date().toISOString();
}

function genId(prefix = 'job'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getJob<TResult = unknown, TInput = unknown>(
  id: string,
): Promise<JobRecord<TResult, TInput> | null> {
  return getStorage().get<JobRecord<TResult, TInput>>(jobKey(id));
}

async function writeJob(rec: JobRecord): Promise<void> {
  await getStorage().set(jobKey(rec.id), rec, TTL_SECONDS);
}

async function patchJob(id: string, patch: Partial<JobRecord>): Promise<JobRecord | null> {
  const cur = await getJob(id);
  if (!cur) return null;
  const next: JobRecord = { ...cur, ...patch, updatedAt: nowIso() };
  await writeJob(next);
  return next;
}

export async function cancelJob(id: string): Promise<JobRecord | null> {
  return patchJob(id, { status: 'cancelled', completedAt: nowIso(), message: 'cancelled by user' });
}

// ─────────────────────────────────────────────────────────────
// Background runner
// ─────────────────────────────────────────────────────────────

/**
 * يطلق مهمة في الخلفية ويرجع jobId فوراً.
 * يستعمل waitUntil لو متوفر (Vercel/Edge) وإلا يطلق Promise بدون await.
 */
export async function enqueueJob<TInput, TResult>(
  kind: string,
  input: TInput,
  worker: (ctx: RunJobContext<TInput>) => Promise<TResult>,
  options: {
    jobId?: string;
    waitUntil?: (p: Promise<unknown>) => void;
  } = {},
): Promise<JobRecord<TResult, TInput>> {
  const id = options.jobId ?? genId('job');
  const initial: JobRecord<TResult, TInput> = {
    id,
    kind,
    status: 'queued',
    progress: 0,
    input,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await writeJob(initial);

  const task = (async () => {
    await patchJob(id, { status: 'running', startedAt: nowIso(), progress: 1 });

    const ctx: RunJobContext<TInput> = {
      jobId: id,
      input,
      report: async (progress, message) => {
        await patchJob(id, {
          progress: Math.max(0, Math.min(100, Math.round(progress))),
          message,
        });
      },
      checkCancelled: async () => {
        const cur = await getJob(id);
        if (cur?.status === 'cancelled') {
          throw new Error('job cancelled');
        }
      },
    };

    try {
      const result = await worker(ctx);
      await patchJob(id, {
        status: 'succeeded',
        progress: 100,
        result: result as unknown as JobRecord['result'],
        completedAt: nowIso(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const cur = await getJob(id);
      if (cur?.status === 'cancelled') return; // ignore — already cancelled
      await patchJob(id, {
        status: 'failed',
        error: msg.slice(0, 1000),
        completedAt: nowIso(),
      });
    }
  })();

  if (options.waitUntil) {
    options.waitUntil(task);
  } else {
    // Fire-and-forget — ensures the function doesn't throw unhandled
    task.catch((e) => console.error(`[jobQueue:${kind}] unhandled:`, e));
  }

  return initial;
}

/**
 * Helper: ينتظر المهمة محلياً (لاختبار، أو routes تعطي 60s مهلة).
 */
export async function waitForJob<TResult = unknown>(
  id: string,
  options: { timeoutMs?: number; pollIntervalMs?: number } = {},
): Promise<JobRecord<TResult> | null> {
  const { timeoutMs = 55_000, pollIntervalMs = 1500 } = options;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const j = await getJob<TResult>(id);
    if (!j) return null;
    if (j.status === 'succeeded' || j.status === 'failed' || j.status === 'cancelled') {
      return j;
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  return getJob<TResult>(id);
}
