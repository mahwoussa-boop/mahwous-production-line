// ============================================================
// lib/mahwousVideoEngine.ts — Mahwous Video Engine v6 RIYADH EDITION
//
// ✅ لهجة الرياض الأصيلة — نطق صحيح مع تشكيل كامل
// ✅ هوك قوي في أول 1.5 ثانية يوقف الإصبع
// ✅ مؤثرات بصرية سينمائية (visualFx) لكل سيناريو
// ✅ مؤثرات صوتية احترافية (SFX) لكل سيناريو
// ✅ برومبت Hedra/Veo متجدد يناسب كل عطر
// ✅ 26 سيناريو عمودي + 15 أفقي = 41 سيناريو
// ✅ كل فيديو جاهز للنشر ويتصدر الترند
//
// قواعد اللهجة (لهجة الرياض):
//   - "وِش" بدل "ماذا"
//   - "يِبي" بدل "يريد"
//   - "ما يِطيح" = لا يسقط
//   - "حِلو" = جميل
//   - "طيب" بدل "عطر" (تجنب ع في البداية)
//   - "ريحة" بدل "عطر"
//   - "حاط" = واضع / ملبس
//   - "اِطلُبه" بدل "اشتر"
//   - "مَهووس" مع تشكيل — مرة واحدة فقط في النهاية
//
// قواعد الهوك (أول جملة):
//   - سؤال مثير أو ادعاء جريء
//   - ما يزيد عن 7 كلمات
//   - يُحدث فضولاً فورياً
//   - يخاطب المشاهد مباشرة
// ============================================================

import type { PerfumeData } from './types';

// ═══════════════════════════════════════════════════════════════
// ختامية مَهووس — مرة واحدة فقط مع تشكيل كامل
// ═══════════════════════════════════════════════════════════════
const OUTROS = [
  'اِطلُبه الحين مِن مَهووس.',
  'مُتوفِّر في مَهووس. اِطلُبه وانت بِمكانك.',
  'لا تفوتك. اِطلُبه مِن مَهووس الحين.',
  'جَرِّبه بنَفسك. مُتوفِّر في مَهووس.',
  'تِستاهل الأفخَم. مِن مَهووس.',
  'مَهووس يِختار لك الأفضَل. اِطلُبه.',
  'ثِق فيني. مُتوفِّر في مَهووس.',
  'اِطلُبه وشوف الفَرق. مَهووس.',
];

// ═══════════════════════════════════════════════════════════════
// وصف الشخصية الثابت (للـ Veo/Hedra prompt)
// ═══════════════════════════════════════════════════════════════
const CHAR = `A stylish confident Saudi Arab man in his late 20s:
- Black swept-back hair with clean fade on sides, thick full black beard perfectly groomed
- Wearing elegant crisp white Saudi thobe with subtle gold embroidery on collar
- Warm olive skin tone, sharp jawline, expressive dark eyes
- Holds luxury perfume bottle naturally at chest level with confident grip
- Direct charismatic eye contact with camera, warm genuine smile
- Saudi cultural authenticity — Riyadh modern gentleman aesthetic`;

const QUALITY = `Ultra-high quality cinematic video production:
- 4K resolution with professional Hollywood color grading
- Warm golden-hour lighting: amber key light at 45 degrees, soft blue fill, hair light from behind
- Shallow depth of field f/1.4 with creamy bokeh background
- Smooth 24fps motion with subtle natural breathing and micro-movements
- Premium luxury fragrance advertising aesthetic
- Trending social media visual style with high engagement composition
- No text overlays, no watermarks, no logos`;

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════
export interface GeneratedVideoContent {
  voiceoverText: string;
  videoPrompt: string;
  scenarioId: string;
  scenarioName: string;
  hook: string;
  sfxInstructions: string;
  transitionStyle: string;
  visualEffects: string;
}

interface Scenario {
  id: string;
  name: string;
  build: (d: PerfumeData) => string;
  hook: (d: PerfumeData) => string;
  prompt: string;
  sfx: string;
  transition: string;
  visualFx: string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sName(d: PerfumeData): string {
  const n = d.name || 'هالطيب';
  const w = n.split(' ');
  return w.length > 2 ? w.slice(0, 2).join(' ') : n;
}

function bName(d: PerfumeData): string {
  if (!d.brand) return '';
  const w = d.brand.split(' ');
  return w[0] || '';
}

function riyadhDesc(): string {
  const descs = [
    'ريحَته فَخمة وثَباته ما يِطيح',
    'ريحة راقِية تدوم طول اليَوم كُله',
    'ريحَته تِجذب كُل مَن حَولك',
    'ريحة مُمَيَّزة ما تِتكرَّر',
    'ريحَته تِخطف الأنظار من أوَّل ما تِدخل',
    'ريحة تِجمع بين الفَخامة والثَبات',
    'ريحة تِخليك مُمَيَّز وسط الكُل',
    'ريحَته تِملا المَكان فَخامة وأناقة',
    'ريحة تِحسّسك بالثِّقة والحُضور',
    'ريحة تِخلّي النّاس تِسألك وِش حاط',
    'ريحة ما تِقدر تِنساها بَعد ما تِشُمّها',
    'ريحَته تِقول عَنك كُل شَيء بدون ما تِتكلَّم',
  ];
  return pick(descs);
}

function trim(text: string, maxWords = 55): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '.';
}

