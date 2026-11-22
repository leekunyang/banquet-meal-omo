'use client';
import { useActionState } from 'react';
import { addToCart, type CartActionState } from '@/app/actions/cart';
import { SubmitButton } from '@/components/common/submit-button';
import { IconPlus } from '@/components/common/icons';
import { cn } from '@/lib/utils';

/** Adds one portion; the server checks stock and replies inline (US-2.4). */
export function AddToCart({ slug, name, label, compact, disabled }: { slug: string; name: string; label?: string; compact?: boolean; disabled?: boolean }) {
  const [state, action] = useActionState<CartActionState, FormData>(addToCart, null);
  return (
    <form action={action} className={cn(!compact && 'flex flex-col gap-2')}>
      <input type="hidden" name="slug" value={slug} />
      {compact ? (
        <SubmitButton size="icon" ariaLabel={`把 ${name} 加入購物車`} disabled={disabled}>
          <IconPlus size={20} />
        </SubmitButton>
      ) : (
        <SubmitButton className="w-full" pendingText="加入中…" disabled={disabled}>
          {label ?? '加入購物車'}
        </SubmitButton>
      )}
      <p aria-live="polite" className={cn('text-sm', compact && 'sr-only', state?.ok ? 'text-success' : 'text-primary-hover')}>
        {state?.message ?? ''}
      </p>
    </form>
  );
}
