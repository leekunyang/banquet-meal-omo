import 'server-only';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { CartLine } from '@/types/contracts';

export const CART_COOKIE = 'cart';
const schema = z.array(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), qty: z.number().int().min(1).max(99) })).max(30);

/** The cart lives in a cookie so guests can shop without signing in (US-3.1). */
export async function readCart(): Promise<CartLine[]> {
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]): Promise<void> {
  const clean = lines.filter((l) => l.qty > 0);
  const store = await cookies();
  if (clean.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, JSON.stringify(clean), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 14 });
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}
