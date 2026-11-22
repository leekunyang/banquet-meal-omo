import 'server-only';
import { getRepo } from '@/lib/data';

export type NotifyOutcome = 'committed' | 'duplicate' | 'failed_payment' | 'rejected';

/**
 * Applies a payment result (domain rule 4). Callers must have verified the
 * notification first. Idempotent: a repeated notification changes nothing.
 */
export async function applyPaymentResult(params: Record<string, string>): Promise<NotifyOutcome> {
  const repo = getRepo();
  const tradeNo = params.MerchantTradeNo ?? '';
  const amount = Number.parseInt(params.TradeAmt ?? params.TotalAmount ?? '', 10);
  if (!tradeNo || !Number.isInteger(amount)) return 'rejected';

  if (params.RtnCode !== '1') {
    await repo.failPayment(tradeNo);
    return 'failed_payment';
  }
  const res = await repo.commitPayment({ merchantTradeNo: tradeNo, tradeAmount: amount, success: true, raw: params });
  if (!res.ok) {
    // No personal data in logs (domain rule 8): trade number and reason only.
    console.error(`[ecpay] commit rejected trade=${tradeNo} reason=${res.reason}`);
    return 'rejected';
  }
  return res.alreadyProcessed ? 'duplicate' : 'committed';
}
