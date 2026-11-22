import type { Metadata } from 'next';
import { getRepo } from '@/lib/data';
import { getSession } from '@/lib/auth/session';
import { readCart } from '@/lib/cart/cookie';
import { getCurrentEvent } from '@/lib/events/current';
import { eventDiscount } from '@/lib/events/rules';
import { isDemo } from '@/lib/env';
import { maskPhone } from '@/lib/utils';
import { STORE_ID, WAREHOUSE_ID } from '@/lib/data/seed';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { IconCheck } from '@/components/common/icons';
import { OtpForm } from '@/components/features/account/otp-form';
import { EventBanner } from '@/components/features/catalog/event-banner';
import { CheckoutForm, type CheckoutLine } from '@/components/features/checkout/checkout-form';

export const metadata: Metadata = { title: '結帳' };

export default async function CheckoutPage() {
  const [member, cart, products, event] = await Promise.all([getSession(), readCart(), getRepo().listProducts(), getCurrentEvent()]);
  const lines: CheckoutLine[] = cart.flatMap((l) => {
    const p = products.find((x) => x.slug === l.slug);
    return p
      ? [{ slug: p.slug, name: p.name, qty: l.qty, unitPrice: p.price, availableDelivery: p.availableByLocation[WAREHOUSE_ID] ?? 0, availablePickup: p.availableByLocation[STORE_ID] ?? 0 }]
      : [];
  });
  if (lines.length === 0) return <EmptyState title="購物車是空的" body="先挑選商品再結帳。" actionHref="/" actionLabel="回到首頁" />;

  return (
    <>
      <h1 className="text-xl font-bold">結帳</h1>
      {event ? <EventBanner event={event} /> : null}
      <Card>
        <CardTitle>1. 手機驗證</CardTitle>
        {member ? (
          <p className="flex items-center gap-2.5">
            <IconCheck size={22} className="text-success" />
            已驗證 {maskPhone(member.phone)}・會員點數 {member.points} 點
          </p>
        ) : (
          <OtpForm demo={isDemo()} />
        )}
      </Card>
      <CheckoutForm lines={lines} signedIn={Boolean(member)} points={member?.points ?? 0} eventDiscount={eventDiscount(event)} defaultRecipient={member?.displayName ?? ''} />
    </>
  );
}
