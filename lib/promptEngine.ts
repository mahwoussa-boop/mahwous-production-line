// ============================================================
// lib/promptEngine.ts  — Mahwous Perfume AI Campaign Generator
// Pipeline v10: FLUX LoRA (Stage 1) + FLUX Kontext LoRA (Stage 2)
//
// Stage 1 prompt: Character holding a GENERIC luxury perfume bottle
//   → Natural holding pose, consistent character via LoRA
//
// Stage 2 prompt: Built in route.ts (Kontext replacement prompt)
//   → Replaces generic bottle with REAL brand-specific bottle
// ============================================================
// @ts-nocheck

import type { GenerationRequest } from './types';

// ─── MAHWOUS CHARACTER BASE DESCRIPTION ──────────────────────────────────────
const CHARACTER_BASE = `a stylish Arab man with black swept-back hair, thick full black beard, 
rendered in high-quality 3D animated Pixar/Disney CGI style with photorealistic textures and cinematic lighting. 
He wears an elegant black suit with subtle gold trim details on the lapels, crisp white shirt, gold silk tie, 
and a gold pocket square. His expression is confident and charming, smiling warmly at the camera.`;

// ─── SCENE / BACKGROUND ──────────────────────────────────────────────────────
function getSceneDescription(vibe: string, notes?: string | string[]): string {
  const notesList: string[] = Array.isArray(notes)
    ? notes
    : typeof notes === 'string' && notes.trim()
    ? notes.split(/[,،•\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const hasFloral = notesList.some(n => /rose|jasmine|floral|flower|ورد|ياسمين|زهر/i.test(n));
  const hasOud = notesList.some(n => /oud|wood|sandalwood|عود|خشب|صندل/i.test(n));
  const hasOcean = notesList.some(n => /ocean|sea|marine|aqua|بحر|مائي/i.test(n));
  const hasCitrus = notesList.some(n => /citrus|lemon|bergamot|حمضيات|ليمون|برغموت/i.test(n));

  const vibeMap: Record<string, string> = {
    rose_garden: 'luxurious marble palace room with tall arched windows, pink roses and white flowers, warm golden sunset light, ornate golden Arabic decorations',
    majlis: 'opulent Arabian royal majlis interior, dark wood paneling with golden geometric Islamic patterns, warm amber lighting from ornate brass lanterns, rich Persian carpets, incense smoke rising gently',
    royal_luxury: 'grand royal palace hall with massive golden chandeliers, marble columns, deep red velvet drapes, golden ornate decorations, regal atmosphere',
    modern_corporate: 'sleek modern luxury office with floor-to-ceiling glass windows overlooking a city skyline at golden hour, minimalist black and gold interior',
    winter_cabin: 'cozy luxury mountain cabin with stone fireplace, warm amber lighting, snow visible through large windows, rich wooden interior with gold accents',
    classic_library: 'grand classical library with tall mahogany bookshelves, warm golden reading lamps, leather armchairs, ornate wooden ceiling',
    desert_sunset: 'dramatic Arabian desert at golden sunset, sand dunes glowing in warm orange light, luxury tent with golden decorations in background',
    oriental_palace: 'magnificent oriental palace with ornate golden arches, intricate Islamic geometric patterns, warm amber lanterns, marble floors with golden inlays',
    modern_minimalist: 'ultra-modern minimalist luxury space with white marble, subtle gold accents, dramatic directional lighting, clean geometric lines',
    ocean_breeze: 'modern luxury penthouse with floor-to-ceiling ocean view windows, crystal blue sea, white marble interior with silver accents, fresh coastal atmosphere',
  };

  if (vibe && vibeMap[vibe]) return vibeMap[vibe];

  if (hasOud) return 'opulent Arabian royal palace interior, dark wood paneling with golden geometric Islamic patterns, warm amber lighting from ornate brass lanterns, rich Persian carpets, incense smoke rising gently';
  if (hasFloral) return 'luxurious marble palace room with tall arched windows, deep emerald green velvet curtains, pink roses and white flowers visible through the window, warm golden sunset light streaming in';
  if (hasOcean) return 'modern luxury penthouse with floor-to-ceiling ocean view windows, crystal blue sea visible in the background, white marble interior with silver accents, cool blue ambient lighting';
  if (hasCitrus) return 'bright modern luxury terrace overlooking Mediterranean sea, white marble balustrade, lemon trees in background, warm Mediterranean sunlight';

  return 'magnificent Arabian palace interior with ornate golden arches, intricate Islamic geometric patterns, warm amber lanterns, marble floors with golden inlays, luxurious atmosphere';
}

// ─── CHARACTER ATTIRE ─────────────────────────────────────────────────────────
function getCharacterDescription(attire: string): string {
  if (attire === 'white_thobe_only' || attire === 'white_thobe_black_bisht') {
    return `a stylish Arab man with black swept-back hair, thick full black beard, 
rendered in high-quality 3D animated Pixar/Disney CGI style with photorealistic textures and cinematic lighting. 
He wears a pristine white Saudi thobe${attire === 'white_thobe_black_bisht' ? ' with a black bisht (cloak) over it' : ''}. 
His expression is confident and charming, smiling warmly at the camera.`;
  }
  if (attire === 'saudi_bisht') {
    return `a stylish Arab man with black swept-back hair, thick full black beard, 
rendered in high-quality 3D animated Pixar/Disney CGI style with photorealistic textures and cinematic lighting. 
He wears a white Saudi thobe with an elegant golden bisht (ceremonial cloak). 
His expression is confident and charming, smiling warmly at the camera.`;
  }
  return CHARACTER_BASE;
}

// ─── FLUX LoRA PROMPT (Stage 1 — character with GENERIC bottle) ──────────────
// CRITICAL: The trigger word MAHWOUS_MAN MUST be at the very start of the prompt.
// Stage 1 generates a GENERIC luxury perfume bottle — the real bottle is added in Stage 2.

export function buildFluxPrompt(params: {
  perfumeData: { name: string; brand: string; notes?: string | string[]; description?: string };
  vibe?: string;
  attire?: string;
  aspectHint?: string;
  bottleDescription?: string;
  loraTriggerWord?: string;
  hasBottleReference?: boolean;
}): string {
  const { perfumeData, vibe = '', attire = '', aspectHint = '', loraTriggerWord = 'MAHWOUS_MAN' } = params;
  const { notes } = perfumeData;

  const sceneDesc = getSceneDescription(vibe, notes);
  const characterDesc = getCharacterDescription(attire);

  // Stage 1: Generic luxury perfume bottle with NATURAL GRIP (will be replaced in Stage 2)
  // CRITICAL: Describe precise hand grip to avoid distortion when Stage 2 replaces bottle
  return `${loraTriggerWord}, ${characterDesc.replace(/\n/g, ' ')}, holding a luxury glass perfume bottle in his RIGHT hand extended toward camera, fingers and palm FULLY WRAPPED around the bottle base, NATURAL GRIP — zero gap between hand and bottle, presenting the bottle proudly at chest level facing camera, the bottle label faces directly toward the viewer, background: ${sceneDesc}, photorealistic 3D Pixar/Disney animation style, cinematic lighting, 4K quality${aspectHint ? `, ${aspectHint}` : ''}`;
}

// ─── GEMINI PROMPT (kept for other uses like captions/analysis) ──────────────
export function buildGeminiEnhancePrompt(params: {
  perfumeData: { name: string; brand: string; notes?: string | string[]; description?: string };
  vibe?: string;
  attire?: string;
  aspectHint?: string;
  bottleDescription?: string;
  hasBottleReference?: boolean;
}): string {
  const { perfumeData, vibe = '', attire = '', aspectHint = '', bottleDescription } = params;
  const { name = '', brand = '', notes } = perfumeData;

  const sceneDesc = getSceneDescription(vibe, notes);
  const characterDesc = getCharacterDescription(attire);

  const bottleName = `${brand} ${name}`.trim();
  return `Create a high-quality 3D animated Pixar/Disney CGI style image${aspectHint ? ` in ${aspectHint}` : ''}:

CHARACTER: ${characterDesc.replace(/\n/g, ' ')}

BOTTLE: He is holding a luxury ${bottleName} perfume bottle with elegant premium glass and the brand name "${brand}" and product name "${name}" visible on the label.
${bottleDescription ? `Bottle details: ${bottleDescription}` : ''}
${notes ? `The perfume "${name}" by ${brand} has notes of: ${Array.isArray(notes) ? notes.join(', ') : notes}` : ''}

POSE: He holds the perfume bottle naturally with his right hand extended toward camera, presenting it proudly. The bottle is clearly visible and prominently featured.

BACKGROUND: ${sceneDesc}

STYLE:
- 3D Pixar/Disney animation quality
- Cinematic golden-hour lighting, 4K resolution
- Photorealistic textures, stylized character
- No text overlays, no watermarks`;
}

// ─── LEGACY EXPORTS (backward compatibility) ─────────────────────────────────
export function buildGeminiPrompt(params: {
  perfumeData: { name: string; brand: string; notes?: string | string[]; description?: string };
  vibe?: string;
  attire?: string;
  aspectHint?: string;
  bottleDescription?: string;
}): string {
  return buildGeminiEnhancePrompt(params);
}

export function buildPrompt(request: GenerationRequest & { loraTriggerWord?: string }): string {
  return buildFluxPrompt({
    perfumeData: request.perfumeData,
    vibe: request.vibe,
    attire: request.attire,
    bottleDescription: request.bottleDescription,
    loraTriggerWord: request.loraTriggerWord,
  });
}

export function buildNegativePrompt(): string {
  return [
    'deformed, distorted, disfigured, poorly drawn, bad anatomy, wrong anatomy',
    'extra limb, missing limb, floating limbs, mutated hands and fingers',
    'disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation',
    'text, watermark, signature, jpeg artifacts, low quality, error, incoherent',
    'realistic human face, photorealistic skin, real person, photograph',
    'multiple characters, crowd, duplicate character',
  ].join(', ');
}

export function generatePrompt(params: any): { prompt: string; negative_prompt: string } {
  const request: GenerationRequest = {
    perfumeData: {
      name: params?.perfumeName || '',
      brand: params?.brand || '',
      notes: params?.notes || [],
    },
    vibe: params?.vibe || '',
    attire: params?.attire || '',
  };
  return {
    prompt: buildPrompt(request),
    negative_prompt: buildNegativePrompt(),
  };
}
