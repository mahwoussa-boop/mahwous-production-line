import { NextRequest, NextResponse } from 'next/server';

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/export-csv
// يولّد ملف CSV بنفس هيكل Metricool تماماً:
//   - 44 عمود ثابت: Date, Time, [Platform Post/Link/Image/Video] × 11 منصة
//   - كل صف = منصة واحدة + محتوى واحد (صورة أو فيديو)
//   - البيانات تملأ فقط في أعمدة المنصة المعنية، باقي الأعمدة فارغة
// ══════════════════════════════════════════════════════════════════════════════

// ── الـ 44 عمود الثابتة بنفس ترتيب Metricool ────────────────────────────────
const HEADERS = [
  'Date', 'Time',
  'Facebook Post',    'Facebook Link',    'Facebook Image',    'Facebook Video',
  'Instagram Post',   'Instagram Link',   'Instagram Image',   'Instagram Video',
  'Threads Post',     'Threads Link',     'Threads Image',     'Threads Video',
  'Twitter Post',     'Twitter Link',     'Twitter Image',     'Twitter Video',
  'LinkedIn Post',    'LinkedIn Link',    'LinkedIn Image',    'LinkedIn Video',
  'Pinterest Post',   'Pinterest Link',   'Pinterest Image',   'Pinterest Video',
  'TikTok Post',      'TikTok Link',      'TikTok Image',      'TikTok Video',
  'YouTube Post',     'YouTube Link',     'YouTube Image',     'YouTube Video',
  'Google My Business Post', 'Google My Business Link', 'Google My Business Image', 'Google My Business Video',
  'Twitch Post',      'Twitch Link',      'Twitch Image',      'Twitch Video',
  'Telegram Post',    'Telegram Link',    'Telegram Image',    'Telegram Video',
];

// ── خريطة المنصات ─────────────────────────────────────────────────────────────
// لكل منصة: مفتاح الكابشن، نوع الصورة، نوع الفيديو، وقت النشر المثالي
interface PlatformConfig {
  captionKey: string;
  imageFormat: 'story' | 'post' | 'landscape' | null;
  videoFormat: 'vertical' | 'horizontal' | null;
  imageTime: string;   // توقيت الصورة
  videoTime: string;   // توقيت الفيديو
}

const PLATFORMS: Record<string, PlatformConfig> = {
  Facebook: {
    captionKey:  'facebook_post',
    imageFormat: 'post',
    videoFormat: 'horizontal',
    imageTime:   '16:00:00',
    videoTime:   '16:10:00',
  },
  Instagram: {
    captionKey:  'instagram_post',
    imageFormat: 'post',
    videoFormat: 'vertical',
    imageTime:   '16:00:00',
    videoTime:   '16:10:00',
  },
  Threads: {
    captionKey:  'instagram_post',
    imageFormat: 'post',
    videoFormat: 'vertical',
    imageTime:   '16:00:00',
    videoTime:   '16:10:00',
  },
  Twitter: {
    captionKey:  'twitter',
    imageFormat: 'landscape',
    videoFormat: 'horizontal',
    imageTime:   '16:15:00',
    videoTime:   '16:25:00',
  },
  LinkedIn: {
    captionKey:  'linkedin',
    imageFormat: 'landscape',
    videoFormat: 'horizontal',
    imageTime:   '16:00:00',
    videoTime:   '16:10:00',
  },
  Pinterest: {
    captionKey:  'pinterest',
    imageFormat: 'story',
    videoFormat: 'vertical',
    imageTime:   '16:00:00',
    videoTime:   '16:10:00',
  },
  TikTok: {
    captionKey:  'tiktok',
    imageFormat: null,          // TikTok لا يدعم صور ثابتة في Metricool
    videoFormat: 'vertical',
    imageTime:   '16:20:00',
    videoTime:   '16:20:00',
  },
  YouTube: {
    captionKey:  'youtube_video',
    imageFormat: null,          // YouTube لا يدعم نشر صور
    videoFormat: 'horizontal',
    imageTime:   '16:30:00',
    videoTime:   '16:30:00',
  },

  Twitch: {
    captionKey:  'instagram_post',
    imageFormat: null,
    videoFormat: 'horizontal',
    imageTime:   '16:40:00',
    videoTime:   '16:40:00',
  },
  Telegram: {
    captionKey:  'instagram_post',
    imageFormat: 'post',
    videoFormat: 'vertical',
    imageTime:   '16:05:00',
    videoTime:   '16:15:00',
  },
};

// ── دالة escape CSV ────────────────────────────────────────────────────────────
function q(value: string): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // دائماً نحيط بعلامات اقتباس (مثل ملف Metricool)
  return `"${str.replace(/"/g, '""')}"`;
}

// ── بناء صف فارغ من 44 عمود ──────────────────────────────────────────────────
function emptyRow(date: string, time: string): Record<string, string> {
  const row: Record<string, string> = {};
  for (const h of HEADERS) {
    row[h] = '';
  }
  row['Date'] = date;
  row['Time'] = time;
  return row;
}

