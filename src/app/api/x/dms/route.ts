import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;

    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
      return NextResponse.json({ data: [], includes: { users: [] }, _warning: 'X API credentials missing.' });
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

    // Fetch DM events using direct client request (more reliable than wrapper)
    const eventsRaw = await (client.v2 as any).get('dm_events', {
      'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
      'expansions': 'sender_id',
      'user.fields': 'username,name,profile_image_url',
      'max_results': '50',
    });

    const events: any[] = eventsRaw?.data ?? [];
    const userMap: Record<string, any> = {};
    (eventsRaw?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });

    // Get unique conversation IDs from events
    const convIds = [...new Set(events.map((e: any) => e.dm_conversation_id).filter(Boolean))];

    if (convIds.length === 0) {
      // No conversations found from sent messages — return what we have
      return NextResponse.json({ data: events, includes: { users: Object.values(userMap) }, _myId: myId });
    }

    // Fetch full threads (both sides) per conversation
    const allMessages: any[] = [];

    for (const convId of convIds) {
      try {
        const threadRaw = await (client.v2 as any).get(`dm_conversations/${convId}/dm_events`, {
          'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
          'expansions': 'sender_id',
          'user.fields': 'username,name,profile_image_url',
          'max_results': '50',
        });

        (threadRaw?.data ?? []).forEach((msg: any) => {
          allMessages.push({ ...msg, dm_conversation_id: convId });
        });
        (threadRaw?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });
      } catch (e: any) {
        console.warn(`Thread fetch failed for ${convId}:`, e?.message);
        // Fallback: include the original sent message at least
        events
          .filter((e: any) => e.dm_conversation_id === convId)
          .forEach((msg: any) => allMessages.push(msg));
      }
    }

    return NextResponse.json({
      data: allMessages,
      includes: { users: Object.values(userMap) },
      _myId: myId,
    });

  } catch (error: any) {
    console.error('DM fetch error:', error?.data ?? error?.message);
    const isAuth = error.code === 401 || error.code === 403;
    if (isAuth) {
      return NextResponse.json({
        data: [], includes: { users: [] },
        _warning: '⚠️ DM permissions missing. Set "Read and write and Direct message" in X Dev Portal and regenerate tokens.'
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
