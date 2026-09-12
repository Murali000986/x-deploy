import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppClient } from '@/lib/xClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const appClient = getAppClient();
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/auth/x/callback`;
    
    const { url, oauth_token, oauth_token_secret } = await appClient.generateAuthLink(callbackUrl, {
      linkMode: 'authorize',
    });

    // Temporarily store the oauth_token_secret in a cookie so the callback can use it
    const cookieStore = await cookies();
    cookieStore.set('oauth_token_secret', oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    cookieStore.set('oauth_token', oauth_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    });

    return NextResponse.redirect(url);
  } catch (err: any) {
    console.error('OAuth login error:', err?.message);
    return NextResponse.redirect(`/settings?error=${encodeURIComponent(err?.message ?? 'OAuth error')}`);
  }
}
