'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconCart, IconGrid, IconHome, IconUser } from './icons';
import { cn } from '@/lib/utils';

export function TabBar({ cartCount }: { cartCount: number }) {
  const path = usePathname();
  const items = [
    { href: '/', label: '首頁', icon: IconHome, active: path === '/' || path.startsWith('/e/') },
    { href: '/products', label: '全部商品', icon: IconGrid, active: path.startsWith('/products') },
    { href: '/cart', label: cartCount ? `購物車（${cartCount}）` : '購物車', icon: IconCart, active: path.startsWith('/cart') || path.startsWith('/checkout') },
    { href: '/account', label: '會員', icon: IconUser, active: path.startsWith('/account') || path.startsWith('/login') },
  ];
  return (
    <nav aria-label="主要導覽" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn('flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs', active ? 'font-bold text-primary' : 'text-muted')}
            >
              <Icon size={22} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
