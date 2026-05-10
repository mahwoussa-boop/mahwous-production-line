// Temporary debug endpoint for video — DELETE after testing
import { NextRequest, NextResponse } from 'next/server';
import { generateSharedAudio } from '@/lib/hedraClient';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};
  const hedraKey = process.env.HEDRA_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  
  results.keys = {
    HEDRA_API_KEY: hedraKey ? `SET (${hedraKey.substring(0, 12)}...)` : 'NOT SET',
    ELEVENLABS_API_KEY: elevenKey ? `SET (${elevenKey.substring(0, 12)}...)` : 'NOT SET',
  };

  // Test Hedra TTS via our client function
  if (hedraKey) {
    try {
      const assetId = await generateSharedAudio('مرحبا، هذا اختبار للصوت العربي');
      results.tts_via_client = { success: true, asset_id: assetId };
    } catch (e) {
      results.tts_via_client = { success: false, error: e instanceof Error ? e.message : String(e) };
    }

    // Also test raw API
    try {
      const ttsRes = await fetch('https://api.hedra.com/web-app/public/generations', {
        method: 'POST',
        headers: { 'X-API-Key': hedraKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text_to_speech',
          voice_id: '61d27b32-834c-4797-b9ff-4b0febed07f6',
          text: 'مرحبا، هذا اختبار',
          language: 'auto',
        }),
        signal: AbortSignal.timeout(20000),
      });
      const ttsData = await ttsRes.json();
      results.tts_raw = { 
        status: ttsRes.status, 
        asset_id: ttsData.asset_id,
        id: ttsData.id,
        full: JSON.stringify(ttsData).substring(0, 400) 
      };
    } catch (e) {
      results.tts_raw = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
