import Link from 'next/link';
import { getRepo } from '@/lib/data';
import { formatDate, formatDateTime, formatTWD } from '@/lib/utils';
import { isEventActive } from '@/lib/events/rules';
import { Badge } from '@/components/ui/badge';
import { EventForm } from '@/components/features/admin/event-form';

/** US-5.4 + US-6 (report preview): banquet sessions, their QR cards and the sales they drove. */
export default async function AdminEventsPage() {
  const stats = await getRepo().listEventStats();
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">宴席場次與 QR</h1>
        <p className="text-sm text-muted">每場喜宴一組桌卡 QR，訂單會記錄來自哪一場。</p>
      </div>
      <EventForm today={new Date().toISOString().slice(0, 10)} />
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[760px] text-[15px]">
          <thead className="bg-[#fcfaf7] text-left text-[13px] text-muted">
            <tr>
              {['新人', '宴席日期', '優惠', '帶動訂單', '營收', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map(({ event, orders, revenue }) => (
              <tr key={event.id} className="border-t border-border">
                <td className="px-4 py-3 font-bold">{event.coupleName}</td>
                <td className="px-4 py-3">{formatDate(`${event.eventDate}T12:00:00+08:00`)}</td>
                <td className="px-4 py-3">
                  折 {formatTWD(event.discountAmount)}
                  <span className="block text-[13px] text-muted">至 {formatDateTime(event.validUntil)}</span>
                  {isEventActive(event) ? null : <Badge className="mt-1">已結束</Badge>}
                </td>
                <td className="px-4 py-3">{orders} 筆</td>
                <td className="px-4 py-3">{formatTWD(revenue)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/events/${event.id}/card`} className="inline-flex min-h-10 items-center font-bold">
                    桌卡 QR
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
