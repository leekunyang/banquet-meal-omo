'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getRepo } from '@/lib/data';
import { requireRole } from '@/lib/auth/session';
import { STORE_ID } from '@/lib/data/seed';
import { normalizeTwPhone } from '@/lib/utils';
import type { CartLine } from '@/types/contracts';

/** Accepts the 6-digit code typed by staff or read by a barcode scanner (which types it too). */
const tokenSchema = z.string().trim().regex(/^\d{6}$/);

export async function lookupPickup(formData: FormData): Promise<void> {
  await requireRole(['staff', 'admin'], '/store');
  const token = tokenSchema.safeParse(formData.get('code'));
  redirect(token.success ? `/store?code=${token.data}` : '/store?invalid=1');
}

export async function confirmPickup(formData: FormData): Promise<void> {
  const staff = await requireRole(['staff', 'admin'], '/store');
  const token = tokenSchema.safeParse(formData.get('code'));
  if (!token.success) redirect('/store?invalid=1');
  const res = await getRepo().redeemPickup(token.data, STORE_ID, staff.id);
  revalidatePath('/store');
  redirect(`/store?code=${token.data}&result=${res.status === 'ok' ? 'redeemed' : res.status}`);
}

export type PosState = { ok: true; number: string; total: number; points: number } | { ok: false; message: string } | null;

export async function posCheckout(_prev: PosState, formData: FormData): Promise<PosState> {
  const staff = await requireRole(['staff', 'admin'], '/store/pos');
  const lines: CartLine[] = [];
  for (const [k, v] of formData.entries()) {
    if (k.startsWith('qty:')) {
      const qty = Number.parseInt(String(v), 10);
      if (qty > 0) lines.push({ slug: k.slice(4), qty });
    }
  }
  const rawPhone = String(formData.get('phone') ?? '').trim();
  const phone = rawPhone ? normalizeTwPhone(rawPhone) : null;
  if (rawPhone && !phone) return { ok: false, message: '會員手機格式錯誤，請輸入 09 開頭 10 碼，或留空' };
  const res = await getRepo().posSale(lines, STORE_ID, phone, staff.id);
  if (!res.ok) return res;
  revalidatePath('/store/pos');
  return { ok: true, number: res.order.number, total: res.order.total, points: phone ? Math.floor(res.order.total / 100) : 0 };
}
