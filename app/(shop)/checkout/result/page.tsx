import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getRepo } from '@/lib/data';
import { getSession } from '@/lib/auth/session';
import { formatDateTime, formatTWD, maskPhone } from '@/lib/utils';
import { pointsEarnedFor } from '@/lib/orders/pricing';
import { Card } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import { IconCheck, IconClock, IconX } from '@/components/common/icons';

export const metadata: Metadata = { title: '付款結果' };

function Badge({ tone, children }: { tone: 'ok' | 'wait' | 'fail'; children: React.ReactNode }) {
  const cls = { ok: 'bg-success-soft text-success', wait: 'bg-warning-soft text-warning', fail: 'bg-primary-soft text-primary' }[tone];
  return <div className={`flex size-[72px] items-center justify-center rounded-full ${cls}`}>{children}</div>;
}

/** Shows the order as stored. Payment status comes only from ECPay's server notification (rule 4). */
export default async function ResultPage({ searchParams }: { searchParams: Promise<{ order?: string; failed?: string }> }) {
  const { order: id, failed } = await searchParams;
  const member = await getSession();
  if (!member) redirect('/login?next=/account');
  const order = id ? await getRepo().getOrder(id) : null;
  if (!order || order.memberId !== member.id) notFound();
  const event = order.eventId ? await getRepo().getEvent(order.eventId) : null;

  if (order.status === 'pending_payment') {
    return (
      <div className="flex flex-1 flex-col items-center gap-4 pt-8 text-center">
        <Badge tone={failed ? 'fail' : 'wait'}>{failed ? <IconX size={36} /> : <IconClock size={36} />}</Badge>
        <h1 className="font-serif text-2xl font-bold">{failed ? '付款沒有成功' : '等待付款確認'}</h1>
        <p className="text-muted">
          {failed ? '這次沒有扣款。' : '收到綠界通知後會自動更新。'}
          <br />
          商品已為你保留到 {order.expiresAt ? formatDateTime(order.expiresAt) : ''}。
        </p>
        <Link href={`/checkout/pay?order=${order.id}`} className={buttonClass('primary', 'md', 'w-full max-w-sm')}>
          {failed ? '重新付款' : '回到付款頁'}
        </Link>
      </div>
    );
  }
  if (order.status === 'cancelled') {
    return (
      <div className="flex flex-1 flex-col items-center gap-4 pt-8 text-center">
        <Badge tone="fail">
          <IconX size={36} />
        </Badge>
        <h1 className="font-serif text-2xl font-bold">訂單已取消</h1>
        <p className="text-muted">超過付款期限，保留的商品已釋放{order.pointsUsed ? '，折抵的點數已退回' : ''}。</p>
        <Link href="/cart" className={buttonClass('primary', 'md', 'w-full max-w-sm')}>
          回到購物車
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 pt-8 text-center">
      <Badge tone="ok">
        <IconCheck size={36} />
      </Badge>
      <h1 className="font-serif text-2xl font-bold">付款成功</h1>
      <p className="text-muted">
        訂單編號 {order.number}
        <br />
        訂單確認通知已傳送到 {maskPhone(member.phone)}
      </p>
      <Card className="w-full max-w-md gap-2 text-left">
        <div className="flex justify-between">
          <span className="text-muted">實付金額</span>
          <strong>{formatTWD(order.total)}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">本次獲得</span>
          <strong>{pointsEarnedFor(order.total)} 點</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">取貨方式</span>
          <strong>{order.fulfillment === 'pickup' ? '會館門市自取' : '冷凍宅配'}</strong>
        </div>
        {event ? <p className="border-t border-border pt-2 text-sm text-muted">這筆訂單來自 {event.coupleName} 的喜宴</p> : null}
      </Card>
      <div className="flex w-full max-w-md flex-col gap-2">
        <Link href={`/account/orders/${order.id}`} className={buttonClass('primary', 'md', 'w-full')}>
          {order.fulfillment === 'pickup' ? '查看取貨 QR' : '查看訂單'}
        </Link>
        <Link href="/" className={buttonClass('secondary', 'md', 'w-full')}>
          繼續逛逛
        </Link>
      </div>
    </div>
  );
}
