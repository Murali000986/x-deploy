import { TwitterApi } from 'twitter-api-v2';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });

  try {
    const user = await client.v2.userByUsername('gokuikuw');
    console.log("Found user:", user.data);

    const res = await client.v2.sendDmToParticipant(user.data.id, { text: "Test from diagnostic script" });
    console.log("Send DM response:", JSON.stringify(res, null, 2));
  } catch (error: any) {
    console.error("Error:", JSON.stringify(error?.data ?? error?.message ?? error, null, 2));
  }
}

run();
