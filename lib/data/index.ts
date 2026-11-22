import 'server-only';
import { dataMode } from '@/lib/env';
import { memoryRepo } from './memory';
import { supabaseRepo } from './supabase';
import type { Repo } from './repo';

export function getRepo(): Repo {
  return dataMode() === 'supabase' ? supabaseRepo : memoryRepo;
}

export type { Repo } from './repo';
