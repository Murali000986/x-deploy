import { NextResponse } from 'next/server';
import { getActiveClient } from '@/lib/xClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;

    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
      return NextResponse.json({ data: [], includes: { users: [] }, _warning: 'X API credentials missing.' });
    }

    const client = await getActiveClient();

    const me = await client.v2.me();
    const myId = me.data.id;

    const allMessages: any[] = [];
    const userMap: Record<string, any> = {};
    const seenMsgIds = new Set<string>();

    // ATTEMPT 1: v1.1 API (returns BOTH sent AND received)
    let v1Success = false;
    try {
      const v1Result = await client.v1.get('direct_messages/events/list.json', { count: 50 });
      const events: any[] = v1Result?.events ?? [];

      events.forEach((ev: any) => {
        const mc = ev.message_create;
        const senderId = mc?.sender_id;
        const recipientId = mc?.target?.recipient_id;
        if (!senderId || !recipientId) return;
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
      v1Success = true;
      console.log(`v1.1 success: ${allMessages.length} messages`);
    } catch (v1Error: any) {
      console.warn('v1.1 failed, using v2:', v1Error?.data?.title ?? v1Error?.message);
    }

    // ATTEMPT 2: v2 fallback
    if (!v1Success) {
      try {
        const eventsRaw = await (client.v2 as any).get('dm_events', {
          'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
          'expansions': 'sender_id',
          'user.fields': 'username,name,profile_image_url',
          'max_results': '50',
        });
        const events: any[] = eventsRaw?.data ?? [];
        (eventsRaw?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });

        for (const msg of events) {
          if (!seenMsgIds.has(msg.id)) {
            allMessages.push(msg);
            seenMsgIds.add(msg.id);
          }
        }

        const convIds = [...new Set(events.map((e: any) => e.dm_conversation_id).filter(Boolean))];
        for (const convId of convIds) {
          try {
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
          } catch (_) {}
        }
      } catch (v2Error: any) {
        console.error('v2 also failed:', v2Error?.message);
      }
    }

    // Collect all unique partner IDs and bulk-fetch profiles
    const partnerIds = new Set<string>();
    allMessages.forEach(msg => {
      const parts = (msg.dm_conversation_id ?? '').split('-');
      parts.forEach((p: string) => { if (p && p !== myId) partnerIds.add(p); });
      if (msg.sender_id && msg.sender_id !== myId) partnerIds.add(msg.sender_id);
      if (msg.recipient_id && msg.recipient_id !== myId) partnerIds.add(msg.recipient_id);
    });

    if (partnerIds.size > 0) {
      try {
        const usersRes = await client.v2.users([...partnerIds], {
          'user.fields': ['username', 'name', 'profile_image_url'] as any,
        });
        (usersRes.data ?? []).forEach((u: any) => { userMap[u.id] = u; });
      } catch (e: any) {
        console.warn('Partner user lookup failed:', e?.message);
      }
    }

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
    const msg = error?.data?.detail ?? error?.message ?? 'Failed to fetch DM inbox';
    return NextResponse.json({ _error: msg, data: [], includes: { users: [] } });
  }
}
