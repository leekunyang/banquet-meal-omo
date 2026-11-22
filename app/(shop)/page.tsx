import Link from 'next/link';
import { getRepo } from '@/lib/data';
import { getCurrentEvent } from '@/lib/events/current';
import { ProductGrid } from '@/components/features/catalog/product-card';
import { EventBanner } from '@/components/features/catalog/event-banner';
import { Card } from '@/components/ui/card';

export default async function HomePage() {
  const [products, event] = await Promise.all([getRepo().listProducts(), getCurrentEvent()]);
  return (
    <>
      <Card className="gap-1.5 p-5">
        <h1 className="font-serif text-2xl leading-snug font-bold md:text-3xl">
          喜宴上的招牌菜
          <br />
          回家也吃得到
        </h1>
        <p className="text-[15px] text-muted">會館主廚做的冷凍調理包，加熱 15 分鐘就上桌。冷凍宅配到府，或到會館門市自取。</p>
      </Card>
      {event ? <EventBanner event={event} /> : null}
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">本月熱賣</h2>
        <Link href="/products" className="text-sm font-bold">
          看全部
        </Link>
      </div>
      <ProductGrid products={products} />
    </>
  );
}
