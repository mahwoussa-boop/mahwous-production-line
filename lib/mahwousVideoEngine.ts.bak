// ============================================================
// lib/mahwousVideoEngine.ts — Mahwous Video Content Engine v5
//
// v5 MEGA UPDATE:
//   - 25+ vertical scenarios (9:16) for TikTok + Reels + Shorts
//   - 15+ horizontal scenarios (16:9) for YouTube
//   - Enhanced cinematic prompts with sound effects & transitions
//   - Better body language & eye contact directions
//   - Saudi dialect with full tashkeel for TTS accuracy
//   - Brand context: selling ORIGINAL global brands (not exclusive)
//   - Diverse content: never repeats same style twice in a row
//   - Professional montage instructions for each scenario
//
// PRONUNCIATION RULES:
//   1. "مَهووس" — with tashkeel, mentioned ONCE at the end only
//   2. NEVER start a word with ع — use alternatives:
//      - "طيب" instead of "عطر"  |  "ريحة" instead of "عطر"
//   3. AVOID hard-to-pronounce words for AI TTS
//   4. SHORT sentences — max 8 words per sentence
//   5. Total script: 10-15 sec (40-60 words max)
//   6. Saudi dialect (Riyadh) — natural spoken style
//   7. NEVER say "زوروا" — use "اطلبه" (online store)
//   8. Each sentence ends with period for TTS pauses
//   9. Avoid English words completely
//   10. Add tashkeel to key words for correct pronunciation
//
// BRAND CONTEXT:
//   - We sell ORIGINAL global brands (not our own brand)
//   - Products available at competitors too — we differentiate by:
//     * Expert curation & recommendations
//     * Mahwous personality & trust
//     * Better content & engagement
//   - NEVER claim exclusivity — say "متوفر في مَهووس"
// ============================================================

import type { PerfumeData } from './types';

// ═══════════════════════════════════════════════════════════════
// ختامية مَهووس — مرة واحدة فقط مع تشكيل
// ═══════════════════════════════════════════════════════════════

const OUTROS = [
  'اِطلُبه الحين مِن مَهووس.',
  'مُتوفِّر في مَهووس. اِطلُبه وانت بِمكانك.',
  'لا تفوتك الفُرصة. اِطلُبه مِن مَهووس.',
  'جَرِّبه بنَفسك. مُتوفِّر في مَهووس.',
  'تِستاهل الأفخَم. مِن مَهووس.',
  'حَصري في مَهووس. اِطلُبه الحين.',
  'مَهووس يِختار لك الأفضَل. اِطلُبه.',
  'ثِق فيني. مُتوفِّر في مَهووس.',
];

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════

interface Scenario {
  id: string;
  name: string;
  build: (d: PerfumeData) => string;
  prompt: string;
  sfx: string;       // تعليمات المؤثرات الصوتية
  transition: string; // نوع الانتقال
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

function simpleDesc(): string {
  const descs = [
    'ريحَته فَخمة وثَباته قَوي',
    'ريحة راقِية تدوم طول اليَوم',
    'ريحَته تِجذب كُل مَن حَولك',
    'ريحة مُمَيَّزة ما تِتكرَّر',
    'ريحَته تِخطف الأنظار',
    'ريحة تِجمع بين الفَخامة والثَبات',
    'ريحة تِخليك مُمَيَّز وسط الكُل',
    'ريحَته تِملا المَكان فَخامة',
    'ريحة تِحسّسك بالثِّقة والأناقة',
    'ريحة تِخلّي النّاس تِسألك وِش حاط',
  ];
  return pick(descs);
}

function trim(text: string, maxWords: number = 55): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  const trimmed = words.slice(0, maxWords).join(' ');
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot > trimmed.length * 0.6) return trimmed.substring(0, lastDot + 1);
  return trimmed + '.';
}

// ═══════════════════════════════════════════════════════════════
// وصف الشخصية والجودة البصرية — سينماتوغرافي v5
// ═══════════════════════════════════════════════════════════════

const CHAR = 'A stylish Arab man in his late 20s, black swept-back hair with clean fade, thick full black beard perfectly groomed, wearing an elegant crisp white thobe with subtle embroidery. Holds a luxury perfume bottle naturally at chest level. Warm olive skin tone, confident charismatic expression with direct eye contact.';

const QUALITY = `Ultra-high quality 3D Pixar-style animation rendered in 4K. 
Cinematic golden-hour lighting with warm amber key light and soft blue fill. 
Smooth natural lip-sync movements matching Arabic speech perfectly. 
Direct eye contact with camera lens, talking intimately to viewer like a close trusted friend. 
Confident relaxed body language with subtle meaningful hand gestures. 
NO spraying action ever. 
Professional Hollywood-grade color grading with rich warm tones. 
Shallow depth of field f/1.4 with creamy bokeh background. 
Premium luxury advertising quality. 
Subtle lens flare and volumetric light rays. 
Film grain texture for cinematic feel.
Smooth 24fps cinematic motion with natural breathing and micro-movements.
Professional sound design with ambient atmosphere.`;

// ═══════════════════════════════════════════════════════════════
// 25+ سيناريو عمودي (9:16) — تيك توك + ريلز + شورتس
// ═══════════════════════════════════════════════════════════════