// ═══════════════════════════════════════════════════════════════
// سيناريوهات عمودية (9:16) — TikTok / Reels / Shorts
// 26 سيناريو متنوع
// ═══════════════════════════════════════════════════════════════
const V_SCENARIOS: Scenario[] = [

  // ─── 1. مغناطيس المدح ───
  {
    id: 'compliment',
    name: 'مغناطيس المدح',
    hook: () => `وِش اللي يِخلّي النّاس تِمدَحك كُل يَوم؟`,
    build: (d) => {
      const n = sName(d);
      return `وِش اللي يِخلّي النّاس تِمدَحك كُل يَوم؟ ${n}. ${riyadhDesc()}. لو تبي الكُل يِسألك وِش ريحتك — هذا هو.`;
    },
    prompt: `Character reacts to imaginary compliments flooding in, proud confident smile spreads across face, slowly raises luxury perfume bottle toward camera in triumphant hero shot. Quick confident head movements with social media energy. Camera: starts medium shot then smooth cinematic dolly-in to tight close-up on face and bottle simultaneously. Background: warm gradient with floating golden light particles. Lighting: vibrant ring light with warm amber color temperature.`,
    sfx: 'Soft whoosh on bottle reveal, sparkle chime, upbeat Saudi trap beat drop on hero shot, crowd murmur in background',
    transition: 'Smooth zoom-in with motion blur, golden particle burst on reveal',
    visualFx: 'Golden shimmer particles floating around bottle, warm bokeh background, subtle lens flare on bottle glass',
  },

  // ─── 2. الصدمة الجميلة ───
  {
    id: 'blind_buy',
    name: 'الصدمة الجميلة',
    hook: () => `اِشتريته بدون ما أشُمّه — وانصدمت.`,
    build: (d) => {
      const n = sName(d);
      return `اِشتريته بدون ما أشُمّه. ${n}. أوَّل ما فتحته اِنصدمت. ريحة فَخمة ما توقَّعتها. مِن أحلى القرارات اللي اِتخذتها.`;
    },
    prompt: `Character opens elegant black gift box slowly, lifts perfume bottle with both hands, brings to nose, eyes widen with genuine amazement and delight. Authentic unboxing excitement. Camera: overhead cinematic shot of box opening, quick cut to extreme close-up of eyes widening, pull back to medium reaction shot. Background: clean black marble surface with warm spotlight. Lighting: soft overhead diffused light with warm golden accent from below.`,
    sfx: 'Luxury box opening click, tissue paper rustle ASMR, dramatic reveal whoosh, gasp of amazement, uplifting music swell',
    transition: 'Cut with white flash on reveal moment',
    visualFx: 'Soft golden light emanating from box as it opens, slow-motion reveal effect, sparkle particles on bottle',
  },

  // ─── 3. السلاح السري ───
  {
    id: 'secret',
    name: 'السلاح السري',
    hook: () => `سِلاحي السِّري قبل أي طَلعة — وما أقوله لأحد.`,
    build: (d) => {
      const n = sName(d);
      return `سِلاحي السِّري قبل أي طَلعة. ${n}. يِخلّيك مُمَيَّز وسط أي مكان. ثَباته يدوم طول اليَوم. وما أقوله لأحد.`;
    },
    prompt: `Character getting ready in front of ornate gold-framed mirror, adjusts thobe collar with deliberate care, then dramatically reveals perfume bottle from behind back with slow confident wink directly at camera. Mirror reflection creates double image. Camera: starts with mirror reflection shot, rack focus from reflection to real character, tight on conspiratorial wink. Background: luxurious dressing room with warm golden wall sconces. Lighting: dramatic side lighting creating depth and mystery.`,
    sfx: 'Mirror ambient echo, fabric rustle, dramatic reveal sting, confident bass music beat, whisper effect',
    transition: 'Mirror reflection dissolve, slow-motion wink freeze frame',
    visualFx: 'Mirror reflection glow effect, golden particles on bottle reveal, subtle smoke wisps around bottle',
  },

  // ─── 4. الطيب يتكلم ───
  {
    id: 'talking',
    name: 'الطيب يتكلم',
    hook: () => `لو هالطّيب يِتكلَّم — وِش بيقول؟`,
    build: (d) => {
      const n = sName(d);
      return `لو هالطّيب يِتكلَّم بيقول: أنا ${n}. اللي يِحُطّني ما يِقدر يِستغني. ريحتي تدوم وتِخلّي الكُل يِلتفت.`;
    },
    prompt: `Character holds perfume bottle near ear as if listening to it whisper secrets, nods knowingly with playful smile, then turns to camera with conspiratorial expression and raises bottle proudly. Creative storytelling style. Camera: tight close-up on bottle near ear, quick cut to knowing expression, pull back to medium shot with bottle featured. Background: colorful trendy gradient with abstract mist effects. Lighting: creative colored rim lights with warm key light.`,
    sfx: 'Mystical whisper sound effect, playful chime, trending beat drop, bottle clink',
    transition: 'Whip pan from bottle to face, zoom burst on reveal',
    visualFx: 'Sound wave visualization around bottle, magical glow from bottle, colorful bokeh particles',
  },

  // ─── 5. تقييم صريح ───
  {
    id: 'rating',
    name: 'تقييم صريح',
    hook: () => `تَقييمي الصَّريح — وما أجامل أحد.`,
    build: (d) => {
      const n = sName(d);
      return `تَقييمي الصَّريح وما أجامل. ${n}. الثَّبات عَشرة مِن عَشرة. الريحة مُمتازة. مِن أفضل اللي جرَّبتها صَراحة.`;
    },
    prompt: `Character counts on fingers with deliberate emphasis while reviewing each quality, pauses thoughtfully between points, then gives enthusiastic double thumbs up with big genuine smile. Quick-cut honest review format. Camera: medium shot with subtle push-in on each point, extreme close-up on thumbs up. Background: clean studio with floating golden rating stars. Lighting: bright even studio lighting with subtle warm tones.`,
    sfx: 'Counting tick sound for each point, star rating ding, double thumbs up celebration sound, upbeat music',
    transition: 'Quick cuts synced with counting beats',
    visualFx: 'Star ratings floating in, golden number overlays, celebration confetti burst on thumbs up',
  },

  // ─── 6. قبل الموعد ───
  {
    id: 'date_night',
    name: 'قبل الموعد',
    hook: () => `عِندك مَوعد مُهم؟ هذا اللي يِكمّل لوكك.`,
    build: (d) => {
      const n = sName(d);
      return `عِندك مَوعد مُهم؟ ${n} يِكمّل لوكك. ريحَته تِمنحك ثِقة وحُضور. جَرِّبه وشوف الفَرق.`;
    },
    prompt: `Character adjusts thobe collar in elegant mirror with focused preparation energy, picks up perfume bottle with deliberate confident motion, applies with charming knowing smile directly at camera. Camera: wide establishing shot of dressing area, smooth track-in to medium close-up, final tight shot on confident smile. Background: elegant warm-toned room with soft ambient lighting. Lighting: warm romantic golden hour simulation.`,
    sfx: 'Elegant preparation ambient, fabric adjustment sound, perfume spray sound, confident music swell',
    transition: 'Smooth track-in with warm color grade',
    visualFx: 'Warm golden vignette, soft bokeh lights, subtle shimmer on thobe fabric',
  },

  // ─── 7. الكاونت داون ───
  {
    id: 'countdown',
    name: 'الكاونت داون',
    hook: (d) => `ثَلاثة أسباب تِخليك تِطلُب ${sName(d)} الحين.`,
    build: (d) => {
      const n = sName(d);
      return `ثَلاثة أسباب تِطلُبه الحين. أوَّل: ريحة مُمَيَّزة. ثاني: ثَبات قَوي. ثالث: سِعره يِستاهل. ${n}.`;
    },
    prompt: `Character holds up three fingers counting down with energetic confidence, each number gets a quick cut to a different angle, final reveal of perfume bottle with explosive energy. Camera: medium shot for countdown, quick cuts between angles, dramatic final close-up on bottle. Background: dark gradient with neon accent lights. Lighting: dramatic split lighting with colored accents.`,
    sfx: 'Countdown beep for each number, bass drop on reveal, hype music, crowd energy sound',
    transition: 'Quick cuts synced with countdown, explosion effect on reveal',
    visualFx: 'Number graphics floating, energy burst on each count, final explosive reveal with light rays',
  },

  // ─── 8. الاختيار الصعب ───
  {
    id: 'choice',
    name: 'الاختيار الصعب',
    hook: () => `كُل مَرَّة أِقف قُدّام طيوبي أِختار نَفس الشَّيء.`,
    build: (d) => {
      const n = sName(d);
      return `كُل مَرَّة أِقف قُدّام طيوبي أِختار نَفس الشَّيء. ${n}. مِش لأنه الوَحيد — لأنه الأفضَل.`;
    },
    prompt: `Character stands before a collection of luxury perfume bottles on an elegant shelf, hand passes over several bottles thoughtfully, then confidently selects the featured bottle with a proud smile. Camera: wide shot of collection, close-up on hand selection, medium shot of proud reveal. Background: luxury perfume display with warm spotlights. Lighting: warm museum-style directional spotlights.`,
    sfx: 'Gentle glass clink as hand passes bottles, selection chime, proud reveal music swell',
    transition: 'Smooth selection motion with focus pull',
    visualFx: 'Spotlight highlighting chosen bottle, other bottles slightly dimmed, golden glow on selection',
  },

  // ─── 9. السر المكشوف ───
  {
    id: 'secret_reveal',
    name: 'السر المكشوف',
    hook: () => `سِرّ ما قُلته لأحد — الحين أقوله.`,
    build: (d) => {
      const n = sName(d);
      return `سِرّ ما قُلته لأحد. الحين أقوله. ${n} هو اللي يِخلّيني دايم مُمَيَّز. ريحته تِفرق عَن كُل شَيء.`;
    },
    prompt: `Character leans toward camera conspiratorially, cups hand near mouth as if sharing a secret, then slowly reveals perfume bottle with dramatic flair and knowing smile. Camera: extreme close-up on face leaning in, quick cut to bottle reveal, medium shot of satisfied expression. Background: dark moody background with single spotlight. Lighting: dramatic Rembrandt lighting with deep shadows.`,
    sfx: 'Record scratch stop, dramatic silence, whisper ambient, secret reveal chime, dramatic music sting',
    transition: 'Dramatic pause then fast reveal with light burst',
    visualFx: 'Vignette darkening around edges, spotlight on face, dramatic light burst on bottle reveal',
  },

  // ─── 10. التحدي المقبول ───
  {
    id: 'challenge',
    name: 'التحدي المقبول',
    hook: (d) => `تَحدَّيت نَفسي أشوف طيب أفضَل مِن ${sName(d)} — ما لَقيت.`,
    build: (d) => {
      const n = sName(d);
      return `تَحدَّيت نَفسي أشوف طيب أفضَل مِن ${n}. جرَّبت كَثير. ما لَقيت. هذا يِبقى مَعي.`;
    },
    prompt: `Character gestures as if examining and comparing multiple options, shakes head dismissively at alternatives, then holds up featured perfume bottle with victorious expression. Camera: medium shot of comparison gesture, close-up on dismissive shake, triumphant medium shot with bottle raised. Background: clean studio with subtle comparison graphics. Lighting: bright confident studio lighting.`,
    sfx: 'Challenge accepted sound, examination suspense music, wrong buzzer on alternatives, victory celebration fanfare',
    transition: 'Quick comparison cuts, triumphant slow-motion reveal',
    visualFx: 'X marks on alternatives, golden crown appearing above winning bottle, confetti burst',
  },

  // ─── 11. الذكاء في الشراء ───
  {
    id: 'smart_buy',
    name: 'الذكاء في الشراء',
    hook: () => `وِش الفَرق بين الغالي والرَّخيص؟ أقولك.`,
    build: (d) => {
      const n = sName(d);
      return `وِش الفَرق بين الغالي والرَّخيص؟ ${n} بسِعره يِتفوَّق على ضِعف سِعره. ثَبات وريحة ما تِتوقَّعها.`;
    },
    prompt: `Character makes smart comparison gesture with hands showing price vs value, shakes head at expensive option, points confidently at featured bottle as the smart choice. Camera: medium shot of comparison gestures, close-up on pointing at bottle, satisfied nod to camera. Background: clean modern background with subtle price graphics. Lighting: bright informative studio lighting.`,
    sfx: 'Cash register cha-ching, wrong buzzer on expensive, winner bell on product, smart upbeat music',
    transition: 'Split-screen comparison effect',
    visualFx: 'Price comparison graphics, value indicator animation, smart choice checkmark',
  },

  // ─── 12. فتح الطرد ───
  {
    id: 'unboxing',
    name: 'فتح الطرد',
    hook: () => `وِصَل الطَّرد — وِش جاء فيه؟`,
    build: (d) => {
      const n = sName(d);
      return `وِصَل الطَّرد. وِش جاء فيه؟ ${n}. الباكيج فَخم. الطيب أفخَم. كُل شَيء يِتكلَّم عَن جَودة حَقيقية.`;
    },
    prompt: `Character receives elegant package, opens with genuine excitement and care, unwraps tissue paper to reveal perfume bottle, holds up to camera with delighted expression. ASMR unboxing style. Camera: overhead shot of unboxing, close-up on hands unwrapping, medium shot of reveal with genuine joy. Background: clean marble surface with warm overhead light. Lighting: soft ASMR-style diffused lighting.`,
    sfx: 'Package rustling ASMR, tissue paper crinkle, box opening click, reveal sparkle, soft ambient music',
    transition: 'Slow-motion unboxing with ASMR audio',
    visualFx: 'Soft golden light on package, sparkle effect on bottle reveal, warm vignette',
  },

  // ─── 13. الصاحب الناصح ───
  {
    id: 'friend_advice',
    name: 'الصاحب الناصح',
    hook: () => `لو صاحبك نَصَحك بطيب — هذا اللي أنصَحك فيه.`,
    build: (d) => {
      const n = sName(d);
      return `لو صاحبك نَصَحك بطيب — هذا اللي أنصَحك فيه. ${n}. جرَّبته وما نَدمت. وانت كَمان ما راح تِندم.`;
    },
    prompt: `Character speaks directly to camera with warm friendly energy like talking to a close friend, leans forward slightly with genuine care, holds perfume bottle up as sincere recommendation. Camera: medium close-up with warm intimate framing, slight lean toward camera. Background: cozy warm living room with soft ambient lighting. Lighting: warm friendly natural light simulation.`,
    sfx: 'Casual conversation ambient, friendly notification sound, warm acoustic guitar background, sincere music',
    transition: 'Warm color grade with gentle zoom',
    visualFx: 'Warm golden vignette, soft bokeh background, heart emoji floating subtly',
  },

  // ─── 14. الغموض الجذاب ───
  {
    id: 'mystery',
    name: 'الغموض الجذاب',
    hook: () => `في طيب يِخلّي النّاس تِتبَعك — وِش هو؟`,
    build: (d) => {
      const n = sName(d);
      return `في طيب يِخلّي النّاس تِتبَعك أينما رُحت. ${n}. ريحته تِترُك أَثَر ما يِنسى. هذا هو السِّر.`;
    },
    prompt: `Character walks slowly toward camera through atmospheric mist, stops, holds perfume bottle up mysteriously, smiles with magnetic confidence. Camera: slow tracking shot following character, dramatic stop, close-up on mysterious smile. Background: dark atmospheric background with golden mist effects. Lighting: dramatic single spotlight from above with atmospheric haze.`,
    sfx: 'Mysterious ambient drone, atmospheric whoosh, magnetic reveal chime, cinematic music swell',
    transition: 'Slow atmospheric reveal through mist',
    visualFx: 'Golden mist particles, atmospheric haze, dramatic spotlight beam, slow-motion walk',
  },

  // ─── 15. طول اليوم ───
  {
    id: 'longevity',
    name: 'طول اليوم',
    hook: () => `حَطَّيته الصُّبح — لَقيته عَليّ اللَّيل.`,
    build: (d) => {
      const n = sName(d);
      return `حَطَّيته الصُّبح. اللَّيل لَقيته لَسا عَليّ. ${n}. ثَباته ما يِصدَّق. هذا هو الفَرق الحَقيقي.`;
    },
    prompt: `Character shows morning routine applying perfume, quick time-lapse effect, then shows same character at night still fresh and confident. Camera: morning medium shot, time-lapse transition effect, evening medium shot with same confident energy. Background: transitions from bright morning to warm evening. Lighting: morning bright natural light transitioning to warm evening ambient.`,
    sfx: 'Clock ticking time-lapse, morning birds, evening ambient, impressed reaction sound, satisfaction music',
    transition: 'Time-lapse wipe with clock overlay',
    visualFx: 'Day-to-night transition effect, time indicator overlay, fresh glow effect on character',
  },

  // ─── 16. الحضور القوي ───
  {
    id: 'presence',
    name: 'الحضور القوي',
    hook: () => `دَخَلت الغُرفة — والكُل اِلتَفَت.`,
    build: (d) => {
      const n = sName(d);
      return `دَخَلت الغُرفة والكُل اِلتَفَت. مِش بَس الشَّكل. الريحة. ${n}. يِعطيك حُضور ما تِشتريه بِفلوس.`;
    },
    prompt: `Character makes confident entrance walking toward camera with commanding presence, stops and looks directly at camera with magnetic confidence, raises perfume bottle proudly. Cinematic entrance style. Camera: wide shot of confident walk, dramatic stop, close-up on confident expression. Background: luxury venue with warm ambient lighting. Lighting: cinematic bass drop lighting with dramatic shadows.`,
    sfx: 'Cinematic bass drop on entrance, slow motion whoosh, confident stride sound, crowd turning ambient',
    transition: 'Slow-motion entrance with speed ramp',
    visualFx: 'Slow-motion particles, dramatic lighting shift on entrance, golden aura effect',
  },

  // ─── 17. قبل وبعد ───
  {
    id: 'before_after',
    name: 'قبل وبعد',
    hook: () => `قَبل ما أحُطّه — وبَعد ما أحُطّه. الفَرق واضِح.`,
    build: (d) => {
      const n = sName(d);
      return `قَبل ما أحُطّه — عادي. بَعد ما أحُطّه — مُختَلِف. ${n}. يِغيَّر كُل شَيء. جَرِّبه وشوف بنَفسك.`;
    },
    prompt: `Character shows clear transformation: first appears casual and ordinary, then applies perfume, instantly transforms to confident and magnetic. Split-screen or before/after style. Camera: split-screen comparison or dramatic transformation cut. Background: neutral before, luxury after. Lighting: flat before, dramatic cinematic after.`,
    sfx: 'Dull ambient for before, dramatic transformation whoosh, powerful confident music for after, transformation sound',
    transition: 'Split-screen wipe or dramatic transformation flash',
    visualFx: 'Split-screen effect, transformation flash, color grade shift from dull to vibrant',
  },

  // ─── 18. الهمس الفاخر ───
  {
    id: 'luxury_whisper',
    name: 'الهمس الفاخر',
    hook: () => `أهمِس لك بسِرّ — هذا الطيب مِش لِلكُل.`,
    build: (d) => {
      const n = sName(d);
      return `أهمِس لك بسِرّ. ${n} مِش لِلكُل. لِلي يِفهم الفَخامة الحَقيقية. لِلي يِستاهل الأفضَل.`;
    },
    prompt: `Character leans very close to camera and whispers intimately, holds perfume bottle delicately like precious treasure, creates exclusive intimate moment. ASMR luxury style. Camera: extreme close-up on face whispering, close-up on bottle held delicately. Background: dark luxurious background with soft ambient glow. Lighting: intimate soft ASMR lighting with warm tones.`,
    sfx: 'ASMR whisper ambient, soft breath sounds, gentle reveal chime, calming luxury background music',
    transition: 'Slow intimate zoom-in',
    visualFx: 'Soft vignette, intimate warm glow, subtle bokeh particles, luxury shimmer on bottle',
  },

  // ─── 19. المناسبة الصحيحة ───
  {
    id: 'occasions',
    name: 'المناسبة الصحيحة',
    hook: () => `طيب واحد لِكُل مُناسَبة — هذا هو.`,
    build: (d) => {
      const n = sName(d);
      return `طيب واحد لِكُل مُناسَبة. سَفَر؟ ${n}. عَمَل؟ ${n}. سَهرة؟ ${n}. يِناسِب كُل وَقت وكُل مَكان.`;
    },
    prompt: `Character quickly changes contexts: points to imaginary travel scene, then office, then evening out, each time holding up the same perfume bottle as the perfect choice. Quick-cut versatility showcase. Camera: quick cuts between different poses and contexts. Background: transitions between different environment suggestions. Lighting: adapts to each context.`,
    sfx: 'Versatile transition sounds for each occasion, smart choice ding, upbeat confident music',
    transition: 'Quick context-switching cuts with whoosh',
    visualFx: 'Context-specific overlays, location indicator graphics, versatility animation',
  },

  // ─── 20. الحكاية الحقيقية ───
  {
    id: 'real_story',
    name: 'الحكاية الحقيقية',
    hook: () => `أقولك قِصَّة حَقيقية صارت معي.`,
    build: (d) => {
      const n = sName(d);
      return `أقولك قِصَّة حَقيقية. حَطَّيت ${n} وطِلعت. شَخص وِقَفني وقال: وِش ريحتك هذي؟ مِن يَومها ما غيَّرته.`;
    },
    prompt: `Character tells story with natural hand gestures and authentic expression, recreates the moment someone stopped them to ask about the fragrance, holds bottle up with pride. Storytelling vlog style. Camera: medium close-up for storytelling, animated hand gestures, proud bottle reveal. Background: warm casual setting. Lighting: warm natural vlog lighting.`,
    sfx: 'Storytelling ambient, suspense build, punchline reveal sound, satisfied music resolution',
    transition: 'Natural storytelling flow with subtle zoom',
    visualFx: 'Warm storytelling vignette, subtle flashback effect, genuine emotion lighting',
  },

  // ─── 21. الشم الأعمى ───
  {
    id: 'blind_test',
    name: 'الشم الأعمى',
    hook: () => `شَمَّيته بدون ما أشوف الاِسم — وخمَّنت صَح.`,
    build: (d) => {
      const n = sName(d);
      return `شَمَّيته بدون ما أشوف الاِسم. فكَّرت وقُلت: هذا لازم يكون ${n}. فتحت — وخمَّنت صَح. ريحة مُمَيَّزة ما تِتكرَّر.`;
    },
    prompt: `Character covers eyes playfully, someone hands them perfume bottle, they smell it thoughtfully, then reveal their guess with confident pointing, uncover eyes to confirm with delighted expression. Camera: close-up on covered eyes, tight on nose smelling, dramatic reveal of correct guess. Background: fun bright studio setting. Lighting: bright playful studio lighting.`,
    sfx: 'Blindfold ambient, deep inhale sound, thinking pause, reveal dramatic sting, satisfaction chime',
    transition: 'Dramatic pause then fast reveal',
    visualFx: 'Question mark overlay during guessing, checkmark explosion on correct guess, celebration effect',
  },

  // ─── 22. نصيحة سريعة ───
  {
    id: 'quick_tip',
    name: 'نصيحة سريعة',
    hook: () => `نَصيحة سَريعة تِغيَّر ريحتك لِلأبَد.`,
    build: (d) => {
      const n = sName(d);
      return `نَصيحة سَريعة. لو تبي ريحة تِدوم — حُطّها على نَبضات المِعصَم والرَّقَبة. ${n}. وشوف الفَرق.`;
    },
    prompt: `Character gives quick expert tip with confident pointing gesture, demonstrates application technique on wrist, holds up bottle as the recommended product. Quick educational style. Camera: medium shot for tip delivery, close-up on wrist demonstration, bottle reveal. Background: clean minimal studio. Lighting: bright clear educational lighting.`,
    sfx: 'Quick tip notification sound, demonstration whoosh, wink sparkle, fast upbeat music',
    transition: 'Quick educational cuts with graphic overlays',
    visualFx: 'Tip indicator graphic, application point highlights, expert badge overlay',
  },

  // ─── 23. المجموعة الخاصة ───
  {
    id: 'collection',
    name: 'المجموعة الخاصة',
    hook: () => `مِن كُل مَجموعتي — هذا اللي يِتصدَّر.`,
    build: (d) => {
      const n = sName(d);
      return `عِندي مَجموعة طيوب. بَس مِن كُلها — ${n} يِتصدَّر. ريحته تِفرق. ثَباته يِفرق. كُل شَيء فيه يِفرق.`;
    },
    prompt: `Character stands before impressive perfume collection on elegant shelf, gestures to the collection with pride, then reaches past all others to select the featured bottle with special reverence. Camera: wide shot of collection, close-up on deliberate selection, medium shot of proud display. Background: luxury perfume display with museum-style lighting. Lighting: warm directional spotlights on collection.`,
    sfx: 'Collection ambient, gentle push aside sounds, spotlight activation sound, emotional music swell',
    transition: 'Smooth selection with focus pull to featured bottle',
    visualFx: 'Spotlight highlighting chosen bottle, others dimming, golden glow on selection',
  },

  // ─── 24. الدخول المميز ───
  {
    id: 'entrance',
    name: 'الدخول المميز',
    hook: () => `كُل ما دَخَلت مَكان — الناس تِسأل وِش ريحتك.`,
    build: (d) => {
      const n = sName(d);
      return `كُل ما دَخَلت مَكان الناس تِسأل: وِش ريحتك؟ ${n}. يِخلّيك تِترُك أَثَر قَبل ما تِتكلَّم.`;
    },
    prompt: `Character makes grand entrance walking through imaginary doorway toward camera, people around react with impressed looks, character stops and holds up perfume bottle confidently. Camera: wide entrance shot, reaction cutaways, confident medium shot with bottle. Background: luxury venue entrance. Lighting: dramatic entrance lighting with warm ambient.`,
    sfx: 'Door opening sound, footstep sounds, impressed crowd murmur, confident entrance music',
    transition: 'Cinematic entrance with slow-motion effect',
    visualFx: 'Entrance light rays, crowd reaction indicators, golden aura around character',
  },

  // ─── 25. الطيب الأصيل ───
  {
    id: 'authentic',
    name: 'الطيب الأصيل',
    hook: () => `في فَرق بين الأصيل والتَّقليد — أقولك كِيف تِعرف.`,
    build: (d) => {
      const n = sName(d);
      return `في فَرق بين الأصيل والتَّقليد. ${n} الأصيل ريحته تِختَلِف. ثَباته يِختَلِف. الجَودة تِحِس فيها مِن أوَّل شَمَّة.`;
    },
    prompt: `Character holds perfume bottle up to light examining it like an expert, nods with authority, then looks directly at camera with confident expertise. Expert authentication style. Camera: close-up on bottle examination, medium shot of expert nod, direct camera address. Background: clean professional setting. Lighting: professional expert lighting.`,
    sfx: 'Expert examination ambient, authentication sound, quality confirmation chime, authoritative music',
    transition: 'Expert examination close-up then confident reveal',
    visualFx: 'Magnification effect on bottle details, quality seal animation, expert badge',
  },

  // ─── 26. الختام الملكي ───
  {
    id: 'royal_ending',
    name: 'الختام الملكي',
    hook: (d) => `مِن يَوم ما جرَّبت ${sName(d)} — ما رَجَعت لِغَيره.`,
    build: (d) => {
      const n = sName(d);
      return `مِن يَوم ما جرَّبت ${n} — ما رَجَعت لِغَيره. ريحة تِلتَصِق بالذَّاكِرة. هذا هو الطيب اللي تِستاهله.`;
    },
    prompt: `Character stands in regal pose with perfume bottle held at chest level, looks at camera with absolute confidence and satisfaction, slow cinematic reveal. Royal luxury style. Camera: wide cinematic shot, slow push-in to medium, final close-up on confident expression. Background: grand luxurious setting. Lighting: royal golden lighting with dramatic shadows.`,
    sfx: 'Royal fanfare intro, cinematic music swell, confident conclusion sound, luxury ambiance',
    transition: 'Slow cinematic push-in with dramatic lighting',
    visualFx: 'Royal golden particles, cinematic letterbox bars, dramatic lighting shift',
  },
];

