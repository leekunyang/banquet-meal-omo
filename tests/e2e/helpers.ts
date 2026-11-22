import { expect, type Page } from '@playwright/test';

/** Demo-mode phone OTP: any 6 digits sign in. */
export async function signIn(page: Page, phone: string) {
  await page.getByLabel(/手機號碼/).fill(phone);
  await page.getByRole('button', { name: /傳送驗證碼/ }).click();
  await page.getByLabel(/6 位數驗證碼/).fill('123456');
  await page.getByRole('button', { name: '驗證', exact: true }).click();
}

export async function addFromCard(page: Page, name: string) {
  await page.getByRole('button', { name: `把 ${name} 加入購物車` }).first().click();
  await expect(page.getByRole('link', { name: /購物車，[1-9]/ })).toBeVisible();
}

export async function payInDemo(page: Page, outcome: '成功' | '失敗' = '成功') {
  await page.getByRole('button', { name: '前往綠界付款' }).click();
  await page.getByRole('button', { name: `模擬付款${outcome}` }).click();
}
