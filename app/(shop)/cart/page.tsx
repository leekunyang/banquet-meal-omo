import Link from 'next/link';
import type { Metadata } from 'next';
import { getRepo } from '@/lib/data';
import { readCart } from '@/lib/cart/cookie';
import { getCurrentEvent } from '@/lib/events/current';
import { eventDiscount } from '@/lib/events/rules';
import { formatTWD } from '@/lib/utils';
import { setCartQty } from '@/app/actions/cart';
import { EmptyState } from '@/components/common/empty-state';
import { StickyActionBar } from '@/components/common/sticky-action-bar';
import { SubmitButton } from '@/components/common/submit-button';
import { IconMinus, IconPlus, IconSnow, IconTrash } from '@/components/common/icons';
import { ProductVisual } from '@/components/common/product-visual';
import { buttonClass } from '@/components/ui/button';

export const metadata: Metadata = { title: '購物車' };

function QtyForm({ slug, qty, label, children, disabled }: { slug: string; qty: number; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <form action={setCartQty}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="qty" value={qty} />
      <SubmitButton variant="secondary" size="icon" ariaLabel={label} disabled={disabled} className="size-10">
        {children}
      </SubmitButton>
    </form>
  );
}

export default async function CartPage() {
  const [cart, products, event] = await Promise.all([readCart(), getRepo().listProducts(), getCurrentEvent()]);
  const lines = cart.flatMap((l) => {
    const p = products.find((x) => x.slug === l.slug);
    return p ? [{ product: p, qty: l.qty }] : [];
  });
  if (lines.length === 0) {
    return <EmptyState title="購物車是空的" body="回到喜宴菜單，把喜歡的菜帶回家。" actionHref="/" actionLabel="回到首頁" />;
  }
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const discount = Math.min(eventDiscount(event), subtotal);

  return (
    <>
      <h1 className="text-xl font-bold">購物車</h1>
      <ul className="flex flex-col gap-3">
        {lines.map(({ product, qty }) => {
          const over = qty > product.available;
          const atMax = qty >= product.available;
          return (
            <li key={product.slug} className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-[10px]" aria-hidden="true">
                  <ProductVisual product={product} className="[&>span:first-child]:text-sm [&>span:last-child]:hidden" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${product.slug}`} className="font-bold text-foreground">
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {formatTWD(product.price)} / {product.servings}
                  </p>
                </div>
                <QtyForm slug={product.slug} qty={0} label={`移除 ${product.name}`}>
                  <IconTrash size={20} />
                </QtyForm>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <QtyForm slug={product.slug} qty={qty - 1} label={`減少 ${product.name}`}>
                    <IconMinus size={18} />
                  </QtyForm>
                  <span className="min-w-6 text-center font-bold" aria-label={`${product.name} 數量`}>
                    {qty}
                  </span>
                  <QtyForm slug={product.slug} qty={qty + 1} label={`增加 ${product.name}`} disabled={atMax}>
                    <IconPlus size={18} />
                  </QtyForm>
                </div>
                <strong>{formatTWD(product.price * qty)}</strong>
              </div>
              {over || atMax ? (
                <p role="alert" className="text-sm text-primary-hover">
                  庫存不足，目前剩 {product.available} 份{over ? '，請減少數量' : ''}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="flex items-start gap-2 text-sm text-muted">
        <IconSnow size={18} className="mt-0.5 shrink-0" />
        全程 −18°C 冷凍配送，或到會館門市自取。
      </p>
      <StickyActionBar>
        <div className="flex justify-between text-[15px]">
          <span>小計</span>
          <span>{formatTWD(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-[15px] text-primary-hover">
            <span>宴席限定優惠</span>
            <span>−{formatTWD(discount)}</span>
          </div>
        ) : null}
        <Link href="/checkout" className={buttonClass('primary', 'md', 'w-full')}>
          前往結帳
        </Link>
      </StickyActionBar>
    </>
  );
}
