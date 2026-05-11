// ============================================================
// lib/engines/storage.ts
// Storage Adapter — يفصل المنطق عن التخزين الفعلي.
// التطبيقات: Memory (افتراضي) | Vercel KV | Upstash Redis (REST).
// يتم اختيار التطبيق تلقائياً بناءً على متغيرات البيئة:
//   - KV_REST_API_URL + KV_REST_API_TOKEN          → Vercel KV / Upstash REST
//   - بدون ذلك                                       → Memory
// Additive: لا اعتماديات خارجية. يستعمل fetch المتوفر في Edge/Node 18+.
// ============================================================

import { resilientFetch } from './resilience';

// ─────────────────────────────────────────────────────────────
// Public Interface
// ─────────────────────────────────────────────────────────────

export interface StorageAdapter {
  readonly kind: 'memory' | 'kv';
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  /** أضف لنهاية قائمة (لتسجيلات الأداء). */
  push<T = unknown>(listKey: string, value: T, maxLen?: number): Promise<void>;
  /** اقرأ آخر N عنصر من قائمة. */
  range<T = unknown>(listKey: string, count: number): Promise<T[]>;
  /** عدد عناصر القائمة. */
  size(listKey: string): Promise<number>;
}

// ─────────────────────────────────────────────────────────────
// Memory Implementation
// ─────────────────────────────────────────────────────────────

interface KVEntry { value: unknown; expiresAt: number | null }

class MemoryAdapter implements StorageAdapter {
  readonly kind = 'memory' as const;
  private kv = new Map<string, KVEntry>();
  private lists = new Map<string, unknown[]>();

  async get<T>(key: string): Promise<T | null> {
    const e = this.kv.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && e.expiresAt < Date.now()) {
      this.kv.delete(key);
      return null;
    }
    return e.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.kv.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.kv.delete(key);
    this.lists.delete(key);
  }

  async push<T>(listKey: string, value: T, maxLen?: number): Promise<void> {
    const list = this.lists.get(listKey) ?? [];
    list.push(value);
    if (maxLen && list.length > maxLen) list.splice(0, list.length - maxLen);
    this.lists.set(listKey, list);
  }

  async range<T>(listKey: string, count: number): Promise<T[]> {
    const list = (this.lists.get(listKey) ?? []) as T[];
    return list.slice(-count);
  }

  async size(listKey: string): Promise<number> {
    return (this.lists.get(listKey)?.length) ?? 0;
  }
}

// ─────────────────────────────────────────────────────────────
// KV REST Implementation (Vercel KV / Upstash compatible)
// API ref: POST {url}/pipeline accepts array of command arrays.
// ─────────────────────────────────────────────────────────────

class KvRestAdapter implements StorageAdapter {
  readonly kind = 'kv' as const;
  constructor(private readonly baseUrl: string, private readonly token: string) {}

  private async cmd<T = unknown>(args: (string | number)[]): Promise<T> {
    const res = await resilientFetch(`${this.baseUrl}/${args.map(encodeURIComponent).join('/')}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.token}` },
      timeoutMs: 8_000,
      retry: { maxAttempts: 3, baseDelayMs: 400 },
    });
    const json = await res.json() as { result?: T; error?: string };
    if (json.error) throw new Error(`KV error: ${json.error}`);
    return json.result as T;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.cmd<string | null>(['get', key]);
    if (raw === null || raw === undefined) return null;
    try { return JSON.parse(raw) as T; }
    catch { return raw as unknown as T; }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const args: (string | number)[] = ['set', key, serialized];
    if (ttlSeconds) { args.push('ex', ttlSeconds); }
    await this.cmd(args);
  }

  async delete(key: string): Promise<void> {
    await this.cmd(['del', key]);
  }

  async push<T>(listKey: string, value: T, maxLen?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.cmd(['rpush', listKey, serialized]);
    if (maxLen && maxLen > 0) {
      await this.cmd(['ltrim', listKey, -maxLen, -1]);
    }
  }

  async range<T>(listKey: string, count: number): Promise<T[]> {
    const raw = await this.cmd<string[]>(['lrange', listKey, -count, -1]);
    if (!Array.isArray(raw)) return [];
    return raw.map((s) => {
      try { return JSON.parse(s) as T; } catch { return s as unknown as T; }
    });
  }

  async size(listKey: string): Promise<number> {
    const raw = await this.cmd<number>(['llen', listKey]);
    return typeof raw === 'number' ? raw : 0;
  }
}

// ─────────────────────────────────────────────────────────────
// Factory + singleton
// ─────────────────────────────────────────────────────────────

let _singleton: StorageAdapter | null = null;

export function createStorage(): StorageAdapter {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return new KvRestAdapter(url.replace(/\/$/, ''), token);
  return new MemoryAdapter();
}

export function getStorage(): StorageAdapter {
  if (!_singleton) _singleton = createStorage();
  return _singleton;
}

/** للاختبار فقط — يستبدل الـ singleton. */
export function __setStorageForTests(s: StorageAdapter | null): void {
  _singleton = s;
}
