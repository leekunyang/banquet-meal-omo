'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { CreateOrderErrorCode } from '@/types/contracts';
import { getRepo } from '@/lib/data';
import { getSession } from '@/lib/auth/session';
import { readCart, writeCart } from '@/lib/cart/cookie';
import { EVENT_COOKIE } from '@/lib/events/rules';

export type CheckoutState = { error: string; code?: CreateOrderErrorCode | 'AUTH' | 'INVALID'; slug?: string } | null;

const schema = z
  .object({
    fulfillment: z.enum(['delivery', 'pickup']),
    paymentMethod: z.enum(['card', 'atm', 'cvs']),
    usePoints: z.enum(['on']).optional(),
    recipient: z.string().trim().max(40).optional(),
    city: z.string().trim().max(10).optional(),
    district: z.string().trim().max(10).optional(),
    line: z.string().trim().max(120).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment === 'delivery') {
      if (!v.recipient) ctx.addIssue({ code: 'custom', path: ['recipient'], message: '請填寫收件人' });
      if (!v.line) ctx.addIssue({ code: 'custom', path: ['line'], message: '請填寫收件地址' });
    }
  });

/**
 * createOrder (contract in types/contracts.ts). Prices, discounts and points
 * are recomputed on the server — nothing from the form is trusted (rule 3).
 */
export async function createOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const member = await getSession();
  if (!member) return { error: '請先完成手機驗證', code: 'AUTH' };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '資料格式錯誤', code: 'INVALID' };
  const v = parsed.data;

  const lines = await readCart();
  const eventId = (await cookies()).get(EVENT_COOKIE)?.value ?? null;
  const result = await getRepo().placeOrder({
    memberId: member.id,
    lines,
    channel: eventId ? 'qr' : 'online',
    eventId,
    fulfillment: v.fulfillment,
    usePoints: v.usePoints === 'on',
    paymentMethod: v.paymentMethod,
    shippingAddress:
      v.fulfillment === 'delivery' ? { recipient: v.recipient!, city: v.city ?? '', district: v.district ?? '', line: v.line! } : null,
  });

  if (!result.ok) return { error: result.message, code: result.code, slug: result.slug };
  await writeCart([]);
  redirect(`/checkout/pay?order=${result.order.id}`);
}
