import { NextResponse } from 'next/server';
import { verifyNotification } from '@/lib/ecpay/payment';
import { applyPaymentResult } from '@/lib/payments/handle';

/**
 * ECPay server-to-server payment notification (ReturnURL). Domain rule 4:
 * verify CheckMacValue, process idempotently, answer "1|OK".
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  if (!verifyNotification(params)) {
    console.error(`[ecpay] CheckMacValue mismatch trade=${params.MerchantTradeNo ?? '-'}`);
    return new NextResponse('0|CheckMacValue Error', { status: 400 });
  }
  const outcome = await applyPaymentResult(params);
  if (outcome === 'rejected') return new NextResponse('0|Rejected', { status: 400 });
  return new NextResponse('1|OK', { status: 200, headers: { 'content-type': 'text/plain' } });
}
