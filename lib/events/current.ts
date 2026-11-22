import 'server-only';
import { cookies } from 'next/headers';
import type { BanquetEvent } from '@/types/domain';
import { getRepo } from '@/lib/data';
import { EVENT_COOKIE } from './rules';

/** The banquet the shopper arrived from (set by middleware on /e/[eventId]), if any. */
export async function getCurrentEvent(): Promise<BanquetEvent | null> {
  const id = (await cookies()).get(EVENT_COOKIE)?.value;
  return id ? getRepo().getEvent(id) : null;
}
