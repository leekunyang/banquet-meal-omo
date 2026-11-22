import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isDemo } from '@/lib/env';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { OtpForm } from '@/components/features/account/otp-form';
import { DEMO_MEMBERS } from '@/lib/data/seed';

export const metadata: Metadata = { title: '登入' };

const ROLE_LABEL = { customer: '會員', staff: '門市人員', admin: '管理者' } as const;

/** Only same-site relative paths are allowed as a post-login destination. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const { next, denied } = await searchParams;
  const member = await getSession();
  const target = safeNext(next);
  if (member && !denied) redirect(target);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-bold">登入或加入會員</h1>
      {denied ? (
        <Notice tone="danger" title="這個頁面需要其他權限">
          {member ? `目前登入的是${ROLE_LABEL[member.role]}帳號，請改用有權限的帳號登入。` : '請先登入。'}
        </Notice>
      ) : null}
      <Card>
        <p className="text-sm text-muted">線上與門市消費都累積到同一個點數帳戶。</p>
        <OtpForm next={target} demo={isDemo()} />
      </Card>
      {isDemo() ? (
        <Card className="gap-2">
          <h2 className="font-bold">展示帳號</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {DEMO_MEMBERS.map((m) => (
              <li key={m.id} className="flex justify-between">
                <span>
                  {ROLE_LABEL[m.role]}・{m.displayName}
                </span>
                <span className="font-mono">{m.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">驗證碼輸入任意 6 位數。其他手機號碼會建立新的一般會員。</p>
        </Card>
      ) : null}
    </div>
  );
}
