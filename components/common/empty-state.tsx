import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export function EmptyState({ title, body, actionHref, actionLabel }: { title: string; body: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <p className="text-[17px] font-bold">{title}</p>
      <p className="text-muted">{body}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={buttonClass('secondary')}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
