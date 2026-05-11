// ============================================================
// lib/engines/validate.ts
// Runtime validator خفيف بدون اعتمادية خارجية.
// يستبدل zod في حالات بسيطة (تحقق مدخلات API).
// ============================================================

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

type Primitive = 'string' | 'number' | 'boolean';

interface FieldRule {
  type: Primitive;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: readonly string[];
}

export type Schema = Readonly<Record<string, FieldRule>>;

function getPath(input: unknown, key: string): unknown {
  if (input && typeof input === 'object') {
    return (input as Record<string, unknown>)[key];
  }
  return undefined;
}

export function validate<T>(input: unknown, schema: Schema): ValidationResult<T> {
  const issues: ValidationIssue[] = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, issues: [{ path: '$', message: 'expected object' }] };
  }

  const out: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const raw = getPath(input, key);

    if (raw === undefined || raw === null) {
      if (rule.required) issues.push({ path: key, message: 'required' });
      continue;
    }

    if (rule.type === 'string' && typeof raw !== 'string') {
      issues.push({ path: key, message: 'expected string' });
      continue;
    }
    if (rule.type === 'number' && typeof raw !== 'number') {
      issues.push({ path: key, message: 'expected number' });
      continue;
    }
    if (rule.type === 'boolean' && typeof raw !== 'boolean') {
      issues.push({ path: key, message: 'expected boolean' });
      continue;
    }

    if (rule.type === 'string') {
      const s = raw as string;
      if (rule.min !== undefined && s.length < rule.min) {
        issues.push({ path: key, message: `min length ${rule.min}` });
      }
      if (rule.max !== undefined && s.length > rule.max) {
        issues.push({ path: key, message: `max length ${rule.max}` });
      }
      if (rule.pattern && !rule.pattern.test(s)) {
        issues.push({ path: key, message: 'pattern mismatch' });
      }
      if (rule.enum && !rule.enum.includes(s)) {
        issues.push({ path: key, message: `must be one of ${rule.enum.join('|')}` });
      }
    }

    if (rule.type === 'number') {
      const n = raw as number;
      if (rule.min !== undefined && n < rule.min) issues.push({ path: key, message: `min ${rule.min}` });
      if (rule.max !== undefined && n > rule.max) issues.push({ path: key, message: `max ${rule.max}` });
    }

    out[key] = raw;
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: out as T };
}

// ─────────────────────────────────────────────────────────────
// Schemas جاهزة
// ─────────────────────────────────────────────────────────────

export const PERFUME_DATA_SCHEMA: Schema = {
  name: { type: 'string', required: true, min: 1, max: 200 },
  brand: { type: 'string', required: false, max: 200 },
  gender: { type: 'string', required: false, enum: ['men', 'women', 'unisex'] },
  notes: { type: 'string', required: false, max: 2000 },
  description: { type: 'string', required: false, max: 5000 },
  imageUrl: { type: 'string', required: false, max: 1000 },
  price: { type: 'string', required: false, max: 100 },
};

export const VIRAL_MODE_VALUES = ['viral', 'educational', 'story', 'promotional', 'trend'] as const;
export const VIRAL_PLATFORM_VALUES = [
  'instagram', 'tiktok', 'twitter', 'snapchat', 'youtube_shorts',
  'threads', 'pinterest', 'telegram', 'whatsapp_status',
  'google_business', 'linkedin', 'facebook',
] as const;

/** يتحقق من حقول caption request السطحية ويرجع issues ودودة. */
export function validateCaptionRequest(body: unknown): ValidationResult<{
  vibe: string; attire: string; productUrl: string;
  viralMode?: string; viralPlatform?: string;
}> {
  const top = validate<{
    vibe: string; attire: string; productUrl: string;
    viralMode?: string; viralPlatform?: string;
  }>(body, {
    vibe: { type: 'string', required: false, max: 100 },
    attire: { type: 'string', required: false, max: 100 },
    productUrl: { type: 'string', required: false, max: 1000 },
    viralMode: { type: 'string', required: false, enum: VIRAL_MODE_VALUES },
    viralPlatform: { type: 'string', required: false, enum: VIRAL_PLATFORM_VALUES },
  });
  if (!top.ok) return top;

  const perfume = (body as { perfumeData?: unknown })?.perfumeData;
  const sub = validate(perfume, PERFUME_DATA_SCHEMA);
  if (!sub.ok) {
    return {
      ok: false,
      issues: sub.issues.map((i) => ({ path: `perfumeData.${i.path}`, message: i.message })),
    };
  }
  return top;
}

export function formatIssues(issues: ValidationIssue[]): string {
  return issues.map((i) => `${i.path}: ${i.message}`).join('; ');
}
