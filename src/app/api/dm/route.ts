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
    const { username, userId, text } = await request.json();
    if (!text || (!username && !userId)) {
      return NextResponse.json({ error: "Missing recipient details or text" }, { status: 400 });
    }

    const client = makeClient();
    
    let recipientId = userId;

    if (!recipientId && username) {
      // 1. Resolve numeric ID if only username was provided
      const cleanUsername = username.trim().replace(/^@/, '');
      const userResult = await client.v2.userByUsername(cleanUsername);
      if (!userResult.data?.id) {
        return NextResponse.json({ error: "User not found on X" }, { status: 404 });
      }
      recipientId = userResult.data.id;
    }

    // 2. Use v2 exclusively for sending (v1.1 silently drops messages on some tiere)
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

