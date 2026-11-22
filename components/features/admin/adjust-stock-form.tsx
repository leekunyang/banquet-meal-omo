'use client';
import { useActionState } from 'react';
import { adjustStock, type FormState } from '@/app/actions/admin';
import { Input, Label, Select } from '@/components/ui/field';
import { SubmitButton } from '@/components/common/submit-button';

const REASONS = ['盤點差異', '包裝破損', '新批次入庫', '門市調撥', '過期報廢'];

/** US-4.3: every manual change needs a reason and is logged. */
export function AdjustStockForm({ lotId, label }: { lotId: string; label: string }) {
  const [state, action] = useActionState<FormState, FormData>(adjustStock, null);
  return (
    <details className="group">
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-lg border border-input px-3 text-sm font-bold hover:bg-subtle">調整</summary>
      <form action={action} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg bg-subtle p-3" aria-label={`調整 ${label}`}>
        <input type="hidden" name="lotId" value={lotId} />
        <div className="w-28">
          <Label htmlFor={`d-${lotId}`}>增減數量</Label>
          <Input id={`d-${lotId}`} name="delta" inputMode="numeric" pattern="-?\d+" placeholder="例如 -1" required />
        </div>
        <div className="w-36">
          <Label htmlFor={`r-${lotId}`}>原因（必填）</Label>
          <Select id={`r-${lotId}`} name="reason" required defaultValue="">
            <option value="" disabled>
              請選擇
            </option>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </div>
        <SubmitButton size="md" pendingText="儲存中…">
          儲存
        </SubmitButton>
        {state ? (
          <p role={state.ok ? 'status' : 'alert'} className={`w-full text-sm ${state.ok ? 'text-success' : 'text-primary-hover'}`}>
            {state.message}
          </p>
        ) : null}
      </form>
    </details>
  );
}
