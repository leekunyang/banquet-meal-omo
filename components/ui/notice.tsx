import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type NoticeTone = 'info' | 'warning' | 'danger' | 'success';

const tones: Record<NoticeTone, string> = {
  info: 'bg-subtle border-border',
  warning: 'bg-warning-soft border-[#e6c46b]',
  danger: 'bg-primary-soft border-primary-line',
  success: 'bg-success-soft border-[#9fd0b6]',
};

/** Inline message placed next to what it is about; states the next step, not just the problem. */
export function Notice({
  tone = 'info',
  title,
  children,
  icon,
  className,
  role,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
}) {
  return (
    <div role={role ?? (tone === 'danger' ? 'alert' : 'status')} className={cn('flex items-start gap-3 rounded-xl border px-3.5 py-3', tones[tone], className)}>
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className="text-sm text-muted">{children}</div> : null}
      </div>
    </div>
  );
}
