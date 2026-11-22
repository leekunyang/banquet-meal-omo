import type { Product } from '@/types/domain';

/** Food-labeling fields required before a product may go on sale (domain rule 6). */
export const LABEL_FIELDS = [
  { key: 'ingredients', label: '內容物／成分', hint: '依含量多寡排列' },
  { key: 'allergens', label: '過敏原', hint: '例如甲殼類、大豆、蛋；沒有請填「無」' },
  { key: 'netWeightG', label: '淨重（公克）', hint: '例如 1200' },
  { key: 'storage', label: '保存方式', hint: '例如冷凍 −18°C 以下保存' },
  { key: 'shelfLifeDays', label: '有效期限（天）', hint: '例如 365' },
] as const;

export type LabelFieldKey = (typeof LABEL_FIELDS)[number]['key'];

type LabelSource = Pick<Product, LabelFieldKey>;

export function missingLabelFields(p: LabelSource): LabelFieldKey[] {
  const missing: LabelFieldKey[] = [];
  if (p.ingredients.length === 0) missing.push('ingredients');
  if (p.allergens.length === 0) missing.push('allergens');
  if (p.netWeightG === null || p.netWeightG <= 0) missing.push('netWeightG');
  if (p.storage.trim() === '') missing.push('storage');
  if (p.shelfLifeDays === null || p.shelfLifeDays <= 0) missing.push('shelfLifeDays');
  return missing;
}

export function isLabelComplete(p: LabelSource): boolean {
  return missingLabelFields(p).length === 0;
}

/** Splits 「糯米、紅蟳, 香菇」 style input into a clean list. */
export function splitList(input: string): string[] {
  return input
    .split(/[、,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
