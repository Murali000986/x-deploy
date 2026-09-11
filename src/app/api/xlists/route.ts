import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import XList from '@/lib/models/xlist';

export const dynamic = 'force-dynamic';

// GET — list all with optional status filter and pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';

  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (search) query.username = { $regex: search, $options: 'i' };

  const [items, total] = await Promise.all([
    XList.find(query).sort({ addedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    XList.countDocuments(query),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

// POST bulk import
export async function POST(request: Request) {
  const body = await request.json();
  const records: IXListInput[] = Array.isArray(body) ? body : [body];

  await connectDB();

  const ops = records.map(r => ({
    updateOne: {
      filter: { username: r.username },
      update: { $setOnInsert: { ...r, addedAt: new Date().toISOString(), status: 'new' } },
      upsert: true,
    },
  }));

  const result = await XList.bulkWrite(ops);
  return NextResponse.json({ inserted: result.upsertedCount, matched: result.matchedCount });
}

interface IXListInput {
  username: string;
  xUrl: string;
  walletAddress?: string;
  usdValue?: string;
  category?: string;
}
