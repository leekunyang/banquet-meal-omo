import type { Metadata } from 'next';
import { getRepo } from '@/lib/data';
import { requireRole } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: '點數紀錄' };

export default async function PointsPage() {
  const member = await requireRole(['customer', 'staff', 'admin'], '/account/points');
  const entries = await getRepo().listPointEntries(member.id);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold">點數紀錄</h1>
      <p className="text-muted">目前 {member.points} 點。每消費 NT$100 得 1 點，線上與門市通用。</p>
      <Card className="gap-0 p-0 px-4">
        {entries.length === 0 ? <p className="py-4 text-sm text-muted">還沒有點數紀錄。</p> : null}
        <ul>
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <div>
                <p className="text-[15px]">{e.reason}</p>
                <p className="text-xs text-muted">{formatDateTime(e.createdAt)}</p>
              </div>
              <strong className={e.delta > 0 ? 'text-success' : 'text-primary-hover'}>
                {e.delta > 0 ? '+' : '−'}
                {Math.abs(e.delta)}
              </strong>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
