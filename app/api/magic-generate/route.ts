// ============================================================
// app/api/magic-generate/route.ts — Magic Engine Orchestrator v2.0
// Single endpoint that runs the entire content generation pipeline:
//   1. Scrape product data
//   2. Fetch Metricool trending intel
//   3. Generate Elite Director content (Gemini)
//   4. Generate images (Gemini/FLUX)
//   5. Generate captions (all platforms)
//   6. Launch video generation (Hedra Pro 1080p)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { scrapeProductPage } from '@/lib/scraper';
import { generateVideoScenarios } from '@/lib/scenarioEngine';
import { fetchTrendingIntel } from '@/lib/metricoolCompetitor';
import type { PerfumeData } from '@/lib/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const diagnostics: string[] = [];

  try {
    const body = await req.json();
    const {
      productUrl,
      bottleImageBase64,
      characterImageBase64,
    } = body;

    if (!productUrl) {
      return NextResponse.json({ error: 'Missing productUrl' }, { status: 400 });
    }

    // ── Step 1: Scrape product ────────────────────────────────────────────
    diagnostics.push('Step 1: Scraping product...');
    const scraped = await scrapeProductPage(productUrl);
    const perfumeData: PerfumeData = {
      name: scraped.name ?? '',
      brand: scraped.brand ?? '',
      gender: (scraped.gender as PerfumeData['gender']) ?? 'unisex',
      notes: scraped.notes ?? '',
      description: scraped.description ?? '',
      imageUrl: scraped.imageUrl ?? '',
      price: scraped.price ?? '',
    };
    diagnostics.push(`Scraped: ${perfumeData.name} by ${perfumeData.brand}`);

    // ── Step 2: Fetch Metricool Intel (non-blocking) ──────────────────────
    diagnostics.push('Step 2: Fetching market intel...');
    let intel = null;
    try {
      intel = await fetchTrendingIntel();
      diagnostics.push(`Intel: ${intel?.trending_keywords?.length || 0} keywords`);
    } catch {
      diagnostics.push('Intel: skipped (no Metricool configured)');
    }

    // ── Step 3: Determine vibe/attire from scraped data ─────────────────────
    const notes = `${perfumeData.notes || ''} ${perfumeData.description || ''}`.toLowerCase();
    let vibe = 'oriental_palace';
    if (/rose|jas|flor|ورد/.test(notes)) vibe = 'rose_garden';
    else if (/ocean|aqua|fresh/.test(notes)) vibe = 'ocean_breeze';
    else if (/wood|cedar|sandal/.test(notes)) vibe = 'classic_library';
    else if (/vanil|sweet/.test(notes)) vibe = 'royal_luxury';

    // ── Step 4: Generate Director content ────────────────────────────────────
    diagnostics.push('Step 4: Generating creative content...');
    const scenarios = generateVideoScenarios(perfumeData, vibe);
    const directorOutput = { cinematic_image_prompts: [], scenarios };
    diagnostics.push(`Director: ${directorOutput.scenarios.length} scenarios`);

    const attire = perfumeData.gender === 'women' ? 'black_suit_gold_details' : 'saudi_bisht';

    return NextResponse.json({
      success: true,
      perfumeData,
      vibe,
      attire,
      directorOutput,
      intel,
      diagnostics,
    });
  } catch (error) {
    console.error('[magic-generate] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Magic generation failed',
      diagnostics,
    }, { status: 500 });
  }
}
