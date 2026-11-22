import type { Product } from '@/types/domain';
import { cn } from '@/lib/utils';

/** Product image, or a labelled colour block until the venue supplies photos. */
export function ProductVisual({ product, className, large }: { product: Pick<Product, 'name' | 'tone' | 'imageUrl'>; className?: string; large?: boolean }) {
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.imageUrl} alt={product.name} className={cn('h-full w-full object-cover', className)} />;
  }
  return (
    <div className={cn('flex h-full w-full flex-col items-center justify-center text-white', className)} style={{ background: product.tone }}>
      <span className={cn('font-serif font-bold', large ? 'text-3xl' : 'text-xl')}>{product.name}</span>
      <span className="text-xs opacity-90">商品照片</span>
    </div>
  );
}
