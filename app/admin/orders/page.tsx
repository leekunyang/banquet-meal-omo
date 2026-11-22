import { getRepo } from '@/lib/data';
import { NEXT_STATUS } from '@/lib/data/repo';
import { formatDateTime, formatTWD } from '@/lib/utils';
import { CHANNEL_LABEL, STATUS_LABEL, STATUS_TONE } from '@/lib/orders/status';
import { advanceOrder } from '@/app/actions/admin';
import { Badge } from '@/components/ui/badge';
import { SubmitButton } from '@/components/common/submit-button';

export default async function AdminOrdersPage() {
  const rows = await getRepo().listAllOrders();
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">訂單</h1>
        <p className="text-sm text-muted">「來源」顯示訂單來自線上、喜宴 QR 或門市；宅配訂單在這裡推進出貨狀態。</p>
      </div>
      {rows.length === 0 ? <p className="text-muted">還沒有訂單。到前台下一筆試試。</p> : null}
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[820px] text-[15px]">
          <thead className="bg-[#fcfaf7] text-left text-[13px] text-muted">
            <tr>
              {['訂單編號', '時間', '會員', '來源', '取貨', '金額', '狀態', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ order, customerName }) => {
              const next = NEXT_STATUS[order.status];
              return (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-sm">{order.number}</td>
                  <td className="px-4 py-3 text-sm">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">{customerName}</td>
                  <td className="px-4 py-3">{CHANNEL_LABEL[order.channel]}</td>
                  <td className="px-4 py-3">{order.channel === 'store' ? '現場' : order.fulfillment === 'pickup' ? '自取' : '宅配'}</td>
                  <td className="px-4 py-3">{formatTWD(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {next && order.fulfillment === 'delivery' ? (
                      <form action={advanceOrder}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="to" value={next} />
                        <SubmitButton variant="secondary" size="sm">
                          改為「{STATUS_LABEL[next]}」
                        </SubmitButton>
                      </form>
                    ) : null}
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
