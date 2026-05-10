// ============================================================
// lib/pipeline/pipelineEngine.ts — Main Pipeline Orchestrator
// AI Content Engine Pipeline — المحرك الرئيسي لخط الإنتاج
// ============================================================

import type {
  PipelineState,
  PipelineStep,
  PipelineStepId,
  PipelineEvent,
  PipelineCheckpoint,
  PipelineExecuteRequest,
  PipelineMode,
  ContentStrategyConfig,
  FaceSwapConfig,
  AudioConfig,
  MontageConfig,
} from './pipelineTypes';

// ── Default Configurations ─────────────────────────────────────────────────

const DEFAULT_CONTENT_STRATEGY: ContentStrategyConfig = {
  contentType: 'promotional',
  enableABTesting: true,
  targetPlatforms: [
    'instagram_post', 'instagram_story', 'tiktok', 'snapchat',
    'twitter', 'facebook_post', 'youtube_shorts', 'linkedin',
  ],
};

const DEFAULT_FACE_SWAP: FaceSwapConfig = {
  enabled: false,
  consistency: 'high',
};

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  provider: 'elevenlabs',
  dialect: 'saudi',
  speed: 1.0,
  stability: 0.7,
  similarityBoost: 0.8,
};

const DEFAULT_MONTAGE_CONFIG: MontageConfig = {
  provider: 'creatomate',
  captionStyle: 'tiktok',
  backgroundMusic: true,
  autoDucking: true,
  soundEffects: true,
  transitionStyle: 'cut',
};

// ── Pipeline Step Definitions ──────────────────────────────────────────────

const PIPELINE_STEPS: Array<{ id: PipelineStepId; label: string; labelAr: string; maxRetries: number; costEstimate: number }> = [
  { id: 'scrape', label: 'Product Scraping', labelAr: 'استخراج بيانات المنتج', maxRetries: 3, costEstimate: 0 },
  { id: 'draft_content', label: 'Draft Content', labelAr: 'إعداد المسودة', maxRetries: 2, costEstimate: 0.01 },
  { id: 'image_generation', label: 'Image Generation', labelAr: 'توليد الصور', maxRetries: 2, costEstimate: 0.15 },
  { id: 'face_swap', label: 'Face Consistency', labelAr: 'ثبات ملامح الشخصية', maxRetries: 2, costEstimate: 0.05 },
  { id: 'audio_generation', label: 'Audio Generation', labelAr: 'توليد الصوت', maxRetries: 2, costEstimate: 0.10 },
  { id: 'video_generation', label: 'Video Generation', labelAr: 'توليد الفيديو', maxRetries: 2, costEstimate: 0.30 },
  { id: 'montage', label: 'Auto Montage', labelAr: 'المونتاج الآلي', maxRetries: 2, costEstimate: 0.10 },
  { id: 'caption_generation', label: 'Caption Generation', labelAr: 'كتابة الكابشنات', maxRetries: 3, costEstimate: 0.02 },
  { id: 'ab_testing', label: 'A/B Testing', labelAr: 'اختبارات A/B', maxRetries: 2, costEstimate: 0.02 },
  { id: 'distribution_prep', label: 'Distribution Prep', labelAr: 'تحضير التوزيع', maxRetries: 2, costEstimate: 0 },
  { id: 'review', label: 'Review', labelAr: 'المراجعة', maxRetries: 0, costEstimate: 0 },
  { id: 'publish', label: 'Publish', labelAr: 'النشر', maxRetries: 2, costEstimate: 0 },
];

// ── Pipeline Factory ───────────────────────────────────────────────────────

