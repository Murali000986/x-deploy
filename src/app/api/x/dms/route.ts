import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;

    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
      return NextResponse.json({
        data: [], includes: { users: [] }, _warning: 'X API credentials missing.'
      });
    }

    const client = new TwitterApi({
      appKey: X_API_KEY,
      appSecret: X_API_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessSecret: X_ACCESS_SECRET,
    });

    // Get bot's own ID
    const me = await client.v2.me();
    const myId = me.data.id;

    // Step 1: Get sent DM events to discover conversation IDs
    const sentEvents = await client.v2.listDmEvents({
      event_types: 'MessageCreate',
      'dm_event.fields': ['dm_conversation_id', 'sender_id'] as any,
      max_results: 50 as any,
    });
    const sentData: any[] = (sentEvents as any)._realData?.data ?? [];

    const convIds = [...new Set(sentData.map((e: any) => e.dm_conversation_id).filter(Boolean))];

    if (convIds.length === 0) {
      return NextResponse.json({ data: [], includes: { users: [] }, _myId: myId });
    }

    // Step 2: Fetch ALL messages (both sides) for each conversation thread
    const allMessages: any[] = [];
    const userMap: Record<string, any> = {};

    for (const convId of convIds) {
      try {
        // GET /2/dm_conversations/:id/dm_events returns BOTH sent AND received messages
        const res = await fetch(
          `https://api.twitter.com/2/dm_conversations/${convId}/dm_events?event_types=MessageCreate&dm_event.fields=text,sender_id,created_at,dm_conversation_id&expansions=sender_id&user.fields=username,name,profile_image_url&max_results=50`,
          {
            headers: {
              Authorization: `Bearer ${process.env.X_BEARER_TOKEN || ''}`,
            },
          }
        );

        // Bearer token may not work for DMs; fallback to OAuth 1.0a via twitter-api-v2
        const raw = res.ok ? await res.json() : null;

        if (!raw || !res.ok) {
          // Fallback: use twitter-api-v2 client with OAuth 1.0a
          const convEvents = await (client.v2 as any).request(
            'GET',
            `dm_conversations/${convId}/dm_events`,
            {
              query: {
                event_types: 'MessageCreate',
                'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
                expansions: 'sender_id',
                'user.fields': 'username,name,profile_image_url',
                max_results: '50',
              },
            }
          );
          if (convEvents?.data) {
            convEvents.data.forEach((msg: any) => {
              allMessages.push({ ...msg, dm_conversation_id: convId });
            });
          }
          if (convEvents?.includes?.users) {
            convEvents.includes.users.forEach((u: any) => { userMap[u.id] = u; });
          }
        } else {
          if (raw?.data) {
            raw.data.forEach((msg: any) => {
              allMessages.push({ ...msg, dm_conversation_id: convId });
            });
          }
          if (raw?.includes?.users) {
            raw.includes.users.forEach((u: any) => { userMap[u.id] = u; });
          }
        }
      } catch (e: any) {
        console.warn(`Failed to fetch thread ${convId}:`, e?.message);
      }
    }

    return NextResponse.json({
      data: allMessages,
      includes: { users: Object.values(userMap) },
      _myId: myId,
    });

  } catch (error: any) {
    console.error("X API DMs Error:", error?.data ?? error?.message);
    const isAuthError = error.code === 401 || error.code === 403;
    if (isAuthError) {
      return NextResponse.json({
        data: [], includes: { users: [] },
        _warning: '⚠️ DM permissions missing. Ensure "Read and write and Direct message" is set in X Dev Portal.'
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