// ═══════════════════════════════════════════════════════════════
// سيناريوهات أفقية (16:9) — YouTube / LinkedIn / Twitter
// 15 سيناريو متنوع
// ═══════════════════════════════════════════════════════════════
const H_SCENARIOS: Scenario[] = [

  // ─── 1. مراجعة الخبير ───
  {
    id: 'h_expert_review',
    name: 'مراجعة الخبير',
    hook: (d) => `مراجعتي الصَّريحة لـ ${sName(d)} — بدون مجاملة.`,
    build: (d) => {
      const n = sName(d);
      const b = bName(d);
      return `مراجعتي الصَّريحة لـ ${n} مِن ${b || 'هذا البَيت'}. الثَّبات: مُمتاز. الريحة: راقِية وفَريدة. القِيمة مُقابِل السِّعر: تِستاهل كُل رِيال. تَوصِيتي: اِطلُبه.`;
    },
    prompt: `Character seated at elegant review desk with multiple perfume bottles arranged professionally, holds featured bottle prominently while giving authoritative review. Professional YouTube review style. Camera: medium shot with bottles visible, close-up on featured bottle, direct camera address. Background: sophisticated review studio with warm lighting. Lighting: professional three-point studio lighting.`,
    sfx: 'Professional review music, subtle analysis ambient, expert conclusion sting, approval sound',
    transition: 'Professional cuts with subtle zoom',
    visualFx: 'Rating graphics overlay, professional lower-third style, quality indicators',
  },

  // ─── 2. تاريخ الطيب ───
  {
    id: 'h_history',
    name: 'تاريخ الطيب',
    hook: (d) => `وِش تَعرِف عَن تاريخ ${sName(d)}؟`,
    build: (d) => {
      const n = sName(d);
      const b = bName(d);
      return `${b || 'هذا البَيت'} عِنده تاريخ في صِناعة الطيب. ${n} واحِد مِن أبرَز إِصداراتهم. مَزيج مُتوازِن بين الأصالة والحَداثة. طيب يِستاهل الاِهتِمام.`;
    },
    prompt: `Character speaks with scholarly authority about fragrance history, gestures thoughtfully, holds bottle with reverence like a historical artifact. Documentary educational style. Camera: medium wide shot with elegant backdrop, close-up on bottle as artifact. Background: classic library or cultural setting. Lighting: warm documentary lighting.`,
    sfx: 'Elegant documentary music, page turning ambient, historical atmosphere sound',
    transition: 'Elegant documentary cuts',
    visualFx: 'Historical timeline overlay, cultural pattern animations, documentary aesthetic',
  },

  // ─── 3. المقارنة الصريحة ───
  {
    id: 'h_comparison',
    name: 'المقارنة الصريحة',
    hook: (d) => `قارَنت ${sName(d)} بِغَيره — والنَّتيجة مُفاجِئة.`,
    build: (d) => {
      const n = sName(d);
      return `قارَنت ${n} بِطيوب بِنَفس السِّعر. الثَّبات: فاز. الريحة: فاز. التَّعبِئة: فاز. الفائِز الواضِح هو ${n}.`;
    },
    prompt: `Character sets up comparison between perfume bottles on desk, examines each thoughtfully, then clearly indicates the winner with confident gesture. Honest comparison review style. Camera: wide shot of comparison setup, close-ups on each bottle, clear winner reveal. Background: clean comparison studio. Lighting: even bright studio lighting.`,
    sfx: 'Debate ambient music, comparison transition sounds, verdict gavel sound, winner celebration',
    transition: 'Split-screen comparison then winner reveal',
    visualFx: 'Comparison table overlay, winner badge animation, vs. graphic',
  },

  // ─── 4. دليل الشراء ───
  {
    id: 'h_buying_guide',
    name: 'دليل الشراء',
    hook: () => `قَبل ما تِشتري طيب — اِسمَع هذا.`,
    build: (d) => {
      const n = sName(d);
      return `قَبل ما تِشتري طيب — في أشياء لازِم تِعرِفها. الثَّبات، الريحة، والقِيمة. ${n} يِجمَع الثَّلاثة. دَليلك لِلشِّراء الصَّح.`;
    },
    prompt: `Character presents buying guide with clear hand gestures for each point, holds up featured bottle as the recommendation that meets all criteria. Educational guide style. Camera: medium shot for guide presentation, close-up on bottle as recommendation. Background: clean educational setting. Lighting: bright informative lighting.`,
    sfx: 'Educational music, guide point sounds, recommendation chime, helpful ambient',
    transition: 'Educational cuts with point indicators',
    visualFx: 'Checklist animation, criteria checkmarks, recommendation highlight',
  },

  // ─── 5. الموسم المناسب ───
  {
    id: 'h_seasonal',
    name: 'الموسم المناسب',
    hook: (d) => `لِكُل مَوسِم طيب — و${sName(d)} طيب الشِّتاء.`,
    build: (d) => {
      const n = sName(d);
      return `لِكُل مَوسِم طيب مُناسِب. ${n} يِتألَّق في الشِّتاء. ريحته الدافِئة والعَميقة تِناسِب البَرد. اِختيار مُثالي.`;
    },
    prompt: `Character discusses seasonal fragrance selection with warm expertise, demonstrates how the bottle suits the season with atmospheric gestures. Seasonal lifestyle content. Camera: medium shot with seasonal atmosphere, close-up on bottle. Background: cozy seasonal setting. Lighting: warm seasonal ambient.`,
    sfx: 'Seasonal ambient sounds, cozy music, recommendation chime, warm atmosphere',
    transition: 'Seasonal atmosphere transition',
    visualFx: 'Seasonal particle effects, temperature indicator, cozy warm overlay',
  },

  // ─── 6. حقائق مفاجئة ───
  {
    id: 'h_facts',
    name: 'حقائق مفاجئة',
    hook: (d) => `ثَلاث حَقائق عَن ${sName(d)} ما تَعرِفها.`,
    build: (d) => {
      const n = sName(d);
      return `ثَلاث حَقائق عَن ${n} ما تَعرِفها. أوَّل: مُكوِّناته نادِرة. ثاني: ثَباته يَتجاوَز اِثنَي عَشَر ساعة. ثالث: سِعره أقَل مِن مُنافِسيه. مُفاجِئ؟`;
    },
    prompt: `Character reveals surprising facts one by one with dramatic pauses and genuine enthusiasm, holds up bottle while sharing each revelation. Fact reveal style. Camera: medium shot for revelations, close-up on surprised expression, bottle reveal. Background: dynamic studio. Lighting: dramatic reveal lighting.`,
    sfx: 'Fact reveal sound effect, educational music, surprise sting, knowledge ambient',
    transition: 'Dramatic fact reveal with pause',
    visualFx: 'Fact number graphics, surprise indicator, information pop-ups',
  },

  // ─── 7. تحليل القيمة ───
  {
    id: 'h_value',
    name: 'تحليل القيمة',
    hook: (d) => `هَل ${sName(d)} يِستاهل سِعره؟ أحلِّل لك.`,
    build: (d) => {
      const n = sName(d);
      return `هَل ${n} يِستاهل سِعره؟ أحلِّل لك. التَّعبِئة فاخِرة. الثَّبات مُمتاز. الريحة رائِعة. الجَواب: يِستاهل وأكثَر.`;
    },
    prompt: `Character analyzes value proposition methodically, examines bottle quality, demonstrates longevity concept, concludes with confident value assessment. Value analysis style. Camera: close-up on bottle examination, medium shot for analysis, confident conclusion. Background: professional analysis setting. Lighting: analytical bright lighting.`,
    sfx: 'Analysis music, comparison transition sounds, value conclusion sting, positive result sound',
    transition: 'Analytical cuts with value indicators',
    visualFx: 'Value meter animation, quality indicators, price-value graph',
  },

  // ─── 8. ورشة العطور ───
  {
    id: 'h_workshop',
    name: 'ورشة العطور',
    hook: (d) => `كِيف يُصنَع طيب مِثل ${sName(d)}؟`,
    build: (d) => {
      const n = sName(d);
      return `كِيف يُصنَع طيب مِثل ${n}؟ مُكوِّنات نادِرة. خَبرة في التَّركيب. وَقت في التَّخمير. النَّتيجة: ريحة ما تِتكرَّر.`;
    },
    prompt: `Character explains fragrance creation with workshop setting, gestures to ingredients and process, holds final bottle as the masterpiece result. Educational workshop style. Camera: wide workshop shot, close-ups on ingredients, proud final reveal. Background: professional perfume workshop. Lighting: warm workshop lighting.`,
    sfx: 'Workshop ambient, glass bottle sounds, mixing effect, expert tip chime, craftsmanship music',
    transition: 'Workshop process cuts',
    visualFx: 'Ingredient overlays, process animation, masterpiece reveal effect',
  },

  // ─── 9. رحلة الريحة ───
  {
    id: 'h_journey',
    name: 'رحلة الريحة',
    hook: (d) => `رِحلة ${sName(d)} مِن أوَّل شَمَّة لِلنِّهاية.`,
    build: (d) => {
      const n = sName(d);
      return `رِحلة ${n} مِن أوَّل شَمَّة. البِداية: رِيحة حَضرية مُنعِشة. المَنتَصَف: عُمق ودِفء. النِّهاية: ثَبات فاخِر. رِحلة كامِلة.`;
    },
    prompt: `Character describes fragrance journey with expressive gestures showing top, heart, and base notes, holds bottle throughout as the subject of the journey. Journey narrative style. Camera: medium shot for journey description, close-up on bottle at each stage. Background: atmospheric journey setting. Lighting: transitions with journey stages.`,
    sfx: 'Journey music progression, time transition whoosh, atmosphere change sounds',
    transition: 'Journey stage transitions with atmosphere',
    visualFx: 'Fragrance note indicators, journey timeline overlay, atmospheric stage effects',
  },

  // ─── 10. الصدق أولاً ───
  {
    id: 'h_honest',
    name: 'الصدق أولاً',
    hook: (d) => `سأكون صَريحاً معك عَن ${sName(d)}.`,
    build: (d) => {
      const n = sName(d);
      return `سأكون صَريحاً. ${n} مِش مُثالي لِلجَميع. لِمَن يُحِب الريحة الفاخِرة العَميقة — هذا طيبك. لِمَن يُحِب الخَفيف — ابحَث عَن غَيره.`;
    },
    prompt: `Character speaks with genuine honesty and directness, acknowledges both strengths and who the fragrance is for, builds trust through authenticity. Honest review style. Camera: direct medium close-up, honest expression, genuine gestures. Background: simple honest setting. Lighting: natural honest lighting.`,
    sfx: 'Honest conversation music, trust-building ambient, sincerity sting',
    transition: 'Natural honest flow',
    visualFx: 'Trust indicator, honest review badge, genuine expression lighting',
  },

  // ─── 11. المناسبات المختلفة ───
  {
    id: 'h_occasions_guide',
    name: 'المناسبات المختلفة',
    hook: (d) => `مَتى تَحُط ${sName(d)}؟ دَليل كامِل.`,
    build: (d) => {
      const n = sName(d);
      return `مَتى تَحُط ${n}؟ العَمَل: مُناسِب. السَّفَر: مُمتاز. المُناسَبات: رائِع. اليَومي: مَقبول. طيب لِكُل وَقت.`;
    },
    prompt: `Character guides through different occasions with clear hand gestures for each, holds bottle as the versatile solution. Comprehensive guide style. Camera: medium shot for each occasion, bottle featured throughout. Background: clean guide setting. Lighting: clear informative lighting.`,
    sfx: 'List counting sound for each number, occasion-specific ambient, conclusion fanfare',
    transition: 'Occasion-switching cuts with indicators',
    visualFx: 'Occasion icons, suitability indicators, versatility animation',
  },

  // ─── 12. تجربة شخصية ───
  {
    id: 'h_personal',
    name: 'تجربة شخصية',
    hook: (d) => `قِصَّتي مَع ${sName(d)} — مِن أوَّل يَوم.`,
    build: (d) => {
      const n = sName(d);
      return `قِصَّتي مَع ${n} بَدأت قَبل سَنة. مِن يَومها ما غيَّرته. ريحة تِلتَصِق بالذَّاكِرة. وكُل مَن يَشُمّها يِسأل عَنها.`;
    },
    prompt: `Character shares personal story with genuine emotion and authentic storytelling, holds bottle with nostalgic affection. Personal story style. Camera: intimate medium close-up, emotional expression, bottle held with care. Background: personal warm setting. Lighting: warm nostalgic lighting.`,
    sfx: 'Time passage music, experience ambient, satisfied conclusion music, personal story sound',
    transition: 'Personal story flow with warm grade',
    visualFx: 'Memory effect, warm nostalgic overlay, personal connection lighting',
  },

  // ─── 13. هدية مثالية ───
  {
    id: 'h_gift',
    name: 'هدية مثالية',
    hook: () => `تَبحَث عَن هَدية مُمَيَّزة؟ وَجَدتَها.`,
    build: (d) => {
      const n = sName(d);
      return `تَبحَث عَن هَدية مُمَيَّزة؟ ${n} الاِختيار المُثالي. التَّعبِئة فاخِرة تِناسِب الهَدية. والريحة تِخلّي المُهدَى له يِذكُرك.`;
    },
    prompt: `Character presents bottle as a gift with warm generous energy, shows elegant packaging, demonstrates how it makes the perfect present. Gift guide style. Camera: medium shot of gift presentation, close-up on packaging, warm expression. Background: gift-giving setting with warm ambiance. Lighting: warm gift presentation lighting.`,
    sfx: 'Gift wrapping sounds, ribbon pull, excited recipient reaction, warm holiday music',
    transition: 'Warm gift presentation flow',
    visualFx: 'Gift ribbon animation, sparkle on packaging, warm gift glow',
  },

  // ─── 14. نصائح الخبير ───
  {
    id: 'h_expert_tips',
    name: 'نصائح الخبير',
    hook: () => `خَمس نَصائح لِتَحصَل على أقصى ثَبات مِن طيبك.`,
    build: (d) => {
      const n = sName(d);
      return `خَمس نَصائح لِأقصى ثَبات. حُطّه على النَّبضات. لا تَفرُك. حُطّه بَعد الاِستِحمام. تَجنَّب الحَرارة. وخَزِّنه صَح. ${n} مَع هذي النَّصائح يِدوم أكثَر.`;
    },
    prompt: `Character delivers expert tips with clear demonstrations and authoritative confidence, holds bottle throughout as the subject of the tips. Expert tip style. Camera: medium shot for each tip, demonstration close-ups, bottle featured. Background: expert studio setting. Lighting: professional expert lighting.`,
    sfx: 'Expert tip notification, demonstration sounds, tip confirmation chime, professional music',
    transition: 'Expert tip cuts with indicators',
    visualFx: 'Tip number graphics, demonstration highlights, expert badge',
  },

  // ─── 15. الخلاصة الذهبية ───
  {
    id: 'h_golden_summary',
    name: 'الخلاصة الذهبية',
    hook: (d) => `الخُلاصة: هَل ${sName(d)} يِستاهل؟`,
    build: (d) => {
      const n = sName(d);
      return `الخُلاصة الذَّهَبية. ${n} طيب يِجمَع الجَودة والثَّبات والريحة المُمَيَّزة. إِذا كُنت تَبحَث عَن طيب يِعبِّر عَنك — هذا هو.`;
    },
    prompt: `Character delivers confident golden summary with authoritative presence, holds bottle as the definitive conclusion. Authoritative summary style. Camera: wide confident shot, close-up on bottle, direct camera conclusion. Background: prestigious setting. Lighting: golden prestigious lighting.`,
    sfx: 'Golden conclusion fanfare, prestigious music, definitive sting, satisfied conclusion',
    transition: 'Prestigious cinematic conclusion',
    visualFx: 'Golden summary overlay, prestigious badge, definitive conclusion lighting',
  },
];

