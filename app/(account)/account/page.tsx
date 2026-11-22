import Link from 'next/link';
import type { Metadata } from 'next';
import { getRepo } from '@/lib/data';
import { requireRole } from '@/lib/auth/session';
import { formatDateTime, formatTWD, maskPhone } from '@/lib/utils';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/orders/status';
import { signOut } from '@/app/actions/auth';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SubmitButton } from '@/components/common/submit-button';

export const metadata: Metadata = { title: '會員中心' };

const NOTE: Record<string, string> = { order_paid: '付款成功，訂單成立', ready_for_pickup: '已可到門市取貨', shipped: '商品已出貨' };

export default async function AccountPage() {
  const member = await requireRole(['customer', 'staff', 'admin'], '/account');
  const repo = getRepo();
  const [orders, notes] = await Promise.all([repo.listMemberOrders(member.id), repo.listNotifications(member.id)]);
  const visible = orders.filter((o) => o.status !== 'cancelled' || o.pointsUsed > 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card className="flex-row items-center justify-between">
        <div>
          <p className="text-sm text-muted">
            {member.displayName ? `${member.displayName}・` : ''}
            {maskPhone(member.phone)}
          </p>
          <p className="text-3xl font-bold">
            {member.points} <span className="text-base">點</span>
          </p>
          <p className="text-[13px] text-muted">1 點折 NT$1・線上與門市通用</p>
        </div>
        <Link href="/account/points" className="text-sm font-bold">
          點數紀錄
        </Link>
      </Card>

      {notes.length ? (
        <section aria-labelledby="notes" className="flex flex-col gap-2">
          <h2 id="notes" className="text-[17px] font-bold">
            最新通知
          </h2>
          <ul className="flex flex-col gap-1.5">
            {notes.slice(0, 3).map((n) => {
              const o = orders.find((x) => x.id === n.orderId);
              return (
                <li key={n.id} className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-[15px]">
                  {o ? <Link href={`/account/orders/${o.id}`}>{`${o.number}：${NOTE[n.kind]}`}</Link> : NOTE[n.kind]}
                  <span className="block text-xs text-muted">{formatDateTime(n.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="orders" className="flex flex-col gap-2">
        <h2 id="orders" className="text-[17px] font-bold">
          我的訂單
        </h2>
        {visible.length === 0 ? <p className="text-sm text-muted">還沒有訂單。</p> : null}
        <ul className="flex flex-col gap-2">
          {visible.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex flex-col gap-1 rounded-[14px] border border-border bg-card p-4 text-foreground hover:border-primary-line">
                <span className="flex items-center justify-between gap-2">
                  <strong>{o.number}</strong>
                  <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                </span>
                <span className="flex justify-between text-sm text-muted">
                  <span className="truncate">{o.items.map((i) => i.name).join('、')}</span>
                  <span>{formatTWD(o.total)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <form action={signOut}>
        <SubmitButton variant="ghost" className="w-full">
          登出
        </SubmitButton>
      </form>
    </div>
  );
}
