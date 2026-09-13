import { NextResponse } from "next/server";
import { getActiveClient } from "@/lib/xClient";
import { TwitterApi } from "twitter-api-v2";
import { XAccount } from "@/lib/models/XAccount";
import { connectDB } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, userId, text, botAccountId } = await request.json();
    if (!text || (!username && !userId)) {
      return NextResponse.json({ error: "Missing recipient details or text" }, { status: 400 });
    }

    let client: TwitterApi;
    if (botAccountId) {
      await connectDB();
      const account = await XAccount.findById(botAccountId).lean();
      if (!account) return NextResponse.json({ error: "Bot account not found" }, { status: 404 });
      client = new TwitterApi({
        appKey: account.appKey, appSecret: account.appSecret,
        accessToken: account.accessToken, accessSecret: account.accessSecret
      });
    } else {
      client = await getActiveClient();
    }

    let recipientId = userId;
    if (!recipientId && username) {
      const cleanUsername = username.trim().replace(/^@/, '');
      const userResult = await client.v2.userByUsername(cleanUsername);
      if (!userResult.data?.id) {
        return NextResponse.json({ error: "User not found on X" }, { status: 404 });
      }
      recipientId = userResult.data.id;
    }

    await client.v2.sendDmToParticipant(recipientId, { text });
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("X API DM Error:", JSON.stringify(error?.data ?? error?.message));
    const title   = error?.data?.title ?? "";
    const detail  = error?.data?.detail ?? "";
    const errors  = error?.data?.errors?.map((e: any) => e.message).join("; ") ?? "";
    let msg = [title, detail, errors].filter(Boolean).join(" — ");
    if (!msg) msg = error?.message ?? "Failed to send DM";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
