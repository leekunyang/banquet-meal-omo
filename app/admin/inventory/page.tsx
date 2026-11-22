import { getRepo } from '@/lib/data';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AdjustStockForm } from '@/components/features/admin/adjust-stock-form';

export default async function InventoryPage() {
  const [lots, log] = await Promise.all([getRepo().listLots(), getRepo().listAdjustments()]);
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">庫存與批號</h1>
        <p className="text-sm text-muted">同一商品依地點與批號分開記錄；出貨依「先到期先出」。訂單保留中的數量不能被調整掉。</p>
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[720px] text-[15px]">
          <thead className="bg-[#fcfaf7] text-left text-[13px] text-muted">
            <tr>
              {['商品', '地點', '批號', '有效期限', '數量', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.id} className="border-t border-border align-top">
                <td className="px-4 py-3">{l.productName}</td>
                <td className="px-4 py-3">{l.locationName}</td>
                <td className="px-4 py-3 font-mono text-sm">{l.lotNo}</td>
                <td className="px-4 py-3">{formatDate(`${l.expiresOn}T12:00:00+08:00`)}</td>
                <td className="px-4 py-3">
                  <strong>{l.qty}</strong>
                  {l.qty <= 2 ? <Badge tone="danger" className="ml-2">低庫存</Badge> : null}
                </td>
                <td className="px-4 py-3">
                  <AdjustStockForm lotId={l.id} label={`${l.productName} ${l.lotNo}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {log.length ? (
        <section className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-4">
          <h2 className="font-bold">異動紀錄</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {log.map((a) => {
              const lot = lots.find((l) => l.id === a.lotId);
              return (
                <li key={a.id}>
                  {formatDateTime(a.createdAt)}・{lot ? `${lot.productName}（${lot.lotNo}）` : a.lotId} {a.delta > 0 ? '+' : ''}
                  {a.delta}・原因：{a.reason}・{a.actor}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}
