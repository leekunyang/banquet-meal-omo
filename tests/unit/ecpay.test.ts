import { describe, expect, it } from 'vitest';
import { computeCheckMacValue, ecpayUrlEncode, verifyCheckMacValue } from '@/lib/ecpay/checkmac';

// Example from ECPay's All-In-One API documentation (stage merchant 3002607).
const HASH_KEY = 'pwFHCqoQZGmho4w6';
const HASH_IV = 'EkRm7iFT261dpevs';
const params = {
  TradeDesc: '促銷方案',
  PaymentType: 'aio',
  MerchantTradeDate: '2023/03/12 15:30:23',
  MerchantTradeNo: 'ecpay20230312153023',
  MerchantID: '3002607',
  ReturnURL: 'https://www.ecpay.com.tw/receive.php',
  ItemName: 'Apple iphone 15',
  TotalAmount: 30000,
  ChoosePayment: 'ALL',
  EncryptType: 1,
};

describe('ECPay CheckMacValue (US-3.5)', () => {
  it('matches the documented example', () => {
    expect(computeCheckMacValue(params, HASH_KEY, HASH_IV)).toBe('6C51C9E6888DE861FD62FB1DD17029FC742634498FD813DC43D4243B5685B840');
  });

  it('encodes like .NET UrlEncode (space as +, lowercase)', () => {
    expect(ecpayUrlEncode('A b/c~')).toBe('a+b%2fc%7e');
  });

  it('verifies a genuine notification and rejects a tampered amount', () => {
    const n: Record<string, string> = { MerchantID: '3002607', MerchantTradeNo: 'BM202611220001', RtnCode: '1', TradeAmt: '1060' };
    n.CheckMacValue = computeCheckMacValue(n, HASH_KEY, HASH_IV);
    expect(verifyCheckMacValue(n, HASH_KEY, HASH_IV)).toBe(true);
    expect(verifyCheckMacValue({ ...n, TradeAmt: '1' }, HASH_KEY, HASH_IV)).toBe(false);
    expect(verifyCheckMacValue({ ...n, CheckMacValue: '' }, HASH_KEY, HASH_IV)).toBe(false);
  });
});
