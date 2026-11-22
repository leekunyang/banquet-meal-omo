import { getRepo } from '@/lib/data';
import { STORE_ID } from '@/lib/data/seed';
import { formatDateTime } from '@/lib/utils';
import { confirmPickup } from '@/app/actions/store';
import { buttonClass } from '@/components/ui/button';
import { SubmitButton } from '@/components/common/submit-button';
import { IconAlert, IconCheck, IconScan, IconX } from '@/components/common/icons';
import { ScanInput } from '@/components/features/store/scan-input';
import Link from 'next/link';

type Search = { code?: string; result?: string; invalid?: string };

/** US-6.2 / US-6.3: pickup redemption. Results fill the screen in colour + words + icon. */
export default async function StorePickupPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { code, result, invalid } = await searchParams;
  const repo = getRepo();
  const [queue, lookup] = await Promise.all([repo.listPickupQueue(STORE_ID), code ? repo.lookupPickup(code, STORE_ID) : Promise.resolve(null)]);
  const waiting = queue.filter((q) => q.order.status === 'ready_for_pickup');

  let panel: React.ReactNode;
  if (result === 'redeemed' && lookup && lookup.status !== 'not_found') {
    panel = (
      <section role="status" className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        <span className="flex size-[72px] items-center justify-center rounded-full bg-success-soft text-success">
          <IconCheck size={36} />
        </span>
        <p className="text-2xl font-bold">核銷完成</p>
        <p className="text-muted">訂單 {lookup.order.number} 已交給顧客，顧客手機上的訂單同步變成「已取貨」。</p>
        <Link href="/store" className={buttonClass('primary', 'lg')}>
          掃下一位
        </Link>
      </section>
    );
  } else if (lookup?.status === 'ok') {
    panel = (
      <section role="status" className="flex min-h-80 flex-col gap-4 rounded-2xl bg-success p-7 text-white">
        <p className="flex items-center gap-4 text-4xl font-bold">
          <IconCheck size={52} />
          可取貨
        </p>
        <p className="text-xl">
          訂單 {lookup.order.number}・取貨碼 {lookup.order.pickupToken}
        </p>
        <ul className="flex flex-col gap-1.5 rounded-xl bg-white px-5 py-4 text-xl text-foreground">
          {lookup.order.items.map((i) => (
            <li key={i.productId} className="flex justify-between">
              <span>{i.name}</span>
              <strong>× {i.qty}</strong>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap gap-3">
          <form action={confirmPickup} className="flex-1">
            <input type="hidden" name="code" value={code} />
            <SubmitButton size="lg" className="w-full bg-white text-success hover:bg-white/90" pendingText="核銷中…">
              已交給顧客，完成核銷
            </SubmitButton>
          </form>
          <Link href="/store" className={buttonClass('ghost', 'lg', 'border-2 border-white text-white hover:bg-white/10')}>
            取消
          </Link>
        </div>
      </section>
    );
  } else if (lookup?.status === 'already') {
    panel = (
      <section role="status" className="flex min-h-80 flex-col gap-4 rounded-2xl border-2 border-[#c98a00] bg-warning-soft p-7">
        <p className="flex items-center gap-4 text-4xl font-bold text-warning">
          <IconAlert size={52} />
          此訂單已取貨
        </p>
        <p className="text-xl">
          已於 {lookup.order.pickedUpAt ? formatDateTime(lookup.order.pickedUpAt) : ''} 核銷，不會重複扣庫存。
        </p>
        <p className="text-muted">若顧客表示沒有拿到商品，請聯絡店長查看核銷紀錄。</p>
        <Link href="/store" className={buttonClass('primary', 'lg', 'mt-auto self-start')}>
          掃下一位
        </Link>
      </section>
    );
  } else if (code || invalid) {
    const notReady = lookup?.status === 'not_ready';
    panel = (
      <section role="alert" className="flex min-h-80 flex-col gap-4 rounded-2xl border-2 border-primary bg-primary-soft p-7">
        <p className="flex items-center gap-4 text-4xl font-bold text-primary-hover">
          <IconX size={52} />
          {notReady ? '訂單尚未付款' : '查無此訂單'}
        </p>
        <p className="text-xl">{invalid ? '取貨碼是 6 位數字，請重新掃描或輸入。' : notReady ? '這筆訂單還沒完成付款，暫時不能取貨。' : '這不是本門市的自取訂單，或取貨碼輸入錯誤。'}</p>
        <p className="text-muted">請顧客打開「會員中心 › 我的訂單」確認取貨門市與狀態。</p>
        <Link href="/store" className={buttonClass('primary', 'lg', 'mt-auto self-start')}>
          重新掃描
        </Link>
      </section>
    );
  } else {
    panel = (
      <section className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-input bg-card p-8 text-center">
        <IconScan size={88} className="text-muted" />
        <p className="text-xl font-bold">請顧客把取貨 QR 對準掃描器</p>
        <ScanInput />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row-reverse lg:items-start">
      <aside className="flex flex-col gap-2 lg:w-80 lg:shrink-0">
        <h2 className="flex items-baseline justify-between text-[17px] font-bold">
          今日待取貨 <span className="text-sm font-normal text-muted">還有 {waiting.length} 筆</span>
        </h2>
        {queue.length === 0 ? <p className="text-sm text-muted">目前沒有自取訂單。</p> : null}
        <ul className="flex flex-col gap-2">
          {queue.map(({ order, customerName }) => (
            <li key={order.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
              <div className="min-w-0">
                <p className="font-bold">{customerName}</p>
                <p className="truncate text-[13px] text-muted">
                  {order.pickupToken}・{order.items.map((i) => `${i.name}${i.qty > 1 ? ` × ${i.qty}` : ''}`).join('、')}
                </p>
              </div>
              <span className={order.status === 'picked_up' ? 'text-[13px] font-bold text-success' : 'text-[13px] font-bold text-primary-hover'}>
                {order.status === 'picked_up' ? '已取貨' : '待取貨'}
              </span>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">自取核銷</h1>
        {panel}
      </div>
    </div>
  );
}
