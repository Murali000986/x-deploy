import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppClient } from '@/lib/xClient';
import { connectDB } from '@/lib/db';
import { XAccount } from '@/lib/models/XAccount';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oauth_token    = searchParams.get('oauth_token') ?? '';
  const oauth_verifier = searchParams.get('oauth_verifier') ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  if (!oauth_verifier) {
    return NextResponse.redirect(`${baseUrl}/settings?error=OAuth+denied`);
  }

  try {
    const cookieStore = await cookies();
    const storedSecret = cookieStore.get('oauth_token_secret')?.value ?? '';
    if (!storedSecret) {
      return NextResponse.redirect(`${baseUrl}/settings?error=Session+expired`);
    }

    // Exchange for permanent access token
    const tempClient = new TwitterApi({
      appKey: process.env.X_API_KEY!,
      appSecret: process.env.X_API_SECRET!,
      accessToken: oauth_token,
      accessSecret: storedSecret,
    });
    const { client: userClient, accessToken, accessSecret } = await tempClient.login(oauth_verifier);

    // Fetch the user profile
    const me = await userClient.v2.me({
      'user.fields': ['profile_image_url', 'name'] as any,
    });
    const { id, username, name } = me.data;
    const profileImageUrl = (me.data as any).profile_image_url ?? '';

    // Upsert into MongoDB and set as active
    await connectDB();
    await XAccount.updateMany({}, { isActive: false }); // deactivate all
    await XAccount.findOneAndUpdate(
      { userId: id },
      { userId: id, username, name, profileImageUrl, accessToken, accessSecret, isActive: true },
      { upsert: true, new: true }
    );

    // Clear temp cookies
    cookieStore.delete('oauth_token_secret');
    cookieStore.delete('oauth_token');

    return NextResponse.redirect(`${baseUrl}/settings?success=Account+added`);
  } catch (err: any) {
    console.error('OAuth callback error:', err?.message);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(err?.message ?? 'OAuth error')}`);
  }
}
