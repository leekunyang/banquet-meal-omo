import { NextResponse, type NextRequest } from 'next/server';
import { EVENT_COOKIE, EVENT_COOKIE_MAX_AGE } from '@/lib/events/rules';

/**
 * Domain rule 7: a session that enters through a banquet QR landing page
 * (/e/[eventId]) keeps the event id so the order records channel = 'qr'.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const match = req.nextUrl.pathname.match(/^\/e\/([a-z0-9-]{1,64})\/?$/);
  if (match?.[1]) {
    res.cookies.set(EVENT_COOKIE, match[1], { httpOnly: true, sameSite: 'lax', path: '/', maxAge: EVENT_COOKIE_MAX_AGE });
  }
  return res;
}

export const config = { matcher: ['/e/:path*'] };
