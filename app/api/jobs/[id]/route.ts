// ============================================================
// app/api/jobs/[id]/route.ts
// GET    → حالة المهمة
// DELETE → إلغاء المهمة
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getJob, cancelJob } from '@/lib/engines/jobQueue';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const id = ctx.params.id;
  if (!id) {
    return NextResponse.json({ error: 'job id required' }, { status: 400 });
  }
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  return NextResponse.json(job, { status: 200 });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const id = ctx.params.id;
  if (!id) {
    return NextResponse.json({ error: 'job id required' }, { status: 400 });
  }
  const cancelled = await cancelJob(id);
  if (!cancelled) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }
  return NextResponse.json(cancelled, { status: 200 });
}
