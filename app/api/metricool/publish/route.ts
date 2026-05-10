import { NextRequest, NextResponse } from 'next/server';

// ── POST /api/metricool/publish ─────────────────────────────────────────────
// Proxy to Metricool API v2 for scheduling posts
// يقرأ Token من متغيرات البيئة (server-side) — لا يحتاج المستخدم إدخال شيء

const METRICOOL_V1 = 'https://app.metricool.com/api';
const METRICOOL_V2 = 'https://app.metricool.com/api/v2';

async function getMetricoolIds(token: string): Promise<{ blogId: string; userId: string }> {
  try {
    const res = await fetch(`${METRICOOL_V1}/admin/simpleProfiles`, {
      headers: { 'X-Mc-Auth': token },
    });
    if (res.ok) {
      const profiles = await res.json();
      const p = Array.isArray(profiles) ? profiles[0] : profiles;
      if (p) {
        return {
          blogId: String(p.id || p.blogId || ''),
          userId: String(p.userId || p.user_id || ''),
        };
      }
    }
  } catch (e) {
    console.error('[Publish] Failed to fetch blogId:', e);
  }
  return { blogId: '', userId: '' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post } = body;

    const token = process.env.METRICOOL_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'METRICOOL_API_TOKEN غير موجود في متغيرات البيئة' },
        { status: 400 }
      );
    }

    const { blogId, userId } = await getMetricoolIds(token);
    const finalBlogId = process.env.METRICOOL_BLOG_ID || blogId;
    const finalUserId = process.env.METRICOOL_USER_ID || userId;

    if (!finalBlogId) {
      return NextResponse.json(
        { error: 'لم نتمكن من جلب blogId من Metricool' },
        { status: 400 }
      );
    }

    if (!post || !post.providers || post.providers.length === 0) {
      return NextResponse.json(
        { error: 'Missing post data or providers' },
        { status: 400 }
      );
    }

    // Build Metricool v2 payload
    const metricoolPayload = {
      blogId: parseInt(finalBlogId),
      ...(finalUserId && { userId: parseInt(finalUserId) }),
      providers: post.providers,
      text: post.text || '',
      date: post.date || new Date().toISOString(),
      media: post.mediaUrls || [],
      autoPublish: post.autoPublish !== false,
      saveExternalMediaFiles: true,
      shortener: false,
      draft: false,
      ...(post.instagramOptions && { instagramOptions: post.instagramOptions }),
      ...(post.facebookOptions && { facebookOptions: post.facebookOptions }),
      ...(post.twitterOptions && { twitterOptions: post.twitterOptions }),
      ...(post.tiktokOptions && { tiktokOptions: post.tiktokOptions }),
      ...(post.linkedinOptions && { linkedinOptions: post.linkedinOptions }),
      ...(post.youtubeOptions && { youtubeOptions: post.youtubeOptions }),
      ...(post.pinterestOptions && { pinterestOptions: post.pinterestOptions }),
    };

    const url = `${METRICOOL_V2}/scheduler/posts?blogId=${finalBlogId}${finalUserId ? `&userId=${finalUserId}` : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mc-Auth': token,
      },
      body: JSON.stringify(metricoolPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Metricool Publish] Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Metricool API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      postId: result.id || result.postId,
      scheduledDate: post.date,
      providers: post.providers,
      message: 'تم جدولة المنشور بنجاح عبر Metricool',
    });
  } catch (error) {
    console.error('[Metricool Publish] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
