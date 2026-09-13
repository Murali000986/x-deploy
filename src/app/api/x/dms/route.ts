import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { XAccount } from '@/lib/models/XAccount';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const accounts = await XAccount.find({ appKey: { $exists: true } }).lean();

    if (accounts.length === 0) {
      return NextResponse.json({ data: [], includes: { users: [] }, _warning: 'No Twitter/X accounts connected.' });
    }

    const allMessages: any[] = [];
    const userMap: Record<string, any> = {};
    const seenMsgIds = new Set<string>();
    const myIds = new Set<string>();

    const promises = accounts.map(async (account) => {
      try {
        const client = new TwitterApi({
          appKey: account.appKey, appSecret: account.appSecret,
          accessToken: account.accessToken, accessSecret: account.accessSecret
        });

        const me = await client.v2.me();
        const myId = me.data.id;
        myIds.add(myId);
        userMap[myId] = {
          id: myId,
          name: me.data.name,
          username: me.data.username,
          profile_image_url: (me.data as any).profile_image_url ?? account.profileImageUrl,
        };

        // Helper to enrich a message
        const enrich = (msg: any, msgId: string, convId: string, createdAt: string) => {
          if (!seenMsgIds.has(msgId)) {
            allMessages.push({
              ...msg,
              id: msgId,
              created_at: new Date(Number(createdAt) || createdAt).toISOString(),
              dm_conversation_id: convId,
              botAccountId: account._id.toString(),
              botUsername: account.username,
              is_mine: msg.sender_id === myId
            });
            seenMsgIds.add(msgId);
          }
        };

        // v1.1 Try
        let v1Success = false;
        try {
          const v1Result = await client.v1.get('direct_messages/events/list.json', { count: 50 });
          const events: any[] = v1Result?.events ?? [];
          for (const ev of events) {
            const mc = ev.message_create;
            if (!mc?.sender_id || !mc?.target?.recipient_id) continue;
            const convId = [mc.sender_id, mc.target.recipient_id].sort().join('-');
            enrich({ text: mc.message_data?.text ?? '', sender_id: mc.sender_id, recipient_id: mc.target.recipient_id }, ev.id, convId, ev.created_timestamp);
          }
          v1Success = true;
        } catch (_) {}

        // v2 Fallback
        if (!v1Success) {
          try {
            const eventsRaw = await (client.v2 as any).get('dm_events', {
              'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
              'expansions': 'sender_id',
              'user.fields': 'username,name,profile_image_url',
              'max_results': '50',
            });
            (eventsRaw?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });
            for (const msg of eventsRaw?.data ?? []) enrich(msg, msg.id, msg.dm_conversation_id, msg.created_at);

            const convIds = [...new Set((eventsRaw?.data ?? []).map((e: any) => e.dm_conversation_id as string).filter(Boolean))];
            for (const convId of convIds) {
              try {
                const threadRaw = await (client.v2 as any).get(`dm_conversations/${convId}/dm_events`, {
                  'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
                  'expansions': 'sender_id', 'user.fields': 'username,name,profile_image_url', 'max_results': '50',
                });
                (threadRaw?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });
                for (const msg of threadRaw?.data ?? []) enrich(msg, msg.id, convId as string, msg.created_at);
              } catch (_) {}
            }
          } catch (_) {}
        }
      } catch (err: any) {
        console.warn(`Failed fetching DMs for ${account.username}:`, err.message);
      }
    });

    await Promise.allSettled(promises);

    // Collect all partner IDs
    const partnerIds = new Set<string>();
    allMessages.forEach(msg => {
      const parts = (msg.dm_conversation_id ?? '').split('-');
      parts.forEach((p: string) => { if (p && !myIds.has(p)) partnerIds.add(p); });
      if (msg.sender_id && !myIds.has(String(msg.sender_id))) partnerIds.add(String(msg.sender_id));
      if (msg.recipient_id && !myIds.has(String(msg.recipient_id))) partnerIds.add(String(msg.recipient_id));
    });

    if (partnerIds.size > 0 && accounts[0]) {
      try {
        const client = new TwitterApi({
          appKey: accounts[0].appKey, appSecret: accounts[0].appSecret,
          accessToken: accounts[0].accessToken, accessSecret: accounts[0].accessSecret
        });
        const usersRes = await client.v2.users([...partnerIds], { 'user.fields': ['username', 'name', 'profile_image_url'] as any });
        (usersRes.data ?? []).forEach((u: any) => { userMap[u.id] = u; });
      } catch (_) {}
    }

    allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return NextResponse.json({
      data: allMessages,
      includes: { users: Object.values(userMap) },
      _myIds: Array.from(myIds),
    });

  } catch (error: any) {
    return NextResponse.json({ _error: error.message || 'Server error', data: [], includes: { users: [] } });
  }
}
