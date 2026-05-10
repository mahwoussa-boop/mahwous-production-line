// ============================================================
// lib/mahwousImageEngine.ts — Mahwous Platform-Specific Image Engine
//
// كل منصة لها ديكور وأسلوب مختلف يناسب جمهورها:
//   - Story (9:16): Instagram/TikTok — شبابي، ألوان جريئة، إضاءة درامية
//   - Post (1:1): Instagram/Facebook — أنيق، كلاسيكي، فخم
//   - Landscape (16:9): Twitter/YouTube — ثقافي، مكتبة عطرية، معلوماتي
// ============================================================

interface PerfumeInfo {
  name: string;
  brand: string;
  notes?: string | string[];
  description?: string;
}

// ── أساليب العرض حسب المنصة ──────────────────────────────────────────────

interface PlatformStyle {
  format: 'story' | 'post' | 'landscape';
  sceneConcept: string;
  poseDescription: string;
  lightingMood: string;
  styleNote: string;
}

// ── مجموعات المشاهد المتنوعة ──────────────────────────────────────────────
// كل مرة يتم اختيار مشهد عشوائي مختلف

const STORY_SCENES = [
  {
    scene: 'modern luxury rooftop at night, city skyline with glowing lights in background, sleek black marble bar counter, neon accent lights in gold and amber, urban nightlife atmosphere',
    pose: 'standing confidently, leaning slightly on the bar counter, holding the perfume bottle close to his face with one hand, looking directly at camera with a charismatic smirk',
    lighting: 'dramatic neon-lit night scene with golden rim lighting, deep shadows, high contrast cinematic look',
    style: 'TikTok/Reels trending style — bold, energetic, eye-catching, urban luxury vibe',
  },
  {
    scene: 'sleek modern car interior (luxury sports car), black leather seats, ambient dashboard lights glowing in warm gold, night drive atmosphere, city lights blurring through the window',
    pose: 'sitting in the driver seat, holding the perfume bottle elegantly near the steering wheel, looking at camera with a confident mysterious expression',
    lighting: 'moody ambient car interior lighting, warm gold dashboard glow, dramatic shadows on face',
    style: 'TikTok car reveal trend — mysterious, luxurious, aspirational young male aesthetic',
  },
  {
    scene: 'modern minimalist bathroom with black marble walls, large backlit mirror, warm ambient lighting, luxury grooming setup on the counter, steam effect in the air',
    pose: 'standing in front of the mirror, holding the perfume bottle at chest level, looking at camera through the mirror reflection with a knowing smile',
    lighting: 'warm backlit mirror glow, soft steam diffusion, intimate and personal atmosphere',
    style: 'Instagram Reels get-ready-with-me style — personal, relatable, aspirational',
  },
  {
    scene: 'luxury fashion store interior, glass display shelves with warm spotlights, black and gold decor, velvet curtains in background, exclusive boutique atmosphere',
    pose: 'walking toward camera holding the perfume bottle like a prized discovery, excited confident expression, slight motion blur suggesting movement',
    lighting: 'warm spotlight from above, golden ambient glow, fashion editorial lighting',
    style: 'Shopping haul / unboxing trend — exciting discovery moment, youthful energy',
  },
  {
    scene: 'dramatic dark studio background with single golden spotlight, floating golden particles in the air, pure black backdrop with subtle smoke effects',
    pose: 'close-up shot, holding the perfume bottle at eye level with both hands, intense focused gaze at camera, the bottle between him and the camera',
    lighting: 'single dramatic golden spotlight from above, Rembrandt lighting on face, dark moody atmosphere',
    style: 'Viral product showcase trend — dramatic reveal, cinematic close-up, maximum product focus',
  },
];

