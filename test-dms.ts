import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
  console.log("Testing credentials...");
  
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });

  try {
    console.log("Checking me...");
    const me = await client.v2.me();
    console.log("Authenticated as:", me.data.username);

    console.log("Fetching DMs...");
    const dmEvents = await client.v2.listDmEvents({
      event_types: 'MessageCreate'
    });
    console.log("Success! Found", (dmEvents as any)._realData?.data?.length || 0, "DMs");
  } catch (error: any) {
    import('fs').then(fs => {
      fs.writeFileSync('error-dump.json', JSON.stringify({
        code: error.code,
        message: error.message,
        data: error.data
      }, null, 2));
    });
  }
}

test();
