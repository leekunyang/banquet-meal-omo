import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { Member, Role } from '@/types/domain';
import { dataMode } from '@/lib/env';
import { getRepo } from '@/lib/data';
import { createServerSupabase } from '@/lib/data/supabase/server';

export const DEMO_SESSION_COOKIE = 'demo_member';

/** The signed-in member for this request, or null. Cached per request. */
export const getSession = cache(async (): Promise<Member | null> => {
  if (dataMode() === 'memory') {
    const id = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
    return id ? getRepo().getMember(id) : null;
  }
  const sb = await createServerSupabase();
  const { data } = await sb.auth.getUser();
  return data.user ? getRepo().getMember(data.user.id) : null;
});

/** Redirects to the login page unless the member has one of the roles. */
export async function requireRole(roles: Role[], nextPath: string): Promise<Member> {
  const member = await getSession();
  if (!member) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!roles.includes(member.role)) redirect(`/login?next=${encodeURIComponent(nextPath)}&denied=1`);
  return member;
}
