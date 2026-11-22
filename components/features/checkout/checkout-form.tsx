'use client';
import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Fulfillment, PaymentMethod } from '@/types/domain';
import { createOrder, type CheckoutState } from '@/app/actions/orders';
import { computeQuote, PRICING_RULES } from '@/lib/orders/pricing';
import { cn, formatTWD } from '@/lib/utils';
import { Card, CardTitle } from '@/components/ui/card';
import { Input, Label, Select } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/common/submit-button';
import { StickyActionBar } from '@/components/common/sticky-action-bar';

export interface CheckoutLine {
  slug: string;
  name: string;
  qty: number;
  unitPrice: number;
  availableDelivery: number;
  availablePickup: number;
}

const CITIES = ['臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市', '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣'];

/**
 * Checkout (US-3.2–3.4, US-7.2). The totals here are a preview using the same
 * rules as the server; the server recomputes everything when the order is placed.
 */
export function CheckoutForm({
  lines,
  signedIn,
  points,
  eventDiscount,
  defaultRecipient,
}: {
  lines: CheckoutLine[];
  signedIn: boolean;
  points: number;
  eventDiscount: number;
  defaultRecipient: string;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(createOrder, null);
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [usePoints, setUsePoints] = useState(true);

  const quote = useMemo(
    () =>
      computeQuote({
        lines: lines.map((l) => ({ unitPrice: l.unitPrice, qty: l.qty })),
        fulfillment,
        eventDiscount,
        pointsBalance: signedIn ? points : 0,
        usePoints: signedIn && usePoints,
      }),
    [lines, fulfillment, eventDiscount, signedIn, points, usePoints],
  );
  const shortages = lines.filter((l) => l.qty > (fulfillment === 'pickup' ? l.availablePickup : l.availableDelivery));

  const option = (value: Fulfillment, title: string, price: string, desc: string) => (
    <label
      className={cn(
        'flex cursor-pointer flex-col rounded-xl border bg-card px-3.5 py-3',
        fulfillment === value ? 'border-2 border-primary bg-primary-soft' : 'border-input',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-bold">
          <input type="radio" name="fulfillment" value={value} checked={fulfillment === value} onChange={() => setFulfillment(value)} className="size-5 accent-[var(--primary)]" />
          {title}
        </span>
        <span>{price}</span>
      </span>
      <span className="pl-7 text-sm text-muted">{desc}</span>
    </label>
  );

  return (
    <form action={action} className="flex flex-1 flex-col gap-4">
      <Card>
        <CardTitle>2. 配送方式</CardTitle>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">配送方式</legend>
          {option('delivery', '冷凍宅配', quote.subtotal >= PRICING_RULES.freeShippingThreshold ? '免運' : formatTWD(PRICING_RULES.deliveryFee), `黑貓／新竹物流冷凍，滿 ${formatTWD(PRICING_RULES.freeShippingThreshold)} 免運`)}
          {option('pickup', '會館門市自取', '免運', '付款後即可到門市出示取貨 QR 領取')}
        </fieldset>
        <p className="text-[13px] text-muted">調理包需全程冷凍，不提供超商常溫取貨。</p>
        {shortages.length > 0 ? (
          <Notice tone="danger" title="庫存不足">
            {shortages.map((l) => `${l.name}${fulfillment === 'pickup' ? '門市' : '宅配'}目前剩 ${fulfillment === 'pickup' ? l.availablePickup : l.availableDelivery} 份`).join('；')}。
            {fulfillment === 'delivery' ? '可改選門市自取，或' : '可改選冷凍宅配，或'}
            <Link href="/cart">回購物車調整數量</Link>。
          </Notice>
        ) : null}
        {fulfillment === 'delivery' ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label htmlFor="recipient">收件人</Label>
              <Input id="recipient" name="recipient" autoComplete="name" defaultValue={defaultRecipient} required />
            </div>
            <div>
              <Label htmlFor="city">縣市</Label>
              <Select id="city" name="city" autoComplete="address-level1" defaultValue="新北市">
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="district">鄉鎮市區</Label>
              <Input id="district" name="district" autoComplete="address-level2" placeholder="例如 新莊區" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="line">地址</Label>
              <Input id="line" name="line" autoComplete="street-address" placeholder="路名、門牌、樓層" required />
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="store">自取門市</Label>
            <Select id="store" name="store" defaultValue="st-hall">
              <option value="st-hall">[會館名稱] 一樓櫃檯</option>
            </Select>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>3. 點數折抵</CardTitle>
        {signedIn ? (
          quote.pointsMax > 0 ? (
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" name="usePoints" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="size-5 accent-[var(--primary)]" />
              <span>
                使用 {quote.pointsMax} 點折 {formatTWD(quote.pointsMax)}
                <span className="block text-[13px] text-muted">你有 {points} 點；1 點折 NT$1，單筆最多折應付的 {PRICING_RULES.pointsCapPercent}%</span>
              </span>
            </label>
          ) : (
            <p className="text-sm text-muted">目前沒有可用點數。這筆完成後可得 {quote.pointsEarned} 點。</p>
          )
        ) : (
          <p className="text-sm text-muted">完成手機驗證後可使用點數。</p>
        )}
      </Card>

      <Card className="gap-1">
        <CardTitle className="mb-1">4. 付款方式</CardTitle>
        {(
          [
            ['card', '信用卡'],
            ['atm', 'ATM 轉帳（3 天內繳費）'],
            ['cvs', '超商代碼繳費（3 天內繳費）'],
          ] as const
        ).map(([v, label]) => (
          <label key={v} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input type="radio" name="paymentMethod" value={v} checked={payment === v} onChange={() => setPayment(v)} className="size-5 accent-[var(--primary)]" />
            {label}
          </label>
        ))}
        <p className="text-[13px] text-muted">由綠界 ECPay 處理付款，本站不會儲存卡號。</p>
      </Card>

      <Card className="gap-1.5">
        <CardTitle className="mb-1">金額明細</CardTitle>
        {lines.map((l) => (
          <div key={l.slug} className="flex justify-between text-sm">
            <span>
              {l.name} × {l.qty}
            </span>
            <span>{formatTWD(l.unitPrice * l.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-1.5 text-sm">
          <span>小計</span>
          <span>{formatTWD(quote.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>運費</span>
          <span>{quote.shippingFee ? formatTWD(quote.shippingFee) : '免運'}</span>
        </div>
        {quote.discount ? (
          <div className="flex justify-between text-sm text-primary-hover">
            <span>宴席限定優惠</span>
            <span>−{formatTWD(quote.discount)}</span>
          </div>
        ) : null}
        {quote.pointsUsed ? (
          <div className="flex justify-between text-sm text-primary-hover">
            <span>點數折抵</span>
            <span>−{formatTWD(quote.pointsUsed)}</span>
          </div>
        ) : null}
      </Card>

      <StickyActionBar>
        {state?.error ? (
          <p role="alert" className="text-sm text-primary-hover">
            {state.error}
            {state.code === 'OUT_OF_STOCK' ? (
              <>
                {' '}
                <Link href="/cart">回購物車調整</Link>
              </>
            ) : null}
          </p>
        ) : null}
        <div className="flex items-baseline justify-between">
          <span className="font-bold">應付</span>
          <strong className="text-2xl text-primary-hover">{formatTWD(quote.total)}</strong>
        </div>
        <SubmitButton className="w-full" disabled={!signedIn || shortages.length > 0} pendingText="建立訂單中…">
          {signedIn ? '前往綠界付款' : '請先完成手機驗證'}
        </SubmitButton>
      </StickyActionBar>
    </form>
  );
}
