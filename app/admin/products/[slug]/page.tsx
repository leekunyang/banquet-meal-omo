import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRepo } from '@/lib/data';
import { unpublishProduct } from '@/app/actions/admin';
import { SubmitButton } from '@/components/common/submit-button';
import { ProductForm } from '@/components/features/admin/product-form';

export default async function AdminProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = (await getRepo().listProducts({ includeInactive: true })).find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <>
      <p className="text-sm text-muted">
        <Link href="/admin/products">商品</Link> › 編輯
      </p>
      <ProductForm key={`${product.slug}-${product.isActive}-${product.status}`} product={product} />
      {product.isActive ? (
        <form action={unpublishProduct}>
          <input type="hidden" name="slug" value={product.slug} />
          <SubmitButton variant="danger">下架這項商品</SubmitButton>
        </form>
      ) : null}
    </>
  );
}
