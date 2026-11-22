'use server';
import { redirect } from 'next/navigation';
import { isDemo } from '@/lib/env';
import { getRepo } from '@/lib/data';
import { getSession } from '@/lib/auth/session';
import { applyPaymentResult } from '@/lib/payments/handle';

/**
 * Demo mode only: stands in for the ECPay payment page and its server
 * notification, going through the same applyPaymentResult path.
 */
export async function simulatePayment(formData: FormData): Promise<void> {
  if (!isDemo()) throw new Error('Payment simulation is disabled outside demo mode');
  const member = await getSession();
  const order = await getRepo().getOrder(String(formData.get('orderId') ?? ''));
  if (!member || !order || order.memberId !== member.id) redirect('/');
  const success = formData.get('outcome') === 'success';
  await applyPaymentResult({
    MerchantTradeNo: order.number,
    TradeAmt: String(order.total),
    RtnCode: success ? '1' : '10100248',
    RtnMsg: success ? '交易成功' : '授權失敗',
  });
  redirect(`/checkout/result?order=${order.id}${success ? '' : '&failed=1'}`);
}
