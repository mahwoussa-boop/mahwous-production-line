// ============================================================
// lib/types.ts — Core type definitions for the entire app
// v3: مع تحليل العطر وكابشنات الفيديو المحسّنة
// ============================================================

export type Vibe =
  | 'rose_garden'
  | 'majlis'
  | 'royal_luxury'
  | 'modern_corporate'
  | 'winter_cabin'
  | 'classic_library'
  | 'desert_sunset'
  | 'oriental_palace'
  | 'modern_minimalist'
  | 'ocean_breeze';

export type Attire =
  | 'black_suit_gold_details'
  | 'saudi_bisht'
  | 'white_thobe_black_bisht'
  | 'charcoal_suit_gold_tie'
  | 'white_thobe_only'
  | 'navy_suit'
  | 'beige_thobe_brown_bisht';

export interface PerfumeData {
  name: string;
  brand: string;
  gender?: 'men' | 'women' | 'unisex';
  notes?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
}

export interface BottleAnalysis {
  description?: string;
  shape?: string;
  color?: string;
  capDesign?: string;
  videoDescription?: string;
  loraPromptAddition?: string;
}

export interface GenerationRequest {
  perfumeData: PerfumeData;
  vibe: string;
  attire: string;
  loraPath?: string;
  loraTriggerWord?: string;
  bottleImageBase64?: string;
  characterImageBase64?: string;
  bottleDescription?: string;
  bottleAnalysis?: BottleAnalysis;
  productImageUrl?: string;  // URL of the real product image scraped from the store
}

export interface GeneratedImage {
  format: 'story' | 'post' | 'landscape';
  label: string;
  aspectRatio: string;
  url: string;
  dimensions: { width: number; height: number };
}

export interface GenerationResult {
  images: GeneratedImage[];
  prompt: string;
  negativePrompt: string;
}

// ── Platform Distribution Types ─────────────────────────────────────────────

export type SourceFormat = 'story' | 'post' | 'landscape';

export interface PlatformUsage {
  id: string;
  platform: string;
  platformAr: string;
  usage: string;
  usageAr: string;
  sourceFormat: SourceFormat;
  icon: string;
  color: string;
  hasCaption: boolean;
  captionKey: string;
}

export interface PlatformCaptions {
  // صور عمودية (9:16)
  instagram_story: string;
  snapchat: string;
  pinterest: string;
  facebook_story: string;
  tiktok: string;
  whatsapp: string;
  youtube_shorts: string;

  // صور مربعة (1:1)
  instagram_post: string;
  facebook_post: string;
  telegram: string;
  haraj: string;
  truth_social: string;

  // صور أفقية (16:9)
  twitter: string;
  linkedin: string;
  youtube_thumbnail: string;
}

export interface DistributionResult {
  captions: PlatformCaptions;
  videoCaptions?: VideoPlatformCaptions;
  analysis?: PerfumeAnalysisResult;
  source: string;
}

// ── تحليل العطر والجمهور المستهدف ──────────────────────────────────────────

export interface PerfumeAnalysisResult {
  gender: string;
  targetAudience: string;
  occasion: string;
  season: string;
  personality: string;
  ageRange: string;
}

// ── Scrape Types ────────────────────────────────────────────────────────────

export interface ScrapedProduct {
  name?: string;
  brand?: string;
  gender?: string;
  notes?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
}

export interface ScrapeResult {
  product: ScrapedProduct;
  recommendation: {
    vibe: string;
    attire: string;
    reasoning: string;
  };
}

export interface CaptionResult {
  captions: PlatformCaptions | Record<string, string>;
  videoCaptions?: VideoPlatformCaptions | Record<string, string>;
  analysis?: PerfumeAnalysisResult;
  source?: string;
}

export interface BottleAnalysisResult {
  description: string;
  bottleShape: string;
  dominantColor: string;
  labelDescription: string;
}

// UI state types
export type AppStep = 'input' | 'generating' | 'output';

export interface GenerationProgress {
  story: 'pending' | 'generating' | 'done' | 'error';
  post: 'pending' | 'generating' | 'done' | 'error';
  landscape: 'pending' | 'generating' | 'done' | 'error';
}

// Video Generation Types
export interface VideoGenerationResult {
  videoId: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  url?: string;
}

// Video Scenario Types
export interface VideoScenario {
  platform: string;
  hook: string;
  action: string;
  voiceover: string;
  cta: string;
}

// ── Hedra Video Types ──────────────────────────────────────────────────────

export type VideoAspectRatio = '9:16' | '16:9';

export interface HedraVideoInfo {
  id: string;
  aspectRatio: VideoAspectRatio;
  status: 'queued' | 'pending' | 'processing' | 'finalizing' | 'complete' | 'failed' | 'error';
  videoUrl?: string | null;
  progress?: number;
  eta_sec?: number;
  error?: string;
  voiceoverText?: string;
  scenarioName?: string;
  hook?: string;
}

export interface VideoGenerationState {
  videos: HedraVideoInfo[];
  voiceoverText: string;
  isGenerating: boolean;
}

// Video platform distribution
export interface VideoPlatformUsage {
  id: string;
  platform: string;
  platformAr: string;
  usage: string;
  usageAr: string;
  aspectRatio: VideoAspectRatio;
  icon: string;
  color: string;
  captionKey: string;
}

export interface VideoPlatformCaptions {
  // فيديو عمودي (9:16)
  instagram_reels: string;
  tiktok_video: string;
  snapchat_video: string;
  youtube_shorts_video: string;
  facebook_stories_video: string;

  // فيديو أفقي (16:9)
  youtube_video: string;
  twitter_video: string;
  linkedin_video: string;
  facebook_video: string;
}

// ── Smart Publish Types ─────────────────────────────────────────────────────

export interface SmartPublishRequest {
  perfumeName: string;
  perfumeBrand: string;
  productUrl: string;
  captions: PlatformCaptions;
  videoCaptions?: VideoPlatformCaptions;
  imageUrls: {
    story?: string;
    post?: string;
    landscape?: string;
  };
  videoUrls?: {
    vertical?: string;
    horizontal?: string;
  };
  hashtags?: Record<string, string[]>;
  platforms?: string[];
  bestTimes?: Record<string, string>;
  publishImages?: boolean;
  publishVideos?: boolean;
}

export interface SmartPublishResult {
  success: boolean;
  message: string;
  summary: {
    totalScheduled: number;
    totalFailed: number;
    imagesScheduled: number;
    videosScheduled: number;
  };
  results: Array<{
    platform: string;
    type: string;
    success: boolean;
    postId?: string;
    scheduledTime?: string;
    error?: string;
  }>;
  diagnostics: string[];
}