export function createPipelineState(request: PipelineExecuteRequest): PipelineState {
  const id = `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const steps: PipelineStep[] = PIPELINE_STEPS.map(step => ({
    id: step.id,
    label: step.label,
    labelAr: step.labelAr,
    status: 'pending',
    progress: 0,
    retryCount: 0,
    maxRetries: step.maxRetries,
    costEstimate: step.costEstimate,
  }));

  // Skip face_swap if not enabled
  if (!request.faceReferenceImageBase64) {
    const faceStep = steps.find(s => s.id === 'face_swap');
    if (faceStep) faceStep.status = 'skipped';
  }

  // In draft mode, skip expensive steps until approval
  if (request.mode === 'draft') {
    const expensiveSteps: PipelineStepId[] = ['image_generation', 'face_swap', 'audio_generation', 'video_generation', 'montage'];
    steps.forEach(step => {
      if (expensiveSteps.includes(step.id) && step.status !== 'skipped') {
        // Will be run after approval — mark as pending but skip during draft
      }
    });
  }

  // Skip A/B testing if disabled
  if (!request.contentStrategy?.enableABTesting) {
    const abStep = steps.find(s => s.id === 'ab_testing');
    if (abStep) abStep.status = 'skipped';
  }

  const totalEstimatedCost = steps
    .filter(s => s.status !== 'skipped')
    .reduce((sum, s) => sum + (s.costEstimate || 0), 0);

  return {
    id,
    mode: request.mode,
    status: 'idle',
    currentStep: null,
    steps,
    createdAt: now,
    updatedAt: now,
    productUrl: request.productUrl,
    perfumeData: null,
    bottleImageBase64: request.bottleImageBase64,
    contentStrategy: {
      ...DEFAULT_CONTENT_STRATEGY,
      ...request.contentStrategy,
    },
    faceSwap: {
      ...DEFAULT_FACE_SWAP,
      enabled: !!request.faceReferenceImageBase64,
      referenceImageBase64: request.faceReferenceImageBase64,
    },
    audioConfig: {
      ...DEFAULT_AUDIO_CONFIG,
      ...request.audioConfig,
    },
    montageConfig: {
      ...DEFAULT_MONTAGE_CONFIG,
      ...request.montageConfig,
    },
    images: [],
    faceSwappedImages: [],
    audios: [],
    videos: [],
    montageResults: [],
    captions: null,
    videoCaptions: null,
    abTestResults: [],
    distributionPackages: [],
    zipBundle: null,
    totalEstimatedCost,
    totalActualCost: 0,
    contentMemory: null,
    checkpoint: null,
  };
}

// ── Step Management ────────────────────────────────────────────────────────

export function updateStepStatus(
  state: PipelineState,
  stepId: PipelineStepId,
  status: PipelineStep['status'],
  progress?: number,
  error?: string
): PipelineState {
  const now = new Date().toISOString();
  const steps = state.steps.map(step => {
    if (step.id !== stepId) return step;
    return {
      ...step,
      status,
      progress: progress ?? step.progress,
      error: error || step.error,
      startedAt: status === 'in_progress' ? now : step.startedAt,
      completedAt: status === 'completed' || status === 'failed' ? now : step.completedAt,
    };
  });

  return {
    ...state,
    steps,
    currentStep: status === 'in_progress' ? stepId : state.currentStep,
    updatedAt: now,
  };
}

// ── Event System ───────────────────────────────────────────────────────────

export function createPipelineEvent(
  type: PipelineEvent['type'],
  message: string,
  messageAr: string,
  stepId?: PipelineStepId,
  data?: Record<string, unknown>
): PipelineEvent {
  return {
    type,
    stepId,
    timestamp: new Date().toISOString(),
    data,
    message,
    messageAr,
  };
}

// ── Checkpoint System (Error Recovery) ─────────────────────────────────────

export function createCheckpoint(state: PipelineState): PipelineCheckpoint {
  const completedSteps = state.steps
    .filter(s => s.status === 'completed')
    .map(s => s.id);

  return {
    stepId: state.currentStep || 'scrape',
    timestamp: new Date().toISOString(),
    state: {
      perfumeData: state.perfumeData,
      images: state.images,
      faceSwappedImages: state.faceSwappedImages,
      audios: state.audios,
      videos: state.videos,
      montageResults: state.montageResults,
      captions: state.captions,
      videoCaptions: state.videoCaptions,
      abTestResults: state.abTestResults,
      distributionPackages: state.distributionPackages,
      totalActualCost: state.totalActualCost,
    },
    completedSteps,
  };
}

export function restoreFromCheckpoint(
  state: PipelineState,
  checkpoint: PipelineCheckpoint
): PipelineState {
  const steps = state.steps.map(step => {
    if (checkpoint.completedSteps.includes(step.id)) {
      return { ...step, status: 'completed' as const, progress: 100 };
    }
    return { ...step, status: 'pending' as const, progress: 0, error: undefined };
  });

  return {
    ...state,
    ...checkpoint.state,
    steps,
    status: 'running',
    currentStep: checkpoint.stepId,
    checkpoint,
    updatedAt: new Date().toISOString(),
  };
}

// ── Cost Tracking ──────────────────────────────────────────────────────────

export function updateCost(state: PipelineState, stepId: PipelineStepId, actualCost: number): PipelineState {
  const steps = state.steps.map(step => {
    if (step.id !== stepId) return step;
    return { ...step, actualCost };
  });

  const totalActualCost = steps.reduce((sum, s) => sum + (s.actualCost || 0), 0);

  return {
    ...state,
    steps,
    totalActualCost,
    updatedAt: new Date().toISOString(),
  };
}

// ── Draft Mode Logic ───────────────────────────────────────────────────────

const DRAFT_STEPS: PipelineStepId[] = ['scrape', 'draft_content', 'caption_generation', 'ab_testing', 'distribution_prep', 'review'];
const PRODUCTION_ONLY_STEPS: PipelineStepId[] = ['image_generation', 'face_swap', 'audio_generation', 'video_generation', 'montage', 'publish'];

export function getExecutableSteps(state: PipelineState): PipelineStepId[] {
  if (state.mode === 'draft') {
    return state.steps
      .filter(s => DRAFT_STEPS.includes(s.id) && s.status === 'pending')
      .map(s => s.id);
  }
  return state.steps
    .filter(s => s.status === 'pending')
    .map(s => s.id);
}

export function isDraftStep(stepId: PipelineStepId): boolean {
  return DRAFT_STEPS.includes(stepId);
}

export function promoteToProdution(state: PipelineState): PipelineState {
  const steps = state.steps.map(step => {
    if (PRODUCTION_ONLY_STEPS.includes(step.id) && step.status === 'skipped') {
      return { ...step, status: 'pending' as const };
    }
    return step;
  });

  return {
    ...state,
    mode: 'production',
    steps,
    updatedAt: new Date().toISOString(),
  };
}

// ── Pipeline Progress ──────────────────────────────────────────────────────

export function getPipelineProgress(state: PipelineState): {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  currentStepLabel: string;
  currentStepLabelAr: string;
} {
  const activeSteps = state.steps.filter(s => s.status !== 'skipped');
  const completedSteps = activeSteps.filter(s => s.status === 'completed').length;
  const totalSteps = activeSteps.length;
  const currentStep = state.steps.find(s => s.id === state.currentStep);

  return {
    completedSteps,
    totalSteps,
    percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
    currentStepLabel: currentStep?.label || '',
    currentStepLabelAr: currentStep?.labelAr || '',
  };
}

// ── Validation ─────────────────────────────────────────────────────────────

export function validatePipelineRequest(request: PipelineExecuteRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.productUrl?.trim()) {
    errors.push('رابط المنتج مطلوب');
  }

  if (request.mode !== 'draft' && request.mode !== 'production') {
    errors.push('وضع التشغيل غير صالح');
  }

  return { valid: errors.length === 0, errors };
}

// ── Pipeline Storage (localStorage-based for client) ───────────────────────

const PIPELINE_STORAGE_KEY = 'mahwous_pipelines';
const MAX_STORED_PIPELINES = 20;

export function savePipelineState(state: PipelineState): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(localStorage.getItem(PIPELINE_STORAGE_KEY) || '[]') as PipelineState[];
    const idx = stored.findIndex(p => p.id === state.id);
    if (idx >= 0) {
      stored[idx] = state;
    } else {
      stored.unshift(state);
    }
    if (stored.length > MAX_STORED_PIPELINES) stored.splice(MAX_STORED_PIPELINES);
    localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(stored));
  } catch { /* storage full or unavailable */ }
}

export function loadPipelineState(pipelineId: string): PipelineState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(localStorage.getItem(PIPELINE_STORAGE_KEY) || '[]') as PipelineState[];
    return stored.find(p => p.id === pipelineId) || null;
  } catch {
    return null;
  }
}

export function listPipelines(): PipelineState[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PIPELINE_STORAGE_KEY) || '[]') as PipelineState[];
  } catch {
    return [];
  }
}
