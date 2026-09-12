import { TwitterApi } from 'twitter-api-v2';
import { connectDB } from './db';
import { XAccount } from './models/XAccount';

function envClient() {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    throw new Error('X API credentials missing in environment');
  }
  return new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });
}

/** Returns a fully-authenticated TwitterApi client for the currently active account. Falls back to .env */
export async function getActiveClient(): Promise<TwitterApi> {
  try {
    await connectDB();
    const account = await XAccount.findOne({ isActive: true }).lean();
    if (account) {
      return new TwitterApi({
        appKey: process.env.X_API_KEY!,
        appSecret: process.env.X_API_SECRET!,
        accessToken: account.accessToken,
        accessSecret: account.accessSecret,
      });
    }
  } catch (_) {
    // DB unavailable — fall back to .env
  }
  return envClient();
}

/** Returns only the App-level (consumer) client — for OAuth handshake steps */
export function getAppClient(): TwitterApi {
  const { X_API_KEY, X_API_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET) throw new Error('X_API_KEY / X_API_SECRET missing');
  return new TwitterApi({ appKey: X_API_KEY, appSecret: X_API_SECRET });
}
