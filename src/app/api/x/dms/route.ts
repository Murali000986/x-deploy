import { NextResponse } from 'next/server';
import { generateOAuth1Header } from '@/lib/twitter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Try Bearer token first (cheaper, works on most tiers)
    const url = 'https://api.twitter.com/2/dm_events?event_types=MessageCreate&dm_event.fields=text,sender_id,created_at&expansions=sender_id&user.fields=username,name,profile_image_url';
    
    // Use OAuth 1.0a for DMs (Bearer doesn't work for user-context DMs)
    const authHeader = generateOAuth1Header('GET', url);
    
    const response = await fetch(url, {
      headers: { 'Authorization': authHeader }
    });

    // If OAuth1 fails (e.g. missing consumer keys), return a helpful error
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      
      // Check if it's a credential issue
      const isAuthError = response.status === 401 || response.status === 403;
      if (isAuthError) {
        return NextResponse.json({
          data: [],
          includes: { users: [] },
          _warning: 'DMs require OAuth 1.0a Consumer Keys (API Key + Secret from X Developer Portal → "Consumer Keys" section). Current credentials are OAuth 2.0 Client ID/Secret which cannot access DMs.'
        }, { status: 200 }); // Return empty gracefully
      }
      
      return NextResponse.json({ error: 'Failed to fetch DMs', details: errorBody }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
