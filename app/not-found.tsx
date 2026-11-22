import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-serif text-2xl font-bold">找不到這個頁面</p>
      <p className="text-muted">網址可能打錯了，或商品已下架。</p>
      <Link href="/" className={buttonClass('primary')}>
        回到首頁
      </Link>
    </main>
  );
}
