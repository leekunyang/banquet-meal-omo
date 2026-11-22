'use client';
import { useEffect, useRef } from 'react';

/** Posts the signed AioCheckOut form to ECPay as soon as the page loads, with a manual fallback button. */
export function EcpayRedirect({ action, fields }: { action: string; fields: Record<string, string> }) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    ref.current?.submit();
  }, []);
  return (
    <form ref={ref} method="post" action={action} className="flex flex-col items-center gap-3">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <p className="text-muted">正在前往綠界付款頁…</p>
      <button type="submit" className="min-h-12 rounded-xl bg-primary px-5 font-bold text-white">
        沒有自動跳轉？按這裡付款
      </button>
    </form>
  );
}