// ── تحويل صف إلى سطر CSV ──────────────────────────────────────────────────────
function rowToCSV(row: Record<string, string>): string {
  return HEADERS.map(h => q(row[h] || '')).join(',');
}

// ══════════════════════════════════════════════════════════════════════════════
// POST Handler
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      perfumeName,
      perfumeBrand,
      productUrl = '',
      captions = {},
      videoCaptions = {},
      imageUrls = {},    // { story, post, landscape }
      videoUrls = {},    // { vertical, horizontal }
      hashtags = [],
      platforms,         // اختياري — إذا لم يُحدد يستخدم كل المنصات
      startDate,         // اختياري — تاريخ البداية
    } = body;

    if (!perfumeName || !perfumeBrand) {
      return NextResponse.json(
        { error: 'perfumeName و perfumeBrand مطلوبان' },
        { status: 400 }
      );
    }

    // ── تحديد التاريخ ──────────────────────────────────────────────────────
    const baseDate: string = startDate || (() => {
      const now = new Date();
      const saudi = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      return saudi.toISOString().split('T')[0];
    })();

    // ── دمج الكابشنات ──────────────────────────────────────────────────────
    const allCaptions: Record<string, string> = { ...captions, ...videoCaptions };

    // ── الهاشتاقات كنص ────────────────────────────────────────────────────
    const hashtagText: string = Array.isArray(hashtags)
      ? hashtags.join(' ')
      : (typeof hashtags === 'string' ? hashtags : '');

    // ── تحديد المنصات ─────────────────────────────────────────────────────
    const allPlatformNames = Object.keys(PLATFORMS);
    const targetPlatformNames: string[] = (platforms && Array.isArray(platforms) && platforms.length > 0)
      ? platforms.filter((p: string) => allPlatformNames.includes(p))
      : allPlatformNames;

    // ══════════════════════════════════════════════════════════════════════
    // بناء الصفوف
    // المنطق: لكل منصة → صف للصورة (إذا متوفرة) + صف للفيديو (إذا متوفر)
    // كل صف يملأ فقط أعمدة المنصة المعنية، باقي الأعمدة فارغة
    // ══════════════════════════════════════════════════════════════════════
    const rows: Record<string, string>[] = [];

    for (const platformName of targetPlatformNames) {
      const cfg = PLATFORMS[platformName];
      if (!cfg) continue;

      // ── اختيار الكابشن ──────────────────────────────────────────────
      const rawCaption = allCaptions[cfg.captionKey]
        || allCaptions['instagram_post']
        || allCaptions['facebook_post']
        || `${perfumeName} من ${perfumeBrand} — متجر مهووس`;

      // دمج الهاشتاقات (بدون تكرار)
      const caption = hashtagText && !rawCaption.includes(hashtagText.split(' ')[0])
        ? `${rawCaption}\n\n${hashtagText}`
        : rawCaption;

      // ── صف الصورة ───────────────────────────────────────────────────
      if (cfg.imageFormat) {
        const imageUrl: string = imageUrls[cfg.imageFormat] || '';
        if (imageUrl) {
          const row = emptyRow(baseDate, cfg.imageTime);
          row[`${platformName} Post`]  = caption;
          row[`${platformName} Link`]  = productUrl;
          row[`${platformName} Image`] = imageUrl;
          row[`${platformName} Video`] = '';
          rows.push(row);
        }
      }

      // ── صف الفيديو ──────────────────────────────────────────────────
      if (cfg.videoFormat) {
        const videoUrl: string = videoUrls[cfg.videoFormat] || '';
        if (videoUrl) {
          const row = emptyRow(baseDate, cfg.videoTime);
          row[`${platformName} Post`]  = caption;
          row[`${platformName} Link`]  = productUrl;
          row[`${platformName} Image`] = '';
          row[`${platformName} Video`] = videoUrl;
          rows.push(row);
        }
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد صور أو فيديوهات لتصديرها — تأكد من توليد المحتوى أولاً' },
        { status: 400 }
      );
    }

    // ── بناء CSV ────────────────────────────────────────────────────────
    const headerLine = HEADERS.map(h => q(h)).join(',');
    const dataLines  = rows.map(rowToCSV);
    const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');

    // ── اسم الملف ───────────────────────────────────────────────────────
    const safeName = `${perfumeBrand}_${perfumeName}`
      .replace(/[^a-zA-Z0-9\u0600-\u06FF_\-]/g, '_')
      .substring(0, 40);
    const filename = `${safeName}_schedule_${baseDate}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Row-Count': String(rows.length),
      },
    });

  } catch (error) {
    console.error('[Export CSV] Error:', error);
    return NextResponse.json({
      error: 'خطأ في تصدير CSV',
      details: error instanceof Error ? error.message : 'Unknown',
    }, { status: 500 });
  }
}
