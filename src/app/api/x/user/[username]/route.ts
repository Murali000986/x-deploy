import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TIER_ERROR_MSG = 'X API Free tier does not include user lookup. Upgrade to Basic tier ($100/mo) at developer.x.com to enable this feature.';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=description,profile_image_url,public_metrics`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` },
    });

    if (response.status === 402 || response.status === 403) {
      return NextResponse.json({ error: TIER_ERROR_MSG }, { status: 402 });
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = errorBody?.detail || errorBody?.errors?.[0]?.message || 'Failed to fetch user from X API';
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.data) {
      return NextResponse.json({ error: `User @${username} not found.` }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
