// Temporary debug endpoint — DELETE after testing
import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 90;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};

  // Check env vars
  results.envs = {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? `SET (${process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 8)}...)` : 'NOT SET',
    FAL_KEY: process.env.FAL_KEY ? `SET (${process.env.FAL_KEY.substring(0, 8)}...)` : 'NOT SET',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `SET (${process.env.OPENAI_API_KEY.substring(0, 8)}...)` : 'NOT SET',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? `SET (${process.env.ANTHROPIC_API_KEY.substring(0, 8)}...)` : 'NOT SET',
    HEDRA_API_KEY: process.env.HEDRA_API_KEY ? `SET (${process.env.HEDRA_API_KEY.substring(0, 8)}...)` : 'NOT SET',
    METRICOOL_API_TOKEN: process.env.METRICOOL_API_TOKEN ? `SET (${process.env.METRICOOL_API_TOKEN.substring(0, 8)}...)` : 'NOT SET',
    NEXT_PUBLIC_DEFAULT_LORA_MODEL: process.env.NEXT_PUBLIC_DEFAULT_LORA_MODEL || 'NOT SET',
    NEXT_PUBLIC_DEFAULT_LORA_TRIGGER: process.env.NEXT_PUBLIC_DEFAULT_LORA_TRIGGER || 'NOT SET',
  };

  // Test Gemini models
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const geminiModels = [
      'gemini-2.0-flash-exp-image-generation',
      'imagen-3.0-generate-002',
    ];
    
    results.gemini_tests = {};
    
    for (const modelName of geminiModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Generate a simple red circle' }] }],
              generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
            }),
            signal: AbortSignal.timeout(30000),
          }
        );
        const geminiData = await geminiRes.json();
        if (geminiRes.ok) {
          const hasImage = geminiData?.candidates?.[0]?.content?.parts?.some((p: Record<string, unknown>) => p.inlineData);
          (results.gemini_tests as Record<string, unknown>)[modelName] = { status: geminiRes.status, hasImage };
        } else {
          (results.gemini_tests as Record<string, unknown>)[modelName] = { status: geminiRes.status, error: geminiData?.error?.message?.substring(0, 100) };
        }
      } catch (e) {
        (results.gemini_tests as Record<string, unknown>)[modelName] = { error: e instanceof Error ? e.message : String(e) };
      }
    }

    // Test Imagen 3 separately
    try {
      const imagenRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: 'A simple red circle on white background' }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );
      const imagenData = await imagenRes.json();
      if (imagenRes.ok) {
        const hasImage = !!imagenData?.predictions?.[0]?.bytesBase64Encoded;
        results.imagen3 = { status: imagenRes.status, hasImage };
      } else {
        results.imagen3 = { status: imagenRes.status, error: imagenData?.error?.message?.substring(0, 100) };
      }
    } catch (e) {
      results.imagen3 = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Test DALL-E 3 via OpenRouter
  if (process.env.OPENAI_API_KEY) {
    const apiKey = process.env.OPENAI_API_KEY;
    const isOpenRouter = apiKey.startsWith('sk-or-');
    const baseUrl = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
    const model = isOpenRouter ? 'openai/dall-e-3' : 'dall-e-3';
    
    try {
      const dalleRes = await fetch(`${baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(isOpenRouter ? { 'HTTP-Referer': 'https://perfume-ai-generator.vercel.app' } : {}),
        },
        body: JSON.stringify({
          model,
          prompt: 'A simple red circle on white background',
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        }),
        signal: AbortSignal.timeout(60000),
      });
      const dalleData = await dalleRes.json();
      if (dalleRes.ok) {
        const hasImage = !!dalleData?.data?.[0]?.url;
        results.dalle3 = { status: dalleRes.status, hasImage, via: isOpenRouter ? 'openrouter' : 'openai', imageUrl: dalleData?.data?.[0]?.url?.substring(0, 50) };
      } else {
        results.dalle3 = { status: dalleRes.status, error: dalleData?.error?.message?.substring(0, 150), via: isOpenRouter ? 'openrouter' : 'openai' };
      }
    } catch (e) {
      results.dalle3 = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Test FAL
  if (process.env.FAL_KEY) {
    try {
      const falRes = await fetch('https://queue.fal.run/fal-ai/flux-lora', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test image',
          image_size: { width: 512, height: 512 },
          num_inference_steps: 1,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const falData = await falRes.json();
      results.fal = { status: falRes.status, response: JSON.stringify(falData).substring(0, 150) };
    } catch (e) {
      results.fal = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
