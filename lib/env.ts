import 'server-only';

export type DataMode = 'supabase' | 'memory';

/**
 * Supabase when credentials are configured; otherwise the in-memory demo
 * driver, so `npm run dev` works with no accounts. DATA_MODE=demo forces demo.
 */
export function dataMode(): DataMode {
  if (process.env.DATA_MODE === 'demo') return 'memory';
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'supabase' : 'memory';
}

export function isDemo(): boolean {
  return dataMode() === 'memory';
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export function ecpayConfig() {
  return {
    merchantId: process.env.ECPAY_MERCHANT_ID ?? '',
    hashKey: process.env.ECPAY_HASH_KEY ?? '',
    hashIV: process.env.ECPAY_HASH_IV ?? '',
    apiUrl: process.env.ECPAY_API_URL ?? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
  };
}
