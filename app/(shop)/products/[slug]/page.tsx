import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRepo } from '@/lib/data';
import { readCart } from '@/lib/cart/cookie';
import { formatTWD } from '@/lib/utils';
import { ProductVisual } from '@/components/common/product-visual';
import { StickyActionBar } from '@/components/common/sticky-action-bar';
import { AddToCart } from '@/components/features/catalog/add-to-cart';
import { stockText } from '@/components/features/catalog/product-card';
import { Card, CardTitle } from '@/components/ui/card';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getRepo().getProduct((await params).slug);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, cart] = await Promise.all([getRepo().getProduct(slug), readCart()]);
  if (!product || !product.isActive) notFound();
  const inCart = cart.find((l) => l.slug === slug)?.qty ?? 0;
  const atMax = inCart >= product.available;

  return (
    <article className="flex flex-1 flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-8">
      <div className="-mx-5 h-52 md:mx-0 md:h-80 md:overflow-hidden md:rounded-2xl">
        <ProductVisual product={product} large />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl font-bold">{product.name}</h1>
          <p className="text-[15px] text-muted">{product.description}</p>
          <p className="mt-1 flex items-baseline gap-2.5">
            <strong className="text-2xl text-primary-hover">{formatTWD(product.price)}</strong>
            <span className="text-sm text-muted">
              {product.servings}・{stockText(product.available)}
            </span>
          </p>
        </div>

        <Card>
          <CardTitle>加熱方式</CardTitle>
          <ol className="flex flex-col gap-2">
            {product.heating.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px]">
                <span className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardTitle>食品標示</CardTitle>
          <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[15px]">
            <dt className="text-muted">內容物</dt>
            <dd>{product.ingredients.join('、')}</dd>
            <dt className="text-muted">過敏原</dt>
            <dd className="flex flex-wrap gap-1.5">
              {product.allergens.map((a) => (
                <span key={a} className="rounded-md border border-primary-line px-2 text-sm text-primary-hover">
                  {a}
                </span>
              ))}
            </dd>
            <dt className="text-muted">淨重</dt>
            <dd>{product.netWeightG?.toLocaleString('en-US')} 公克</dd>
            <dt className="text-muted">保存方式</dt>
            <dd>{product.storage}</dd>
            <dt className="text-muted">有效期限</dt>
            <dd>冷凍 {product.shelfLifeDays} 天，日期見包裝</dd>
          </dl>
        </Card>

        <StickyActionBar>
          {inCart > 0 ? <p className="text-sm text-muted">購物車已有 {inCart} 份{atMax ? '，已達目前庫存' : ''}</p> : null}
          <AddToCart slug={product.slug} name={product.name} label={`加入購物車・${formatTWD(product.price)}`} disabled={atMax} />
        </StickyActionBar>
      </div>
    </article>
  );
}
