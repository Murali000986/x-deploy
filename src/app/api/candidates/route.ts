import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/lib/models/candidate';

export const dynamic = 'force-dynamic';

// GET all candidates
export async function GET() {
  await connectDB();
  const candidates = await Candidate.find().sort({ addedAt: -1 }).lean();
  return NextResponse.json(candidates);
}

// POST add a new candidate (or upsert by username)
export async function POST(request: Request) {
  const body = await request.json();
  const { username, name, description, profile_image_url, public_metrics } = body;

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  await connectDB();

  const existing = await Candidate.findOne({ username }).lean();
  if (existing) return NextResponse.json(existing);

  const now = new Date().toISOString();
  const newCandidate = await Candidate.create({
    id: `${Date.now()}`,
    username,
    name,
    description,
    profile_image_url,
    public_metrics,
    status: 'new',
    addedAt: now,
    lastActivity: now,
  });

  return NextResponse.json(newCandidate, { status: 201 });
}
