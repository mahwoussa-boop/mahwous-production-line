import { NextRequest, NextResponse } from 'next/server';

// ── POST /api/metricool/analytics ───────────────────────────────────────────
// Proxy to Metricool API for fetching analytics data
// يقرأ Token من متغيرات البيئة (server-side)

const METRICOOL_BASE = 'https://app.metricool.com/api';

async function getBlogId(token: string): Promise<string> {
  try {
    const res = await fetch(`${METRICOOL_BASE}/admin/simpleProfiles`, {
      headers: { 'X-Mc-Auth': token },
    });
    if (res.ok) {
      const profiles = await res.json();
      if (Array.isArray(profiles) && profiles.length > 0) {
        return String(profiles[0].id || profiles[0].blogId || '');
      }
    }
  } catch (e) {
    console.error('[Analytics] Failed to fetch blogId:', e);
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, params } = body;

    const token = process.env.METRICOOL_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'METRICOOL_API_TOKEN غير موجود في متغيرات البيئة' },
        { status: 400 }
      );
    }

    const blogId = process.env.METRICOOL_BLOG_ID || await getBlogId(token);
    if (!blogId) {
      return NextResponse.json(
        { error: 'لم نتمكن من جلب blogId' },
        { status: 400 }
      );
    }

    // Supported endpoints
    const allowedEndpoints = [
      'stats/posts',
      'stats/community',
      'stats/reels',
      'stats/stories',
      'stats/tiktok',
      'stats/facebook',
      'stats/twitter',
      'stats/linkedin',
      'stats/youtube',
      'stats/pinterest',
      'stats/summary',
      'stats/aggregation',
      'stats/aggregations',
      'stats/timeline',
      'stats/distribution',
      'stats/instagram',
      'stats/postmessage',
      'stats/datacomment',
      'stats/postlike',
      'stats/country',
      'stats/city',
      'competitors/list',
      'competitors/posts',
      'scheduler/list',
      'scheduler/besttime',
      'scheduler/posts/list',
      'data/posts',
    ];

    if (!endpoint || !allowedEndpoints.some(e => endpoint.startsWith(e))) {
      return NextResponse.json(
        { error: 'Invalid or unsupported endpoint' },
        { status: 400 }
      );
    }

    // Build URL with query params
    const url = new URL(`${METRICOOL_BASE}/${endpoint}`);
    url.searchParams.set('blogId', blogId);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Mc-Auth': token,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Metricool Analytics] Error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `Metricool API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data,
      endpoint,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Metricool Analytics] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
