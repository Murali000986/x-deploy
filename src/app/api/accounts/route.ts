import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { XAccount } from '@/lib/models/XAccount';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const accounts = await XAccount.find({}, { accessToken: 0, accessSecret: 0 }).lean();
  return NextResponse.json({ accounts });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await connectDB();
  await XAccount.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
