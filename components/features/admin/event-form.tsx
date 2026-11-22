'use client';
import { useActionState } from 'react';
import { createEvent, type FormState } from '@/app/actions/admin';
import { Input, Label } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/common/submit-button';

export function EventForm({ today }: { today: string }) {
  const [state, action] = useActionState<FormState, FormData>(createEvent, null);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-5">
      <h2 className="text-lg font-bold">新增宴席場次</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="coupleName">新人名字</Label>
          <Input id="coupleName" name="coupleName" placeholder="例如 阿傑 & 小雯" required />
        </div>
        <div>
          <Label htmlFor="eventDate">宴席日期</Label>
          <Input id="eventDate" name="eventDate" type="date" defaultValue={today} required />
        </div>
        <div>
          <Label htmlFor="discountAmount">宴席優惠（新台幣，整數）</Label>
          <Input id="discountAmount" name="discountAmount" inputMode="numeric" pattern="\d+" defaultValue="100" required />
        </div>
      </div>
      <input type="hidden" name="venue" value="[會館名稱]" />
      <p className="text-[13px] text-muted">優惠期間為宴席日起 7 天；建立後會帶你到桌卡 QR 頁面，可直接列印。</p>
      {state && !state.ok ? <Notice tone="danger">{state.message}</Notice> : null}
      <SubmitButton className="self-start" pendingText="建立中…">
        建立並產生桌卡 QR
      </SubmitButton>
    </form>
  );
}