// ═══════════════════════════════════════════════════════════════
// نظام الاختيار الذكي بدون تكرار
// ═══════════════════════════════════════════════════════════════
const usedVertical: Set<string> = new Set();
const usedHorizontal: Set<string> = new Set();

function pickUnique(scenarios: Scenario[], used: Set<string>): Scenario {
  if (used.size >= scenarios.length) used.clear();
  const available = scenarios.filter(s => !used.has(s.id));
  const chosen = available[Math.floor(Math.random() * available.length)];
  used.add(chosen.id);
  return chosen;
}

// ═══════════════════════════════════════════════════════════════
// توليد محتوى الفيديو العمودي (9:16)
// ═══════════════════════════════════════════════════════════════
export function generateVerticalContent(perfumeData: PerfumeData): GeneratedVideoContent {
  const sc = pickUnique(V_SCENARIOS, usedVertical);
  const outro = pick(OUTROS);
  const hookText = sc.hook(perfumeData);
  const script = sc.build(perfumeData);
  const full = `${script} ${outro}`;
  const final = trim(full, 55);

  const vp = `${sc.prompt}

CHARACTER: ${CHAR}

QUALITY: ${QUALITY}

SOUND DESIGN: ${sc.sfx}

VISUAL EFFECTS: ${sc.visualFx}

TRANSITIONS: ${sc.transition}

COMPOSITION: Vertical 9:16 portrait orientation optimized for TikTok and Instagram Reels.
Energetic trending vibe with high engagement composition.
Character speaks directly to camera with genuine enthusiasm and charisma.
Fast-paced editing rhythm matching current trending content style.
Natural breathing and micro-movements for realistic authentic feel.
Confident body language with direct eye contact throughout.
Hook delivered in first 1.5 seconds to stop the scroll.`;

  return {
    voiceoverText: final,
    videoPrompt: vp,
    scenarioId: sc.id,
    scenarioName: sc.name,
    hook: hookText,
    sfxInstructions: sc.sfx,
    transitionStyle: sc.transition,
    visualEffects: sc.visualFx,
  };
}

