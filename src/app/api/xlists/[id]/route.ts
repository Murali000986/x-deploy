import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import XList from '@/lib/models/xlist';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  const valid = ['new', 'pending', 'chat', 'done'];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await connectDB();
  const doc = await XList.findByIdAndUpdate(id, { status }, { new: true, lean: true });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}
