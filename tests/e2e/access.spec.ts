import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

// US-8.2: back-office routes are role-gated.
test('guests and customers cannot open the store or admin screens', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  await signIn(page, '0911999000');
  await page.goto('/admin/products');
  await expect(page).toHaveURL(/denied=1/);
  await expect(page.getByText('這個頁面需要其他權限')).toBeVisible();
  await page.goto('/store');
  await expect(page).toHaveURL(/denied=1/);
});

test('admins cannot publish a product with an incomplete food label (US-2.3)', async ({ page }) => {
  await page.goto('/login?next=/admin/products/wu-liu-ju');
  await signIn(page, '0933000222');
  await expect(page.getByRole('button', { name: /上架（還缺 3 項）/ })).toBeDisabled();
  await page.getByLabel('淨重（公克）').fill('900');
  await page.getByLabel('保存方式').fill('冷凍 −18°C 以下保存');
  await page.getByLabel('有效期限（天）').fill('180');
  await expect(page.getByRole('button', { name: '儲存並上架' })).toBeEnabled();
});
