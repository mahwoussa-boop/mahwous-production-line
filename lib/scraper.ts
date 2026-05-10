// @ts-nocheck
// ============================================================
// lib/scraper.ts — v4.0 SMART FALLBACK (Vercel Compatible)
// Scrapes perfume product pages and extracts structured data.
// Optimized for mahwous.com (Salla-based store).
//
// STRATEGY (no curl — Vercel serverless compatible):
//   1. Try Node.js fetch with browser headers
//   2. If blocked → AI extraction from URL slug (OpenAI)
//   3. If no AI → basic slug extraction
// ============================================================
import * as cheerio from 'cheerio';
import type { ScrapedProduct } from './types';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'identity',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

function getOGMeta($: cheerio.CheerioAPI, property: string): string {
  return (
    $(`meta[property="${property}"]`).attr('content') ??
    $(`meta[name="${property}"]`).attr('content') ??
    ''
  );
}

function resolveUrl(href: string | undefined, baseUrl: string): string {
  if (!href) return '';
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function detectGender(text: string): 'men' | 'women' | 'unisex' {
  const lower = text.toLowerCase();
  if (/for men|homme|pour homme|للرجال|رجالي|masculine|أومو|uomo|man\b/.test(lower)) return 'men';
  if (/for women|femme|pour femme|للنساء|نسائي|feminine|donna|woman\b/.test(lower)) return 'women';
  return 'unisex';
}

// ─── Extract product slug from URL ───────────────────────────────────────────
function extractSlugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // mahwous.com: /products/product-slug
    const idx = parts.findIndex(p => p === 'products' || p === 'p' || p === 'product');
    if (idx >= 0 && parts[idx + 1]) {
      return decodeURIComponent(parts[idx + 1]).replace(/-/g, ' ').replace(/_/g, ' ');
    }
    // Last path segment
    const last = parts[parts.length - 1];
    if (last && last.length > 3 && !last.includes('.')) {
      return decodeURIComponent(last).replace(/-/g, ' ').replace(/_/g, ' ');
    }
  } catch {}
  return '';
}

// ─── AI-powered product extraction from URL slug ─────────────────────────────
async function extractProductFromSlugWithAI(url: string): Promise<ScrapedProduct | null> {
  const slug = extractSlugFromUrl(url);
  if (!slug || slug.length < 3) return null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    const prompt = `You are a perfume expert. Extract structured product info from this URL slug.
Slug: "${slug}"
Full URL: ${url}

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "full product name in Arabic",
  "brand": "brand name in English",
  "gender": "men|women|unisex",
  "price": null,
  "notes": "likely fragrance notes based on name",
  "description": "brief Arabic description",
  "imageUrl": null
}

Examples:
- "valentino-born-in-roma-extravaganza-uomo-edp-100ml" → {"name":"فالنتينو بورن إن روما إكسترادوز أومو أو دو بارفيوم 100 مل","brand":"Valentino","gender":"men","notes":"woody amber vanilla","description":"عطر رجالي فاخر من فالنتينو","price":null,"imageUrl":null}
- "dior-sauvage-edp-200ml" → {"name":"ديور سوفاج أو دو بارفيوم 200 مل","brand":"Dior","gender":"men","notes":"bergamot ambroxan cedar","description":"عطر رجالي عصري من ديور","price":null,"imageUrl":null}
- "chanel-no5-edp-100ml-women" → {"name":"شانيل نمبر 5 أو دو بارفيوم 100 مل للنساء","brand":"Chanel","gender":"women","notes":"rose jasmine sandalwood","description":"عطر نسائي كلاسيكي من شانيل","price":null,"imageUrl":null}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      max_tokens: 400,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'Respond only with valid JSON, no markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '{}';
    const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    console.log('[scraper] AI extracted product from URL slug:', parsed.name);
    return {
      name: parsed.name || slug,
      brand: parsed.brand || 'Unknown',
      gender: (parsed.gender as 'men' | 'women' | 'unisex') || 'unisex',
      price: parsed.price || undefined,
      notes: parsed.notes || undefined,
      description: parsed.description || undefined,
      imageUrl: parsed.imageUrl || undefined,
    };
  } catch (e) {
    console.warn('[scraper] AI slug extraction failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

// ─── Check if HTML looks like a valid product page ───────────────────────────
function isValidProductPage(html: string): boolean {
  // Check for error page indicators
  const lower = html.toLowerCase();
  if (lower.includes('<title>410') || lower.includes('<title>404') || lower.includes('<title>403')) return false;
  if (lower.includes('page not found') || lower.includes('not found') && html.length < 5000) return false;
  if (lower.includes('access denied') || lower.includes('403 forbidden')) return false;
  // Check for product indicators
  const hasProductSignal = (
    lower.includes('product') || lower.includes('price') || lower.includes('عطر') ||
    lower.includes('parfum') || lower.includes('perfume') || lower.includes('ريال') ||
    lower.includes('sar') || lower.includes('add to cart') || lower.includes('أضف للسلة')
  );
  return hasProductSignal;
}

// ─── Fetch HTML via Node.js fetch (Vercel compatible) ────────────────────────
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const html = await response.text();
      if (html && html.length > 500 && isValidProductPage(html)) {
        console.log('[scraper] Fetched valid product page, length:', html.length);
        return html;
      } else if (html && html.length > 500) {
        console.warn('[scraper] Page fetched but does not look like a product page');
        return null;
      }
    }
    console.warn(`[scraper] Node fetch returned HTTP ${response.status}`);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scraper] Node fetch failed: ${msg}`);
    return null;
  }
}

