// ============================================================
// lib/talkingObjectScenarios.ts
// محرك السيناريوهات المتقدم — 6 أنواع محتوى مشوق
//
// الأنواع:
// 1. BOTTLE_TALKS       — زجاجة العطر تتحدث (أسلوب الجمادات)
// 2. INGREDIENTS_TALK   — المكونات تتحدث مع بعضها
// 3. BOTTLE_VS_MAN      — حوار بين الزجاجة والشخصية مهووس
// 4. BRAND_STORY        — قصة تأسيس الماركة (ملوك وأمراء)
// 5. ROYAL_HISTORY      — تاريخ العطر مع الملوك والرؤساء
// 6. CLASSIC_MAHWOUS    — الأسلوب الكلاسيكي مع مهووس
// ============================================================

import type { PerfumeData } from './types';

export type ScenarioType =
  | 'bottle_talks'
  | 'ingredients_talk'
  | 'bottle_vs_man'
  | 'brand_story'
  | 'royal_history'
  | 'classic_mahwous';

export interface AdvancedScenario {
  type: ScenarioType;
  typeLabel: string;
  platform: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts';
  hook: string;                    // أول 3 ثوانٍ — الخطاف
  voiceoverScript: string;         // النص الكامل للصوت
  visualDirections: string[];      // توجيهات المشاهد المرئية
  veoPrompt: string;               // prompt مباشر لـ Veo 3
  veoPromptLandscape: string;      // prompt 16:9 لـ Veo 3
  sfx: string;                     // المؤثرات الصوتية
  bgm: string;                     // الموسيقى الخلفية
  captionStyle: string;            // أسلوب الكابشن
  cta: string;                     // Call to Action
  estimatedViralScore: number;     // 1-10
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractNotes(perfumeData: PerfumeData): string {
  if (!perfumeData.notes) return 'العود والورد والمسك';
  if (typeof perfumeData.notes === 'string') return perfumeData.notes;
  if (Array.isArray(perfumeData.notes)) return (perfumeData.notes as string[]).join(' و');
  const n = perfumeData.notes as Record<string, string[]>;
  const parts: string[] = [];
  if (n.top?.length) parts.push(n.top.join(' و'));
  if (n.heart?.length) parts.push(n.heart.join(' و'));
  if (n.base?.length) parts.push(n.base.join(' و'));
  return parts.join(' مع ') || 'العود والورد والمسك';
}

function getOrigin(perfumeData: PerfumeData): string {
  const text = `${perfumeData.brand} ${perfumeData.name} ${perfumeData.description || ''}`.toLowerCase();
  if (/chanel|dior|guerlain|hermès|hermes|lanvin|givenchy|paris|france|french/.test(text)) return 'فرنسي';
  if (/armani|versace|prada|gucci|ferrari|italian|italy/.test(text)) return 'إيطالي';
  if (/arabian|arabic|saudi|oud|عود|عربي|خليجي|mahwous|مهووس/.test(text)) return 'عربي';
  if (/british|london|english|england/.test(text)) return 'بريطاني';
  if (/creed|royal|maison|niche/.test(text)) return 'نيش فاخر';
  return 'عالمي';
}

function getBottlePersonality(perfumeData: PerfumeData): string {
  const notes = extractNotes(perfumeData).toLowerCase();
  if (/oud|عود|wood|خشب/.test(notes)) return 'صوت عميق ورزين وواثق من نفسه';
  if (/rose|ورد|floral|زهر/.test(notes)) return 'صوت ناعم وجذاب وغامض';
  if (/fresh|ocean|بحر|منعش/.test(notes)) return 'صوت منعش وحيوي ومفعم بالطاقة';
  if (/musk|مسك|vanilla|فانيل/.test(notes)) return 'صوت دافئ وحميمي وساحر';
  return 'صوت فخور وملكي وأصيل';
}

function getBrandFoundingStory(perfumeData: PerfumeData): {
  year: string;
  founder: string;
  story: string;
  royalUser: string;
} {
  const brand = perfumeData.brand.toLowerCase();

  if (/chanel/.test(brand)) {
    return {
      year: '1921',
      founder: 'غابرييل "كوكو" شانيل',
      story: 'ولدت في دار أيتام فرنسية، وأصبحت أيقونة الأناقة العالمية. أرادت أن تصنع عطراً يشبه المرأة لا الزهور.',
      royalUser: 'الأميرة ديانا وماريلين مونرو كانتا تنامان على Chanel No.5 فقط.',
    };
  }
  if (/dior/.test(brand)) {
    return {
      year: '1947',
      founder: 'كريستيان ديور',
      story: 'بعد الحرب العالمية الثانية، أراد ديور إعادة الأمل والجمال لفرنسا. Miss Dior كان هدية لأخته.',
      royalUser: 'الملكة إليزابيث الثانية كانت من أوائل عملاء دار ديور.',
    };
  }
  if (/creed/.test(brand)) {
    return {
      year: '1760',
      founder: 'جيمس هنري كريد',
      story: 'بدأت كدار خياطة ملكية في لندن، وتحولت لأعرق دور العطور. كل زجاجة تُصنع يدوياً.',
      royalUser: 'نابليون بونابرت، الملكة فيكتوريا، والملك تشارلز الثالث — كلهم عملاء Creed.',
    };
  }
  if (/mahwous|مهووس/.test(brand)) {
    return {
      year: '2020',
      founder: 'مهووس',
      story: 'ولدت من شغف سعودي أصيل بعالم العطور. هدفها واحد: أن يحمل كل سعودي عطراً يليق بهويته.',
      royalUser: 'عطر صُنع للمهووس بالفخامة — أنت.',
    };
  }

  // Default story
  return {
    year: 'مطلع القرن الماضي',
    founder: `مؤسس ${perfumeData.brand}`,
    story: `${perfumeData.brand} — ماركة بُنيت على أساس الشغف بالعطور الفاخرة، وتحدت كل التوقعات لتصبح رمزاً للأناقة العالمية.`,
    royalUser: `ملوك وأمراء وزعماء العالم اختاروا ${perfumeData.brand} ليكون عطرهم الخاص.`,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. BOTTLE TALKS — زجاجة العطر تتحدث
// ══════════════════════════════════════════════════════════════════════════════

function buildBottleTalksScenario(perfumeData: PerfumeData): AdvancedScenario {
  const notes = extractNotes(perfumeData);
  const personality = getBottlePersonality(perfumeData);
  const origin = getOrigin(perfumeData);

  const voiceover = `[صوت الزجاجة — ${personality}]

أنا... ${perfumeData.name}.

لا تنظر إليّ كأنني مجرد زجاجة.
أنا سنوات من البحث. أنا قطرات من ${notes}.
أنا الرائحة التي لن تنساها.

كل من فتحني... تغيّر.
كل من ارتداني... أصبح مختلفاً.

أنا لست عطراً ${origin} فقط.
أنا تجربة.

هل أنت مستعد؟`;

  const veoPrompt = `Cinematic luxury perfume advertisement. A beautiful ${perfumeData.brand} perfume bottle sits alone on a dark marble surface. Dramatic spotlight illuminates it from above. The bottle slowly rotates. Wisps of golden smoke rise from around it. Close-up shots reveal intricate bottle details — the cap, the glass texture, the label. The atmosphere is mysterious and powerful. No human figures. The bottle is the star. Slow cinematic camera movements. Color palette: deep black, gold, and amber. Style: high-end luxury commercial, 4K photorealistic. The bottle's exact shape and design preserved perfectly.`;

  const veoPromptLandscape = `Epic luxury perfume commercial. ${perfumeData.brand} ${perfumeData.name} bottle placed on ancient marble in a grand palace hall. Columns of light pierce through tall windows. The bottle glows from within. Macro close-ups of the glass, the liquid inside, the golden cap. Slow motion particles float around it. No human presence — the bottle commands the entire scene. Cinematic wide shots then intimate close-ups. Style: museum-quality luxury advertisement, 4K.`;

  return {
    type: 'bottle_talks',
    typeLabel: '🫙 الزجاجة تتحدث',
    platform: 'TikTok',
    hook: 'أنا لست مجرد زجاجة... أنا سر.',
    voiceoverScript: voiceover,
    visualDirections: [
      'زجاجة العطر في الظلام — ضوء واحد يسقط عليها',
      'كلوز أب على تفاصيل الزجاجة مع كل جملة',
      'دخان ذهبي يتصاعد حول الزجاجة',
      'الزجاجة تدور ببطء كأنها تتنفس',
      'نهاية: يد تمتد وتمسك الزجاجة',
    ],
    veoPrompt,
    veoPromptLandscape,
    sfx: 'deep resonant hum, glass clink, whisper echo, mystical chime, heartbeat',
    bgm: 'dark cinematic orchestral, slow build, Arabian oud undertones, 60 BPM',
    captionStyle: 'white italic text on black, fade in word by word, dramatic pauses',
    cta: 'احجز زجاجتك — الرابط في البايو',
    estimatedViralScore: 9,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. INGREDIENTS TALK — المكونات تتحدث مع بعضها
// ══════════════════════════════════════════════════════════════════════════════

function buildIngredientsTalkScenario(perfumeData: PerfumeData): AdvancedScenario {
  const notes = extractNotes(perfumeData);
  const notesList = notes.split(/[،,و]/).map(n => n.trim()).filter(Boolean).slice(0, 4);
  const n1 = notesList[0] || 'العود';
  const n2 = notesList[1] || 'الورد';
  const n3 = notesList[2] || 'المسك';
  const n4 = notesList[3] || 'العنبر';

  const voiceover = `[${n1} يتكلم — صوت عميق وقوي]:
أنا الأساس. بدوني لا يكتمل شيء.

[${n2} يرد — صوت ناعم وجذاب]:
وأنا من يجعل القلوب تنبض. الجمال يبدأ مني.

[${n3} يقاطع — صوت هادئ وغامض]:
أنتما تتجادلان؟ أنا من يبقى... على جلدك لساعات.

[${n4} يضحك — صوت دافئ]:
وأنا من يجمعكم جميعاً في لحظة واحدة لا تُنسى.

[معاً في انسجام]:
نحن لسنا مكونات...
نحن ${perfumeData.name}.`;

  const veoPrompt = `Abstract cinematic visualization. Four glowing orbs of light representing perfume ingredients — deep amber (oud), soft pink (rose), silver mist (musk), warm gold (amber). They float in a dark void, circling each other. Each orb pulses with its own color and energy. Slowly they merge together, swirling and combining, creating a beautiful luminous explosion. Finally they form the shape of a perfume bottle. Macro photography style, ultra-detailed particles, slow motion. Style: artistic luxury commercial, 4K.`;

  const veoPromptLandscape = `Cinematic ingredient journey. Raw perfume materials displayed on dark marble — oud wood chips glowing amber, rose petals with dewdrops, white musk crystals, golden ambergris. Each ingredient is dramatically lit. Camera moves slowly across each one. Then all ingredients swirl together in a magical vortex and transform into the ${perfumeData.brand} perfume bottle. Epic cinematic transformation. Style: luxury documentary meets fantasy, 4K.`;

  return {
    type: 'ingredients_talk',
    typeLabel: '🌿 المكونات تتحدث',
    platform: 'TikTok',
    hook: `${n1} يتحدى ${n2}: من منا الأقوى؟`,
    voiceoverScript: voiceover,
    visualDirections: [
      `كل مكوّن يظهر كنقطة ضوء ملونة`,
      `${n1}: ضوء ذهبي عميق يهتز بقوة`,
      `${n2}: ضوء وردي ناعم يرقص`,
      `${n3}: ضوء فضي هادئ يتسلل`,
      `${n4}: ضوء دافئ يلف الجميع`,
      'كل الأضواء تلتقي وتشكّل زجاجة العطر',
    ],
    veoPrompt,
    veoPromptLandscape,
    sfx: 'nature sounds layered, wood creak, flower bloom, crystalline chime, deep bass merge',
    bgm: 'playful yet mysterious, each instrument represents one ingredient, builds to crescendo',
    captionStyle: 'each ingredient name appears in its own color, bold Arabic font',
    cta: 'اكتشف التوازن المثالي — اطلبه الآن',
    estimatedViralScore: 8,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. BOTTLE VS MAN — حوار بين الزجاجة والشخصية مهووس
// ══════════════════════════════════════════════════════════════════════════════

function buildBottleVsManScenario(perfumeData: PerfumeData): AdvancedScenario {
  const notes = extractNotes(perfumeData);

  const voiceover = `[مهووس يمسك الزجاجة ويحدق فيها]:
وش فيك يا صاحبي؟ ليش الكل يسألني عنك؟

[الزجاجة ترد — صوت واثق]:
لأنك لما ترتديني... تصبح أنت.

[مهووس يبتسم]:
أنا؟

[الزجاجة]:
نعم. الإصدار الأفضل منك.
${notes}... كل هذا في نفَس واحد.

[مهووس يرش العطر]:
والله... صح.

[الزجاجة، بهدوء]:
أنا لا أكذب.
أنا ${perfumeData.name}.`;

  const veoPrompt = `Cinematic luxury perfume commercial. MAHWOUS_MAN — a stylish confident Saudi Arab man in his late 20s, black swept-back hair with clean fade, thick full black beard neatly groomed, tan warm skin tone, wearing pristine white Saudi thobe — holds a perfume bottle at eye level. He examines it closely, then smiles confidently. He sprays it on his wrist and inhales deeply, eyes closed in satisfaction. The bottle glows slightly as if alive. Dramatic lighting, dark luxury background. Camera: close-up on face, then bottle, then both together. Style: high-end luxury commercial, 4K photorealistic. Character's face remains consistent throughout.`;

  const veoPromptLandscape = `Epic luxury perfume advertisement. MAHWOUS_MAN — stylish Saudi Arab man, white thobe, black beard — stands in a grand marble palace. He holds the ${perfumeData.brand} perfume bottle. He looks at it, then at the camera. He places it on a marble pedestal and steps back, arms crossed, admiring it. The bottle seems to glow. Wide cinematic shot showing both man and bottle in the grand setting. Golden hour lighting through tall windows. Style: cinematic luxury, 4K.`;

  return {
    type: 'bottle_vs_man',
    typeLabel: '🤝 مهووس والزجاجة',
    platform: 'Instagram Reels',
    hook: 'سألت العطر: ليش الكل يسألني عنك؟',
    voiceoverScript: voiceover,
    visualDirections: [
      'مهووس يمسك الزجاجة ويحدق فيها بجدية',
      'كلوز أب على وجهه ثم على الزجاجة بالتناوب',
      'الزجاجة "تتوهج" عند كل جملة تقولها',
      'مهووس يرش العطر ببطء ويغمض عينيه',
      'ابتسامة واثقة — نظرة للكاميرا',
    ],
    veoPrompt,
    veoPromptLandscape,
    sfx: 'perfume spray sound, glass resonance, heartbeat, subtle echo on bottle voice',
    bgm: 'smooth Arabic trap, confident beat, 95 BPM, gold vibes',
    captionStyle: 'split screen text: white for man, gold for bottle, Arabic bold font',
    cta: 'أنت + العطر = نسخة أفضل. اطلبه الآن.',
    estimatedViralScore: 9,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. BRAND STORY — قصة تأسيس الماركة
// ══════════════════════════════════════════════════════════════════════════════

function buildBrandStoryScenario(perfumeData: PerfumeData): AdvancedScenario {
  const story = getBrandFoundingStory(perfumeData);
  const origin = getOrigin(perfumeData);

  const voiceover = `عام ${story.year}...

في مكان ما في العالم،
شخص واحد قرر أن يغير كيف يشعر الناس.

اسمه ${story.founder}.

${story.story}

${story.royalUser}

اليوم، هذا العطر بين يديك.
${perfumeData.name} — ${perfumeData.brand}.

${origin}. أصيل. لا يُقلَّد.`;

  const veoPrompt = `Cinematic historical documentary style. Sepia-toned opening showing an old perfume workshop — glass bottles, ancient distillation equipment, maps and journals. Slowly transitions to modern luxury. A master perfumer's hands carefully crafting a perfume. Then a grand palace where a king or nobleman receives the perfume as a gift. Finally, the modern ${perfumeData.brand} bottle in full color on a luxury display. Time-lapse style transitions. Dramatic orchestral music implied. Style: luxury brand heritage film, 4K cinematic.`;

  const veoPromptLandscape = `Epic brand heritage commercial. Wide establishing shots of historical locations — Paris boulevards, Arabian palaces, London streets. Each location represents a chapter of the brand story. Archival-style footage transitions to modern luxury. Close-ups of antique perfume bottles evolving into the modern ${perfumeData.brand} design. A sense of legacy and timelessness. Golden color grading. Style: prestige brand documentary, 4K cinematic.`;

  return {
    type: 'brand_story',
    typeLabel: '📖 قصة الماركة',
    platform: 'YouTube Shorts',
    hook: `عام ${story.year}... قصة لا تعرفها عن ${perfumeData.brand}`,
    voiceoverScript: voiceover,
    visualDirections: [
      `لقطة تاريخية: ورشة عطور قديمة عام ${story.year}`,
      'يد المؤسس تصنع العطر بعناية',
      'قصر ملكي — ملك يتسلم زجاجة العطر كهدية',
      'انتقال زمني: من العصر القديم للحديث',
      `زجاجة ${perfumeData.name} الحديثة تظهر بكل تفاصيلها`,
    ],
    veoPrompt,
    veoPromptLandscape,
    sfx: 'old clock ticking, quill writing, royal fanfare, time whoosh, modern glass clink',
    bgm: 'epic orchestral, builds from solo piano to full orchestra, timeless and majestic',
    captionStyle: 'elegant serif font, gold on dark, dates appear as titles, documentary style',
    cta: `كن جزءاً من التاريخ — ${perfumeData.name} متاح الآن`,
    estimatedViralScore: 8,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. ROYAL HISTORY — تاريخ العطر مع الملوك والأمراء
// ══════════════════════════════════════════════════════════════════════════════

function buildRoyalHistoryScenario(perfumeData: PerfumeData): AdvancedScenario {
  const notes = extractNotes(perfumeData);
  const origin = getOrigin(perfumeData);

  const voiceover = `هل تعلم...

أن الملوك والأمراء كانوا يختارون عطورهم بعناية أكثر من اختيار قصورهم؟

العطر كان رسالة. كان هوية. كان سلطة.

${notes}...
هذه المكونات كانت تُهدى للملوك فقط.

الآن، هذا الإرث ${origin} الأصيل
بين يديك.

${perfumeData.name} — ${perfumeData.brand}.

ارتدِ ما كان يرتديه الملوك.`;

  const veoPrompt = `Cinematic royal historical commercial. A king or prince in traditional royal attire receives a perfume bottle as a precious gift. The scene is set in an opulent palace with gold and marble. The perfume bottle is presented on a velvet cushion. The royal figure holds it reverently. Cut to the modern ${perfumeData.brand} bottle on a luxury display. The connection between royal heritage and modern luxury is clear. Dramatic lighting, rich colors — deep burgundy, gold, royal blue. Style: prestige luxury heritage, 4K cinematic.`;

  const veoPromptLandscape = `Epic royal palace setting. Grand hall with massive chandeliers and marble floors. A procession of royal attendants carrying precious gifts including perfume bottles. Wide establishing shots of palace exterior at golden hour. Interior shots of the royal receiving chamber. Close-ups of ornate perfume vessels. Transition to the modern ${perfumeData.brand} bottle. The sense of royal legacy and exclusivity. Style: epic historical luxury commercial, 4K.`;

  return {
    type: 'royal_history',
    typeLabel: '👑 تاريخ الملوك',
    platform: 'Instagram Reels',
    hook: `ما الذي كان يرتديه الملوك؟ — ${notes}`,
    voiceoverScript: voiceover,
    visualDirections: [
      'قصر ملكي فخم — إضاءة ذهبية دراماتيكية',
      'ملك يتسلم زجاجة عطر على وسادة مخملية',
      'كلوز أب على المكونات الفاخرة: عود، ورد، مسك',
      'انتقال من التاريخي للحديث',
      `زجاجة ${perfumeData.name} تظهر على منصة فاخرة`,
    ],
    veoPrompt,
    veoPromptLandscape,
    sfx: 'royal fanfare, velvet fabric sound, gold coins, ancient seal stamp, modern glass clink',
    bgm: 'majestic Arabic orchestral, oud and strings, royal and powerful, 80 BPM',
    captionStyle: 'royal gold font on dark background, crown emoji, historical dates',
    cta: `ارتدِ ما كان يرتديه الملوك — اطلبه الآن`,
    estimatedViralScore: 9,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. CLASSIC MAHWOUS — الأسلوب الكلاسيكي مع مهووس
// ══════════════════════════════════════════════════════════════════════════════

function buildClassicMahwousScenario(perfumeData: PerfumeData): AdvancedScenario {
  const notes = extractNotes(perfumeData);

  const voiceover = `يا جماعة، وش السالفة مع ${perfumeData.name}؟

والله هذا العطر غير من أول لحظة!

${notes}...
مكونات ما تجتمع إلا في عطر واحد.

أنا مهووس بالعطور، وهذا العطر خلاني أوقف.

لو بتشتري عطراً هذا الشهر،
هذا هو.

${perfumeData.price ? `وبسعره ${perfumeData.price} — يستاهل كل ريال.` : 'وسعره يستاهل والله.'}

الرابط في البايو!`;

  const veoPrompt = `Cinematic luxury perfume advertisement. MAHWOUS_MAN — a stylish confident Saudi Arab man in his late 20s, black swept-back hair with clean fade, thick full black beard neatly groomed, tan warm skin tone, wearing pristine white Saudi thobe — stands confidently in a modern luxury setting. He holds the perfume bottle and speaks directly to camera with enthusiasm and confidence. He demonstrates the perfume, sprays it, and reacts with genuine satisfaction. The bottle's exact design is clearly visible. Warm golden lighting, luxury background. Style: authentic influencer meets luxury commercial, 4K.`;

  const veoPromptLandscape = `Luxury lifestyle commercial. MAHWOUS_MAN — stylish Saudi Arab man, white thobe, black beard — in a stunning modern Saudi luxury interior. He walks confidently, picks up the ${perfumeData.brand} bottle, examines it, and smiles. Wide shots show him in the full luxurious environment. Close-ups of the bottle and his satisfied expression. The energy is authentic and aspirational. Style: premium lifestyle commercial, 4K.`;

  return {
    type: 'classic_mahwous',
    typeLabel: '⭐ مهووس الكلاسيكي',
    platform: 'TikTok',
    hook: `وش السالفة مع ${perfumeData.name}؟ 🤯`,
    voiceoverScript: voiceover,
    visualDirections: [
      'مهووس يدخل الفريم بثقة ويمسك الزجاجة',
      'يتحدث للكاميرا بحماس وأصالة',
      'يرش العطر ويتفاعل بصدق',
      'كلوز أب على الزجاجة مع كل ذكر للمكونات',
      'ينظر للكاميرا بابتسامة واثقة ويشير للبايو',
    ],
    veoPrompt,
    veoPromptLandscape,
    sfx: 'perfume spray, crowd reaction, upbeat sound effect, notification ping',
    bgm: 'trending Arabic trap beat, energetic, 120-130 BPM, viral sound',
    captionStyle: 'TikTok style bold text, emoji, kinetic typography, Arabic dialect',
    cta: 'الرابط في البايو! 🔗',
    estimatedViralScore: 8,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — توليد جميع السيناريوهات
// ══════════════════════════════════════════════════════════════════════════════

export function generateAdvancedScenarios(
  perfumeData: PerfumeData,
  requestedTypes?: ScenarioType[],
): AdvancedScenario[] {
  const allScenarios: AdvancedScenario[] = [
    buildBottleTalksScenario(perfumeData),
    buildIngredientsTalkScenario(perfumeData),
    buildBottleVsManScenario(perfumeData),
    buildBrandStoryScenario(perfumeData),
    buildRoyalHistoryScenario(perfumeData),
    buildClassicMahwousScenario(perfumeData),
  ];

  if (!requestedTypes || requestedTypes.length === 0) {
    return allScenarios;
  }

  return allScenarios.filter(s => requestedTypes.includes(s.type));
}

// ── Get scenario by type ──────────────────────────────────────────────────────
export function getScenarioByType(
  perfumeData: PerfumeData,
  type: ScenarioType,
): AdvancedScenario {
  switch (type) {
    case 'bottle_talks':      return buildBottleTalksScenario(perfumeData);
    case 'ingredients_talk':  return buildIngredientsTalkScenario(perfumeData);
    case 'bottle_vs_man':     return buildBottleVsManScenario(perfumeData);
    case 'brand_story':       return buildBrandStoryScenario(perfumeData);
    case 'royal_history':     return buildRoyalHistoryScenario(perfumeData);
    case 'classic_mahwous':   return buildClassicMahwousScenario(perfumeData);
    default:                  return buildClassicMahwousScenario(perfumeData);
  }
}

// ── Get scenario labels for UI ────────────────────────────────────────────────
export const SCENARIO_TYPE_LABELS: Record<ScenarioType, string> = {
  bottle_talks:      '🫙 الزجاجة تتحدث',
  ingredients_talk:  '🌿 المكونات تتحدث',
  bottle_vs_man:     '🤝 مهووس والزجاجة',
  brand_story:       '📖 قصة الماركة',
  royal_history:     '👑 تاريخ الملوك',
  classic_mahwous:   '⭐ مهووس الكلاسيكي',
};
