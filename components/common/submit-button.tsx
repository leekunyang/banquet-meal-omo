'use client';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button';

/** Submit button that disables itself and shows progress while its form is pending. */
export function SubmitButton({
  children,
  pendingText,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ariaLabel,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={disabled || pending} aria-label={ariaLabel} aria-busy={pending} name={name} value={value}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
