import { NextResponse } from 'next/server';
import { getActiveClient } from '@/lib/xClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await getActiveClient();
    const me = await client.v2.me({
      'user.fields': ['profile_image_url'] as any
    });
    
    return NextResponse.json(me.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
