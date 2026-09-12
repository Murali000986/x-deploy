import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { XAccount } from '@/lib/models/XAccount';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await connectDB();
  await XAccount.updateMany({}, { isActive: false });
  const account = await XAccount.findByIdAndUpdate(id, { isActive: true }, { new: true });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  return NextResponse.json({ success: true, username: account.username });
}
