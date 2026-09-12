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

    // v1.1 returns BOTH sent and received DMs in one call
    const v1Result = await client.v1.get('direct_messages/events/list.json', { count: 50 });
    const events: any[] = v1Result?.events ?? [];

    // Collect unique user IDs to look up
    const userIds = new Set<string>();
    events.forEach((ev: any) => {
      const mc = ev.message_create;
      if (mc?.sender_id) userIds.add(mc.sender_id);
      if (mc?.target?.recipient_id) userIds.add(mc.target.recipient_id);
    });
    userIds.delete(myId); // we know ourselves

    // Lookup user info for all participants
    const userMap: Record<string, any> = {};
    if (userIds.size > 0) {
      try {
        const usersRes = await client.v2.users([...userIds], {
          'user.fields': ['username', 'name', 'profile_image_url'] as any,
        });
        (usersRes.data ?? []).forEach((u: any) => { userMap[u.id] = u; });
      } catch (e) {
        console.warn('User lookup failed:', e);
      }
    }

    // Transform v1.1 events to our internal format
    const messages = events.map((ev: any) => {
      const mc = ev.message_create;
      const senderId = mc?.sender_id;
      const recipientId = mc?.target?.recipient_id;
      // Conversation ID = sorted pair of user IDs (consistent regardless of direction)
      const convId = [senderId, recipientId].sort().join('-');
      return {
        id: ev.id,
        sender_id: senderId,
        text: mc?.message_data?.text ?? '',
        created_at: new Date(Number(ev.created_timestamp)).toISOString(),
        dm_conversation_id: convId,
      };
    });

    return NextResponse.json({
      data: messages,
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
