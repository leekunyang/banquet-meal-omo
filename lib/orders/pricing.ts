// Pricing rules. The server is the source of truth (see place_order in
// supabase/migrations); this module mirrors it so the UI can preview totals
// and the demo data driver can compute them. All values are integer TWD.
import type { Fulfillment, PaymentMethod } from '@/types/domain';

/** Provisional rules from the architecture doc's open questions — confirm with the venue. */
export const PRICING_RULES = {
  deliveryFee: 180,
  freeShippingThreshold: 2000,
  /** Points can cover at most this percentage of the payable amount. */
  pointsCapPercent: 20,
  /** One point is earned per this many TWD paid. */
  twdPerPoint: 100,
} as const;

export const PAYMENT_HOLD_MINUTES: Record<PaymentMethod, number> = {
  card: 30,
  atm: 60 * 24 * 3,
  cvs: 60 * 24 * 3,
};

export interface QuoteLine {
  unitPrice: number;
  qty: number;
}

export interface QuoteInput {
  lines: QuoteLine[];
  fulfillment: Fulfillment;
  eventDiscount: number;
  pointsBalance: number;
  usePoints: boolean;
}

export interface Quote {
  subtotal: number;
  shippingFee: number;
  discount: number;
  pointsMax: number;
  pointsUsed: number;
  total: number;
  pointsEarned: number;
}

function assertInt(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer, got ${value}`);
  }
}

export function shippingFeeFor(fulfillment: Fulfillment, subtotal: number): number {
  if (fulfillment === 'pickup' || subtotal === 0) return 0;
  return subtotal >= PRICING_RULES.freeShippingThreshold ? 0 : PRICING_RULES.deliveryFee;
}

export function pointsEarnedFor(total: number): number {
  return Math.floor(total / PRICING_RULES.twdPerPoint);
}

export function computeQuote(input: QuoteInput): Quote {
  assertInt('eventDiscount', input.eventDiscount);
  assertInt('pointsBalance', input.pointsBalance);
  for (const line of input.lines) {
    assertInt('unitPrice', line.unitPrice);
    assertInt('qty', line.qty);
  }

  const subtotal = input.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const shippingFee = shippingFeeFor(input.fulfillment, subtotal);
  const discount = Math.min(input.eventDiscount, subtotal);
  const base = subtotal + shippingFee - discount;
  // Integer math only: floor(base * 20 / 100).
  const pointsMax = Math.min(input.pointsBalance, Math.floor((base * PRICING_RULES.pointsCapPercent) / 100));
  const pointsUsed = input.usePoints ? pointsMax : 0;
  const total = base - pointsUsed;

  return { subtotal, shippingFee, discount, pointsMax, pointsUsed, total, pointsEarned: pointsEarnedFor(total) };
}
