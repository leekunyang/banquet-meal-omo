'use client';
import { useEffect, useRef } from 'react';
import { lookupPickup } from '@/app/actions/store';
import { Input, Label } from '@/components/ui/field';
import { SubmitButton } from '@/components/common/submit-button';

/**
 * Handheld scanners act as a keyboard: they type the 6-digit code and press
 * Enter. The field keeps focus so staff never have to tap before scanning.
 */
export function ScanInput() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <form action={lookupPickup} className="flex flex-wrap items-end justify-center gap-2">
      <div>
        <Label htmlFor="code">掃描取貨 QR，或輸入取貨碼</Label>
        <Input ref={ref} id="code" name="code" inputMode="numeric" maxLength={6} pattern="\d{6}" placeholder="6 位數" required className="w-48 text-xl tracking-[0.3em]" autoComplete="off" />
      </div>
      <SubmitButton variant="secondary" pendingText="查詢中…">
        查詢
      </SubmitButton>
    </form>
  );
}
