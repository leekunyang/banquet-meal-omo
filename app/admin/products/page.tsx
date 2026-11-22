import Link from 'next/link';
import { getRepo } from '@/lib/data';
import { formatTWD } from '@/lib/utils';
import { missingLabelFields } from '@/lib/products/label';
import { Badge } from '@/components/ui/badge';

export default async function AdminProductsPage() {
  const products = await getRepo().listProducts({ includeInactive: true });
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">商品</h1>
        <p className="text-sm text-muted">食品標示填完才能上架（《食品安全衛生管理法》）。新菜色請先用 dish-to-product skill 整理資料。</p>
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[640px] text-[15px]">
          <thead className="bg-[#fcfaf7] text-left text-[13px] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">商品</th>
              <th className="px-4 py-3 font-medium">售價</th>
              <th className="px-4 py-3 font-medium">可售庫存</th>
              <th className="px-4 py-3 font-medium">食品標示</th>
              <th className="px-4 py-3 font-medium">狀態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const missing = missingLabelFields(p).length;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-bold">{p.name}</td>
                  <td className="px-4 py-3">{formatTWD(p.price)}</td>
                  <td className="px-4 py-3">
                    {p.available}
                    {p.available <= 3 ? <Badge tone="danger" className="ml-2">低庫存</Badge> : null}
                  </td>
                  <td className="px-4 py-3">{missing ? <span className="text-primary-hover">缺 {missing} 項</span> : <span className="text-success">完整</span>}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.isActive ? 'success' : missing ? 'neutral' : 'warning'}>{p.isActive ? '上架中' : missing ? '草稿' : '可上架'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.slug}`} className="inline-flex min-h-10 items-center font-bold">
                      編輯
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
