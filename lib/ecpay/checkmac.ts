import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * ECPay's URL encoding follows .NET HttpUtility.UrlEncode: like encodeURIComponent,
 * but spaces become "+", and "~" and "'" are percent-encoded. The result is lowercased.
 */
export function ecpayUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/~/g, '%7e')
    .replace(/'/g, '%27')
    .toLowerCase();
}

/** CheckMacValue (EncryptType=1, SHA256) for AioCheckOut requests and notifications. */
export function computeCheckMacValue(params: Record<string, string | number>, hashKey: string, hashIV: string): string {
  const pairs = Object.keys(params)
    .filter((k) => k !== 'CheckMacValue')
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const raw = `HashKey=${hashKey}&${pairs}&HashIV=${hashIV}`;
  return createHash('sha256').update(ecpayUrlEncode(raw)).digest('hex').toUpperCase();
}

export function verifyCheckMacValue(params: Record<string, string>, hashKey: string, hashIV: string): boolean {
  const received = params.CheckMacValue;
  if (!received) return false;
  const expected = computeCheckMacValue(params, hashKey, hashIV);
  const a = Buffer.from(expected);
  const b = Buffer.from(received.toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
