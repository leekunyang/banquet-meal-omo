import Link from 'next/link';
import { readCart, cartCount } from '@/lib/cart/cookie';
import { getSession } from '@/lib/auth/session';
import { isDemo } from '@/lib/env';
import { IconCart } from './icons';
import { TabBar } from './tab-bar';

/** Storefront frame: header, demo-mode strip and the phone tab bar. */
export async function ShopChrome({ children }: { children: React.ReactNode }) {
  const [cart, member] = await Promise.all([readCart(), getSession()]);
  const count = cartCount(cart);
  return (
    <div className="flex min-h-dvh flex-col">
      {isDemo() ? (
        <p className="no-print bg-foreground px-4 py-1.5 text-center text-xs text-white">
          展示模式・重新啟動後資料還原・<Link href="/login" className="underline text-white">展示帳號</Link>
        </p>
      ) : null}
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-5">
          <Link href="/" className="font-serif text-xl font-bold text-primary">
            喜宴好味
          </Link>
          <nav aria-label="網站導覽" className="ml-6 hidden gap-5 text-[15px] md:flex">
            <Link href="/products" className="text-foreground hover:text-primary">全部商品</Link>
            <Link href="/account" className="text-foreground hover:text-primary">{member ? '會員中心' : '登入'}</Link>
            {member && member.role !== 'customer' ? <Link href="/store" className="text-foreground hover:text-primary">門市</Link> : null}
            {member?.role === 'admin' ? <Link href="/admin" className="text-foreground hover:text-primary">後台</Link> : null}
          </nav>
          <Link href="/cart" aria-label={`購物車，${count} 件`} className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full px-3 hover:bg-subtle">
            <IconCart />
            <span className="text-sm font-bold text-primary">{count}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-5 pt-4 pb-24 md:pb-10">{children}</main>
      <TabBar cartCount={count} />
    </div>
  );
}
