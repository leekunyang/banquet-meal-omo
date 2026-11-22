import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';
import { BackOfficeNav } from '@/components/common/back-office-nav';

export const metadata: Metadata = { title: '門市' };

/** Store staff only (US-8.2). Laid out for a counter tablet. */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireRole(['staff', 'admin'], '/store');
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-border bg-card p-3 md:w-60 md:shrink-0 md:border-r md:border-b-0 md:p-5">
        <BackOfficeNav
          title="喜宴好味・門市"
          items={[
            { href: '/store', label: '自取核銷', exact: true },
            { href: '/store/pos', label: 'POS 現場結帳' },
          ]}
        />
        <p className="mt-3 hidden px-3 text-sm text-muted md:block">[會館名稱] 一樓櫃檯・{staff.displayName || '門市人員'}</p>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-5 p-5 md:p-7">{children}</main>
    </div>
  );
}
