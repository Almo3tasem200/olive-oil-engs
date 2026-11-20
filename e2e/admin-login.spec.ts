import { expect, test } from '@playwright/test';

test('admin login exposes only the supported sign-in fields', async ({ page }) => {
  await page.goto('/admin/login');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel(/البريد الإلكتروني/)).toBeVisible();
  await expect(page.getByLabel(/كلمة المرور/)).toHaveAttribute('type', 'password');
  await expect(page.getByRole('button', { name: /تسجيل الدخول/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /إنشاء حساب|تسجيل جديد/ })).toHaveCount(0);
});

test('admin login remains usable on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/login');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /تسجيل الدخول/ })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await page.screenshot({ path: 'test-results/admin-login-mobile.png', fullPage: true });
});
