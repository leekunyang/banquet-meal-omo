import type { Metadata } from 'next';
import { getRepo } from '@/lib/data';
import { STORE_ID } from '@/lib/data/seed';
import { PosTerminal } from '@/components/features/store/pos-terminal';

export const metadata: Metadata = { title: 'POS 現場結帳' };

export default async function PosPage() {
  const products = await getRepo().listProducts();
  return (
    <>
      <h1 className="text-2xl font-bold">POS 現場結帳</h1>
      <PosTerminal products={products.map((p) => ({ slug: p.slug, name: p.name, price: p.price, available: p.availableByLocation[STORE_ID] ?? 0 }))} />
    </>
  );
}
