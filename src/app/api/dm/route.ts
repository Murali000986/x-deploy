import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";

export const dynamic = 'force-dynamic';

function makeClient() {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    throw new Error("X API credentials missing in environment");
  }
  return new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });
}

export async function POST(request: Request) {
  try {
    const { username, text } = await request.json();
    if (!username || !text) {
      return NextResponse.json({ error: "Missing username or text" }, { status: 400 });
    }

    const client = makeClient();
    const cleanUsername = username.trim().replace(/^@/, '');

    // 1. Resolve numeric ID
    const userResult = await client.v2.userByUsername(cleanUsername);
    if (!userResult.data?.id) {
      return NextResponse.json({ error: "User not found on X" }, { status: 404 });
    }
    const recipientId = userResult.data.id;

    // 2. Try v1.1 first (works on Basic tier and above, more widely supported)
    try {
      await (client.v1 as any).sendDm({
        recipient_id: recipientId,
        text,
      });
      return NextResponse.json({ success: true });
    } catch (v1err: any) {
      // v1.1 failed — try v2
      console.warn("v1.1 DM failed, trying v2:", v1err?.data ?? v1err?.message);
    }

    // 3. Fallback to v2
    await client.v2.sendDmToParticipant(recipientId, { text });
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("X API DM Error:", JSON.stringify(error?.data ?? error?.message));

    // Always show the real X API error — never swallow it
    const title = error?.data?.title ?? "";
    const detail = error?.data?.detail ?? "";
    const errors = error?.data?.errors?.map((e: any) => e.message).join("; ") ?? "";

    let msg = [title, detail, errors].filter(Boolean).join(" — ");
    if (!msg) msg = error?.message ?? "Failed to send DM";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

