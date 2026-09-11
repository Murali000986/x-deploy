import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const {
      X_API_KEY,
      X_API_SECRET,
      X_ACCESS_TOKEN,
      X_ACCESS_SECRET,
    } = process.env;

    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
      return NextResponse.json({
        data: [],
        includes: { users: [] },
        _warning: 'Environment variables for X API are missing.'
      }, { status: 200 });
    }

    const client = new TwitterApi({
      appKey: X_API_KEY,
      appSecret: X_API_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessSecret: X_ACCESS_SECRET,
    });

    const dmEvents = await client.v2.listDmEvents({
      event_types: 'MessageCreate',
      'dm_event.fields': 'text,sender_id,created_at' as any,
      expansions: 'sender_id' as any,
      'user.fields': 'username,name,profile_image_url' as any
    });

    return NextResponse.json((dmEvents as any)._realData);
  } catch (error: any) {
    console.error("X API Error fetching DMs:", error);
    const isAuthError = error.code === 401 || error.code === 403;
    if (isAuthError) {
      return NextResponse.json({
        data: [],
        includes: { users: [] },
        _warning: '⚠️ DMs need Consumer Keys (API Key + Secret) from X Dev Portal. Make sure your app has "Read and write and Direct message" permissions and regenerate your keys!'
      }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
