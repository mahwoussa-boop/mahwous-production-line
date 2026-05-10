// ============================================================
// app/api/generate-scenarios/route.ts
// POST /api/generate-scenarios
// Generates trending video scenarios for a given perfume.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateVideoScenarios } from '@/lib/scenarioEngine';
import type { PerfumeData } from '@/lib/types';

export const maxDuration = 20;
export const dynamic = 'force-dynamic';

interface ScenarioRequest {
  perfumeData: PerfumeData;
  vibe: string;
}

export async function POST(request: NextRequest) {
  try {
    const { perfumeData, vibe }: ScenarioRequest = await request.json();

    if (!perfumeData?.name || !vibe) {
      return NextResponse.json({ error: 'Missing required fields: perfumeData, vibe' }, { status: 400 });
    }

    const scenarios = generateVideoScenarios(perfumeData, vibe);

    return NextResponse.json({ scenarios }, { status: 200 });

  } catch (error: unknown) {
    console.error('[/api/generate-scenarios] Error:', error);
    const message = error instanceof Error ? error.message : 'Scenario generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
