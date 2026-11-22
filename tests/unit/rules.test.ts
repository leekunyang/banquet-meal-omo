import { describe, expect, it } from 'vitest';
import { isLabelComplete, missingLabelFields, splitList } from '@/lib/products/label';
import { defaultValidUntil, eventDiscount, isEventActive } from '@/lib/events/rules';
import { maskPhone, normalizeTwPhone } from '@/lib/utils';
import { SEED_PRODUCTS } from '@/lib/data/seed';
import type { BanquetEvent } from '@/types/domain';

describe('food label (US-2.3, domain rule 6)', () => {
  it('a complete product passes', () => {
    expect(isLabelComplete(SEED_PRODUCTS[0]!)).toBe(true);
  });
  it('lists every missing field', () => {
    expect(missingLabelFields(SEED_PRODUCTS[4]!)).toEqual(['netWeightG', 'storage', 'shelfLifeDays']);
  });
  it('splits Chinese and Latin separators', () => {
    expect(splitList('糯米、紅蟳, 香菇，蝦米\n')).toEqual(['糯米', '紅蟳', '香菇', '蝦米']);
  });
});

describe('banquet coupon window (US-5.2, US-5.3)', () => {
  const event: BanquetEvent = { id: 'x', venue: 'v', coupleName: 'c', eventDate: '2026-11-14', discountAmount: 100, validUntil: defaultValidUntil('2026-11-14'), featuredSlugs: [] };
  it('runs until 23:59:59 Taipei time seven days after the banquet', () => {
    expect(event.validUntil).toBe('2026-11-21T15:59:59.000Z');
  });
  it('is active one second before the end and expired one second after', () => {
    expect(isEventActive(event, new Date('2026-11-21T15:59:58Z'))).toBe(true);
    expect(isEventActive(event, new Date('2026-11-21T16:00:00Z'))).toBe(false);
  });
  it('an expired or missing event gives no discount but never blocks buying', () => {
    expect(eventDiscount(event, new Date('2026-12-01T00:00:00Z'))).toBe(0);
    expect(eventDiscount(null)).toBe(0);
  });
});

describe('phone numbers (US-1.1, domain rule 8)', () => {
  it('normalizes common formats', () => {
    expect(normalizeTwPhone('0912 345 678')).toBe('0912345678');
    expect(normalizeTwPhone('+886-912-345-678')).toBe('0912345678');
    expect(normalizeTwPhone('02 1234 5678')).toBeNull();
  });
  it('masks phones for display and logs', () => {
    expect(maskPhone('0912345678')).toBe('0912-***-678');
  });
});
