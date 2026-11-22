import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'warning' | 'success' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-subtle text-muted',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  danger: 'bg-primary-soft text-primary-hover',
};

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap', tones[tone], className)} {...props} />;
}
