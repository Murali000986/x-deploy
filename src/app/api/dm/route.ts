import { NextResponse } from "next/server";
import { getActiveClient } from "@/lib/xClient";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, userId, text } = await request.json();
    if (!text || (!username && !userId)) {
      return NextResponse.json({ error: "Missing recipient details or text" }, { status: 400 });
    }

    const client = await getActiveClient();

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
