import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/lib/models/candidate';

export const dynamic = 'force-dynamic';

// PATCH update status of a candidate
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses = ['new', 'pending', 'chat'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  await connectDB();
  const candidate = await Candidate.findOneAndUpdate(
    { id },
    { status, lastActivity: new Date().toISOString() },
    { new: true, lean: true }
  );

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  return NextResponse.json(candidate);
}

// DELETE remove a candidate
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();
  await Candidate.findOneAndDelete({ id });
  return NextResponse.json({ success: true });
}
