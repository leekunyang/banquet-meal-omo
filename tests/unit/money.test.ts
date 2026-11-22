import { describe, expect, it } from 'vitest';
import { computeQuote } from '@/lib/orders/pricing';
import { formatTWD } from '@/lib/utils';

const base = { eventDiscount: 0, pointsBalance: 0, usePoints: false } as const;

describe('computeQuote (US-3.2, US-7.2)', () => {
  it('adds the NT$180 delivery fee below NT$2,000', () => {
    const q = computeQuote({ ...base, lines: [{ unitPrice: 880, qty: 1 }], fulfillment: 'delivery' });
    expect(q).toMatchObject({ subtotal: 880, shippingFee: 180, total: 1060 });
  });

  it('ships free at exactly NT$2,000 (boundary)', () => {
    const q = computeQuote({ ...base, lines: [{ unitPrice: 1000, qty: 2 }], fulfillment: 'delivery' });
    expect(q.shippingFee).toBe(0);
  });

  it('pickup never pays shipping', () => {
    expect(computeQuote({ ...base, lines: [{ unitPrice: 520, qty: 1 }], fulfillment: 'pickup' }).shippingFee).toBe(0);
  });

  it('event discount never exceeds the subtotal', () => {
    const q = computeQuote({ ...base, eventDiscount: 500, lines: [{ unitPrice: 300, qty: 1 }], fulfillment: 'pickup' });
    expect(q.discount).toBe(300);
    expect(q.total).toBe(0);
  });

  it('points are capped at 20% of the payable amount and the balance (integer floor)', () => {
    const q = computeQuote({ eventDiscount: 100, pointsBalance: 9999, usePoints: true, lines: [{ unitPrice: 1280, qty: 1 }], fulfillment: 'delivery' });
    // base = 1280 + 180 - 100 = 1360; 20% = 272
    expect(q.pointsUsed).toBe(272);
    expect(q.total).toBe(1088);
    expect(Number.isInteger(q.total)).toBe(true);
  });

  it('uses only the remaining balance when it is below the cap', () => {
    const q = computeQuote({ eventDiscount: 0, pointsBalance: 47, usePoints: true, lines: [{ unitPrice: 1280, qty: 1 }], fulfillment: 'pickup' });
    expect(q.pointsUsed).toBe(47);
  });

  it('total is never negative', () => {
    const q = computeQuote({ eventDiscount: 100, pointsBalance: 100, usePoints: true, lines: [{ unitPrice: 50, qty: 1 }], fulfillment: 'pickup' });
    expect(q.total).toBeGreaterThanOrEqual(0);
  });

  it('earns 1 point per NT$100 paid', () => {
    expect(computeQuote({ ...base, lines: [{ unitPrice: 1299, qty: 1 }], fulfillment: 'pickup' }).pointsEarned).toBe(12);
  });

  it('rejects non-integer prices so float money never slips in', () => {
    expect(() => computeQuote({ ...base, lines: [{ unitPrice: 99.5, qty: 1 }], fulfillment: 'pickup' })).toThrow();
  });
});

describe('formatTWD', () => {
  it('formats integers with thousands separators', () => {
    expect(formatTWD(1280)).toBe('NT$1,280');
    expect(formatTWD(0)).toBe('NT$0');
  });
  it('throws on floats', () => {
    expect(() => formatTWD(10.5)).toThrow();
  });
});
