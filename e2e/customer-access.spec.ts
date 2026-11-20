import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

test('storefront exposes customer sign-in and sign-up routes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  await expect(page.locator("a[href='/account/login']").first()).toBeVisible();
  await expect(page.locator("a[href='/account/signup']").first()).toBeVisible();

  await page.goto('/account/signup');
  await expect(page.getByRole('heading', { name: 'إنشاء حساب جديد' })).toBeVisible();
  await expect(page.getByLabel('الاسم الكامل')).toBeVisible();
  await expect(page.getByLabel('البريد الإلكتروني')).toBeVisible();
  await expect(page.getByLabel('تأكيد كلمة المرور')).toHaveAttribute('type', 'password');

  await page.goto('/account/login');
  await expect(page.getByRole('heading', { name: 'تسجيل الدخول' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'أنشئ حسابًا' })).toBeVisible();
});

test('sign-up remains discoverable from the mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator("a[href='/account/login']").last()).toBeVisible();
  await expect(page.locator("a[href='/account/signup']").last()).toBeVisible();
  await page.locator('header button[aria-expanded="false"]').click();
  await expect(page.locator("nav[aria-label='التنقل'] a[href='/account/signup']")).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test('customer can register, sign out, and sign in again', async ({ page }) => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/el_mohandeseen?schema=public',
    }),
  });
  const email = `customer-${randomUUID()}@example.com`;
  const password = 'olive-oil-test-password-2026';

  try {
    await page.goto('/account/signup');
    await page.getByLabel('الاسم الكامل').fill('Smoke Test Customer');
    await page.getByLabel('البريد الإلكتروني').fill(email);
    await page.locator("input[autocomplete='new-password']").nth(0).fill(password);
    await page.locator("input[autocomplete='new-password']").nth(1).fill(password);
    await page.getByRole('button', { name: 'إنشاء حساب' }).click();
    await page.waitForURL('**/account');
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
    await page.waitForURL('**/account/login');
    await page.getByLabel('البريد الإلكتروني').fill(email);
    await page.locator("input[autocomplete='current-password']").fill(password);
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL('**/account');
    await expect(page.getByText(email)).toBeVisible();
  } finally {
    await prisma.customerAccount.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
