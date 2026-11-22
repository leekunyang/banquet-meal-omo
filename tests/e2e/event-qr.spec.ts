import { expect, test } from '@playwright/test';
import { addFromCard, payInDemo, signIn } from './helpers';

// Journey 2: banquet QR → automatic offer → order channel = qr.
test('banquet QR order applies the offer and records the event', async ({ page }) => {
  await page.goto('/e/ajie-xiaowen');
  await expect(page.getByRole('heading', { name: /阿傑 & 小雯 的喜宴菜/ })).toBeVisible();
  await expect(page.getByText(/宴席限定：結帳自動折 NT\$100/)).toBeVisible();
  await addFromCard(page, '佛跳牆');

  await page.goto('/checkout');
  await signIn(page, '0911555666');
  await page.getByText('會館門市自取').click();
  await expect(page.getByText('−NT$100').first()).toBeVisible();
  await payInDemo(page);

  await expect(page.getByText('這筆訂單來自 阿傑 & 小雯 的喜宴')).toBeVisible();
  await page.getByRole('link', { name: '查看取貨 QR' }).click();
  await expect(page.getByRole('img', { name: /取貨 QR code/ })).toBeVisible();
  await expect(page.getByText('來源：喜宴 QR')).toBeVisible();
});

test('an expired banquet QR still lets guests buy at the regular price (US-5.3)', async ({ page }) => {
  await page.goto('/e/zhihao-yijun');
  await expect(page.getByText('此優惠已結束')).toBeVisible();
  await expect(page.getByRole('button', { name: /加入購物車/ }).first()).toBeEnabled();
});
