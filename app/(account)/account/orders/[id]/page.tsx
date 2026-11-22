import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRepo } from '@/lib/data';
import { requireRole } from '@/lib/auth/session';
import { formatDateTime, formatTWD } from '@/lib/utils';
import { CHANNEL_LABEL, STATUS_LABEL, STATUS_TONE, orderTimeline } from '@/lib/orders/status';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import { QrCode } from '@/components/common/qr-code';
import { IconCheck } from '@/components/common/icons';

export const metadata: Metadata = { title: '訂單明細' };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await requireRole(['customer', 'staff', 'admin'], `/account/orders/${id}`);
  const order = await getRepo().getOrder(id);
  // RLS already hides other members' orders; this check keeps demo mode equally strict.
  if (!order || order.memberId !== member.id) notFound();
  const steps = orderTimeline(order);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">訂單 {order.number}</h1>
        <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
      </div>

      {order.status === 'pending_payment' ? (
        <Card>
          <p>尚未付款，商品保留到 {order.expiresAt ? formatDateTime(order.expiresAt) : ''}。</p>
          <Link href={`/checkout/pay?order=${order.id}`} className={buttonClass('primary', 'md', 'w-full')}>
            前往付款
          </Link>
        </Card>
      ) : null}

      {order.status === 'ready_for_pickup' && order.pickupToken ? (
        <Card className="items-center p-5 text-center">
          <CardTitle>取貨 QR</CardTitle>
          <QrCode value={order.pickupToken} label={`取貨 QR code，取貨碼 ${order.pickupToken}`} />
          <p className="text-[15px]">
            掃不到時，請門市輸入取貨碼 <strong className="tracking-[0.2em]">{order.pickupToken}</strong>
          </p>
          <p className="text-[13px] text-muted">[會館名稱] 一樓櫃檯・調理包已在門市冷凍櫃為你保留</p>
        </Card>
      ) : null}

      {order.status !== 'cancelled' && order.status !== 'pending_payment' ? (
        <Card className="gap-1">
          <CardTitle className="mb-2">訂單進度</CardTitle>
          <ol>
            {steps.map((s, i) => (
              <li key={s.label} className="flex min-h-12 gap-3">
                <div className="flex flex-col items-center">
                  {s.done ? (
                    <span className="flex size-[22px] items-center justify-center rounded-full bg-success text-white">
                      <IconCheck size={14} />
                    </span>
                  ) : (
                    <span className="size-[22px] rounded-full border-2 border-input bg-card" />
                  )}
                  {i < steps.length - 1 ? <span className="w-0.5 flex-1 bg-border" /> : null}
                </div>
                <div>
                  <p className="font-bold">{s.label}</p>
                  <p className="text-[13px] text-muted">{s.label === '已取貨' && order.pickedUpAt ? formatDateTime(order.pickedUpAt) : s.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <Card className="gap-1.5">
        <CardTitle className="mb-1">商品與金額</CardTitle>
        {order.items.map((i) => (
          <div key={i.productId} className="flex justify-between text-sm">
            <span>
              {i.name} × {i.qty}
            </span>
            <span>{formatTWD(i.unitPrice * i.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-1.5 text-sm">
          <span>運費</span>
          <span>{order.shippingFee ? formatTWD(order.shippingFee) : '免運'}</span>
        </div>
        {order.discount ? (
          <div className="flex justify-between text-sm">
            <span>宴席限定優惠</span>
            <span>−{formatTWD(order.discount)}</span>
          </div>
        ) : null}
        {order.pointsUsed ? (
          <div className="flex justify-between text-sm">
            <span>點數折抵</span>
            <span>−{formatTWD(order.pointsUsed)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-bold">
          <span>實付</span>
          <span>{formatTWD(order.total)}</span>
        </div>
        <p className="text-[13px] text-muted">
          來源：{CHANNEL_LABEL[order.channel]}・下單時間 {formatDateTime(order.createdAt)}
        </p>
        {order.shippingAddress ? (
          <p className="text-[13px] text-muted">
            收件：{order.shippingAddress.recipient}・{order.shippingAddress.city}
            {order.shippingAddress.district}
            {order.shippingAddress.line}
          </p>
        ) : null}
      </Card>
      <Link href="/account" className={buttonClass('secondary', 'md')}>
        回會員中心
      </Link>
    </div>
  );
}