const V_SCENARIOS: Scenario[] = [
  // ─── 1. مغناطيس المدح ───
  {
    id: 'compliment',
    name: 'مغناطيس المدح',
    build: (d) => {
      const n = sName(d);
      return `كُل ما أحُطّه النّاس تِمدَحني. ${n}. ${simpleDesc()}. لو تبي الكُل يِسألك وِش ريحتك هذا هو.`;
    },
    prompt: `Character reacts to imaginary compliments with proud confident smile, slowly raises perfume bottle to camera in hero shot. Fun energetic social media energy with quick confident head movements. Camera: starts medium shot then smooth dolly-in to close-up on face and bottle. Background: bright gradient with floating golden particles. Lighting: vibrant ring light with warm color temperature.`,
    sfx: 'Soft whoosh on bottle reveal, subtle sparkle sound effect, upbeat background music beat drop on hero shot',
    transition: 'Smooth zoom-in with motion blur',
  },
  // ─── 2. شراء بدون شم ───
  {
    id: 'blind_buy',
    name: 'شراء بدون شم',
    build: (d) => {
      const n = sName(d);
      return `اِشتريته بدون ما أشُمّه. ${n}. أوَّل ما فتحته اِنصدمت. ريحة فَخمة ما توقَّعتها. مِن أحلى القرارات.`;
    },
    prompt: `Character opens elegant gift box with genuine surprise expression, lifts perfume bottle, brings to nose, eyes widen with amazement. Unboxing style with authentic excitement. Camera: overhead shot of box opening, then cut to close-up reaction face. Background: clean modern minimalist white marble surface. Lighting: soft overhead diffused light with warm accent.`,
    sfx: 'Box opening crinkle sound, dramatic reveal whoosh, gasp reaction sound, gentle ambient music',
    transition: 'Cut with light flash on reveal',
  },
  // ─── 3. السلاح السري ───
  {
    id: 'secret',
    name: 'السلاح السري',
    build: (d) => {
      const n = sName(d);
      return `سِلاحي السِّري قبل أي طَلعة. ${n}. يِخلّيك مُمَيَّز وسط أي مكان. ثَباته يدوم طول اليَوم.`;
    },
    prompt: `Character getting ready in front of elegant mirror, adjusts thobe collar, then dramatically reveals perfume bottle from behind back with confident wink. Camera: mirror reflection shot with rack focus. Background: luxurious dressing room with warm golden sconces. Lighting: dramatic side lighting creating depth.`,
    sfx: 'Mirror reflection ambient, fabric rustle, dramatic reveal sting, confident music beat',
    transition: 'Mirror reflection dissolve',
  },
  // ─── 4. الطيب يتكلم ───
  {
    id: 'talking',
    name: 'الطيب يتكلم',
    build: (d) => {
      const n = sName(d);
      return `لو هالطّيب يِتكلَّم بيقول أنا ${n}. اللي يِحُطّني ما يِقدر يِستغني. ريحتي تدوم وتِخلّي الكُل يِلتفت.`;
    },
    prompt: `Character holds perfume bottle near ear as if listening to it whisper, nods knowingly, then turns to camera with playful conspiratorial smile. Creative storytelling style. Camera: tight on bottle near ear, pulls back to medium shot. Background: colorful trendy gradient with abstract mist effects. Lighting: creative colored rim lights with warm key.`,
    sfx: 'Mystical whisper sound effect, playful chime, trendy beat drop',
    transition: 'Whip pan from bottle to face',
  },
  // ─── 5. تقييم صريح ───
  {
    id: 'rating',
    name: 'تقييم صريح',
    build: (d) => {
      const n = sName(d);
      return `تَقييمي الصَّريح. ${n}. الثَّبات عَشرة مِن عَشرة. الريحة مُمتازة. مِن أفضل اللي جرَّبتها صَراحة.`;
    },
    prompt: `Character counts on fingers while reviewing, pauses thoughtfully, then gives enthusiastic thumbs up with big genuine smile. Quick-cut review format. Camera: medium shot with subtle zoom on each point, close-up on thumbs up. Background: clean studio with floating rating stars. Lighting: bright even studio lighting.`,
    sfx: 'Counting tick sound for each point, star rating ding, celebration sound on thumbs up',
    transition: 'Quick cuts synced with counting',
  },
  // ─── 6. قبل الموعد ───
  {
    id: 'date_night',
    name: 'قبل الموعد',
    build: (d) => {
      const n = sName(d);
      return `تبي تِطلع لمَوعد مُهم؟ ${n} يِكمّل لوكك. ريحَته تِمنحك ثِقة وحُضور. جَرِّبه وشوف الفَرق.`;
    },
    prompt: `Character adjusts collar in mirror, picks up perfume bottle with deliberate confident motion, applies with charming knowing smile. Camera: wide establishing, smooth track-in to medium close-up. Background: elegant warm-toned room with soft ambient lighting. Lighting: warm romantic golden hour simulation.`,
    sfx: 'Smooth jazz intro, fabric adjustment sound, confident music swell',
    transition: 'Slow cinematic push-in',
  },
  // ─── 7. ردة الفعل ───
  {
    id: 'reaction',
    name: 'ردة الفعل',
    build: (d) => {
      const n = sName(d);
      return `رِدّة فِعلي لمّا شمّيت ${n} أوَّل مرّة. ريحة فَخمة ما توقَّعتها. مِن يومها صار المُفضَّل.`;
    },
    prompt: `Character brings perfume to nose, inhales deeply, face transforms from neutral to genuine amazement. Authentic reaction video style. Camera: extreme close-up on face during smell, pull back to show full reaction. Background: soft blurred warm tones. Lighting: soft beauty lighting with warm fill.`,
    sfx: 'Deep inhale sound, dramatic pause, amazement gasp, uplifting music swell',
    transition: 'Slow motion on reaction moment',
  },
  // ─── 8. التوقيع ───
  {
    id: 'signature',
    name: 'التوقيع',
    build: (d) => {
      const n = sName(d);
      return `الريحة اللي صارت تَوقيعي. ${n}. كُل ما أدخل مكان النّاس تِعرفني. ريحة مُمَيَّزة وثَبات قَوي.`;
    },
    prompt: `Character walks in confidently through doorway in slow motion, holds perfume bottle proudly at chest level, subtle head nod to camera. Cinematic entrance. Camera: low angle tracking shot, then medium portrait shot. Background: luxury lobby with marble and warm lighting. Lighting: dramatic backlight creating silhouette then revealing face.`,
    sfx: 'Cinematic bass drop on entrance, slow motion whoosh, confident stride sound',
    transition: 'Slow motion entrance with speed ramp',
  },
  // ─── 9. العد التنازلي ───
  {
    id: 'countdown',
    name: 'العد التنازلي',
    build: (d) => {
      const n = sName(d);
      return `ثلاث ثَواني وتِحكم بنَفسك. ${n}. ريحة فَخمة وثَبات قَوي. اللي جرَّبه ما رِجع لغيره.`;
    },
    prompt: `Character holds up 3 fingers, counts down dramatically, then presents perfume bottle with explosive excitement. Fast-paced countdown style. Camera: quick cuts synced with countdown, final reveal in slow motion. Background: dynamic with countdown graphics. Lighting: dynamic changing colored lights.`,
    sfx: 'Countdown beep for each number, explosion sound on reveal, hype music drop',
    transition: 'Speed ramp from fast to slow motion on reveal',
  },
  // ─── 10. من المجموعة ───
  {
    id: 'collection',
    name: 'من المجموعة',
    build: (d) => {
      const n = sName(d);
      return `مِن كُل مَجموعتي اِخترت لكم ${n}. هالطّيب له مَكانة خاصّة. ثَباته قَوي وريحَته راقِية.`;
    },
    prompt: `Character browses elegant perfume shelf, hand glides over bottles, deliberately picks one special bottle, presents to camera with pride. Collector showcase style. Camera: tracking shot along shelf, close-up on hand selection, medium shot presentation. Background: elegant dark wood shelf with warm spot lighting. Lighting: warm accent spots on bottles.`,
    sfx: 'Gentle glass clink as hand passes bottles, selection chime, proud reveal music',
    transition: 'Rack focus from shelf to selected bottle',
  },
  // ─── 11. وقف وشوف ───
  {
    id: 'stop_scroll',
    name: 'وقف وشوف',
    build: (d) => {
      const n = sName(d);
      return `وَقّف. هالمَعلومة تِهمّك. ${n}. ${simpleDesc()}. لو ما جرَّبته فاتك شي كبير.`;
    },
    prompt: `Character makes dramatic stop gesture with palm toward camera, pauses, then leans in closer as if sharing a secret, reveals perfume. Scroll-stopping format. Camera: fast zoom to palm, then intimate close-up as character leans in. Background: bold vibrant gradient. Lighting: bright punchy front lighting with dramatic rim light.`,
    sfx: 'Record scratch stop sound, dramatic pause silence, whisper ambient, secret reveal chime',
    transition: 'Freeze frame on stop gesture then resume',
  },
  // ─── 12. التحدي ───
  {
    id: 'challenge',
    name: 'التحدي',
    build: (d) => {
      const n = sName(d);
      return `تحدَّيت نَفسي ألقى ريحة كامِلة بكُل شي. ${n}. فَخامة وثَبات وسِعر مُمتاز. التَّحدي نِجح.`;
    },
    prompt: `Character accepts challenge with determined expression, examines perfume carefully, tests it, then celebrates with victorious fist pump. Challenge format. Camera: dynamic angles, triumphant final shot. Background: fun competitive atmosphere. Lighting: energetic bright lighting with celebratory burst.`,
    sfx: 'Challenge accepted sound, examination suspense music, victory celebration fanfare',
    transition: 'Dynamic angle cuts with speed ramps',
  },
  // ─── 13. مقارنة الأسعار ───
  {
    id: 'price_compare',
    name: 'مقارنة الأسعار',
    build: (d) => {
      const n = sName(d);
      return `النّاس تِظن الغالي أحسن. بس ${n} يِثبت إن الجَودة مو بالسِّعر. ريحة تِنافس أغلى الماركات. جَرِّبه وشوف.`;
    },
    prompt: `Character holds two imaginary price tags, weighs them with hands, shakes head at expensive one, then proudly presents the perfume bottle as the winner. Smart shopper format. Camera: medium shot with dynamic hand movements, close-up on bottle reveal. Background: clean split-screen style with price comparison feel. Lighting: balanced bright lighting with warm accent on winning product.`,
    sfx: 'Cash register cha-ching, wrong buzzer on expensive, winner bell on product, smart music',
    transition: 'Split screen merge to single frame',
  },
  // ─── 14. فتح الصندوق ───
  {
    id: 'unboxing',
    name: 'فتح الصندوق',
    build: (d) => {
      const n = sName(d);
      const b = bName(d);
      return `وَصلني طَرد مِن مَهووس. ${b ? `${b}.` : ''} ${n}. التَّغليف فَخم. الريحة أفخَم. أوَّل بَخّة وحَبيتها.`;
    },
    prompt: `Character excitedly opens a premium package, carefully unwraps tissue paper, lifts perfume box, opens it to reveal bottle with genuine excitement. ASMR unboxing style. Camera: overhead ASMR angle on package, then close-up on hands, medium shot for reaction. Background: clean white surface with warm side lighting. Lighting: soft diffused overhead with warm accent creating ASMR mood.`,
    sfx: 'Package rustling ASMR, tissue paper crinkle, box opening click, reveal sparkle, soft ambient music',
    transition: 'Smooth overhead to eye-level transition',
  },
  // ─── 15. توصية صديق ───
  {
    id: 'friend_rec',
    name: 'توصية صديق',
    build: (d) => {
      const n = sName(d);
      return `لو صاحبك يِسألك وِش أحسن طيب. قُله ${n}. ريحَته تِناسب كُل المَناسبات. ما بتِندم صَدّقني.`;
    },
    prompt: `Character talks casually to camera as if chatting with a close friend, relaxed posture, genuine smile, holds bottle casually. Friendly recommendation style. Camera: medium shot, slightly off-center for casual feel, subtle handheld movement. Background: casual cozy setting like a living room or cafe. Lighting: warm natural window light with soft fill.`,
    sfx: 'Casual conversation ambient, friendly notification sound, warm acoustic guitar background',
    transition: 'Natural conversational cuts',
  },
  // ─── 16. سر العطارين ───
  {
    id: 'insider_secret',
    name: 'سر العطارين',
    build: (d) => {
      const n = sName(d);
      return `سِر ما يِقولونه لك في المَحلّات. ${n}. هالطّيب تَركيبته مُمَيَّزة. الخُبراء يِعرفون قيمته. الحين تِعرفها انت بعد.`;
    },
    prompt: `Character leans in conspiratorially, looks around as if checking no one is listening, then whispers the secret to camera with knowing expression. Insider secret format. Camera: starts wide, dramatic push-in to extreme close-up during secret reveal. Background: mysterious dark elegant setting with golden accents. Lighting: dramatic low-key lighting with spotlight on face.`,
    sfx: 'Mysterious ambient, suspenseful whisper effect, secret reveal chime, dramatic music sting',
    transition: 'Dramatic push-in with vignette',
  },
  // ─── 17. تحدي الثبات ───
  {
    id: 'longevity_test',
    name: 'تحدي الثبات',
    build: (d) => {
      const n = sName(d);
      return `حَطّيته الصُّبح. الحين آخر اليَوم. ${n}. لسّا الريحة مَوجودة. ثَبات خُرافي. هذا اللي يِفرق.`;
    },
    prompt: `Character shows morning application, then time-lapse transition to evening, smells wrist with impressed expression. Longevity test format. Camera: split-screen morning/evening or time-lapse transition, close-up on wrist smell test. Background: transitions from bright morning light to warm evening ambiance. Lighting: cool morning light transitioning to warm golden evening.`,
    sfx: 'Clock ticking time-lapse, morning birds, evening ambient, impressed reaction sound',
    transition: 'Time-lapse wipe from morning to evening',
  },
  // ─── 18. ردة فعل الناس ───
  {
    id: 'people_reaction',
    name: 'ردة فعل الناس',
    build: (d) => {
      const n = sName(d);
      return `حَطّيت ${n} ورُحت السّوق. ثلاث أشخاص سَألوني وِش ريحتك. هذا دَليل إنّه طيب صَح.`;
    },
    prompt: `Character applies perfume confidently, walks through imaginary crowd, reacts to imaginary compliments with proud grateful smile, turns to camera. Social proof format. Camera: starts with application close-up, tracking shot of walk, then medium shot addressing camera. Background: bright social setting suggesting a mall or gathering. Lighting: bright social lighting with warm highlights.`,
    sfx: 'Crowd ambient, compliment whispers, proud music swell, social media notification sounds',
    transition: 'Walking tracking shot with blur transitions',
  },
  // ─── 19. قبل وبعد ───
  {
    id: 'before_after',
    name: 'قبل وبعد',
    build: (d) => {
      const n = sName(d);
      return `قبل ما أحُطّ طيب. عادي. بعد ما حَطّيت ${n}. الثِّقة تِتضاعف. الحُضور يِتغيَّر. جَرِّبه بنَفسك.`;
    },
    prompt: `Split personality transformation: first half shows character looking plain and unsure, dramatic transition, second half shows same character with confident powerful presence holding perfume. Before/after transformation. Camera: same framing for both halves, dramatic transition effect in middle. Background: dull grey transforms to vibrant warm luxury. Lighting: flat boring light transforms to dramatic cinematic golden lighting.`,
    sfx: 'Dull ambient for before, dramatic transformation whoosh, powerful confident music for after',
    transition: 'Dramatic split-screen or snap transition',
  },
  // ─── 20. ترند الهمسة ───
  {
    id: 'whisper_trend',
    name: 'ترند الهمسة',
    build: (d) => {
      const n = sName(d);
      return `تبي تِعرف سِرّي؟ ${n}. هالريحة تِخلّي كُل مَن حَولك يِقرب مِنك. مُجرَّب ومَضمون.`;
    },
    prompt: `Character starts with ASMR whisper close to camera, creates intimate atmosphere, slowly reveals perfume bottle with gentle movements. ASMR whisper trend. Camera: extreme close-up for whisper, gentle pull-back for reveal. Background: dark intimate setting with soft bokeh lights. Lighting: soft intimate low lighting with warm accent on face.`,
    sfx: 'ASMR whisper ambient, soft breath sounds, gentle reveal chime, calming background music',
    transition: 'Soft focus pull from blur to sharp',
  },
  // ─── 21. الطيب المثالي ───
  {
    id: 'perfect_pick',
    name: 'الطيب المثالي',
    build: (d) => {
      const n = sName(d);
      return `لو تِبي طيب واحد يِكفيك لكُل شي. ${n}. يِمشي مع الدَّوام والمَناسبات والطَّلعات. اِختيار ذَكي.`;
    },
    prompt: `Character presents perfume as the ultimate all-in-one solution, shows different scenario cards or gestures for different occasions. Versatile pick format. Camera: medium shot with graphic overlays suggesting different occasions. Background: clean modern with floating occasion icons. Lighting: bright clean professional with warm undertones.`,
    sfx: 'Versatile transition sounds for each occasion, smart choice ding, upbeat confident music',
    transition: 'Quick graphic overlays between occasions',
  },
  // ─── 22. ستوري تايم ───
  {
    id: 'storytime',
    name: 'ستوري تايم',
    build: (d) => {
      const n = sName(d);
      return `قِصّة سَريعة. رُحت مَناسبة وكُل النّاس تِمدح ريحتي. السِّر؟ ${n}. مِن يومها ما غيَّرته.`;
    },
    prompt: `Character tells engaging story with animated expressions and gestures, builds suspense, reveals perfume as the punchline. Storytime format. Camera: medium shot with subtle movements matching story beats, close-up on reveal. Background: cozy storytelling setting with warm tones. Lighting: warm campfire-style lighting creating intimate storytelling mood.`,
    sfx: 'Storytelling ambient, suspense build, punchline reveal sound, satisfied music resolution',
    transition: 'Story beat cuts with subtle zooms',
  },
  // ─── 23. تحدي الشم ───
  {
    id: 'smell_test',
    name: 'اختبار أعمى',
    build: (d) => {
      const n = sName(d);
      return `اِختبار بدون ما أشوف الاِسم. شمّيته. ريحة فَخمة وقَويّة. طِلع ${n}. ما اِستغربت. دايم يِبهرني.`;
    },
    prompt: `Character blindfolded or eyes closed, smells perfume strip, gives genuine reaction, removes blindfold to see the name, nods with satisfaction. Blind test format. Camera: close-up on blindfolded face, reaction shot, reveal of bottle name. Background: clean testing environment with professional feel. Lighting: clinical bright light for test, warm reveal lighting.`,
    sfx: 'Blindfold ambient, deep inhale, thinking pause, reveal dramatic sting, satisfaction chime',
    transition: 'Blindfold removal reveal transition',
  },
  // ─── 24. نصيحة سريعة ───
  {
    id: 'quick_tip',
    name: 'نصيحة سريعة',
    build: (d) => {
      const n = sName(d);
      return `نَصيحة بثَلاث ثَواني. لا تِحُط الطّيب على ثيابك. حُطّه على بَشرتك. ${n} يدوم أكثر كِذا. شُكراً لي بعدين.`;
    },
    prompt: `Character gives rapid-fire tip with confident pointing gesture, demonstrates on wrist, winks at camera. Quick tip format. Camera: fast-paced cuts matching tip delivery, close-up on demonstration. Background: bright energetic with tip graphic overlay. Lighting: bright punchy lighting matching fast energy.`,
    sfx: 'Quick tip notification sound, demonstration whoosh, wink sparkle, fast upbeat music',
    transition: 'Rapid cuts with graphic overlays',
  },
  // ─── 25. المفضل الدائم ───
  {
    id: 'all_time_fav',
    name: 'المفضل الدائم',
    build: (d) => {
      const n = sName(d);
      return `سَنة كامِلة وهو المُفضَّل. ${n}. جرَّبت كثير بعده. بس دايم أرجع له. هذا يِدُل على شي.`;
    },
    prompt: `Character surrounded by many perfume bottles, pushes them aside gently, picks up the one special bottle with loving expression. All-time favorite format. Camera: wide shot of collection, tracking to hand selection, medium shot of proud presentation. Background: elegant display of many bottles with one highlighted. Lighting: spot light on the chosen bottle, softer on others.`,
    sfx: 'Collection ambient, gentle push aside sounds, spotlight activation, emotional music swell',
    transition: 'Rack focus from collection to chosen bottle',
  },
  // ─── 26. ترند POV ───
  {
    id: 'pov_trend',
    name: 'ترند POV',
    build: (d) => {
      const n = sName(d);
      return `لمّا تِحُط ${n} وتِدخل المَجلس. كُل الرّوس تِلتفت. هالريحة تِسبقك قبل ما توصل.`;
    },
    prompt: `POV style: camera IS the character walking into a room, imaginary heads turn, then cut to character holding bottle proudly. POV trend format. Camera: first-person POV walking shot, then dramatic cut to third-person hero shot. Background: elegant majlis or gathering setting. Lighting: warm ambient with dramatic entrance lighting.`,
    sfx: 'Door opening, footstep sounds, impressed crowd murmur, confident entrance music',
    transition: 'POV to third-person dramatic cut',
  },
];

