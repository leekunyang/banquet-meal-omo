'use client';
import { createBrowserClient } from '@supabase/ssr';

/** Browser client (anon key only). Not used by the MVP screens; kept for future realtime features. */
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
