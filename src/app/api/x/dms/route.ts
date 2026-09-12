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

    const me = await client.v2.me();
    const myId = me.data.id;

    const allMessages: any[] = [];
    const userMap: Record<string, any> = {};
    const seenMsgIds = new Set<string>();

    // ATTEMPT 1: v1.1 API (Most reliable for fetching BOTH sent and received in one go)
    try {
      const v1Result = await client.v1.get('direct_messages/events/list.json', { count: 50 });
      const events: any[] = v1Result?.events ?? [];
      
      const userIdsToLookup = new Set<string>();
      events.forEach((ev: any) => {
        const mc = ev.message_create;
        if (mc?.sender_id) userIdsToLookup.add(mc.sender_id);
        if (mc?.target?.recipient_id) userIdsToLookup.add(mc.target.recipient_id);
      });
      userIdsToLookup.delete(myId);

      if (userIdsToLookup.size > 0) {
        try {
          const usersRes = await client.v2.users([...userIdsToLookup], {
            'user.fields': ['username', 'name', 'profile_image_url'] as any,
          });
          (usersRes.data ?? []).forEach((u: any) => { userMap[u.id] = u; });
        } catch (e) {
          console.warn("User lookup for v1.1 failed:", e);
        }
      }

      events.forEach((ev: any) => {
        const mc = ev.message_create;
        const senderId = mc?.sender_id;
        const recipientId = mc?.target?.recipient_id;
        if (!senderId || !recipientId) return;

        // convId = sorted pair so both directions share same key
        const convId = [senderId, recipientId].sort().join('-');
        const msgId = ev.id;
        if (!seenMsgIds.has(msgId)) {
          allMessages.push({
            id: msgId,
            text: mc?.message_data?.text ?? '',
            sender_id: senderId,
            recipient_id: recipientId,
            created_at: new Date(Number(ev.created_timestamp)).toISOString(),
            dm_conversation_id: convId,
          });
          seenMsgIds.add(msgId);
        }
      });
      console.log(`v1.1 fetch success. Loaded ${allMessages.length} messages.`);
    } catch (v1Error: any) {
      console.warn("v1.1 API failed, falling back to v2:", v1Error?.data ?? v1Error?.message);

      // ATTEMPT 2: v2 API
      const eventsRaw = await (client.v2 as any).get('dm_events', {
        'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
        'expansions': 'sender_id',
        'user.fields': 'username,name,profile_image_url',
        'max_results': '50',
      });

      const events: any[] = eventsRaw?.data ?? [];
      (eventsRaw?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });

      const convIds = [...new Set(events.map((e: any) => e.dm_conversation_id).filter(Boolean))];

      for (const convId of convIds) {
        try {
          // Attempt to fetch thread to get BOTH sent and received
          const threadRaw = await (client.v2 as any).get(`dm_conversations/${convId}/dm_events`, {
            'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
            'expansions': 'sender_id',
            'user.fields': 'username,name,profile_image_url',
            'max_results': '50',
          });

          (threadRaw?.data ?? []).forEach((msg: any) => {
            if (!seenMsgIds.has(msg.id)) {
              allMessages.push({ ...msg, dm_conversation_id: convId });
              seenMsgIds.add(msg.id);
            }
          });
          (threadRaw?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });
        } catch (threadError: any) {
          console.warn(`Thread fetch failed for ${convId}:`, threadError?.message);
          // Only fallback to sent messages if thread fetch fails
          events
            .filter((e: any) => e.dm_conversation_id === convId)
            .forEach((msg: any) => {
               if (!seenMsgIds.has(msg.id)) {
                 allMessages.push(msg);
                 seenMsgIds.add(msg.id);
               }
            });
        }
      }
    }

    // Always ensure my details are in the map so UI can render my avatar
    userMap[myId] = {
      id: myId,
      name: me.data.name,
      username: me.data.username,
      profile_image_url: (me.data as any).profile_image_url,
    };

    allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return NextResponse.json({
      data: allMessages,
      includes: { users: Object.values(userMap) },
      _myId: myId,
    });

  } catch (error: any) {
    const isAuth = error.code === 401 || error.code === 403;
    if (isAuth) {
      return NextResponse.json({
        data: [], includes: { users: [] },
        _warning: '⚠️ DM permissions missing. Set "Read and write and Direct message" in X Dev Portal and regenerate tokens.'
      });
    }
    const msg = error?.data?.detail ?? error?.message ?? "Failed to fetch DM inbox";
    return NextResponse.json({ _error: msg, data: [], includes: { users: [] } });
  }
}
