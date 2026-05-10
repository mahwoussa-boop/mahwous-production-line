// ============================================================
// /api/upload-image — رفع صورة base64 والحصول على URL عام
// v3: Multi-provider with automatic fallback
//   1. imgbb.com (needs API key — most reliable)
//   2. freeimage.host (no key needed)
//   3. catbox.moe (no key needed — file hosting)
//   4. 0x0.st (no key needed — temporary hosting)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

// ── Helper: base64 to Buffer ──
function base64ToUint8Array(base64: string): { data: Uint8Array; mimeType: string } {
  const match = base64.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  const raw = match ? match[2] : base64;
  const mime = match ? match[1] : 'image/png';
  const buf = Buffer.from(raw, 'base64');
  return {
    data: new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
    mimeType: mime,
  };
}

// ── Provider 1: imgbb.com ──
async function uploadToImgbb(base64Data: string, name?: string): Promise<string | null> {
  if (!IMGBB_API_KEY) return null;

  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z+]+;base64,/i, '');
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', cleanBase64);
    if (name) formData.append('name', name);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const url = data?.data?.url || data?.data?.display_url;
      if (url) {
        console.log(`[upload-image] imgbb SUCCESS: ${url}`);
        return url;
      }
    }
    console.warn(`[upload-image] imgbb failed: ${res.status}`);
  } catch (err) {
    console.warn('[upload-image] imgbb error:', err);
  }
  return null;
}

// ── Provider 2: freeimage.host ──
async function uploadToFreeimage(base64Data: string): Promise<string | null> {
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z+]+;base64,/i, '');
    const formData = new URLSearchParams();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    formData.append('source', cleanBase64);
    formData.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const url = data?.image?.url || data?.image?.display_url;
      if (url) {
        console.log(`[upload-image] freeimage SUCCESS: ${url}`);
        return url;
      }
    }
    console.warn(`[upload-image] freeimage failed: ${res.status}`);
  } catch (err) {
    console.warn('[upload-image] freeimage error:', err);
  }
  return null;
}

// ── Provider 3: catbox.moe (file upload) ──
async function uploadToCatbox(base64Data: string, name?: string): Promise<string | null> {
  try {
    const { data, mimeType } = base64ToUint8Array(base64Data);
    const ext = mimeType.split('/')[1] || 'png';
    const fileName = `${name || 'mahwous'}_${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', new Blob([data as BlobPart], { type: mimeType }), fileName);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith('https://')) {
        console.log(`[upload-image] catbox SUCCESS: ${url}`);
        return url.trim();
      }
    }
    console.warn(`[upload-image] catbox failed: ${res.status}`);
  } catch (err) {
    console.warn('[upload-image] catbox error:', err);
  }
  return null;
}

// ── Provider 4: 0x0.st (temporary file hosting) ──
async function uploadTo0x0(base64Data: string, name?: string): Promise<string | null> {
  try {
    const { data, mimeType } = base64ToUint8Array(base64Data);
    const ext = mimeType.split('/')[1] || 'png';
    const fileName = `${name || 'mahwous'}_${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append('file', new Blob([data as BlobPart], { type: mimeType }), fileName);

    const res = await fetch('https://0x0.st', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith('http')) {
        console.log(`[upload-image] 0x0.st SUCCESS: ${url}`);
        return url.trim();
      }
    }
    console.warn(`[upload-image] 0x0.st failed: ${res.status}`);
  } catch (err) {
    console.warn('[upload-image] 0x0.st error:', err);
  }
  return null;
}

// ── Main handler ──
export async function POST(request: NextRequest) {
  try {
    const { imageBase64, name } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    // Try each provider in order
    const providers = [
      { name: 'imgbb', fn: () => uploadToImgbb(imageBase64, name) },
      { name: 'freeimage', fn: () => uploadToFreeimage(imageBase64) },
      { name: 'catbox', fn: () => uploadToCatbox(imageBase64, name) },
      { name: '0x0', fn: () => uploadTo0x0(imageBase64, name) },
    ];

    for (const provider of providers) {
      try {
        const url = await provider.fn();
        if (url && !url.startsWith('data:')) {
          return NextResponse.json({
            url,
            provider: provider.name,
          });
        }
      } catch (e) {
        console.warn(`[upload-image] ${provider.name} failed:`, e);
      }
    }

    // All providers failed — return base64 as last resort
    console.error('[upload-image] ALL providers failed');
    return NextResponse.json({
      url: imageBase64,
      provider: 'base64_fallback',
      warning: 'لم يتم رفع الصورة — أضف IMGBB_API_KEY في .env لنتائج أفضل',
    });

  } catch (error) {
    console.error('[upload-image] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
