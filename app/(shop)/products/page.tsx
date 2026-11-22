import Link from 'next/link';
import type { Metadata } from 'next';
import { getRepo } from '@/lib/data';
import { ProductGrid } from '@/components/features/catalog/product-card';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: '全部商品' };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const all = await getRepo().listProducts();
  const categories = [...new Set(all.map((p) => p.category))];
  const products = cat ? all.filter((p) => p.category === cat) : all;
  const chip = (active: boolean) =>
    cn('inline-flex min-h-10 items-center rounded-full border px-4 text-sm', active ? 'border-primary bg-primary-soft font-bold text-primary-hover' : 'border-border bg-card text-foreground');
  return (
    <>
      <h1 className="text-xl font-bold">全部商品</h1>
      <nav aria-label="商品分類" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link href="/products" className={chip(!cat)} aria-current={!cat ? 'page' : undefined}>
          全部
        </Link>
        {categories.map((c) => (
          <Link key={c} href={`/products?cat=${encodeURIComponent(c)}`} className={chip(cat === c)} aria-current={cat === c ? 'page' : undefined}>
            {c}
          </Link>
        ))}
      </nav>
      {products.length ? <ProductGrid products={products} /> : <EmptyState title="這個分類還沒有商品" body="看看其他分類吧。" actionHref="/products" actionLabel="看全部商品" />}
    </>
  );
}
