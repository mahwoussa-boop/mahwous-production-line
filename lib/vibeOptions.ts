// ============================================================
// lib/vibeOptions.ts
// ملف بيانات خالص — آمن 100% للاستخدام في Client Components
//
// السبب: promptEngine.ts يحتوي على كود يعمل على الخادم فقط.
// عندما يستورد منه 'use client' component، يفشل Vercel في
// Static Generation بسبب Tree-Shaking يُخرج الدوال كـ undefined.
//
// الحل: فصل البيانات الثابتة في هذا الملف المستقل.
// ============================================================

export interface VibeData {
  label: string;
  description: string;
  lighting: string;
  mood: string;
  colorPalette: string;
  arabicLabel: string;
}

export interface AttireData {
  label: string;
  description: string;
  arabicLabel: string;
}

// ─── Vibe / Background Database ──────────────────────────────────────────────

export const VIBE_MAP: Record<string, VibeData> = {
  rose_garden: {
    label: 'Rose Garden',
    arabicLabel: 'حديقة الورود',
    description:
      'in a lush, magical rose garden, with dense blooming pink roses, glowing butterflies, soft morning mist, creating an enchanted forest atmosphere',
    lighting:
      'soft, diffused morning light with warm golden sunbeams filtering through the leaves and magical glowing elements',
    mood: 'romantic, enchanting, dreamy, serene',
    colorPalette: 'pink, green, gold, white',
  },
  majlis: {
    label: 'Majlis',
    arabicLabel: 'مجلس عربي',
    description:
      'in a luxurious modern Saudi majlis, featuring rich green curtains, an ornate Arabic coffee pot (dallah), and small coffee cups (finjan), with a background of blooming flowers and subtle oud smoke',
    lighting:
      'soft, warm interior lighting combined with natural light from a window, creating a welcoming and opulent atmosphere',
    mood: 'hospitable, traditional, luxurious, warm',
    colorPalette: 'green, gold, brown, white',
  },
  royal_luxury: {
    label: 'Royal Luxury',
    arabicLabel: 'الفخامة الملكية',
    description:
      'inside an opulent royal palace hall with soaring golden columns, polished white Carrara marble floors with intricate geometric inlay, cascading crystal chandeliers, deep royal purple velvet drapes, and a golden throne in the soft background',
    lighting:
      'dramatic warm golden hour shafts of light streaming through arched windows, volumetric god rays',
    mood: 'majestic, commanding, imperial, regal',
    colorPalette: 'deep navy, gold, ivory, burgundy',
  },
  modern_corporate: {
    label: 'Modern Corporate',
    arabicLabel: 'الأعمال العصرية',
    description:
      'in a 70th-floor penthouse corner office with floor-to-ceiling glass walls overlooking a glittering city skyline at golden hour, a minimalist walnut desk, architectural recessed lighting, and a sleek city energy',
    lighting:
      'cool blue-grey ambient light from city sky, warm accent spotlights on subject, lens flare from city lights',
    mood: 'powerful, professional, ambitious, sharp',
    colorPalette: 'slate, charcoal, amber, white',
  },
  winter_cabin: {
    label: 'Winter Cabin',
    arabicLabel: 'الكوخ الشتوي',
    description:
      'inside a luxurious alpine mountain chalet with exposed dark timber beams, a large crackling stone fireplace, premium cognac leather furniture, Persian kilim rugs, and snow-heavy pine trees visible through panoramic windows',
    lighting:
      'intimate amber firelight dancing across the scene, soft snow-diffused daylight, warm shadow play',
    mood: 'warm, intimate, refined, contemplative',
    colorPalette: 'burnt amber, deep brown, cream, forest green',
  },
  classic_library: {
    label: 'Classic Library',
    arabicLabel: 'المكتبة الكلاسيكية',
    description:
      'inside a private grand mahogany library with floor-to-ceiling shelves of leather-bound books, a rolling brass ladder, deep Chesterfield armchairs, a Tiffany lamp, a bronze globe, and Persian rugs on dark hardwood floors',
    lighting:
      'warm brass reading lamp light mixed with soft candlelight, golden hour slanting through a high casement window',
    mood: 'intellectual, timeless, distinguished, powerful',
    colorPalette: 'cognac, mahogany, forest green, gold',
  },
  desert_sunset: {
    label: 'Desert Sunset',
    arabicLabel: 'غروب الصحراء',
    description:
      'standing atop a grand sweeping sand dune in the Arabian Rub al Khali desert, vast ocean of gold and rust-colored dunes receding to the horizon, ancient stone ruins silhouetted in the far distance, solitary camel caravan silhouette',
    lighting:
      'spectacular golden hour sunset, sky blazing in deep orange, crimson, and violet, dramatic long golden shadows',
    mood: 'epic, ancestral, adventurous, heritage',
    colorPalette: 'deep orange, sand gold, burnt sienna, indigo',
  },
  oriental_palace: {
    label: 'Oriental Palace',
    arabicLabel: 'القصر الشرقي',
    description:
      'inside a magnificent Andalusian-Islamic palace courtyard, intricate hand-painted geometric zellige tilework, a central alabaster fountain with softly cascading water, jasmine-draped horseshoe arches, ornate carved plasterwork, lush garden in the background',
    lighting:
      'romantic early evening, brass Moroccan lanterns casting star-pattern light, deep blue dusk sky above the courtyard',
    mood: 'romantic, heritage, mystical, cultural',
    colorPalette: 'cobalt blue, terracotta, gold leaf, emerald',
  },
  modern_minimalist: {
    label: 'Modern Minimalist',
    arabicLabel: 'الأناقة البسيطة',
    description:
      'in an ultra-minimalist polished concrete and glass architectural studio, a single abstract sculpture on a plinth, floating shelves with negative space, precise diagonal light shafts from a clerestory window',
    lighting:
      'pristine clean softbox studio lighting, precise shadow control, razor-sharp definition, white-grey tones',
    mood: 'avant-garde, pure, conceptual, future-forward',
    colorPalette: 'cool grey, white, black, single gold accent',
  },
  ocean_breeze: {
    label: 'Ocean Breeze',
    arabicLabel: 'نسيم البحر',
    description:
      'on the bow deck of a magnificent luxury superyacht gliding through turquoise Mediterranean waters, the white hull cutting a crisp wake, Amalfi coast cliffs and cypress trees in the background, clear endless sky',
    lighting:
      'bright Mediterranean high-sun, soft sea-surface reflected light from below, warm tropical glow',
    mood: 'free, affluent, sun-drenched, adventurous',
    colorPalette: 'cerulean blue, crisp white, sun gold, sea foam',
  },
};

