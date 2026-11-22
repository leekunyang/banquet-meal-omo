'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getRepo } from '@/lib/data';
import { requireRole } from '@/lib/auth/session';
import { splitList } from '@/lib/products/label';
import { defaultValidUntil } from '@/lib/events/rules';
import type { OrderStatus } from '@/types/domain';

export type FormState = { ok: boolean; message: string } | null;

const optionalInt = z.preprocess((v) => (v === '' || v === null ? null : Number(v)), z.number().int().positive().nullable());

const productSchema = z.object({
  name: z.string().trim().min(1, '請填寫商品名稱').max(40),
  price: z.coerce.number().int('售價必須是整數').min(0),
  servings: z.string().trim().max(20),
  category: z.string().trim().max(10),
  description: z.string().trim().max(300),
  ingredients: z.string(),
  allergens: z.string(),
  netWeightG: optionalInt,
  storage: z.string().trim().max(60),
  shelfLifeDays: optionalInt,
  heating: z.string(),
});

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(['admin'], '/admin/products');
  const slug = String(formData.get('slug') ?? '');
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? '資料格式錯誤' };
  const v = parsed.data;
  const product = await getRepo().updateProduct(slug, {
    name: v.name,
    price: v.price,
    servings: v.servings,
    category: v.category,
    description: v.description,
    ingredients: splitList(v.ingredients),
    allergens: splitList(v.allergens),
    netWeightG: v.netWeightG,
    storage: v.storage,
    shelfLifeDays: v.shelfLifeDays,
    heating: v.heating.split('\n').map((s) => s.trim()).filter(Boolean),
  });
  if (formData.get('intent') === 'publish') {
    const res = await getRepo().setProductActive(slug, true);
    revalidatePath('/', 'layout');
    return res.ok ? { ok: true, message: '已上架，商品頁已更新' } : { ok: false, message: res.message ?? '無法上架' };
  }
  revalidatePath('/', 'layout');
  return { ok: true, message: product.status === 'ready' ? '已儲存，可以上架' : '已儲存草稿' };
}

export async function unpublishProduct(formData: FormData): Promise<void> {
  await requireRole(['admin'], '/admin/products');
  await getRepo().setProductActive(String(formData.get('slug') ?? ''), false);
  revalidatePath('/', 'layout');
}

const adjustSchema = z.object({
  lotId: z.string().min(1),
  delta: z.coerce.number().int('請輸入整數').refine((n) => n !== 0, '數量不可為 0'),
  reason: z.string().trim().min(1, '請選擇調整原因'),
});

export async function adjustStock(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole(['admin'], '/admin/inventory');
  const parsed = adjustSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? '資料格式錯誤' };
  const res = await getRepo().adjustStock(parsed.data.lotId, parsed.data.delta, parsed.data.reason, admin.id);
  revalidatePath('/', 'layout');
  return res.ok ? { ok: true, message: '已調整並留下紀錄' } : { ok: false, message: res.message ?? '調整失敗' };
}

export async function advanceOrder(formData: FormData): Promise<void> {
  await requireRole(['admin'], '/admin/orders');
  await getRepo().advanceOrder(String(formData.get('orderId') ?? ''), String(formData.get('to') ?? '') as OrderStatus);
  revalidatePath('/admin/orders');
}

const eventSchema = z.object({
  coupleName: z.string().trim().min(1, '請填寫新人名字').max(30),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請選擇宴席日期'),
  discountAmount: z.coerce.number().int('優惠金額必須是整數').min(0).max(5000),
  venue: z.string().trim().max(40).default('[會館名稱]'),
});

export async function createEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(['admin'], '/admin/events');
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? '資料格式錯誤' };
  const products = await getRepo().listProducts();
  const event = await getRepo().createEvent({
    venue: parsed.data.venue || '[會館名稱]',
    coupleName: parsed.data.coupleName,
    eventDate: parsed.data.eventDate,
    discountAmount: parsed.data.discountAmount,
    validUntil: defaultValidUntil(parsed.data.eventDate),
    featuredSlugs: products.map((p) => p.slug),
  });
  revalidatePath('/admin/events');
  redirect(`/admin/events/${event.id}/card`);
}
