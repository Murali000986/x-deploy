import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;

    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
      return NextResponse.json({ error: 'X API credentials missing in environment' });
    }

    const client = new TwitterApi({
      appKey: X_API_KEY,
      appSecret: X_API_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessSecret: X_ACCESS_SECRET,
    });

    const debugOutput: any = {
      timestamp: new Date().toISOString(),
      v1_result: null,
      v2_events_result: null,
      v2_thread_result: null,
      v1_error: null,
      v2_events_error: null,
    };

    // 1. Try v1.1
    try {
      const v1Result = await client.v1.get('direct_messages/events/list.json', { count: 10 });
      debugOutput.v1_result = v1Result;
    } catch (e: any) {
      debugOutput.v1_error = e?.data ?? e?.message ?? String(e);
    }

    // 2. Try v2 dm_events
    let testConvId = null;
    try {
      const v2Result = await (client.v2 as any).get('dm_events', {
        'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
        'expansions': 'sender_id',
        'max_results': '10',
      });
      debugOutput.v2_events_result = v2Result;

      const events = v2Result?.data ?? [];
      testConvId = events.find((e: any) => e.dm_conversation_id)?.dm_conversation_id;
    } catch (e: any) {
      debugOutput.v2_events_error = e?.data ?? e?.message ?? String(e);
    }

    // 3. Try v2 thread if we found a convId
    if (testConvId) {
      try {
        const threadResult = await (client.v2 as any).get(`dm_conversations/${testConvId}/dm_events`, {
          'dm_event.fields': 'text,sender_id,created_at,dm_conversation_id',
          'max_results': '10',
        });
        debugOutput.v2_thread_result = threadResult;
      } catch (e: any) {
        debugOutput.v2_thread_error = e?.data ?? e?.message ?? String(e);
      }
    }

    return NextResponse.json(debugOutput);
  } catch (globalError: any) {
    return NextResponse.json({ global_error: globalError?.message ?? String(globalError) }, { status: 500 });
  }
}
