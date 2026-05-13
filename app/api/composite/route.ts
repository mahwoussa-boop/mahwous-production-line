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

interface BBox { left: number; top: number; width: number; height: number; }

// Ask Gemini Vision for the bottle bounding box in the AI-generated image.
// Gemini returns normalized [ymin, xmin, ymax, xmax] in 0–1000 coords.
async function detectBottleBBox(
  imageBuffer: Buffer,
  imgW: number,
  imgH: number,
): Promise<BBox | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  try {
    const b64 = imageBuffer.toString('base64');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inline_data: { mime_type: 'image/jpeg', data: b64 } },
                {
                  text: 'Return the tight 2D bounding box around the perfume bottle the character is holding. Respond with ONLY a JSON array [ymin, xmin, ymax, xmax] using integer coordinates normalized 0–1000. No prose.',
                },
              ],
            },
          ],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      },
    );
    if (!res.ok) {
      console.warn('[composite] Gemini bbox failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const match = text.match(/\[\s*\d+[\s\S]*?\]/);
    if (!match) return null;
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr) || arr.length < 4) return null;
    const [ymin, xmin, ymax, xmax] = arr.map(Number);
    if ([ymin, xmin, ymax, xmax].some((v) => !Number.isFinite(v))) return null;
    const left = Math.round((xmin / 1000) * imgW);
    const top = Math.round((ymin / 1000) * imgH);
    const right = Math.round((xmax / 1000) * imgW);
    const bottom = Math.round((ymax / 1000) * imgH);
    const width = Math.max(1, right - left);
    const height = Math.max(1, bottom - top);
    if (width < imgW * 0.05 || height < imgH * 0.05) return null; // implausibly small
    console.log(`[composite] Gemini bbox: left=${left} top=${top} w=${width} h=${height}`);
    return { left, top, width, height };
  } catch (err) {
    console.warn('[composite] detectBottleBBox error:', err);
    return null;
  }
}

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

    // 3. Try Gemini Vision to locate the bottle in the character image,
    //    so the real product is placed exactly where the hand is holding it.
    //    Fall back to fixed BOTTLE_CONFIG ratios if detection fails.
    let bbox = await detectBottleBBox(charBuffer, charWidth, charHeight);
    if (!bbox) {
      const config = BOTTLE_CONFIG[format] || BOTTLE_CONFIG.post;
      bbox = {
        left: Math.round(charWidth * config.leftRatio),
        top: Math.round(charHeight * config.topRatio),
        width: Math.round(charWidth * config.widthRatio),
        height: 0, // computed below from bottle aspect ratio
      };
    }

    // 4. Process bottle image:
    //    - Remove white/light background (make transparent)
    //    - Resize to target dimensions
    //    - Apply slight shadow for realism
    const bottleMeta = await sharp(bottleBuffer).metadata();
    const bottleSrcW = bottleMeta.width || 1;
    const bottleSrcH = bottleMeta.height || 1;
    const bottleSrcAspect = bottleSrcH / bottleSrcW;

    // Fit the real bottle inside the detected bbox while preserving its aspect
    const bboxW = bbox.width;
    const bboxH = bbox.height > 0 ? bbox.height : Math.round(bboxW * bottleSrcAspect);
    let drawW = bboxW;
    let drawH = Math.round(drawW * bottleSrcAspect);
    if (drawH > bboxH) {
      drawH = bboxH;
      drawW = Math.round(drawH / bottleSrcAspect);
    }
    const drawLeft = bbox.left + Math.round((bboxW - drawW) / 2);
    const drawTop = bbox.top + Math.round((bboxH - drawH) / 2);

    // Process the bottle: resize and ensure it has transparency support
    const processedBottle = await sharp(bottleBuffer)
      .resize(drawW, drawH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png() // Convert to PNG to support transparency
      .toBuffer();

    // 5. Composite the bottle onto the character image
    const composited = await sharp(charBuffer)
      .composite([
        {
          input: processedBottle,
          left: Math.max(0, Math.min(drawLeft, charWidth - drawW)),
          top: Math.max(0, Math.min(drawTop, charHeight - drawH)),
          blend: 'over',
        },
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    // 6. Upload composited image to fal.ai storage and return a public URL
    const falKey = (process.env.FAL_KEY || '')
      .replace(/^﻿/, '')
      .replace(/\\n/g, '')
      .replace(/[‘’“”«»]/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[^\x20-\x7E]/g, '')
      .trim();

    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY is not configured' }, { status: 500 });
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(composited)], { type: 'image/jpeg' });
    formData.append('file', blob, `composite-${Date.now()}.jpg`);
    const uploadRes = await fetch('https://rest.fal.run/storage/upload', {
      method: 'POST',
      headers: { Authorization: `Key ${falKey}` },
      body: formData,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return NextResponse.json({ error: `fal upload failed ${uploadRes.status}: ${errText}` }, { status: 500 });
    }
    const uploadData = await uploadRes.json();
    const url = uploadData?.url as string | undefined;
    if (!url) {
      return NextResponse.json({ error: 'fal upload did not return a URL' }, { status: 500 });
    }
    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[composite] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
