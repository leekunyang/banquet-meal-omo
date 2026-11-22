import { expect, test } from '@playwright/test';

// UI acceptance (ARCHITECTURE §6): 375px wide, no horizontal scrolling, readable labels.
for (const path of ['/', '/products', '/products/fo-tiao-qiang', '/e/ajie-xiaowen', '/cart', '/login']) {
  test(`no horizontal scroll at 375px: ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}

test('primary buttons meet the 44px touch target', async ({ page }) => {
  await page.goto('/products/fo-tiao-qiang');
  const box = await page.getByRole('button', { name: /加入購物車/ }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