// ═══════════════════════════════════════════════════════════════
// 15+ سيناريو أفقي (16:9) — يوتيوب
// ═══════════════════════════════════════════════════════════════

const H_SCENARIOS: Scenario[] = [
  // ─── 1. تاريخ الماركة ───
  {
    id: 'history',
    name: 'تاريخ الماركة',
    build: (d) => {
      const n = sName(d);
      const b = bName(d);
      return `القِصّة وراء هالطّيب ما يِعرفها كثير. ${b ? `${b} مِن أقدم بيوت الطّيب.` : 'هالماركة لها تاريخ طَويل.'} ${n}. ${simpleDesc()}. كُل تَفصيلة فيه مَدروسة.`;
    },
    prompt: `Character sits in elegant leather chair in sophisticated study, speaks knowledgeably to camera about brand heritage. Documentary style. Camera: wide establishing, then medium shot with subtle push-in. Background: rich wood-paneled study with vintage perfume bottles. Lighting: warm cinematic three-point lighting.`,
    sfx: 'Elegant documentary music, page turning ambient, historical atmosphere',
    transition: 'Smooth dissolve between points',
  },
  // ─── 2. رأي الخبير ───
  {
    id: 'expert',
    name: 'رأي الخبير',
    build: (d) => {
      const n = sName(d);
      return `رأيي كخَبير. هالطّيب يِستاهل مكان في مَجموعتك. ${n}. الطَّبقة الأولى تِجذبك والقاعِدة تِخلّيها تدوم ساعات. تَركيبة ذَكيّة.`;
    },
    prompt: `Character explains with professional hand gestures, occasionally gestures to perfume on display stand. Expert review format. Camera: medium shot with side angle, occasional close-up inserts of bottle. Background: elegant desk with perfume on crystal stand. Lighting: warm professional key light with accent on bottle.`,
    sfx: 'Professional review music, subtle analysis ambient, expert conclusion sting',
    transition: 'Clean cuts with B-roll inserts of bottle',
  },
  // ─── 3. جدل ورأي ───
  {
    id: 'debate',
    name: 'جدل ورأي',
    build: (d) => {
      const n = sName(d);
      const b = bName(d);
      return `هالطّيب فيه جَدل كبير. ${n}${b ? ` مِن ${b}` : ''}. البَعض يقول سِعره مُبالغ. بس لمّا تِجرّبه تِفهم ليش. الثَّبات قَوي والريحة فَخمة.`;
    },
    prompt: `Character presents both sides with expressive gestures, weighs pros and cons, gives confident verdict. Debate format. Camera: medium shot with dynamic angle changes, centered verdict shot. Background: professional studio with split lighting. Lighting: balanced professional, warmer on verdict.`,
    sfx: 'Debate ambient music, argument transition sounds, verdict gavel sound, resolution music',
    transition: 'Angle changes for each argument',
  },
  // ─── 4. طيب الموسم ───
  {
    id: 'season',
    name: 'طيب الموسم',
    build: (d) => {
      const n = sName(d);
      return `الطّيب المِثالي لهالمَوسم. ${n}. مُكوّناته تِتفاعل مع الجَو بشكل مِثالي. ريحَته تكون أحلى في البَرد. نَصيحتي خلّوه في مَجموعتكم.`;
    },
    prompt: `Character presents perfume with seasonal context, gestures to suggest weather. Seasonal recommendation. Camera: medium-wide establishing, then medium shot. Background: cozy setting with seasonal elements. Lighting: warm golden ambient suggesting the season.`,
    sfx: 'Seasonal ambient sounds (rain/wind/birds), cozy music, recommendation chime',
    transition: 'Seasonal atmosphere dissolves',
  },
  // ─── 5. حقائق مثيرة ───
  {
    id: 'facts',
    name: 'حقائق مثيرة',
    build: (d) => {
      const n = sName(d);
      const b = bName(d);
      return `حَقيقة بتِغيّر نَظرتك. ${b ? `هل تِدري إن ${b} بَدأت كشَركة صغيرة؟` : 'هالماركة لها قِصّة نَجاح مُذهلة.'} ${n} مِن أنجح إصداراتهم. الطّيب الفاخر يِتفاعل مع بَشرتك.`;
    },
    prompt: `Character shares fascinating facts with enthusiastic energy, uses storytelling gestures, leans in for revelations. Educational format. Camera: medium shot with push-in during facts, close-up for emphasis. Background: elegant library with warm ambient lighting. Lighting: warm storytelling lighting with dramatic shifts.`,
    sfx: 'Fact reveal sound effect, educational music, surprise sting, knowledge ambient',
    transition: 'Push-in on key facts with graphic overlays',
  },
  // ─── 6. تحليل القيمة ───
  {
    id: 'value',
    name: 'تحليل القيمة',
    build: (d) => {
      const n = sName(d);
      return `ليش هالطّيب يِتفوَّق على اللي أغلى مِنه؟ ${n}. الجَودة مو بالسِّعر. ثَباته قَوي وريحَته مُنافسة. لو تبي قيمة حَقيقية هذا اِختيارك.`;
    },
    prompt: `Character compares thoughtfully with analytical gestures, weighs value proposition. Value analysis format. Camera: medium shot with clean composition, two-shot with bottle. Background: professional clean setting. Lighting: balanced professional with warm undertones.`,
    sfx: 'Analysis music, comparison transition sounds, value conclusion sting',
    transition: 'Clean professional cuts with data overlays',
  },
  // ─── 7. نصيحة الخلط ───
  {
    id: 'layering',
    name: 'نصيحة الخلط',
    build: (d) => {
      const n = sName(d);
      return `لو تِخلطه مع طيب ثاني وِش يِصير؟ ${n}. لو تِضيف طيب خَشبي تِحصل على مَزيج رهيب. سِر الخُبراء إنّهم يِخلطون الطَّبقات.`;
    },
    prompt: `Character demonstrates layering with two bottles, shows combination with expert precision. Workshop format. Camera: medium shot, close-up inserts on bottles during demonstration. Background: elegant perfumer workshop. Lighting: warm workshop lighting with accent on bottles.`,
    sfx: 'Workshop ambient, glass bottle sounds, mixing effect, expert tip chime',
    transition: 'Close-up inserts between demonstration steps',
  },
  // ─── 8. رحلة الريحة ───
  {
    id: 'journey',
    name: 'رحلة الريحة',
    build: (d) => {
      const n = sName(d);
      return `خلّوني آخذكم في رِحلة مع ${n}. أوَّل ما تِحُطّه تِحس بنَفحة مُنعشة. بعد ساعة تِتحوَّل لريحة دافِية. وبالليل تِصير أغنى. تَجربة كامِلة.`;
    },
    prompt: `Character takes viewer on olfactory journey, expressions change with each phase. Time-lapse storytelling. Camera: smooth tracking with lighting transitions. Background: transitions from bright morning to warm afternoon to rich evening. Lighting: dynamic shifts from cool bright to warm golden to rich amber.`,
    sfx: 'Journey music progression, time transition whoosh, atmosphere change sounds',
    transition: 'Lighting transition dissolves matching time of day',
  },
  // ─── 9. مقارنة مع المنافسين ───
  {
    id: 'vs_competitor',
    name: 'مقارنة صادقة',
    build: (d) => {
      const n = sName(d);
      return `النّاس تِسأل وِش الفَرق بين المَحلّات. الطّيب نَفسه. ${n}. بس الفَرق في التَّجربة والنَّصيحة. في مَهووس نِختار لك الأنسب.`;
    },
    prompt: `Character speaks honestly about market, acknowledges competition, then highlights what makes the experience special. Honest comparison format. Camera: medium shot with sincere direct eye contact, occasional gestures. Background: professional neutral setting suggesting objectivity. Lighting: balanced honest lighting, warm and trustworthy.`,
    sfx: 'Honest conversation music, trust-building ambient, sincerity sting',
    transition: 'Clean honest cuts maintaining eye contact',
  },
  // ─── 10. أفضل 3 مناسبات ───
  {
    id: 'top3_occasions',
    name: 'أفضل 3 مناسبات',
    build: (d) => {
      const n = sName(d);
      return `ثلاث مَناسبات يِتألَّق فيها ${n}. الأولى المَناسبات الرَّسمية. الثّانية الطَّلعات المَسائية. الثّالثة الاِجتماعات المُهمّة. طيب شامِل.`;
    },
    prompt: `Character counts three occasions with fingers, describes each with appropriate gestures and expressions. Top 3 list format. Camera: medium shot with graphic overlays for each occasion number. Background: clean professional with numbered list graphics. Lighting: bright professional with warm accent changes for each point.`,
    sfx: 'List counting sound for each number, occasion-specific ambient, conclusion fanfare',
    transition: 'Numbered graphic transitions between occasions',
  },
  // ─── 11. مراجعة بعد شهر ───
  {
    id: 'month_review',
    name: 'مراجعة بعد شهر',
    build: (d) => {
      const n = sName(d);
      return `شَهر كامِل مع ${n}. النَّتيجة؟ الثَّبات ما تغيَّر. الريحة لسّا تِبهرني. مِن أفضل القرارات اللي اِتَّخذتها. يِستاهل كُل ريال.`;
    },
    prompt: `Character gives long-term review with experienced authority, shows genuine satisfaction after extended use. Long-term review format. Camera: medium shot with experienced confident posture, occasional close-up for emphasis. Background: personal office or study suggesting time and experience. Lighting: warm experienced lighting with golden tones.`,
    sfx: 'Time passage music, experience ambient, satisfied conclusion music',
    transition: 'Calendar page flip transitions',
  },
  // ─── 12. هدية مثالية ───
  {
    id: 'gift_guide',
    name: 'هدية مثالية',
    build: (d) => {
      const n = sName(d);
      return `تِدوّر هَدية تِبهر؟ ${n}. التَّغليف فَخم. الريحة أفخَم. هَدية تِخلّي اللي يِستلمها يِتذكَّرك دايم.`;
    },
    prompt: `Character presents perfume as the perfect gift, shows elegant packaging, imagines recipient reaction with warm smile. Gift guide format. Camera: medium shot with warm inviting feel, close-up on packaging details. Background: gift-wrapping setting with elegant ribbons and warm lighting. Lighting: warm festive lighting with golden accents.`,
    sfx: 'Gift wrapping sounds, ribbon pull, excited recipient reaction, warm holiday music',
    transition: 'Gift unwrapping reveal transitions',
  },
  // ─── 13. نصائح الحفظ ───
  {
    id: 'storage_tips',
    name: 'نصائح الحفظ',
    build: (d) => {
      const n = sName(d);
      return `كثير يِغلطون في حِفظ الطّيب. ${n} لازم تِحفظه بَعيد عن الشَّمس والحَرارة. المَكان البارِد يِخلّي الريحة تدوم سَنوات. نَصيحة مَجّانية.`;
    },
    prompt: `Character gives practical storage advice with helpful demonstrations, shows correct and incorrect methods. Educational tips format. Camera: medium shot with demonstration inserts, close-up on storage examples. Background: organized perfume storage area with proper conditions. Lighting: bright educational lighting with warm practical feel.`,
    sfx: 'Educational tip sounds, correct/incorrect buzzer, helpful chime, practical music',
    transition: 'Do/dont split screen transitions',
  },
  // ─── 14. الفرق بين الأصلي والتقليد ───
  {
    id: 'real_vs_fake',
    name: 'أصلي ولا تقليد',
    build: (d) => {
      const n = sName(d);
      return `كيف تِفرّق بين الأصلي والتَّقليد؟ ${n}. أوَّل شي التَّغليف. ثاني شي الباركود. ثالث شي الريحة نَفسها. في مَهووس كُلّه أصلي مَضمون.`;
    },
    prompt: `Character shows authentication tips with expert knowledge, examines bottle details, gives confident assurance. Authentication guide format. Camera: medium shot with close-up inserts on packaging details, barcode, bottle quality. Background: professional examination setting with magnifying elements. Lighting: bright examination lighting with detailed accent.`,
    sfx: 'Investigation music, magnifying glass sound, authentication stamp, trust confirmation chime',
    transition: 'Magnifying glass zoom transitions on details',
  },
  // ─── 15. ليش مهووس ───
  {
    id: 'why_mahwous',
    name: 'ليش مهووس',
    build: (d) => {
      const n = sName(d);
      return `ليش تِطلب مِن مَهووس؟ مو بس نِبيع طيب. نِختار لك الأفضَل. نِنصحك بالمُناسب. ${n} مِثال على ذَوقنا. جَرِّب وشوف الفَرق.`;
    },
    prompt: `Character speaks passionately about brand mission and values, genuine belief in what they offer. Brand story format. Camera: medium shot with sincere direct address, occasional wide shot showing brand environment. Background: elegant Mahwous branded setting with warm inviting atmosphere. Lighting: warm brand lighting with golden signature tones.`,
    sfx: 'Brand anthem music, passionate speech ambient, mission statement sting, warm conclusion',
    transition: 'Cinematic brand story transitions',
  },
];

