// ============================================================
// app/api/pipeline/approve/route.ts — Approve Draft & Start Production
// اعتماد المسودة وبدء توليد الوسائط
// ============================================================

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pipelineId, action } = body;

    if (!pipelineId) {
      return NextResponse.json({ error: 'Pipeline ID is required' }, { status: 400 });
    }

    if (action === 'approve') {
      // User approved the draft — trigger production pipeline
      return NextResponse.json({
        success: true,
        message: 'تم اعتماد المسودة — جاري بدء توليد الوسائط',
        action: 'promote_to_production',
        pipelineId,
      });
    }

    if (action === 'reject') {
      return NextResponse.json({
        success: true,
        message: 'تم رفض المسودة',
        action: 'rejected',
        pipelineId,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Approval failed' },
      { status: 500 }
    );
  }
}
