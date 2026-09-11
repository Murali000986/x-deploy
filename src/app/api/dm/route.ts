import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, text } = await request.json();

    if (!username || !text) {
      return NextResponse.json({ error: "Missing username or text" }, { status: 400 });
    }

    const {
      X_API_KEY,
      X_API_SECRET,
      X_ACCESS_TOKEN,
      X_ACCESS_SECRET,
    } = process.env;

    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
      return NextResponse.json({ error: "X API credentials missing in environment" }, { status: 500 });
    }

    // Initialize client for OAuth 1.0a User context (Required for DMs)
    const client = new TwitterApi({
      appKey: X_API_KEY,
      appSecret: X_API_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessSecret: X_ACCESS_SECRET,
    });

    // 1. Get the target user's numeric ID
    const cleanUsername = username.trim().replace(/^@/, '');
    const userResult = await client.v2.userByUsername(cleanUsername);

    if (!userResult.data || !userResult.data.id) {
      return NextResponse.json({ error: "User not found on X" }, { status: 404 });
    }

    const recipientId = userResult.data.id;

    // 2. Send the DM
    await client.v2.sendDmToParticipant(recipientId, {
      text: text,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("X API Error during DM:", error);
    
    // Extract a readable error message from the X API response if available
    const errorTitle = error?.data?.title;
    const errorDetail = error?.data?.detail;
    let errorMessage = error.message || "Failed to send DM via X API";
    
    if (errorTitle || errorDetail) {
      errorMessage = `${errorTitle || 'API Error'}: ${errorDetail || 'Unknown'}`;
    }
    
    // If it's a 403, specifically mention the necessary Developer Portal permissions
    if (error.code === 403 || (error.code === 401 && !errorTitle)) {
       errorMessage = "Permission Denied: Please ensure your App has 'Read and write and Direct message' permissions in the Developer Portal, and regenerate your tokens.";
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
