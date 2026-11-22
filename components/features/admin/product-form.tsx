'use client';
import { useActionState, useState } from 'react';
import type { Product } from '@/types/domain';
import { saveProduct, type FormState } from '@/app/actions/admin';
import { LABEL_FIELDS, missingLabelFields, splitList } from '@/lib/products/label';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/common/submit-button';
import { IconCheck } from '@/components/common/icons';

/** US-2.3 / US-8.3: the publish button stays disabled until the food label is complete. */
export function ProductForm({ product }: { product: Product }) {
  const [state, action] = useActionState<FormState, FormData>(saveProduct, null);
  const [label, setLabel] = useState({
    ingredients: product.ingredients.join('、'),
    allergens: product.allergens.join('、'),
    netWeightG: product.netWeightG?.toString() ?? '',
    storage: product.storage,
    shelfLifeDays: product.shelfLifeDays?.toString() ?? '',
  });
  const missing = missingLabelFields({
    ingredients: splitList(label.ingredients),
    allergens: splitList(label.allergens),
    netWeightG: label.netWeightG ? Number(label.netWeightG) : null,
    storage: label.storage,
    shelfLifeDays: label.shelfLifeDays ? Number(label.shelfLifeDays) : null,
  });
  const set = (k: keyof typeof label) => (e: React.ChangeEvent<HTMLInputElement>) => setLabel((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={product.slug} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          {product.name}
          <Badge tone={product.isActive ? 'success' : missing.length ? 'neutral' : 'warning'}>{product.isActive ? '上架中' : missing.length ? '草稿' : '可上架'}</Badge>
        </h1>
        <div className="flex gap-2">
          <SubmitButton variant="secondary" name="intent" value="save" pendingText="儲存中…">
            儲存
          </SubmitButton>
          {!product.isActive ? (
            <SubmitButton name="intent" value="publish" disabled={missing.length > 0} pendingText="上架中…">
              {missing.length ? `上架（還缺 ${missing.length} 項）` : '儲存並上架'}
            </SubmitButton>
          ) : null}
        </div>
      </div>
      {state ? <Notice tone={state.ok ? 'success' : 'danger'}>{state.message}</Notice> : null}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-4 rounded-[14px] border border-border bg-card p-6">
          <h2 className="text-lg font-bold">基本資料</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">商品名稱</Label>
              <Input id="name" name="name" defaultValue={product.name} required />
            </div>
            <div>
              <Label htmlFor="price">售價（新台幣，整數）</Label>
              <Input id="price" name="price" inputMode="numeric" pattern="\d+" defaultValue={product.price} required />
            </div>
            <div>
              <Label htmlFor="servings">份量</Label>
              <Input id="servings" name="servings" defaultValue={product.servings} />
            </div>
            <div>
              <Label htmlFor="category">分類</Label>
              <Select id="category" name="category" defaultValue={product.category}>
                {['湯品', '主食', '主菜', '甜點'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">商品介紹</Label>
              <Textarea id="description" name="description" defaultValue={product.description} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="heating">加熱方式（一行一個步驟）</Label>
              <Textarea id="heating" name="heating" defaultValue={product.heating.join('\n')} />
            </div>
          </div>
          <h2 className="mt-2 text-lg font-bold">食品標示（必填）</h2>
          {LABEL_FIELDS.map((f) => {
            const empty = missing.includes(f.key);
            const numeric = f.key === 'netWeightG' || f.key === 'shelfLifeDays';
            return (
              <div key={f.key}>
                <Label htmlFor={f.key} className="text-foreground">
                  {f.label}
                </Label>
                <Input
                  id={f.key}
                  name={f.key}
                  value={label[f.key]}
                  onChange={set(f.key)}
                  placeholder={f.hint}
                  inputMode={numeric ? 'numeric' : undefined}
                  aria-invalid={empty}
                  aria-describedby={empty ? `${f.key}-hint` : undefined}
                />
                {empty ? (
                  <p id={`${f.key}-hint`} className="mt-1 text-[13px] text-primary-hover">
                    必填：{f.hint}
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
        <aside className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-5 lg:w-72">
          <h2 className="font-bold">上架檢查</h2>
          <p className="text-sm text-muted">全部打勾才能上架；商品頁會原文顯示這些資訊。</p>
          <ul className="flex flex-col gap-2">
            {LABEL_FIELDS.map((f) => {
              const ok = !missing.includes(f.key);
              return (
                <li key={f.key} className="flex min-h-8 items-center gap-2.5">
                  {ok ? (
                    <span className="flex size-[22px] items-center justify-center rounded-full bg-success text-white">
                      <IconCheck size={14} />
                    </span>
                  ) : (
                    <span className="flex size-[22px] items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-hover" aria-hidden="true">
                      !
                    </span>
                  )}
                  <span>{f.label}</span>
                  <span className={`ml-auto text-[13px] ${ok ? 'text-success' : 'text-primary-hover'}`}>{ok ? '已填' : '未填'}</span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </form>
  );
}
