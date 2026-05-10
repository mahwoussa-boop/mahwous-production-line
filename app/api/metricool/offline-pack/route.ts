import { NextRequest, NextResponse } from 'next/server';

// ── POST /api/metricool/offline-pack ────────────────────────────────────────
// Generates downloadable content packs for platforms without API automation
// WhatsApp Status, Haraj, Snapchat

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      perfumeName,
      perfumeBrand,
      productUrl,
      captions,
      imageUrls,
      videoUrls,
      price,
    } = body;

    // ── WhatsApp Status Pack ──────────────────────────────────────────────
    const whatsappPack = {
      platform: 'whatsapp',
      platformAr: 'واتساب',
      instructions: 'انشر كل صورة/فيديو كحالة واتساب مع الكابشن',
      instructionsAr: 'انشر كل صورة/فيديو كحالة واتساب مع الكابشن',
      media: [
        ...(imageUrls?.story ? [{ type: 'image', url: imageUrls.story, label: 'صورة ستوري' }] : []),
        ...(imageUrls?.post ? [{ type: 'image', url: imageUrls.post, label: 'صورة بوست' }] : []),
        ...(videoUrls?.vertical ? [{ type: 'video', url: videoUrls.vertical, label: 'فيديو عمودي' }] : []),
      ],
      caption: captions?.whatsapp || captions?.instagram ||
        `✨ ${perfumeName}\n${perfumeBrand}\n\n${captions?.instagram || 'عطر فاخر من مهووس ستور'}\n\n🛒 للطلب: ${productUrl}`,
    };

    // ── Haraj Pack ────────────────────────────────────────────────────────
    const harajCaption = `${perfumeName} - ${perfumeBrand}

${captions?.haraj || captions?.instagram || 'عطر أصلي 100% من مهووس ستور'}

${price ? `💰 السعر: ${price}` : ''}

📍 التوصيل لجميع مناطق المملكة
✅ أصلي 100% مع ضمان
📦 شحن سريع

للطلب: ${productUrl}

#عطور #عطور_أصلية #مهووس_ستور #عطر #perfume`;

    const harajPack = {
      platform: 'haraj',
      platformAr: 'حراج',
      instructions: 'انشر الصور مع الوصف في منصة حراج',
      instructionsAr: 'انشر الصور مع الوصف في منصة حراج',
      media: [
        ...(imageUrls?.post ? [{ type: 'image', url: imageUrls.post, label: 'صورة رئيسية' }] : []),
        ...(imageUrls?.landscape ? [{ type: 'image', url: imageUrls.landscape, label: 'صورة عرضية' }] : []),
        ...(imageUrls?.story ? [{ type: 'image', url: imageUrls.story, label: 'صورة إضافية' }] : []),
      ],
      caption: harajCaption,
      title: `${perfumeName} - عطر أصلي | مهووس ستور`,
      category: 'عطور',
      price: price || '',
    };

    // ── Snapchat Pack ─────────────────────────────────────────────────────
    const snapchatPack = {
      platform: 'snapchat',
      platformAr: 'سناب شات',
      instructions: 'انشر الصور والفيديو كسنابات وقصص',
      instructionsAr: 'انشر الصور والفيديو كسنابات وقصص',
      media: [
        ...(imageUrls?.story ? [{ type: 'image', url: imageUrls.story, label: 'صورة ستوري' }] : []),
        ...(videoUrls?.vertical ? [{ type: 'video', url: videoUrls.vertical, label: 'فيديو عمودي' }] : []),
        ...(imageUrls?.post ? [{ type: 'image', url: imageUrls.post, label: 'صورة إضافية' }] : []),
      ],
      caption: captions?.snapchat || captions?.tiktok ||
        `✨ ${perfumeName}\n${perfumeBrand}\n\nجربوه وشاركونا رأيكم 🔥\n\n${productUrl}`,
    };

    // ── Generate text file content for download ──────────────────────────
    const textFileContent = `═══════════════════════════════════════════════════
📱 ملف المحتوى الجاهز — المنصات غير المؤتمتة
═══════════════════════════════════════════════════
🏷️ المنتج: ${perfumeName}
🏢 العلامة: ${perfumeBrand}
🔗 الرابط: ${productUrl}
📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}

═══════════════════════════════════════════════════
📱 واتساب — حالة/ستوري
═══════════════════════════════════════════════════
${whatsappPack.caption}

الصور والفيديو:
${whatsappPack.media.map(m => `- ${m.label}: ${m.url}`).join('\n')}

═══════════════════════════════════════════════════
🏪 حراج
═══════════════════════════════════════════════════
العنوان: ${harajPack.title}
${harajPack.caption}

الصور:
${harajPack.media.map(m => `- ${m.label}: ${m.url}`).join('\n')}

═══════════════════════════════════════════════════
👻 سناب شات
═══════════════════════════════════════════════════
${snapchatPack.caption}

الصور والفيديو:
${snapchatPack.media.map(m => `- ${m.label}: ${m.url}`).join('\n')}

═══════════════════════════════════════════════════
✅ تم التوليد بواسطة مهووس AI
═══════════════════════════════════════════════════`;

    return NextResponse.json({
      success: true,
      packs: [whatsappPack, harajPack, snapchatPack],
      textFileContent,
      message: 'تم توليد حزم المحتوى للمنصات غير المؤتمتة',
    });
  } catch (error) {
    console.error('[Offline Pack] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
