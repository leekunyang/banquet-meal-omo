import { expect, test } from '@playwright/test';
import { addFromCard, payInDemo, signIn } from './helpers';

// Journey 3: order for pickup → staff redeems → picked_up; a second scan is refused.
test('store pickup redemption', async ({ page }) => {
  await page.goto('/');
  await addFromCard(page, '魚翅羹');
  await page.goto('/checkout');
  await signIn(page, '0911777888');
  await page.getByText('會館門市自取').click();
  await payInDemo(page);
  await page.getByRole('link', { name: '查看取貨 QR' }).click();
  const code = (await page.locator('strong.tracking-\\[0\\.2em\\]').textContent())!.trim();
  expect(code).toMatch(/^\d{6}$/);

  // Switch to the store clerk account.
  await page.goto('/login?next=/store&denied=1');
  await signIn(page, '0922000111');
  await expect(page.getByRole('heading', { name: '自取核銷' })).toBeVisible();
  await page.getByLabel(/掃描取貨 QR/).fill(code);
  await page.getByRole('button', { name: '查詢' }).click();
  await expect(page.getByText('可取貨', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '已交給顧客，完成核銷' }).click();
  await expect(page.getByText('核銷完成')).toBeVisible();

  await page.getByRole('link', { name: '掃下一位' }).click();
  await page.getByLabel(/掃描取貨 QR/).fill(code);
  await page.getByRole('button', { name: '查詢' }).click();
  await expect(page.getByText('此訂單已取貨')).toBeVisible();
});
