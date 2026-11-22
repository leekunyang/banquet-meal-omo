import { NextResponse } from 'next/server';
import { getRepo } from '@/lib/data';

/** US-3.6: cancel unpaid orders past their hold and release stock. Called by Vercel Cron. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const released = await getRepo().releaseExpired();
  return NextResponse.json({ released });
}
