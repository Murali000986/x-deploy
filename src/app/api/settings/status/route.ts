import { NextResponse } from 'next/server';
import { generateOAuth1Header } from '@/lib/twitter';

export const dynamic = 'force-dynamic';

async function testBearerToken() {
  try {
    const res = await fetch('https://api.twitter.com/2/users/by/username/twitter?user.fields=id', {
      headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` }
    });
    const rateLimit = {
      limit: res.headers.get('x-rate-limit-limit'),
      remaining: res.headers.get('x-rate-limit-remaining'),
      reset: res.headers.get('x-rate-limit-reset'),
    };
    if (res.ok) return { ok: true, message: 'Connected', rateLimit };
    const body = await res.json().catch(() => ({}));
    return { ok: false, message: body?.detail || body?.errors?.[0]?.message || `HTTP ${res.status}`, rateLimit };
  } catch (e: any) {
    return { ok: false, message: e.message, rateLimit: null };
  }
}

async function testOAuth1() {
  try {
    const url = 'https://api.twitter.com/2/users/me';
    const authHeader = generateOAuth1Header('GET', url);
    const res = await fetch(url, { headers: { 'Authorization': authHeader } });
    const rateLimit = {
      limit: res.headers.get('x-rate-limit-limit'),
      remaining: res.headers.get('x-rate-limit-remaining'),
      reset: res.headers.get('x-rate-limit-reset'),
    };
    if (res.ok) {
      const body = await res.json();
      return { ok: true, message: 'Connected', botUsername: body?.data?.username, botName: body?.data?.name, rateLimit };
    }
    const body = await res.json().catch(() => ({}));
    return { ok: false, message: body?.detail || body?.errors?.[0]?.message || `HTTP ${res.status}`, rateLimit };
  } catch (e: any) {
    return { ok: false, message: e.message, rateLimit: null };
  }
}

export async function GET() {
  const [bearerResult, oauth1Result] = await Promise.all([testBearerToken(), testOAuth1()]);

  return NextResponse.json({
    bearer_token:  {
      set: !!process.env.X_BEARER_TOKEN,
      masked: process.env.X_BEARER_TOKEN ? `${process.env.X_BEARER_TOKEN.slice(0, 12)}…` : null,
      ok: bearerResult.ok,
      message: bearerResult.message,
      rateLimit: bearerResult.rateLimit,
    },
    api_key:       { set: !!process.env.X_API_KEY,        masked: process.env.X_API_KEY        ? `${process.env.X_API_KEY.slice(0, 8)}…`        : null },
    api_secret:    { set: !!process.env.X_API_SECRET,     masked: process.env.X_API_SECRET     ? `${process.env.X_API_SECRET.slice(0, 6)}…`     : null },
    access_token:  {
      set: !!process.env.X_ACCESS_TOKEN,
      masked: process.env.X_ACCESS_TOKEN ? `${process.env.X_ACCESS_TOKEN.slice(0, 10)}…` : null,
      ok: oauth1Result.ok,
      message: oauth1Result.message,
      botUsername: (oauth1Result as any).botUsername,
      botName: (oauth1Result as any).botName,
      rateLimit: oauth1Result.rateLimit,
    },
    access_secret: { set: !!process.env.X_ACCESS_SECRET,  masked: process.env.X_ACCESS_SECRET  ? `${process.env.X_ACCESS_SECRET.slice(0, 6)}…`  : null },
  });
}
