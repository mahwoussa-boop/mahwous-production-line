// ============================================================
// lib/engines/viralPerformanceTracker.ts
// تتبع أداء الكابشنات الفيروسية + استخراج الأنماط الناجحة
// Additive: مستقل عن selfLearningEngine الموجود.
// In-memory store — يصلح للـ analytics قصيرة المدى.
// ============================================================

import type {
  HookCategory,
  PersonaVoice,
  ViralPlatform,
  ContentMode,
} from './viralContentEngine';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PerformanceMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clickThrough?: number;
}

export interface PerformanceRecord {
  captionId: string;
  perfumeName: string;
  platform: ViralPlatform;
  hook: string;
  hookCategory: HookCategory;
  contentMode: ContentMode;
  persona: PersonaVoice;
  metrics: PerformanceMetrics;
  viralScore: number; // 0..100
  generatedAt: string; // ISO
  recordedAt: string; // ISO
}

export interface PatternInsight {
  bestHookCategories: Array<{ category: HookCategory; avgScore: number; count: number }>;
  bestPersonas: Array<{ persona: PersonaVoice; avgScore: number; count: number }>;
  bestContentModes: Array<{ mode: ContentMode; avgScore: number; count: number }>;
  bestPlatforms: Array<{ platform: ViralPlatform; avgScore: number; count: number }>;
  topHooks: Array<{ hook: string; score: number; platform: ViralPlatform }>;
  sampleSize: number;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

const STORE: PerformanceRecord[] = [];
const MAX_RECORDS = 5000;

export function recordPerformance(rec: Omit<PerformanceRecord, 'recordedAt'>): PerformanceRecord {
  const full: PerformanceRecord = { ...rec, recordedAt: new Date().toISOString() };
  STORE.push(full);
  if (STORE.length > MAX_RECORDS) STORE.shift();
  return full;
}

export function getAllRecords(): readonly PerformanceRecord[] {
  return STORE;
}

export function clearRecords(): void {
  STORE.length = 0;
}

// ─────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────

/**
 * يحوّل metrics خام إلى viral score 0..100 بأوزان معقولة.
 * يستخدم نسبة التفاعل لمنع تشويه views العالية بدون تفاعل.
 */
export function computeViralScore(m: PerformanceMetrics): number {
  const views = m.views ?? 0;
  const likes = m.likes ?? 0;
  const comments = m.comments ?? 0;
  const shares = m.shares ?? 0;
  const saves = m.saves ?? 0;
  const ctr = m.clickThrough ?? 0;

  if (views <= 0 && likes <= 0) return 0;

  const reach = Math.log10(Math.max(views, 1)) * 12; // up to ~60
  const engagementRate = views > 0
    ? (likes + comments * 3 + shares * 5 + saves * 4) / views
    : 0;
  const engagement = Math.min(30, engagementRate * 1000);
  const ctrBoost = Math.min(10, ctr * 100);

  return Math.max(0, Math.min(100, Math.round(reach + engagement + ctrBoost)));
}

// ─────────────────────────────────────────────────────────────
// Pattern Analysis
// ─────────────────────────────────────────────────────────────

interface Bucket { sum: number; count: number }

function pushBucket<K extends string>(map: Map<K, Bucket>, key: K, score: number): void {
  const b = map.get(key);
  if (b) { b.sum += score; b.count += 1; }
  else map.set(key, { sum: score, count: 1 });
}

function rankBuckets<K extends string, T>(
  map: Map<K, Bucket>,
  build: (k: K, avg: number, count: number) => T,
): T[] {
  return Array.from(map.entries())
    .map(([k, b]) => ({ k, avg: b.count ? b.sum / b.count : 0, count: b.count }))
    .sort((a, b) => b.avg - a.avg)
    .map(({ k, avg, count }) => build(k, avg, count));
}

export function analyzeTopPerformers(
  records: readonly PerformanceRecord[] = STORE,
  limit = 30,
): PatternInsight {
  const recent = records.slice(-Math.max(limit, 1));

  const hookMap = new Map<HookCategory, Bucket>();
  const personaMap = new Map<PersonaVoice, Bucket>();
  const modeMap = new Map<ContentMode, Bucket>();
  const platformMap = new Map<ViralPlatform, Bucket>();

  for (const r of recent) {
    pushBucket(hookMap, r.hookCategory, r.viralScore);
    pushBucket(personaMap, r.persona, r.viralScore);
    pushBucket(modeMap, r.contentMode, r.viralScore);
    pushBucket(platformMap, r.platform, r.viralScore);
  }

  const topHooks = [...recent]
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 10)
    .map((r) => ({ hook: r.hook, score: r.viralScore, platform: r.platform }));

