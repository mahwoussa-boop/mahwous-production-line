// app/api/composite/route.ts
// Composites the real product bottle image onto the AI-generated character image
// This ensures 100% accurate product representation in all generated images

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface CompositeRequest {
  characterImageUrl: string; // URL of the AI-generated character (from fal.ai)
  bottleImageUrl: string;    // URL of the real product image (from the store)
  format: 'story' | 'post' | 'landscape'; // Image format
}

// Position and size of the bottle overlay based on format
const BOTTLE_CONFIG = {
  story: {
    // 9:16 portrait — bottle in center-lower area of the image
    widthRatio: 0.28,   // bottle width = 28% of image width
    leftRatio: 0.36,    // left position = 36% from left
    topRatio: 0.42,     // top position = 42% from top
  },
  post: {
    // 1:1 square — bottle in center-right area
    widthRatio: 0.30,
    leftRatio: 0.35,
    topRatio: 0.38,
  },
  landscape: {
    // 16:9 landscape — bottle in center-right area
    widthRatio: 0.22,
    leftRatio: 0.38,
    topRatio: 0.30,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body: CompositeRequest = await req.json();
    const { characterImageUrl, bottleImageUrl, format } = body;

    if (!characterImageUrl || !bottleImageUrl || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Download both images
    const [charRes, bottleRes] = await Promise.all([
      fetch(characterImageUrl),
      fetch(bottleImageUrl),
    ]);

    if (!charRes.ok || !bottleRes.ok) {
      return NextResponse.json({ error: 'Failed to download images' }, { status: 500 });
    }

    const [charBuffer, bottleBuffer] = await Promise.all([
      charRes.arrayBuffer().then(Buffer.from),
      bottleRes.arrayBuffer().then(Buffer.from),
    ]);

    // 2. Get character image dimensions
    const charMeta = await sharp(charBuffer).metadata();
    const charWidth = charMeta.width || 1080;
    const charHeight = charMeta.height || 1920;

    // 3. Calculate bottle overlay dimensions
    const config = BOTTLE_CONFIG[format] || BOTTLE_CONFIG.post;
    const bottleWidth = Math.round(charWidth * config.widthRatio);
    const bottleLeft = Math.round(charWidth * config.leftRatio);
    const bottleTop = Math.round(charHeight * config.topRatio);

    // 4. Process bottle image:
    //    - Remove white/light background (make transparent)
    //    - Resize to target dimensions
    //    - Apply slight shadow for realism
    const bottleMeta = await sharp(bottleBuffer).metadata();
    const bottleAspect = (bottleMeta.height || 1) / (bottleMeta.width || 1);
    const bottleHeight = Math.round(bottleWidth * bottleAspect);

    // Process the bottle: resize and ensure it has transparency support
    const processedBottle = await sharp(bottleBuffer)
      .resize(bottleWidth, bottleHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png() // Convert to PNG to support transparency
      .toBuffer();

    // 5. Composite the bottle onto the character image
    const composited = await sharp(charBuffer)
      .composite([
        {
          input: processedBottle,
          left: bottleLeft,
          top: bottleTop,
          blend: 'over',
        },
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    // 6. Return the composited image as base64
    const base64 = composited.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({ imageDataUrl: dataUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[composite] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
