// ============================================================
// lib/engines/hedraResilient.ts
// تدريع استدعاءات Hedra: retry/backoff + circuit breaker + timeout.
// Additive: غلاف اختياري حول hedraClient الأصلي بدون أي تعديل عليه.
// الاستخدام:
//   import { hedraResilient } from '@/lib/engines/hedraResilient';
//   const id = await hedraResilient.uploadImage(url);
// ============================================================

import {
  uploadImageToHedra,
  generateSharedAudio,
  createHedraVideo,
  createHedraVideoWithAssets,
  getHedraVideoStatus,
  getHedraAsset,
  type HedraGenerationResponse,
  type HedraAsset,
  type VideoAspectRatio,
} from '../hedraClient';
import {
  retryWithBackoff,
  withCircuit,
  isTransientError,
  type RetryOptions,
} from './resilience';

const CIRCUIT_KEY = 'hedra';

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 4,
  baseDelayMs: 800,
  maxDelayMs: 10_000,
  factor: 2,
  jitter: 0.3,
  shouldRetry: isTransientError,
  perAttemptTimeoutMs: 45_000,
  onRetry: (err, attempt, delay) => {
    console.warn(`[hedra-resilient] attempt ${attempt} failed (retry in ${delay}ms):`,
      err instanceof Error ? err.message : err);
  },
};

function resilient<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  retry: RetryOptions = DEFAULT_RETRY,
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) =>
    withCircuit(CIRCUIT_KEY, () => retryWithBackoff(() => fn(...args), retry));
}

export const hedraResilient = {
  uploadImage: resilient<[string], string>(uploadImageToHedra),
  generateAudio: resilient<[string], string>(generateSharedAudio),
  createVideo: resilient<
    [{
      imageUrl: string; voiceoverText: string; aspectRatio: VideoAspectRatio; voiceId?: string;
    }],
    HedraGenerationResponse
  >(createHedraVideo),
  createVideoWithAssets: resilient<
    [{
      imageAssetId: string; audioAssetId: string; voiceoverText: string; aspectRatio: VideoAspectRatio;
    }],
    HedraGenerationResponse
  >(createHedraVideoWithAssets),
  /** Status polling — retries أقل لأنه سريع ومتكرر */
  getStatus: resilient<[string], HedraGenerationResponse>(getHedraVideoStatus, {
    ...DEFAULT_RETRY,
    maxAttempts: 2,
    perAttemptTimeoutMs: 15_000,
  }),
  getAsset: resilient<[string], HedraAsset>(getHedraAsset),
};

export { CIRCUIT_KEY as HEDRA_CIRCUIT_KEY };
