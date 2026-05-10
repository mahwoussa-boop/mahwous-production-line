// ============================================================
// lib/pipeline/pipelineTypes.ts — Pipeline Core Types
// AI Content Engine Pipeline — أنواع خط الإنتاج
// ============================================================

import type { PerfumeData, GeneratedImage, PlatformCaptions, VideoPlatformCaptions, HedraVideoInfo } from '../types';

// ── Pipeline Steps ─────────────────────────────────────────────────────────
export type PipelineStepId =
  | 'scrape'
  | 'draft_content'
  | 'image_generation'
  | 'face_swap'
  | 'audio_generation'
  | 'video_generation'
  | 'montage'
  | 'caption_generation'
  | 'ab_testing'
  | 'distribution_prep'
  | 'review'
  | 'publish';

export type PipelineStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface PipelineStep {
  id: PipelineStepId;
  label: string;
  labelAr: string;
  status: PipelineStepStatus;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  costEstimate?: number; // estimated API cost in USD
  actualCost?: number;
}

// ── Pipeline Mode ──────────────────────────────────────────────────────────
export type PipelineMode = 'draft' | 'production';

// ── Content Strategy ───────────────────────────────────────────────────────
export type ContentType = 'educational' | 'promotional';

export interface ContentStrategyConfig {
  /** 50/50 rule: educational vs promotional */
  contentType: ContentType;
  /** A/B testing: generate 2 caption variants */
  enableABTesting: boolean;
  /** Target platforms */
  targetPlatforms: string[];
}

// ── A/B Testing ────────────────────────────────────────────────────────────
export interface ABTestVariant {
  id: 'A' | 'B';
  caption: string;
  style: string; // e.g., 'emotional' | 'informative' | 'humorous'
  hashtags: string[];
}

export interface ABTestResult {
  platform: string;
  variantA: ABTestVariant;
  variantB: ABTestVariant;
  selectedVariant?: 'A' | 'B';
}

// ── Face Consistency ───────────────────────────────────────────────────────
export interface FaceSwapConfig {
  enabled: boolean;
  referenceImageUrl?: string;
  referenceImageBase64?: string;
  consistency: 'low' | 'medium' | 'high';
}

// ── ElevenLabs Audio ───────────────────────────────────────────────────────
export interface AudioConfig {
  provider: 'elevenlabs' | 'hedra';
  voiceId?: string;
  dialect: 'saudi' | 'egyptian' | 'levantine' | 'gulf';
  speed: number; // 0.5 - 2.0
  stability: number; // 0 - 1
  similarityBoost: number; // 0 - 1
}

export interface GeneratedAudio {
  id: string;
  url?: string;
  duration?: number;
  script: string;
  provider: 'elevenlabs' | 'hedra';
  aspectRatio: '9:16' | '16:9';
}

// ── Montage ────────────────────────────────────────────────────────────────
export interface MontageConfig {
  provider: 'remotion' | 'creatomate';
  captionStyle: 'tiktok' | 'minimal' | 'cinematic' | 'bold';
  backgroundMusic: boolean;
  musicTrack?: string;
  autoDucking: boolean; // lower music volume during speech
  soundEffects: boolean;
  transitionStyle: 'cut' | 'fade' | 'zoom' | 'slide';
}

export interface MontageResult {
  videoUrl: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
  duration: number;
  withCaptions: boolean;
  withMusic: boolean;
}

// ── Distribution ───────────────────────────────────────────────────────────
export interface DistributionPackage {
  format: '9:16' | '1:1' | '16:9';
  label: string;
  labelAr: string;
  imageUrl?: string;
  videoUrl?: string;
  montageVideoUrl?: string;
  caption: string;
  captionVariantB?: string;
  hashtags: string[];
  platforms: string[];
}

export interface ZipBundle {
  id: string;
  downloadUrl?: string;
  contents: {
    images: string[];
    videos: string[];
    captions: string;
    metadata: string;
  };
  createdAt: string;
}

// ── Memory System ──────────────────────────────────────────────────────────
export interface ContentMemory {
  productId: string;
  productUrl: string;
  usedScenes: string[];
  usedScenarios: string[];
  usedBackgrounds: string[];
  usedCaptionStyles: string[];
  generationHistory: Array<{
    timestamp: string;
    contentType: ContentType;
    scenes: string[];
    scenarios: string[];
  }>;
}

// ── Pipeline State ─────────────────────────────────────────────────────────
export interface PipelineState {
  id: string;
  mode: PipelineMode;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep: PipelineStepId | null;
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;

  // Input
  productUrl: string;
  perfumeData: PerfumeData | null;
  bottleImageBase64?: string;

  // Configuration
  contentStrategy: ContentStrategyConfig;
  faceSwap: FaceSwapConfig;
  audioConfig: AudioConfig;
  montageConfig: MontageConfig;

  // Generated Assets
  images: GeneratedImage[];
  faceSwappedImages: GeneratedImage[];
  audios: GeneratedAudio[];
  videos: HedraVideoInfo[];
  montageResults: MontageResult[];
  captions: PlatformCaptions | null;
  videoCaptions: VideoPlatformCaptions | null;
  abTestResults: ABTestResult[];
  distributionPackages: DistributionPackage[];
  zipBundle: ZipBundle | null;

  // Cost tracking
  totalEstimatedCost: number;
  totalActualCost: number;

  // Memory
  contentMemory: ContentMemory | null;

  // Error recovery
  checkpoint: PipelineCheckpoint | null;
}

// ── Checkpoint (Error Recovery) ────────────────────────────────────────────
export interface PipelineCheckpoint {
  stepId: PipelineStepId;
  timestamp: string;
  state: Partial<PipelineState>;
  completedSteps: PipelineStepId[];
}

// ── Pipeline Events ────────────────────────────────────────────────────────
export type PipelineEventType =
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'pipeline_completed'
  | 'pipeline_failed'
  | 'checkpoint_saved'
  | 'cost_warning';

export interface PipelineEvent {
  type: PipelineEventType;
  stepId?: PipelineStepId;
  timestamp: string;
  data?: Record<string, unknown>;
  message: string;
  messageAr: string;
}

// ── Pipeline Request ───────────────────────────────────────────────────────
export interface PipelineExecuteRequest {
  productUrl: string;
  mode: PipelineMode;
  bottleImageBase64?: string;
  faceReferenceImageBase64?: string;
  contentStrategy?: Partial<ContentStrategyConfig>;
  audioConfig?: Partial<AudioConfig>;
  montageConfig?: Partial<MontageConfig>;
  resumeFromCheckpoint?: string; // checkpoint ID to resume from
}

export interface PipelineExecuteResponse {
  pipelineId: string;
  status: PipelineState['status'];
  currentStep: PipelineStepId | null;
  steps: PipelineStep[];
  events: PipelineEvent[];
  assets: {
    images: GeneratedImage[];
    videos: HedraVideoInfo[];
    audios: GeneratedAudio[];
    montages: MontageResult[];
    captions: PlatformCaptions | null;
    videoCaptions: VideoPlatformCaptions | null;
    abTests: ABTestResult[];
    distributionPackages: DistributionPackage[];
    zipBundle: ZipBundle | null;
  };
  costs: {
    estimated: number;
    actual: number;
  };
}
