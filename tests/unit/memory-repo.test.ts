import { beforeEach, describe, expect, it } from 'vitest';
import { memoryRepo, resetMemoryStore } from '@/lib/data/memory';
import { DEMO_MEMBERS, STORE_ID } from '@/lib/data/seed';
import type { CreateOrderInput } from '@/types/contracts';

const shopper = DEMO_MEMBERS[0]!;
const staff = DEMO_MEMBERS[1]!;
const address = { recipient: '陳小美', city: '新北市', district: '新莊區', line: '中正路 1 號' };
const order = (over: Partial<CreateOrderInput> = {}): CreateOrderInput => ({
  memberId: shopper.id,
  lines: [{ slug: 'dong-po-rou', qty: 1 }],
  channel: 'online',
  eventId: null,
  fulfillment: 'delivery',
  usePoints: false,
  paymentMethod: 'card',
  shippingAddress: address,
  ...over,
});

beforeEach(() => resetMemoryStore());

describe('demo data driver mirrors the database functions', () => {
  it('does not oversell the last portion (US-4.1)', async () => {
    const first = await memoryRepo.placeOrder(order());
    const second = await memoryRepo.placeOrder(order());
    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, code: 'OUT_OF_STOCK', remaining: 0 });
  });

  it('records channel qr and applies the event discount (US-5.1, US-5.2)', async () => {
    const res = await memoryRepo.placeOrder(order({ eventId: 'ajie-xiaowen', channel: 'qr' }));
    expect(res.ok && res.order).toMatchObject({ channel: 'qr', discount: 100, total: 520 + 180 - 100 });
  });

  it('ignores an expired event discount but still sells (US-5.3)', async () => {
    const res = await memoryRepo.placeOrder(order({ eventId: 'zhihao-yijun' }));
    expect(res.ok && res.order.discount).toBe(0);
  });

  it('requires an address for delivery (US-3.3)', async () => {
    expect(await memoryRepo.placeOrder(order({ shippingAddress: null }))).toMatchObject({ ok: false, code: 'ADDRESS_REQUIRED' });
  });

  it('processes a payment notification once, then reports duplicates (US-3.5)', async () => {
    const res = await memoryRepo.placeOrder(order({ lines: [{ slug: 'fo-tiao-qiang', qty: 2 }], fulfillment: 'pickup', shippingAddress: null }));
    if (!res.ok) throw new Error(res.message);
    const n = { merchantTradeNo: res.order.number, tradeAmount: res.order.total, success: true, raw: {} };
    const a = await memoryRepo.commitPayment(n);
    const b = await memoryRepo.commitPayment(n);
    expect(a).toMatchObject({ ok: true, alreadyProcessed: false });
    expect(b).toMatchObject({ ok: true, alreadyProcessed: true });
    const product = await memoryRepo.getProduct('fo-tiao-qiang');
    expect(product?.availableByLocation[STORE_ID]).toBe(2);
  });

  it('rejects a notification whose amount differs from the order', async () => {
    const res = await memoryRepo.placeOrder(order());
    if (!res.ok) throw new Error(res.message);
    expect(await memoryRepo.commitPayment({ merchantTradeNo: res.order.number, tradeAmount: 1, success: true, raw: {} })).toMatchObject({ ok: false, reason: 'AMOUNT_MISMATCH' });
  });

  it('releases expired holds and refunds points (US-3.6)', async () => {
    const res = await memoryRepo.placeOrder(order({ lines: [{ slug: 'fo-tiao-qiang', qty: 1 }], usePoints: true }));
    if (!res.ok) throw new Error(res.message);
    expect((await memoryRepo.getMember(shopper.id))?.points).toBe(120 - res.order.pointsUsed);
    const later = new Date(Date.now() + 31 * 60_000);
    expect(await memoryRepo.releaseExpired(later)).toBe(1);
    expect((await memoryRepo.getOrder(res.order.id))?.status).toBe('cancelled');
    expect((await memoryRepo.getMember(shopper.id))?.points).toBe(120);
  });

  it('redeems a pickup once and reports a second scan (US-6.2, US-6.3)', async () => {
    const res = await memoryRepo.placeOrder(order({ lines: [{ slug: 'yu-chi-geng', qty: 1 }], fulfillment: 'pickup', shippingAddress: null }));
    if (!res.ok) throw new Error(res.message);
    const paid = await memoryRepo.commitPayment({ merchantTradeNo: res.order.number, tradeAmount: res.order.total, success: true, raw: {} });
    if (!paid.ok) throw new Error('commit failed');
    const token = paid.order.pickupToken!;
    expect((await memoryRepo.redeemPickup(token, STORE_ID, staff.id)).status).toBe('ok');
    expect((await memoryRepo.redeemPickup(token, STORE_ID, staff.id)).status).toBe('already');
    expect((await memoryRepo.redeemPickup('000000', STORE_ID, staff.id)).status).toBe('not_found');
  });

  it('POS sale deducts store stock and credits points to the shared wallet (US-6.4, US-7.1)', async () => {
    const res = await memoryRepo.posSale([{ slug: 'hong-xun-mi-gao', qty: 2 }], STORE_ID, shopper.phone, staff.id);
    expect(res.ok).toBe(true);
    expect((await memoryRepo.getProduct('hong-xun-mi-gao'))?.availableByLocation[STORE_ID]).toBe(1);
    expect((await memoryRepo.getMember(shopper.id))?.points).toBe(120 + 17);
  });
});
