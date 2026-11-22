// Cross-domain contracts between package A (transactions & inventory) and
// package B (members & on-site OMO). Change only with the architect's review.
import type { Channel, Fulfillment, Order, PaymentMethod, ShippingAddress } from './domain';

export interface CartLine {
  slug: string;
  qty: number;
}

export interface CreateOrderInput {
  memberId: string;
  lines: CartLine[];
  channel: Channel;
  eventId: string | null;
  fulfillment: Fulfillment;
  usePoints: boolean;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress | null;
}

export type CreateOrderErrorCode =
  | 'EMPTY_CART'
  | 'OUT_OF_STOCK'
  | 'PRODUCT_UNAVAILABLE'
  | 'ADDRESS_REQUIRED'
  | 'POINTS_EXCEEDED';

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; code: CreateOrderErrorCode; message: string; slug?: string; remaining?: number };

export interface PaymentNotification {
  merchantTradeNo: string;
  tradeAmount: number;
  success: boolean;
  raw: Record<string, string>;
}

export type CommitResult =
  | { ok: true; order: Order; alreadyProcessed: boolean }
  | { ok: false; reason: 'NOT_FOUND' | 'AMOUNT_MISMATCH' | 'NOT_PENDING' };

export type RedeemResult =
  | { status: 'ok'; order: Order }
  | { status: 'already'; order: Order }
  | { status: 'not_ready'; order: Order }
  | { status: 'not_found' };
