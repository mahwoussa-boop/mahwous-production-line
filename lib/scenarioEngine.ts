// ============================================================
// lib/scenarioEngine.ts
// Generates trending video scenarios for social media platforms.
// ============================================================

import type { PerfumeData } from './types';

// This function would call an LLM (Claude/OpenAI) similar to the captions API.
// For simplicity in this step, we are defining the logic directly.
// In a real implementation, this would be a prompt-based generation.

export interface VideoScenario {
  platform: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts';
  hook: string; // The first 1-3 seconds
  action: string; // The main character action
  voiceover: string; // The text for the voiceover
  cta: string; // The call to action
}

function getVibeCategory(vibe: string): 'floral' | 'oriental' | 'fresh' | 'woody' | 'sweet' {
  if (vibe.includes('rose') || vibe.includes('garden')) return 'floral';
  if (vibe.includes('oriental') || vibe.includes('majlis') || vibe.includes('palace')) return 'oriental';
  if (vibe.includes('ocean') || vibe.includes('breeze')) return 'fresh';
  if (vibe.includes('woody') || vibe.includes('library') || vibe.includes('cabin')) return 'woody';
  if (vibe.includes('sweet') || vibe.includes('vanilla')) return 'sweet';
  return 'oriental'; // Default
}

export function generateVideoScenarios(perfumeData: PerfumeData, vibe: string): VideoScenario[] {
  const category = getVibeCategory(vibe);
  const scenarios: VideoScenario[] = [];

  // --- TikTok Scenario ---
  let tiktokHook = 'هذا العطر ممنوع! ⛔️';
  let tiktokAction = 'الشخصية تنظر للكاميرا بجدية ثم تبتسم بثقة وهي تمسك العطر.';
  let tiktokVoiceover = `يقولون أن الفخامة لها حدود، لكن مع ${perfumeData.name}، كسرنا كل القواعد.`;
  let tiktokCta = 'اكتشف سر الجاذبية بنفسك. الرابط في البايو!';

  switch (category) {
    case 'floral':
      tiktokHook = 'لقيت لكم عطر ريحته ورد طبيعي! 🌸';
      tiktokAction = 'الشخصية تمشي بين الزهور، ثم تقرب العطر من الكاميرا.';
      tiktokVoiceover = `${perfumeData.name} مو مجرد عطر، هذي حديقة كاملة في زجاجة.`;
      break;
    case 'oriental':
      tiktokHook = 'إذا شفت هذا العطر، اشتريه وأنت مغمض.';
      tiktokAction = 'الشخصية تجلس في مجلس فاخر، وتمرر يدها على غطاء العطر.';
      tiktokVoiceover = `هذا هو تعريف الفخامة الشرقية. ${perfumeData.name} يجمع بين أصالة الماضي وفخامة الحاضر.`;
      break;
    case 'fresh':
      tiktokHook = 'شعور الانتعاش في زجاجة! 🌊';
      tiktokAction = 'مشهد سريع للشخصية على الشاطئ، ثم يظهر العطر بوضوح.';
      tiktokVoiceover = `تبغى تحس بالصيف طول السنة؟ ${perfumeData.name} هو الجواب.`;
      break;
  }

  scenarios.push({
    platform: 'TikTok',
    hook: tiktokHook,
    action: tiktokAction,
    voiceover: tiktokVoiceover,
    cta: tiktokCta,
  });

  // --- Instagram Reels Scenario ---
  const igReelsScenario: VideoScenario = {
    platform: 'Instagram Reels',
    hook: 'السر وراء حضوري القوي؟ ✨',
    action: 'الشخصية ترتدي ملابس أنيقة، وتنظر بتركيز في المرآة ثم تضع العطر بثقة.',
    voiceover: `كل مناسبة لها عطرها، و${perfumeData.name} هو عطري لكل لحظة استثنائية.`,
    cta: 'جرّب الفخامة. اطلبه الآن.',
  };
  scenarios.push(igReelsScenario);

  // --- YouTube Shorts Scenario ---
  const ytShortsScenario: VideoScenario = {
    platform: 'YouTube Shorts',
    hook: 'كيف تختار عطرك صح؟ 🤔',
    action: 'الشخصية تشير إلى مكونات العطر وهي تظهر على الشاشة، ثم تشير إلى زجاجة العطر.',
    voiceover: `عطر ${perfumeData.name} بمكوناته من ${perfumeData.notes || 'أجود المصادر'} هو خيارك الأمثل لإطلالة متكاملة.`,
    cta: 'لا تتردد، الرابط أول تعليق.',
  };
  scenarios.push(ytShortsScenario);

  return scenarios;
}
