'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtp, verifyOtp, type OtpState } from '@/app/actions/auth';
import { Input, Label, FieldError } from '@/components/ui/field';
import { SubmitButton } from '@/components/common/submit-button';

/** Phone OTP sign-in (US-1.1). Verifying creates the member, so there is no separate sign-up. */
export function OtpForm({ next, demo }: { next?: string; demo: boolean }) {
  const router = useRouter();
  const [phoneState, sendAction] = useActionState<OtpState, FormData>(sendOtp, { step: 'phone' });
  const [codeState, verifyAction] = useActionState<OtpState, FormData>(verifyOtp, { step: 'phone' });
  const step = codeState.step === 'done' ? 'done' : phoneState.step;

  useEffect(() => {
    if (codeState.step === 'done') {
      if (next) router.push(next);
      router.refresh();
    }
  }, [codeState.step, next, router]);

  return (
    <div className="flex flex-col gap-3">
      <form action={sendAction} className="flex flex-col gap-1">
        <Label htmlFor="phone">手機號碼（驗證後自動成為會員，不用另外註冊）</Label>
        <div className="flex gap-2">
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" required aria-invalid={Boolean(phoneState.step === 'phone' && phoneState.error)} aria-describedby="phone-error" />
          <SubmitButton variant="secondary" className="shrink-0" pendingText="傳送中…">
            {step === 'code' ? '重新傳送' : '傳送驗證碼'}
          </SubmitButton>
        </div>
        <FieldError id="phone-error">{phoneState.step === 'phone' ? phoneState.error : undefined}</FieldError>
      </form>
      {phoneState.step === 'code' ? (
        <form action={verifyAction} className="flex flex-col gap-1">
          <input type="hidden" name="phone" value={phoneState.phone} />
          <Label htmlFor="code">6 位數驗證碼（已傳送到 {phoneState.masked}）</Label>
          <div className="flex gap-2">
            <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" placeholder="輸入驗證碼" required aria-describedby="code-error" autoFocus />
            <SubmitButton className="shrink-0" pendingText="驗證中…">
              驗證
            </SubmitButton>
          </div>
          <FieldError id="code-error">{codeState.step === 'code' ? codeState.error : undefined}</FieldError>
          {demo ? <p className="text-xs text-muted">展示模式：輸入任意 6 位數即可。</p> : null}
        </form>
      ) : null}
    </div>
  );
}