// ─── Parse HTML to extract product data ──────────────────────────────────────
function parseHtml(html: string, url: string): ScrapedProduct {
  const $ = cheerio.load(html);
  const product: ScrapedProduct = {};

  // ── Product Name ──────────────────────────────────────────────────────────
  product.name = (
    $('h1').first().text().trim() ||
    getOGMeta($, 'og:title') ||
    $('title').text().split('|')[0].trim()
  )
    .replace(/\s+/g, ' ')
    .substring(0, 150);

  // ── Brand ─────────────────────────────────────────────────────────────────
  let brand = '';
  $('a[hint="brand"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length < 60 && !/الجنس|نوع|الشخصية|العائلة/.test(t)) {
      brand = t.split(/\n/)[0].trim();
      return false;
    }
  });
  if (!brand) {
    $('li, p, span, div').each((_, el) => {
      const text = $(el).text();
      const match = text.match(/العلامة التجارية[:\s]+([^\n,،]+)/);
      if (match) { brand = match[1].trim().substring(0, 80); return false; }
    });
  }
  if (!brand) {
    const ldJson = $('script[type="application/ld+json"]').first().html();
    if (ldJson) {
      try {
        const d = JSON.parse(ldJson);
        brand = d.brand?.name || d.brand || '';
      } catch {}
    }
  }
  if (!brand) brand = getOGMeta($, 'og:site_name');
  product.brand = brand.substring(0, 80) || 'مهووس';

  // ── Price ─────────────────────────────────────────────────────────────────
  let price = '';
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const offers = data.offers;
      if (offers?.price) { price = `${offers.price} ${offers.priceCurrency || 'SAR'}`; return false; }
    } catch {}
  });
  if (!price) {
    const priceAmount = getOGMeta($, 'product:price:amount') || getOGMeta($, 'og:price:amount');
    if (priceAmount) price = `${priceAmount} SAR`;
  }
  if (!price) {
    const fullText = $('body').text();
    const priceMatch = fullText.match(/(\d{2,4})\s*(?:ر\.س|SAR|ريال|﷼)/);
    if (priceMatch) price = `${priceMatch[1]} ريال`;
  }
  product.price = price.trim().substring(0, 30);

  // ── Image URL ─────────────────────────────────────────────────────────────
  const ogImage = getOGMeta($, 'og:image');
  if (ogImage) {
    product.imageUrl = resolveUrl(ogImage, url);
  } else {
    const mainImg =
      $('[class*="product"] img').first().attr('src') ||
      $('img[class*="main"]').first().attr('src') ||
      $('img').first().attr('src');
    if (mainImg) product.imageUrl = resolveUrl(mainImg, url);
  }

  // ── Description ───────────────────────────────────────────────────────────
  product.description = (
    getOGMeta($, 'og:description') ||
    $('meta[name="description"]').attr('content') ||
    ''
  ).trim().replace(/\s+/g, ' ').substring(0, 500);

  // ── Notes ─────────────────────────────────────────────────────────────────
  const fullText = $('body').text().replace(/\s+/g, ' ');
  const notes: string[] = [];
  const topMatch = fullText.match(/المكونات العليا[:\s]+([^.،\n]{5,150})/);
  const heartMatch = fullText.match(/المكونات الوسطى[:\s]+([^.،\n]{5,150})/);
  const baseMatch = fullText.match(/المكونات الأساسية[:\s]+([^.،\n]{5,150})/);
  if (topMatch) notes.push(`رأسية: ${topMatch[1].trim()}`);
  if (heartMatch) notes.push(`قلبية: ${heartMatch[1].trim()}`);
  if (baseMatch) notes.push(`قاعدية: ${baseMatch[1].trim()}`);
  if (!notes.length) {
    const enTop = fullText.match(/top notes?[:\s]+([^.;<\n]{5,150})/i);
    const enHeart = fullText.match(/(?:heart|middle) notes?[:\s]+([^.;<\n]{5,150})/i);
    const enBase = fullText.match(/base notes?[:\s]+([^.;<\n]{5,150})/i);
    if (enTop) notes.push(`Top: ${enTop[1].trim()}`);
    if (enHeart) notes.push(`Heart: ${enHeart[1].trim()}`);
    if (enBase) notes.push(`Base: ${enBase[1].trim()}`);
  }
  product.notes = notes.join(' • ') || '';

  // ── Gender ────────────────────────────────────────────────────────────────
  const genderMatch = fullText.match(/الجنس[:\s]+([^\n،,]{2,20})/);
  if (genderMatch) {
    const g = genderMatch[1].trim();
    if (/نسائي|للنساء|women/i.test(g)) product.gender = 'women';
    else if (/رجالي|للرجال|men/i.test(g)) product.gender = 'men';
    else product.gender = 'unisex';
  } else {
    product.gender = detectGender(fullText + ' ' + (product.name ?? ''));
  }

  // ── Volume ────────────────────────────────────────────────────────────────
  const volumeMatch = ((product.name ?? '') + ' ' + fullText).match(/(\d+)\s*(?:ml|مل)/i);
  if (volumeMatch) product.volume = `${volumeMatch[1]}ml`;

  return product;
}

