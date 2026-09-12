import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { generateOAuth1Header } from '@/lib/twitter';

export const dynamic = 'force-dynamic';

// Signed fetch helper using OAuth 1.0a
async function oauthFetch(url: string): Promise<any> {
  const auth = generateOAuth1Header('GET', url);
  const res = await fetch(url, { headers: { Authorization: auth } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(`HTTP ${res.status}`);
    err.code = res.status;
    err.data = body;
    throw err;
  }
  return res.json();
}

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

    // Step 1: Fetch DM events (sent by authenticates user) to get conversation IDs
    const step1Url = 'https://api.twitter.com/2/dm_events?event_types=MessageCreate&dm_event.fields=text,sender_id,created_at,dm_conversation_id&expansions=sender_id&user.fields=username,name,profile_image_url&max_results=50';
    const step1 = await oauthFetch(step1Url);
    const sentEvents: any[] = step1?.data ?? [];
    const userMap: Record<string, any> = {};
    (step1?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });

    const convIds = [...new Set(sentEvents.map((e: any) => e.dm_conversation_id).filter(Boolean))];

    if (convIds.length === 0) {
      // No sent messages — return empty
      return NextResponse.json({ data: [], includes: { users: [] }, _myId: myId });
    }

    // Step 2: For each conversation, fetch FULL thread (both sent + received)
    const allMessages: any[] = [];

    for (const convId of convIds) {
      try {
        const threadUrl = `https://api.twitter.com/2/dm_conversations/${convId}/dm_events?event_types=MessageCreate&dm_event.fields=text,sender_id,created_at,dm_conversation_id&expansions=sender_id&user.fields=username,name,profile_image_url&max_results=50`;
        const thread = await oauthFetch(threadUrl);
        (thread?.data ?? []).forEach((msg: any) => {
          allMessages.push({ ...msg, dm_conversation_id: convId });
        });
        (thread?.includes?.users ?? []).forEach((u: any) => { userMap[u.id] = u; });
      } catch (e: any) {
        console.warn(`Thread ${convId} failed:`, e?.data ?? e?.message);
        // Fallback: at least include the sent messages for this conv
        sentEvents
          .filter((e: any) => e.dm_conversation_id === convId)
          .forEach((msg: any) => allMessages.push(msg));
      }
    }

    // Sort by time ascending so oldest message is first
    allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return NextResponse.json({
      data: allMessages,
      includes: { users: Object.values(userMap) },
      _myId: myId,
    });

  } catch (error: any) {
    const code = error?.code ?? 500;
    const msg = error?.data?.detail ?? error?.data?.title ?? error?.message ?? 'Unknown error';
    console.error('DM GET error:', code, msg, error?.data);

    return NextResponse.json({
      data: [],
      includes: { users: [] },
      _error: `X API error ${code}: ${msg}`,
    });
  }
}
