import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Show all Mongo-related env vars without exposing full secrets
  const keys = Object.keys(process.env).filter(k =>
    k.toLowerCase().includes('mongo') || k.toLowerCase().includes('database')
  );
  const result: Record<string, string> = {};
  for (const k of keys) {
    const v = process.env[k] || '';
    result[k] = v.length > 20 ? v.slice(0, 20) + '...' : v;
  }
  return NextResponse.json({ mongoEnvVars: result, total: keys.length });
}
