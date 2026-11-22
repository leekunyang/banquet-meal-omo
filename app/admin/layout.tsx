import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';
import { BackOfficeNav } from '@/components/common/back-office-nav';

export const metadata: Metadata = { title: '後台' };

/** Administrators only (US-8.2). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['admin'], '/admin');
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="no-print border-b border-border bg-card p-3 md:w-60 md:shrink-0 md:border-r md:border-b-0 md:p-5">
        <BackOfficeNav
          title="喜宴好味・後台"
          items={[
            { href: '/admin/products', label: '商品' },
            { href: '/admin/inventory', label: '庫存與批號' },
            { href: '/admin/orders', label: '訂單' },
            { href: '/admin/events', label: '宴席場次與 QR' },
          ]}
        />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-5 p-5 md:p-8">{children}</main>
    </div>
  );
}