  return {
    bestHookCategories: rankBuckets(hookMap, (category, avgScore, count) => ({ category, avgScore, count })),
    bestPersonas: rankBuckets(personaMap, (persona, avgScore, count) => ({ persona, avgScore, count })),
    bestContentModes: rankBuckets(modeMap, (mode, avgScore, count) => ({ mode, avgScore, count })),
    bestPlatforms: rankBuckets(platformMap, (platform, avgScore, count) => ({ platform, avgScore, count })),
    topHooks,
    sampleSize: recent.length,
  };
}

// ─────────────────────────────────────────────────────────────
// Auto-Optimize Hint — يُستخدم لتغذية prompts المستقبلية
// ─────────────────────────────────────────────────────────────

export interface OptimizationHint {
  preferredHookCategory: HookCategory | null;
  preferredPersona: PersonaVoice | null;
  preferredMode: ContentMode | null;
  confidence: number; // 0..1
  rationale: string;
}

// ─────────────────────────────────────────────────────────────
// Async API — مدعومة بـ StorageAdapter (Memory افتراضياً، KV لو متاح)
// تبقى الـ sync API أعلاه للـ backward compat.
// ─────────────────────────────────────────────────────────────

const STORAGE_LIST_KEY = 'mahwous:viral:performance';
const STORAGE_MAX = 5000;

import { getStorage } from './storage';

export async function recordPerformanceAsync(
  rec: Omit<PerformanceRecord, 'recordedAt'>,
): Promise<PerformanceRecord> {
  const full: PerformanceRecord = { ...rec, recordedAt: new Date().toISOString() };
  await getStorage().push(STORAGE_LIST_KEY, full, STORAGE_MAX);
  return full;
}

export async function getAllRecordsAsync(limit = STORAGE_MAX): Promise<PerformanceRecord[]> {
  return getStorage().range<PerformanceRecord>(STORAGE_LIST_KEY, limit);
}

export async function analyzeTopPerformersAsync(limit = 30): Promise<PatternInsight> {
  const records = await getAllRecordsAsync(limit);
  return analyzeTopPerformers(records, limit);
}

export async function buildOptimizationHintAsync(
  platform: ViralPlatform,
  limit = STORAGE_MAX,
): Promise<OptimizationHint> {
  const records = await getAllRecordsAsync(limit);
  return buildOptimizationHint(platform, records);
}

export function buildOptimizationHint(
  platform: ViralPlatform,
  records: readonly PerformanceRecord[] = STORE,
): OptimizationHint {
  const filtered = records.filter((r) => r.platform === platform);
  if (filtered.length < 3) {
    return {
      preferredHookCategory: null,
      preferredPersona: null,
      preferredMode: null,
      confidence: 0,
      rationale: 'بيانات غير كافية — لا تطبيق للتحسين بعد',
    };
  }

  const insight = analyzeTopPerformers(filtered, filtered.length);
  const top = (arr: { count: number }[]): boolean => arr.length > 0 && arr[0].count >= 2;

  const confidence = Math.min(1, filtered.length / 20);
  return {
    preferredHookCategory: top(insight.bestHookCategories) ? insight.bestHookCategories[0].category : null,
    preferredPersona: top(insight.bestPersonas) ? insight.bestPersonas[0].persona : null,
    preferredMode: top(insight.bestContentModes) ? insight.bestContentModes[0].mode : null,
    confidence,
    rationale: `استند على ${filtered.length} منشور — أعلى متوسط ${insight.bestHookCategories[0]?.avgScore.toFixed(1) ?? 'N/A'}`,
  };
}
