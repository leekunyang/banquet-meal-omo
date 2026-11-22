'use client';
import { useActionState, useState } from 'react';
import { posCheckout, type PosState } from '@/app/actions/store';
import { cn, formatTWD } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/common/submit-button';
import { IconCheck, IconMinus } from '@/components/common/icons';

export interface PosProduct {
  slug: string;
  name: string;
  price: number;
  available: number;
}

/** US-6.4: on-site sale. Stock is checked again on the server when the sale is recorded. */
export function PosTerminal({ products }: { products: PosProduct[] }) {
  const [state, action] = useActionState<PosState, FormData>(posCheckout, null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [phone, setPhone] = useState('');
  const lines = products.filter((p) => (qty[p.slug] ?? 0) > 0);
  const total = lines.reduce((s, p) => s + p.price * (qty[p.slug] ?? 0), 0);

  if (state?.ok) {
    return (
      <section role="status" className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        <span className="flex size-[72px] items-center justify-center rounded-full bg-success-soft text-success">
          <IconCheck size={36} />
        </span>
        <p className="text-2xl font-bold">收款完成 {formatTWD(state.total)}</p>
        <p className="text-muted">
          訂單 {state.number}・門市冷凍櫃庫存已即時扣除，線上商品頁同步更新
          {state.points ? `；會員獲得 ${state.points} 點` : ''}
        </p>
        <Button size="lg" onClick={() => window.location.reload()}>
          下一位顧客
        </Button>
      </section>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="grid flex-1 grid-cols-2 gap-3 xl:grid-cols-3">
        {products.map((p) => {
          const q = qty[p.slug] ?? 0;
          const left = p.available - q;
          return (
            <button
              key={p.slug}
              type="button"
              disabled={left <= 0}
              onClick={() => setQty((s) => ({ ...s, [p.slug]: q + 1 }))}
              className={cn(
                'flex min-h-24 flex-col items-start gap-1 rounded-[14px] border bg-card p-4 text-left disabled:opacity-50',
                q ? 'border-2 border-primary' : 'border-border',
              )}
              aria-label={`加一份 ${p.name}，門市剩 ${left} 份`}
            >
              <strong className="text-lg">{p.name}</strong>
              <span className="flex w-full justify-between text-sm">
                <span>{formatTWD(p.price)}</span>
                <span className="text-muted">門市剩 {left}</span>
              </span>
              {q ? <span className="text-sm font-bold text-primary-hover">已選 {q} 份</span> : null}
            </button>
          );
        })}
      </div>
      <section className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 lg:w-80">
        <h2 className="text-[17px] font-bold">本筆明細</h2>
        {lines.length === 0 ? <p className="text-sm text-muted">點選左側商品加入</p> : null}
        {lines.map((p) => (
          <div key={p.slug} className="flex items-center justify-between">
            <span>
              {p.name} × {qty[p.slug]}
            </span>
            <span className="flex items-center gap-1">
              {formatTWD(p.price * (qty[p.slug] ?? 0))}
              <button type="button" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-subtle" aria-label={`減少 ${p.name}`} onClick={() => setQty((s) => ({ ...s, [p.slug]: (s[p.slug] ?? 1) - 1 }))}>
                <IconMinus size={18} />
              </button>
            </span>
            <input type="hidden" name={`qty:${p.slug}`} value={qty[p.slug]} />
          </div>
        ))}
        <div>
          <Label htmlFor="pos-phone">會員手機（選填，累積點數）</Label>
          <Input id="pos-phone" name="phone" inputMode="tel" placeholder="0912 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {state && !state.ok ? <Notice tone="danger">{state.message}</Notice> : null}
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <strong>應收</strong>
          <strong className="text-2xl text-primary-hover">{formatTWD(total)}</strong>
        </div>
        <SubmitButton size="lg" className="w-full" disabled={lines.length === 0} pendingText="處理中…">
          收款完成
        </SubmitButton>
      </section>
    </form>
  );
}