const POST_SCENES = [
  {
    scene: 'grand Arabian palace interior with ornate golden arches, intricate Islamic geometric patterns on walls, warm amber lanterns hanging from ceiling, marble floors with golden inlays, luxurious Persian carpet',
    pose: 'standing tall and proud, holding the perfume bottle with right hand extended slightly toward camera, left hand in pocket, full body elegant pose',
    lighting: 'warm golden hour light streaming through arched windows, ambient lantern glow, rich warm tones',
    style: 'Classic luxury Instagram post — elegant, sophisticated, timeless Arabian luxury',
  },
  {
    scene: 'opulent royal majlis with deep burgundy velvet seating, dark mahogany wood panels with golden trim, crystal chandelier above, incense burner with subtle smoke, traditional Arabic coffee set on side table',
    pose: 'seated elegantly on the majlis, leaning forward slightly, presenting the perfume bottle on his palm like a precious gift, warm inviting expression',
    lighting: 'warm chandelier light, ambient golden glow, rich deep shadows creating depth',
    style: 'Heritage luxury post — cultural pride, traditional elegance, premium positioning',
  },
  {
    scene: 'modern luxury penthouse living room, floor-to-ceiling windows with city skyline view, white marble interior with gold accents, designer furniture, art pieces on walls',
    pose: 'standing by the window with city view behind him, holding perfume bottle at chest level, sophisticated confident pose, slight head tilt',
    lighting: 'natural daylight from windows mixed with warm interior lighting, clean bright atmosphere',
    style: 'Lifestyle luxury post — modern success, aspirational living, clean aesthetic',
  },
  {
    scene: 'exclusive perfume collection room, glass display cases with warm spotlights, dark wood shelving filled with luxury perfume bottles, velvet-lined display stands, museum-like atmosphere',
    pose: 'standing next to the display, carefully placing or picking up the perfume bottle from a velvet stand, collector appreciation expression',
    lighting: 'museum-style directional spotlights, warm focused lighting on the bottle, sophisticated ambient glow',
    style: 'Collector showcase post — connoisseur appeal, exclusive collection, refined taste',
  },
];

const LANDSCAPE_SCENES = [
  {
    scene: 'grand classical library with tall mahogany bookshelves filled with leather-bound books, warm golden reading lamps, large wooden desk with perfume bottles and notes scattered, leather armchair, globe in corner',
    pose: 'seated at the desk like a perfume expert, holding the bottle while examining it thoughtfully, other perfume bottles visible on desk for comparison, scholarly analytical expression',
    lighting: 'warm library lamp lighting, golden ambient glow from reading lamps, intellectual cozy atmosphere',
    style: 'YouTube educational style — expert review, knowledge sharing, perfume culture',
  },
  {
    scene: 'professional perfume workshop/laboratory, wooden workbench with glass vials and essential oils, raw ingredients (oud wood, roses, amber) displayed, vintage scales, handwritten notes',
    pose: 'standing at the workbench, holding the perfume bottle in one hand while gesturing toward the ingredients with the other, teaching/explaining expression',
    lighting: 'natural workshop lighting, warm tones, detailed close-up quality, documentary style',
    style: 'Behind-the-scenes educational — ingredient exploration, craftsmanship, perfume making',
  },
  {
    scene: 'elegant perfume review studio setup, professional desk with multiple perfume bottles arranged, soft background with brand logos blurred, microphone visible, review cards/notes on desk',
    pose: 'seated at the review desk, holding the featured perfume bottle prominently, other bottles in background for context, professional reviewer pose, engaging expression',
    lighting: 'professional studio three-point lighting, clean and bright, YouTube thumbnail quality',
    style: 'Professional review/comparison — informative, trustworthy, expert opinion format',
  },
  {
    scene: 'luxury perfume boutique counter, glass display with various luxury brands, elegant black and gold interior, soft ambient lighting, VIP shopping experience atmosphere',
    pose: 'standing behind the counter like a perfume consultant, presenting the bottle to camera as if recommending it to a customer, warm professional smile',
    lighting: 'boutique ambient lighting, warm spotlights on products, inviting retail atmosphere',
    style: 'Expert recommendation — personal shopping experience, trusted advisor, cultural knowledge',
  },
];

// ── اختيار مشهد عشوائي ──────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── بناء البرومبت المخصص لكل منصة ──────────────────────────────────────────