// ─── Attire Database ──────────────────────────────────────────────────────────

export const ATTIRE_MAP: Record<string, AttireData> = {
  black_suit_gold_details: {
    label: 'Black Suit, Gold Details',
    arabicLabel: 'بدلة سوداء بتفاصيل ذهبية',
    description:
      'an impeccably tailored modern black suit with subtle gold embroidery on the lapels, a crisp white shirt, and a shining gold tie',
  },
  saudi_bisht: {
    label: 'Saudi Bisht',
    arabicLabel: 'بشت سعودي',
    description:
      'a traditional Saudi thobe and a luxurious black bisht with gold trim, embodying Arabian heritage and elegance',
  },
  white_thobe_black_bisht: {
    label: 'White Thobe + Black Bisht',
    arabicLabel: 'ثوب أبيض + بشت أسود',
    description:
      'a pristine snow-white Saudi thobe with fine gold embroidery at the collar and cuffs, draped with a sweeping jet-black bisht (ceremonial cloak) edged with a thick gold trim, a traditional white ghutrah headdress secured with a black agal crown',
  },
  charcoal_suit_gold_tie: {
    label: 'Charcoal Suit + Gold Tie',
    arabicLabel: 'بدلة رمادية + ربطة عنق ذهبية',
    description:
      'a perfectly tailored charcoal grey double-breasted suit with ultra-fine chalk stripe texture, crisp white French cuff dress shirt, a lustrous 22-karat gold silk tie with a confident half-Windsor knot, and a matching gold pocket square with three peaks',
  },
  white_thobe_only: {
    label: 'White Thobe Only',
    arabicLabel: 'ثوب أبيض فقط',
    description:
      'an immaculate crisp white thobe with subtle silver and white thread embroidery in a traditional geometric pattern along the collar, wearing no headdress, revealing a neat well-groomed short dark hairstyle, relaxed yet dignified',
  },
  navy_suit: {
    label: 'Navy Blue Suit',
    arabicLabel: 'بدلة زرقاء داكنة',
    description:
      'a sharp midnight navy blue slim-fit suit with peak lapels, a bright white dress shirt with gold cufflinks on French cuffs, a thin brushed silver tie with a subtle texture, minimal but clearly expensive accessories',
  },
  beige_thobe_brown_bisht: {
    label: 'Beige Thobe + Brown Bisht',
    arabicLabel: 'ثوب بيج + بشت بني',
    description:
      'a warm camel-beige thobe with intricate brown thread embroidery in a traditional arabesque pattern, draped with a rich chocolate-brown bisht generously trimmed with a wide band of gold metallic thread, a matching cream-toned ghutrah',
  },
};

// ─── Helper Functions — مُصدَّرة للاستخدام في أي مكان ────────────────────────

export function getVibeOptions(): Array<{ value: string; label: string; arabicLabel: string }> {
  return Object.entries(VIBE_MAP).map(([value, data]) => ({
    value,
    label: data.label,
    arabicLabel: data.arabicLabel,
  }));
}

export function getAttireOptions(): Array<{ value: string; label: string; arabicLabel: string }> {
  return Object.entries(ATTIRE_MAP).map(([value, data]) => ({
    value,
    label: data.label,
    arabicLabel: data.arabicLabel,
  }));
}
