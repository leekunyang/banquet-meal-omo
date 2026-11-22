import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getRepo } from '@/lib/data';
import { getSession } from '@/lib/auth/session';
import { isDemo } from '@/lib/env';
import { buildCheckoutForm } from '@/lib/payments/ecpay/payment';
import { formatDateTime, formatTWD } from '@/lib/utils';
import { simulatePayment } from '@/app/actions/demo';
import { Card } from '@/components/ui/card';
import { SubmitButton } from '@/components/common/submit-button';
import { EcpayRedirect } from '@/components/features/checkout/ecpay-redirect';

export const metadata: Metadata = { title: '付款' };

export default async function PayPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: id } = await searchParams;
  const member = await getSession();
  if (!member) redirect('/login?next=/account');
  const order = id ? await getRepo().getOrder(id) : null;
  if (!order || order.memberId !== member.id) notFound();
  if (order.status !== 'pending_payment') redirect(`/checkout/result?order=${order.id}`);

  if (!isDemo()) {
    const form = buildCheckoutForm(order);
    return (
      <Card className="items-center py-10 text-center">
        <EcpayRedirect action={form.action} fields={form.fields} />
      </Card>
    );
  }

  return (
    <Card className="items-center gap-4 py-8 text-center">
      <span className="rounded-md bg-subtle px-2 py-0.5 text-xs text-muted">展示模式：正式環境會導向綠界付款頁</span>
      <p className="text-muted">
        訂單 {order.number} 已建立，商品保留到
        <br />
        {order.expiresAt ? formatDateTime(order.expiresAt) : ''}
      </p>
      <strong className="text-3xl">{formatTWD(order.total)}</strong>
      <div className="flex w-full max-w-sm flex-col gap-2.5">
        <form action={simulatePayment}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="outcome" value="success" />
          <SubmitButton className="w-full" pendingText="付款中…">
            模擬付款成功
          </SubmitButton>
        </form>
        <form action={simulatePayment}>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="outcome" value="fail" />
          <SubmitButton variant="secondary" className="w-full">
            模擬付款失敗
          </SubmitButton>
        </form>
      </div>
    </Card>
  );
}