export function buildPlatformSpecificPrompt(params: {
  perfumeData: PerfumeInfo;
  format: 'story' | 'post' | 'landscape';
  attire?: string;
  aspectHint?: string;
  bottleDescription?: string;
  hasBottleReference?: boolean;
}): string {
  const { perfumeData, format, attire = '', aspectHint = '', bottleDescription, hasBottleReference } = params;
  const { name = '', brand = '', notes } = perfumeData;

  // Pick a random scene for this format
  let scene;
  if (format === 'story') {
    scene = pickRandom(STORY_SCENES);
  } else if (format === 'post') {
    scene = pickRandom(POST_SCENES);
  } else {
    scene = pickRandom(LANDSCAPE_SCENES);
  }

  // ⚠️ CHARACTER: نفس الوصف لكل المنصات — ثابت 100%
  const characterBase = getCharacterForFormat(attire, format);

  if (hasBottleReference) {
    return `You are given a REFERENCE PHOTO of a real perfume bottle. Your task is to create a 3D animated advertisement image.

=== THE ATTACHED IMAGE IS THE REAL PERFUME BOTTLE ===
Product: "${name}" by ${brand}
This photo shows the EXACT bottle you must reproduce. Study every detail:
- The exact shape, cap/lid design, label, medallion, text, decorations
- The exact colors, materials, proportions

=== CHARACTER ===
${characterBase}

=== SCENE & COMPOSITION ===
Create a single image${aspectHint ? ` in ${aspectHint}` : ''} showing:
SCENE: ${scene.scene}
POSE: ${scene.pose}
- The perfume bottle must be the EXACT bottle from the reference photo (3D rendered version)
- The bottle is clearly visible, prominently featured, and well-lit

=== LIGHTING & MOOD ===
${scene.lighting}

=== TARGET PLATFORM STYLE ===
${scene.style}

=== STYLE ===
- 3D Pixar/Disney animation quality (Nano Banana style)
- ${scene.lighting}
- 4K resolution, photorealistic textures on the bottle
- No text overlays, no watermarks, no logos outside the bottle
${notes ? `\nPerfume notes: ${Array.isArray(notes) ? notes.join(', ') : notes}` : ''}

=== ABSOLUTE RULES ===
RULE 1: The bottle MUST match the reference photo EXACTLY (shape, cap, label, color)
RULE 2: DO NOT invent or substitute a different bottle design
RULE 3: The character MUST have black swept-back hair, thick black beard, black suit with gold trim, white shirt, gold tie
RULE 4: The scene must match the described setting EXACTLY
RULE 5: NO spraying action — character is PRESENTING/HOLDING the bottle only
RULE 6: Character appearance MUST be IDENTICAL across Story, Post, AND Landscape formats`;
  }

  // Without bottle reference
  const bottleName = `${brand} ${name}`.trim();
  return `Create a high-quality 3D animated Pixar/Disney CGI style image${aspectHint ? ` in ${aspectHint}` : ''}:

CHARACTER: ${characterBase}

BOTTLE: He is holding/presenting a luxury ${bottleName} perfume bottle with elegant premium glass and the brand name "${brand}" and product name "${name}" visible on the label.
${bottleDescription ? `Bottle details: ${bottleDescription}` : ''}
${notes ? `Perfume notes: ${Array.isArray(notes) ? notes.join(', ') : notes}` : ''}

SCENE: ${scene.scene}
POSE: ${scene.pose}

LIGHTING & MOOD: ${scene.lighting}

TARGET STYLE: ${scene.style}

RENDERING:
- 3D Pixar/Disney animation quality (Nano Banana style)
- 4K resolution, cinematic composition
- Photorealistic textures, stylized character
- No text overlays, no watermarks
- NO spraying action — PRESENTING/HOLDING only
- Character appearance MUST be identical in Story, Post, AND Landscape formats`;
}

// ══════════════════════════════════════════════════════════════════════════════
// CHARACTER BASE — ثابت لكل المنصات بدون استثناء
// ⚠️ CRITICAL FIX: لا تغيير في الملابس أو المظهر حسب المنصة
// ══════════════════════════════════════════════════════════════════════════════

const MAHWOUS_CHARACTER_BASE = `a stylish Arab man with black swept-back hair, thick full black beard, 
rendered in high-quality 3D animated Pixar/Disney CGI style with photorealistic textures and cinematic lighting. 
He wears an elegant black suit with subtle gold trim details on the lapels, crisp white shirt, gold silk tie, 
and a gold pocket square. His expression is confident and charming, smiling warmly at the camera.`;

const MAHWOUS_CHARACTER_THOBE = `a stylish Arab man with black swept-back hair, thick full black beard, 
rendered in high-quality 3D animated Pixar/Disney CGI style with photorealistic textures and cinematic lighting. 
He wears a pristine white Saudi thobe. His expression is confident and charming, smiling warmly at the camera.`;

const MAHWOUS_CHARACTER_BISHT = `a stylish Arab man with black swept-back hair, thick full black beard, 
rendered in high-quality 3D animated Pixar/Disney CGI style with photorealistic textures and cinematic lighting. 
He wears a pristine white Saudi thobe with an elegant golden bisht (ceremonial cloak). 
His expression is confident and charming, smiling warmly at the camera.`;

// ── وصف الشخصية الثابت — نفس الوصف لكل المنصات ────────────────────────────
// ⚠️ FIXED: لا تغيير حسب المنصة — الشخصية واحدة في Story و Post و Landscape

function getCharacterForFormat(attire: string, _format: 'story' | 'post' | 'landscape'): string {
  // نفس الوصف بغض النظر عن المنصة
  if (attire === 'white_thobe_black_bisht' || attire === 'saudi_bisht' || attire.includes('bisht')) {
    return MAHWOUS_CHARACTER_BISHT;
  }
  if (attire === 'white_thobe_only' || attire.includes('thobe')) {
    return MAHWOUS_CHARACTER_THOBE;
  }
  // Default: black suit — ثابت لكل المنصات
  return MAHWOUS_CHARACTER_BASE;
}
