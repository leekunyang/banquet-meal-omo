import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'md' | 'lg' | 'sm' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-border disabled:text-muted',
  secondary: 'bg-card text-foreground border border-input hover:bg-subtle disabled:text-muted',
  ghost: 'bg-transparent text-foreground hover:bg-subtle',
  danger: 'bg-card text-primary border border-primary-line hover:bg-primary-soft',
  success: 'bg-success text-white hover:brightness-95',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 text-sm',
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-14 px-6 text-lg',
  icon: 'size-11 rounded-full p-0',
};

/** Shared classes so links can look like buttons. Minimum touch target 44px. */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