// ═══════════════════════════════════════════════════════════════
// توليد محتوى الفيديو الأفقي (16:9)
// ═══════════════════════════════════════════════════════════════
export function generateHorizontalContent(perfumeData: PerfumeData): GeneratedVideoContent {
  const sc = pickUnique(H_SCENARIOS, usedHorizontal);
  const outro = pick(OUTROS);
  const hookText = sc.hook(perfumeData);
  const script = sc.build(perfumeData);
  const full = `${script} ${outro}`;
  const final = trim(full, 60);

  const vp = `${sc.prompt}

CHARACTER: ${CHAR}

QUALITY: ${QUALITY}

SOUND DESIGN: ${sc.sfx}

VISUAL EFFECTS: ${sc.visualFx}

TRANSITIONS: ${sc.transition}

COMPOSITION: Horizontal 16:9 widescreen cinematic composition optimized for YouTube.
Professional documentary feel with warm informative atmosphere.
Character speaks to camera with authority, warmth, and genuine expertise.
Measured pacing with elegant transitions and breathing room.
Natural body language with purposeful hand gestures.
Direct eye contact creating trust and connection.`;

  return {
    voiceoverText: final,
    videoPrompt: vp,
    scenarioId: sc.id,
    scenarioName: sc.name,
    hook: hookText,
    sfxInstructions: sc.sfx,
    transitionStyle: sc.transition,
    visualEffects: sc.visualFx,
  };
}

// ═══════════════════════════════════════════════════════════════
// الدالة الرئيسية — توليد محتوى الفيديوين
// ═══════════════════════════════════════════════════════════════
export function generateVideoContents(perfumeData: PerfumeData): {
  vertical: GeneratedVideoContent;
  horizontal: GeneratedVideoContent;
} {
  return {
    vertical: generateVerticalContent(perfumeData),
    horizontal: generateHorizontalContent(perfumeData),
  };
}

// ═══════════════════════════════════════════════════════════════
// إحصائيات المحرك
// ═══════════════════════════════════════════════════════════════
export function getEngineStats() {
  return {
    verticalScenarios: V_SCENARIOS.length,
    horizontalScenarios: H_SCENARIOS.length,
    totalScenarios: V_SCENARIOS.length + H_SCENARIOS.length,
    verticalUsed: usedVertical.size,
    horizontalUsed: usedHorizontal.size,
    verticalRemaining: V_SCENARIOS.length - usedVertical.size,
    horizontalRemaining: H_SCENARIOS.length - usedHorizontal.size,
  };
}
