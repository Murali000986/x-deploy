import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppClient } from '@/lib/xClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const appClient = getAppClient();
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/auth/x/callback`;
    
    const { url, oauth_token, oauth_token_secret } = await appClient.generateAuthLink(callbackUrl, {
      linkMode: 'authorize',
    });

    const cookieStore = await cookies();
    cookieStore.set('oauth_token_secret', oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
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
    const redirectUrl = new URL(`/settings?error=${encodeURIComponent(err?.message ?? 'OAuth error')}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }
}
