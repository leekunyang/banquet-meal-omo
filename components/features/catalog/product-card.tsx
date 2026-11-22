import Link from 'next/link';
import type { ProductWithStock } from '@/types/domain';
import { formatTWD } from '@/lib/utils';
import { ProductVisual } from '@/components/common/product-visual';
import { AddToCart } from './add-to-cart';

export function stockText(available: number): string {
  if (available <= 0) return '已售完';
  return available <= 3 ? `只剩 ${available} 份` : '現貨供應';
}

export function ProductCard({ product }: { product: ProductWithStock }) {
  const soldOut = product.available <= 0;
  return (
    <article className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-card">
      <Link href={`/products/${product.slug}`} className="block h-28 md:h-40" aria-label={`查看 ${product.name}`}>
        <ProductVisual product={product} />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
        <Link href={`/products/${product.slug}`} className="font-bold text-foreground hover:text-primary">
          {product.name}
        </Link>
        <span className={soldOut || product.available <= 3 ? 'text-[13px] text-primary-hover' : 'text-[13px] text-muted'}>
          {product.servings}・{stockText(product.available)}
        </span>
        <div className="mt-auto flex items-center justify-between">
          <strong className="text-lg">{formatTWD(product.price)}</strong>
          <AddToCart slug={product.slug} name={product.name} compact disabled={soldOut} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductWithStock[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
