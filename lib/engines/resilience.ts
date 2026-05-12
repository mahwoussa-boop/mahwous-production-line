// ============================================================
// lib/engines/resilience.ts
// أدوات تدريع API: Exponential Backoff + Timeout + Circuit Breaker خفيف
// Additive: مستقل، لا يستورده أحد بعد. اختياري للاستخدام في clients.
// ============================================================

// ─────────────────────────────────────────────────────────────
// Retry with Exponential Backoff + Jitter
// ─────────────────────────────────────────────────────────────

export interface RetryOptions {
  /** أقصى عدد محاولات (المحاولة الأولى محسوبة). افتراضي 4. */
  maxAttempts?: number;
  /** التأخير الأولي بالميلي ثانية. افتراضي 500. */
  baseDelayMs?: number;
  /** أقصى تأخير بين المحاولات. افتراضي 8000. */
  maxDelayMs?: number;
  /** عامل المضاعفة. افتراضي 2. */
  factor?: number;
  /** نسبة jitter بين 0..1. افتراضي 0.3. */
  jitter?: number;
  /** يحدد ما إذا كان الخطأ يستحق إعادة المحاولة. افتراضي: true لكل خطأ. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** مهلة قصوى لكل محاولة منفردة. افتراضي بدون. */
  perAttemptTimeoutMs?: number;
  /** يُستدعى قبل كل إعادة محاولة (للتسجيل). */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export class TimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Operation exceeded ${timeoutMs}ms timeout`);
    this.name = 'TimeoutError';
  }
}

export class RetryExhaustedError extends Error {
  constructor(public readonly attempts: number, public readonly lastError: unknown) {
    super(`Retry exhausted after ${attempts} attempt(s): ${describeError(lastError)}`);
    this.name = 'RetryExhaustedError';
  }
}

function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('aborted'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    }, { once: true });
  });
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

/**
 * يشغّل دالة async مع Exponential Backoff + Jitter.
 * يحفظ آخر خطأ ويُلقي RetryExhaustedError عند الفشل النهائي.
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 4,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    factor = 2,
    jitter = 0.3,
    shouldRetry = () => true,
    perAttemptTimeoutMs,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const exec = fn(attempt);
      return perAttemptTimeoutMs ? await withTimeout(exec, perAttemptTimeoutMs) : await exec;
    } catch (err) {
      lastError = err;
      if (attempt >= maxAttempts || !shouldRetry(err, attempt)) {
        throw new RetryExhaustedError(attempt, err);
      }
      const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(factor, attempt - 1));
      const jitterDelta = exp * jitter * (Math.random() * 2 - 1);
      const delay = Math.max(0, Math.round(exp + jitterDelta));
      onRetry?.(err, attempt, delay);
      await sleep(delay);
    }
  }
  throw new RetryExhaustedError(maxAttempts, lastError);
}

// ─────────────────────────────────────────────────────────────
// Common shouldRetry predicates
// ─────────────────────────────────────────────────────────────

/** يعيد المحاولة على 429/5xx/timeout/network فقط. */
export function isTransientError(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (/timeout|etimedout|econnreset|econnrefused|enotfound|network/.test(msg)) return true;
    const status = (error as Error & { status?: number }).status;
    if (typeof status === 'number') {
      return status === 408 || status === 425 || status === 429 || (status >= 500 && status < 600);
    }
    if (/\b(429|5\d\d)\b/.test(msg)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// Lightweight Circuit Breaker (in-memory, per-key)
// ─────────────────────────────────────────────────────────────

type CircuitState = 'closed' | 'open' | 'half_open';

interface CircuitData {
  state: CircuitState;
  failures: number;
  openedAt: number;
}

const CIRCUITS = new Map<string, CircuitData>();

export interface CircuitOptions {
  failureThreshold?: number; // افتراضي 5
  cooldownMs?: number; // افتراضي 30s
}

export class CircuitOpenError extends Error {
  constructor(public readonly key: string) {
    super(`Circuit '${key}' is OPEN — refusing call`);
    this.name = 'CircuitOpenError';
  }
}

export async function withCircuit<T>(
  key: string,
  fn: () => Promise<T>,
  options: CircuitOptions = {},
): Promise<T> {
  const { failureThreshold = 5, cooldownMs = 30_000 } = options;
  const data = CIRCUITS.get(key) ?? { state: 'closed', failures: 0, openedAt: 0 };

  if (data.state === 'open') {
    if (Date.now() - data.openedAt >= cooldownMs) {
      data.state = 'half_open';
    } else {
      throw new CircuitOpenError(key);
    }
  }

  try {
    const result = await fn();
    if (data.state !== 'closed') {
      data.state = 'closed';
      data.failures = 0;
      data.openedAt = 0;
    }
    CIRCUITS.set(key, data);
    return result;
  } catch (err) {
    data.failures += 1;
    if (data.state === 'half_open' || data.failures >= failureThreshold) {
      data.state = 'open';
      data.openedAt = Date.now();
    }
    CIRCUITS.set(key, data);
    throw err;
  }
}

export function getCircuitState(key: string): CircuitState {
  return CIRCUITS.get(key)?.state ?? 'closed';
}

export function resetCircuit(key: string): void {
  CIRCUITS.delete(key);
}

export interface CircuitSnapshot {
  key: string;
  state: CircuitState;
  failures: number;
  openedAt: number;
  openedSecondsAgo: number | null;
}

export function listCircuits(): CircuitSnapshot[] {
  const now = Date.now();
  return Array.from(CIRCUITS.entries()).map(([key, d]) => ({
    key,
    state: d.state,
    failures: d.failures,
    openedAt: d.openedAt,
    openedSecondsAgo: d.openedAt ? Math.round((now - d.openedAt) / 1000) : null,
  }));
}

// ─────────────────────────────────────────────────────────────
// Resilient Fetch — fetch + timeout + retry على transient errors
// يحتفظ بنفس signature الـ fetch القياسي
// ─────────────────────────────────────────────────────────────

export interface ResilientFetchOptions extends RequestInit {
  timeoutMs?: number;
  retry?: RetryOptions;
}

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly body: string) {
    super(`HTTP ${status}: ${body.slice(0, 200)}`);
    this.name = 'HttpError';
  }
}

/**
 * يلف fetch بـ AbortSignal للـ timeout + retry على 429/5xx/network.
 * يرمي HttpError للحالات غير القابلة لإعادة المحاولة (4xx غير 408/425/429).
 */
export async function resilientFetch(
  input: string | URL,
  options: ResilientFetchOptions = {},
): Promise<Response> {
  const { timeoutMs = 30_000, retry, ...init } = options;

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const userSignal = init.signal;
        if (userSignal) {
          userSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }
        const res = await fetch(input, { ...init, signal: controller.signal });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          const err = new HttpError(res.status, body);
          if (res.status === 408 || res.status === 425 || res.status === 429 || res.status >= 500) {
            throw err;
          }
          // 4xx non-retryable
          throw Object.assign(err, { __noRetry: true });
        }
        return res;
      } finally {
        clearTimeout(timer);
      }
    },
    {
      maxAttempts: retry?.maxAttempts ?? 4,
      baseDelayMs: retry?.baseDelayMs ?? 600,
      maxDelayMs: retry?.maxDelayMs ?? 8000,
      factor: retry?.factor ?? 2,
      jitter: retry?.jitter ?? 0.3,
      onRetry: retry?.onRetry,
      shouldRetry: retry?.shouldRetry ?? ((err) => {
        if ((err as { __noRetry?: boolean }).__noRetry) return false;
        return isTransientError(err);
      }),
    },
  );
}

export async function resilientJsonFetch<T = unknown>(
  input: string | URL,
  options: ResilientFetchOptions = {},
): Promise<T> {
  const res = await resilientFetch(input, options);
  return res.json() as Promise<T>;
}
