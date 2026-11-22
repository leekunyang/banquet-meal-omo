import type { Metadata } from 'next';
import { getRepo } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { EventBanner } from '@/components/features/catalog/event-banner';
import { ProductGrid } from '@/components/features/catalog/product-card';

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getRepo().getEvent((await params).eventId);
  return { title: event ? `${event.coupleName} 的喜宴菜` : '喜宴菜單' };
}

/** US-5.1: banquet table-card landing page. Middleware stores the event id for channel tracking. */
export default async function EventLandingPage({ params }: Props) {
  const { eventId } = await params;
  const [event, products] = await Promise.all([getRepo().getEvent(eventId), getRepo().listProducts()]);
  const featured = event ? products.filter((p) => event.featuredSlugs.includes(p.slug)) : products;

  return (
    <>
      <Card className="gap-1.5 p-5">
        {event ? (
          <>
            <span className="text-sm text-muted">
              {formatDate(`${event.eventDate}T12:00:00+08:00`)}・{event.venue} 喜宴
            </span>
            <h1 className="font-serif text-2xl leading-snug font-bold">
              {event.coupleName} 的喜宴菜
              <br />
              回家也吃得到
            </h1>
          </>
        ) : (
          <h1 className="font-serif text-2xl leading-snug font-bold">喜宴上的招牌菜，回家也吃得到</h1>
        )}
        <p className="text-[15px] text-muted">今天桌上的招牌菜都做成冷凍調理包，加熱 15 分鐘就上桌。</p>
      </Card>
      {event ? (
        <EventBanner event={event} />
      ) : (
        <EventBanner event={{ id: '', venue: '', coupleName: '', eventDate: '2000-01-01', discountAmount: 0, validUntil: '2000-01-01T00:00:00Z', featuredSlugs: [] }} />
      )}
      <h2 className="mt-2 text-lg font-bold">{event ? '今天桌上的菜' : '熱賣商品'}</h2>
      <ProductGrid products={featured.length ? featured : products} />
    </>
  );
}
