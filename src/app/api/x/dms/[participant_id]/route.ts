import { NextResponse } from 'next/server';
import { generateOAuth1Header } from '@/lib/twitter';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ participant_id: string }> }
) {
  try {
    const { participant_id } = await params;
    const bodyText = await request.json(); 

    const url = `https://api.twitter.com/2/dm_conversations/with/${participant_id}/messages`;
    
    const authHeader = generateOAuth1Header('POST', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: bodyText.text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'Failed to send DM', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
