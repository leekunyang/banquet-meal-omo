'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function BackOfficeNav({ title, items }: { title: string; items: { href: string; label: string; exact?: boolean }[] }) {
  const path = usePathname();
  return (
    <nav aria-label={`${title}選單`} className="no-print flex flex-col gap-1">
      <p className="px-3 pb-3 font-serif text-xl font-bold text-primary">{title}</p>
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {items.map((i) => {
          const active = i.exact ? path === i.href : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? 'page' : undefined}
                className={cn('flex min-h-11 items-center rounded-lg px-3 text-[15px]', active ? 'bg-primary-soft font-bold text-primary-hover' : 'text-foreground hover:bg-subtle')}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/" className="flex min-h-11 items-center rounded-lg px-3 text-[15px] text-muted hover:bg-subtle">
            回到前台
          </Link>
        </li>
      </ul>
    </nav>
  );
}
