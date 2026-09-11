import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import XList from '@/lib/models/xlist';

export const dynamic = 'force-dynamic';

// Helper: parse "$1,234.56" or "1234" → number for sorting
function parseUsd(val: string): number {
  if (!val || val === 'No Data') return -1;
  const n = parseFloat(val.replace(/[$,]/g, ''));
  return isNaN(n) ? -1 : n;
}

// GET — list with optional status/search/sort filters + pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const sortValue = searchParams.get('sort') || ''; // 'value_asc' | 'value_desc'

  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (search) query.username = { $regex: search, $options: 'i' };

  const [rawItems, total] = await Promise.all([
    XList.find(query).lean(),
    XList.countDocuments(query),
  ]);

  // Sort by numeric USD value in JS (stored as string)
  let sorted = rawItems;
  if (sortValue === 'value_asc' || sortValue === 'value_desc') {
    sorted = [...rawItems].sort((a, b) => {
      const aVal = parseUsd(a.usdValue || '');
      const bVal = parseUsd(b.usdValue || '');
      return sortValue === 'value_asc' ? aVal - bVal : bVal - aVal;
    });
  } else {
    // Default: newest first
    sorted = [...rawItems].sort((a, b) =>
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }

  const items = sorted.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ items, total, page, limit });
}

// POST bulk import
export async function POST(request: Request) {
  try {
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('XList import error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

interface IXListInput {
  username: string;
  xUrl: string;
  walletAddress?: string;
  usdValue?: string;
  category?: string;
}