// ─── Main scraper ────────────────────────────────────────────────────────────
export async function scrapeProductPage(url: string): Promise<ScrapedProduct> {
  // Validate URL
  let validUrl: URL;
  try {
    validUrl = new URL(url);
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }
  } catch {
    throw new Error(`رابط غير صالح: ${url}`);
  }

  // Strategy 1: Try to fetch HTML directly
  const html = await fetchHtml(validUrl.toString());
  if (html) {
    const product = parseHtml(html, validUrl.toString());
    if (product.name && product.name.length > 3) {
      console.log('[scraper] Successfully parsed HTML, product:', product.name);
      return product;
    }
  }

  // Strategy 2: AI extraction from URL slug
  console.log('[scraper] HTML fetch failed or empty, trying AI slug extraction...');
  const aiProduct = await extractProductFromSlugWithAI(validUrl.toString());
  if (aiProduct && aiProduct.name && aiProduct.name.length > 3) {
    console.log('[scraper] AI extraction succeeded:', aiProduct.name);
    return aiProduct;
  }

  // Strategy 3: Basic extraction from URL slug
  const slug = extractSlugFromUrl(validUrl.toString());
  if (slug && slug.length > 3) {
    console.log('[scraper] Using basic URL slug extraction:', slug);
    const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1);
    return {
      name: capitalized,
      brand: validUrl.hostname.replace('www.', '').split('.')[0],
      gender: detectGender(slug),
      description: `منتج من ${validUrl.hostname}`,
    };
  }

  // Strategy 4: Throw error
  throw new Error(
    `لم نتمكن من استخراج بيانات المنتج. تأكد من صحة الرابط أو أدخل بيانات المنتج يدوياً.`
  );
}