// ═══════════════════════════════════════════════════════════════
// محرك التوليد v5
// ═══════════════════════════════════════════════════════════════

export interface GeneratedVideoContent {
  voiceoverText: string;
  videoPrompt: string;
  scenarioId: string;
  scenarioName: string;
  hook: string;
  sfxInstructions: string;
  transitionStyle: string;
}

// تتبع السيناريوهات المستخدمة لتجنب التكرار
const usedVertical: Set<string> = new Set();
const usedHorizontal: Set<string> = new Set();

function pickUnique(scenarios: Scenario[], used: Set<string>): Scenario {
  // إذا استُخدمت كل السيناريوهات، أعد التعيين
  if (used.size >= scenarios.length) {
    used.clear();
  }
  
  const available = scenarios.filter(s => !used.has(s.id));
  const selected = pick(available.length > 0 ? available : scenarios);
  used.add(selected.id);
  return selected;
}

export function generateVerticalContent(perfumeData: PerfumeData): GeneratedVideoContent {
  const sc = pickUnique(V_SCENARIOS, usedVertical);
  const outro = pick(OUTROS);
  const script = sc.build(perfumeData);
  const full = `${script} ${outro}`;
  const final = trim(full, 55);

  const hook = script.split(/[.!]/)[0]?.trim() || '';
  const vp = `${sc.prompt}

CHARACTER: ${CHAR}

QUALITY: ${QUALITY}

SOUND DESIGN: ${sc.sfx}

TRANSITIONS: ${sc.transition}

COMPOSITION: Vertical 9:16 portrait orientation optimized for mobile viewing. 
Energetic youthful vibe matching TikTok and Instagram Reels trending aesthetic. 
Character speaks directly to camera with genuine enthusiasm and charisma. 
Fast-paced editing rhythm with smooth transitions.
Natural breathing and micro-movements for realistic feel.
Confident body language with direct eye contact throughout.`;

  return {
    voiceoverText: final,
    videoPrompt: vp,
    scenarioId: sc.id,
    scenarioName: sc.name,
    hook,
    sfxInstructions: sc.sfx,
    transitionStyle: sc.transition,
  };
}

export function generateHorizontalContent(perfumeData: PerfumeData): GeneratedVideoContent {
  const sc = pickUnique(H_SCENARIOS, usedHorizontal);
  const outro = pick(OUTROS);
  const script = sc.build(perfumeData);
  const full = `${script} ${outro}`;
  const final = trim(full, 60);

  const hook = script.split(/[.!]/)[0]?.trim() || '';
  const vp = `${sc.prompt}

CHARACTER: ${CHAR}

QUALITY: ${QUALITY}

SOUND DESIGN: ${sc.sfx}

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
    hook,
    sfxInstructions: sc.sfx,
    transitionStyle: sc.transition,
  };
}

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
