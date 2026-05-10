// Temporary debug endpoint for Veo — DELETE after testing
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  results.gemini_key = geminiKey ? `SET (${geminiKey.substring(0, 12)}...)` : 'NOT SET';

  if (!geminiKey) {
    return NextResponse.json({ error: 'No Gemini key', results }, { status: 200 });
  }

  // Test: Try Veo 3 Fast with predictLongRunning (correct endpoint)
  const model = 'veo-3.0-fast-generate-001';
  try {
    const body = {
      instances: [
        {
          prompt: 'A luxury perfume bottle on a golden surface with cinematic lighting and bokeh background',
        },
      ],
      parameters: {
        aspectRatio: '9:16',
        durationSeconds: 6,
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      }
    );

    const responseText = await res.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText.substring(0, 500);
    }

    results.veo_test = {
      model,
      status: res.status,
      response: responseData,
    };

    // If we got an operation name, try polling it
    if (res.ok && typeof responseData === 'object' && responseData !== null && 'name' in responseData) {
      const opName = (responseData as { name: string }).name;
      results.operation_name = opName;

      // Poll once to check status
      const pollRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${opName}?key=${geminiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const pollData = await pollRes.json();
      results.poll_result = {
        status: pollRes.status,
        done: pollData.done,
        error: pollData.error,
        response_keys: pollData.response ? Object.keys(pollData.response) : [],
      };
    }

  } catch (e) {
    results.veo_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results, { status: 200 });
}
