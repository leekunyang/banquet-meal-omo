'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getRepo } from '@/lib/data';
import { readCart, writeCart } from '@/lib/cart/cookie';

export type CartActionState = { ok: boolean; message: string; at: number } | null;

const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const slug = slugSchema.safeParse(formData.get('slug'));
  if (!slug.success) return { ok: false, message: '找不到商品', at: Date.now() };
  const product = await getRepo().getProduct(slug.data);
  if (!product || !product.isActive) return { ok: false, message: '這項商品目前沒有販售', at: Date.now() };

  const cart = await readCart();
  const current = cart.find((l) => l.slug === slug.data)?.qty ?? 0;
  if (current + 1 > product.available) {
    return { ok: false, message: `${product.name}目前只剩 ${product.available} 份，已全部放進購物車`, at: Date.now() };
  }
  const next = current > 0 ? cart.map((l) => (l.slug === slug.data ? { ...l, qty: l.qty + 1 } : l)) : [...cart, { slug: slug.data, qty: 1 }];
  await writeCart(next);
  revalidatePath('/', 'layout');
  return { ok: true, message: `已加入購物車（${current + 1} 份）`, at: Date.now() };
}

export async function setCartQty(formData: FormData): Promise<void> {
  const slug = slugSchema.safeParse(formData.get('slug'));
  const qty = z.coerce.number().int().min(0).max(99).safeParse(formData.get('qty'));
  if (!slug.success || !qty.success) return;
  const product = await getRepo().getProduct(slug.data);
  const capped = product ? Math.min(qty.data, product.available) : 0;
  const cart = await readCart();
  await writeCart(cart.map((l) => (l.slug === slug.data ? { ...l, qty: capped } : l)));
  revalidatePath('/', 'layout');
}
