import type { BanquetEvent } from '@/types/domain';

export const EVENT_COOKIE = 'event_id';
/** The landing cookie lives as long as the longest coupon window. */
export const EVENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const EVENT_VALID_DAYS = 7;

export function isEventActive(event: BanquetEvent, now: Date = new Date()): boolean {
  return now.getTime() <= new Date(event.validUntil).getTime();
}

/** Discount to apply at checkout: zero for a missing or expired event. */
export function eventDiscount(event: BanquetEvent | null, now: Date = new Date()): number {
  return event && isEventActive(event, now) ? event.discountAmount : 0;
}

/** Coupon runs from the banquet day until 23:59:59 Taipei time, EVENT_VALID_DAYS later. */
export function defaultValidUntil(eventDate: string): string {
  const [y, m, d] = eventDate.split('-').map(Number) as [number, number, number];
  // 23:59:59 in UTC+8 is 15:59:59Z.
  return new Date(Date.UTC(y, m - 1, d + EVENT_VALID_DAYS, 15, 59, 59)).toISOString();
}
