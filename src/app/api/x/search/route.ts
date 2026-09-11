import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TIER_ERROR_MSG = 'X API Free tier does not include tweet/user search. Upgrade to Basic tier ($100/mo) at developer.x.com to enable this feature.';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query q is required' }, { status: 400 });
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodedQuery}&tweet.fields=author_id,created_at&expansions=author_id&user.fields=username,name,description,profile_image_url`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` }
    });

    if (response.status === 402 || response.status === 403) {
      return NextResponse.json({ error: TIER_ERROR_MSG }, { status: 402 });
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = errorBody?.detail || errorBody?.errors?.[0]?.message || 'Failed to search';
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
