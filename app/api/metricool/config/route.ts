import { NextRequest, NextResponse } from 'next/server';

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/metricool/config — جلب إعدادات Metricool تلقائياً
// يقرأ Token من متغيرات البيئة ويجلب blogId و userId من Metricool API
// ══════════════════════════════════════════════════════════════════════════════

const METRICOOL_BASE = 'https://app.metricool.com/api';

export async function GET() {
  try {
    const token = process.env.METRICOOL_API_TOKEN;

    if (!token) {
      return NextResponse.json({
        connected: false,
        error: 'METRICOOL_API_TOKEN غير موجود في متغيرات البيئة',
      });
    }

    // جلب قائمة البراندات/الحسابات المرتبطة
    const profilesRes = await fetch(`${METRICOOL_BASE}/admin/simpleProfiles`, {
      headers: { 'X-Mc-Auth': token },
    });

    if (!profilesRes.ok) {
      // إذا فشل simpleProfiles، نجرب endpoint آخر
      const blogRes = await fetch(`${METRICOOL_BASE}/admin/blog`, {
        headers: { 'X-Mc-Auth': token },
      });

      if (blogRes.ok) {
        const blogData = await blogRes.json();
        return NextResponse.json({
          connected: true,
          token: '***configured***',
          blogId: blogData.id || blogData.blogId || '',
          userId: blogData.userId || '',
          profiles: blogData,
        });
      }

      return NextResponse.json({
        connected: false,
        error: `خطأ في الاتصال بـ Metricool: HTTP ${profilesRes.status}`,
        hint: 'تأكد من صحة METRICOOL_API_TOKEN في Vercel',
      });
    }

    const profiles = await profilesRes.json();

    // استخراج أول blogId و userId
    let blogId = '';
    let userId = '';
    let connectedNetworks: string[] = [];

    if (Array.isArray(profiles) && profiles.length > 0) {
      const firstProfile = profiles[0];
      blogId = String(firstProfile.id || firstProfile.blogId || '');
      userId = String(firstProfile.userId || firstProfile.user_id || '');
      connectedNetworks = firstProfile.networks || firstProfile.connectedNetworks || [];
    } else if (profiles && typeof profiles === 'object') {
      blogId = String(profiles.id || profiles.blogId || '');
      userId = String(profiles.userId || profiles.user_id || '');
      connectedNetworks = profiles.networks || profiles.connectedNetworks || [];
    }

    return NextResponse.json({
      connected: true,
      token: '***configured***',
      blogId,
      userId,
      connectedNetworks,
      profileCount: Array.isArray(profiles) ? profiles.length : 1,
      profiles: Array.isArray(profiles)
        ? profiles.map((p: any) => ({
            id: p.id || p.blogId,
            name: p.name || p.brandName || 'Unknown',
            networks: p.networks || p.connectedNetworks || [],
          }))
        : [profiles],
    });
  } catch (error) {
    console.error('[Metricool Config] Error:', error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}
