import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRepo } from '@/lib/data';
import { siteUrl } from '@/lib/env';
import { formatDateTime, formatTWD } from '@/lib/utils';
import { QrCode } from '@/components/common/qr-code';
import { PrintButton } from '@/components/features/admin/print-button';

export default async function EventCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getRepo().getEvent(id);
  if (!event) notFound();
  const url = `${siteUrl()}/e/${event.id}`;
  return (
    <>
      <p className="no-print text-sm text-muted">
        <Link href="/admin/events">宴席場次</Link> › 桌卡 QR
      </p>
      <article className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-background p-8 text-center print:border-0">
        <p className="font-serif text-2xl text-primary">{event.coupleName} 的喜宴菜</p>
        <p className="text-sm">掃碼把今天的菜帶回家{event.discountAmount ? `・結帳自動折 ${formatTWD(event.discountAmount)}` : ''}</p>
        <QrCode value={url} size={200} label={`${event.coupleName} 喜宴桌卡 QR code`} />
        <p className="text-xs text-muted">優惠至 {formatDateTime(event.validUntil)}</p>
        <p className="font-mono text-xs break-all text-muted">{url}</p>
      </article>
      <PrintButton />
    </>
  );
}
