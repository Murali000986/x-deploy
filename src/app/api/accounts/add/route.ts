import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { connectDB } from '@/lib/db';
import { XAccount } from '@/lib/models/XAccount';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { appKey, appSecret, accessToken, accessSecret } = await request.json();

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      return NextResponse.json({ error: 'All 4 API keys are required' }, { status: 400 });
    }

    // Test the keys
    const tempClient = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
    const me = await tempClient.v2.me({
      'user.fields': ['profile_image_url', 'name'] as any,
    });
    
    const { id, username, name } = me.data;
    const profileImageUrl = (me.data as any).profile_image_url ?? '';

    // Save to Mongo
    await connectDB();
    await XAccount.updateMany({}, { isActive: false }); // deactivate all others
    await XAccount.findOneAndUpdate(
      { userId: id },
      { userId: id, username, name, profileImageUrl, appKey, appSecret, accessToken, accessSecret, isActive: true },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, account: { username, name } });

  } catch (err: any) {
    console.error('Add account error:', err?.message ?? err);
    return NextResponse.json({ error: err?.data?.detail ?? err?.message ?? 'Failed to verify keys' }, { status: 400 });
  }
}
