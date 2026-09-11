import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const url = `https://api.twitter.com/2/tweets/search/recent?query=from:${username}&tweet.fields=created_at,public_metrics&max_results=10`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.detail || err?.errors?.[0]?.message || 'Failed to fetch tweets', status: response.status },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
