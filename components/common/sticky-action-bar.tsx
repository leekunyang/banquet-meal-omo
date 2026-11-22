import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Primary actions stay within thumb reach at the bottom of the screen on phones. */
export function StickyActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-[calc(56px+env(safe-area-inset-bottom))] z-20 -mx-5 mt-auto flex flex-col gap-2 border-t border-border bg-card px-5 pt-3 pb-4 md:bottom-0 md:mx-0 md:rounded-xl md:border',
        className,
      )}
    >
      {children}
    </div>
  );
}
