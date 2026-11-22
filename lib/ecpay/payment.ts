import 'server-only';
import type { Order, PaymentMethod } from '@/types/domain';
import { ecpayConfig, siteUrl } from '@/lib/env';
import { computeCheckMacValue, verifyCheckMacValue } from './checkmac';

const CHOOSE_PAYMENT: Record<PaymentMethod, string> = { card: 'Credit', atm: 'ATM', cvs: 'CVS' };

function taipeiTimestamp(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/** AioCheckOut V5 form fields, signed with CheckMacValue. The amount comes from the stored order only. */
export function buildCheckoutForm(order: Order): { action: string; fields: Record<string, string> } {
  const cfg = ecpayConfig();
  const base = siteUrl();
  const fields: Record<string, string> = {
    MerchantID: cfg.merchantId,
    MerchantTradeNo: order.number,
    MerchantTradeDate: taipeiTimestamp(new Date(order.createdAt)),
    PaymentType: 'aio',
    TotalAmount: String(order.total),
    TradeDesc: '喜宴好味冷凍調理包',
    ItemName: order.items.map((i) => `${i.name} x ${i.qty}`).join('#').slice(0, 400),
    ReturnURL: `${base}/api/ecpay/notify`,
    ClientBackURL: `${base}/checkout/result?order=${order.id}`,
    ChoosePayment: CHOOSE_PAYMENT[order.paymentMethod ?? 'card'],
    EncryptType: '1',
    CustomField1: order.id,
  };
  if (order.paymentMethod === 'atm') fields.ExpireDate = '3';
  if (order.paymentMethod === 'cvs') fields.StoreExpireDate = String(60 * 24 * 3);
  fields.CheckMacValue = computeCheckMacValue(fields, cfg.hashKey, cfg.hashIV);
  return { action: cfg.apiUrl, fields };
}

export function verifyNotification(params: Record<string, string>): boolean {
  const cfg = ecpayConfig();
  if (!cfg.hashKey || !cfg.hashIV) return false;
  return verifyCheckMacValue(params, cfg.hashKey, cfg.hashIV);
}
