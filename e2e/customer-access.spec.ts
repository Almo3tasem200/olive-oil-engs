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

test('forgot-password recovery is reachable in English and Arabic', async ({ page }) => {
  await page.goto('/en/account/login');
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/en/account/forgot-password');
  await page.goto('/en/account/forgot-password');
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send verification code' })).toBeVisible();

  await page.goto('/account/login');
  await expect(page.locator("a[href='/account/forgot-password']")).toBeVisible();
  await page.goto('/account/forgot-password');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('the published 12 liter product uses its matching jerrycan photo', async ({ page }) => {
  await page.goto('/en/products/olive-oil-12l');
  await expect(page.getByRole('heading', { name: 'Olive Oil - 12 liters' })).toBeVisible();
  const productImage = page.locator("img[alt='Dark plastic 12 liter olive oil jerrycan']");
  await expect(productImage).toBeVisible();
  await expect.poll(() => productImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const imageResponse = await page.request.get('/reference-assets/olive-oil-12l.jpg');
  expect(imageResponse.ok()).toBe(true);
});

test('home benefits appear above the headline and the hero product photo is removed', async ({ page }) => {
  for (const [path, expectedBenefit, direction] of [
    ['/en', 'monounsaturated fats', 'ltr'],
    ['/', 'الدهون الأحادية غير المشبعة', 'rtl'],
  ]) {
    await page.goto(path);
    const hero = page.locator('#store-hero');
    await expect(hero).toHaveAttribute('dir', direction);
    const benefits = hero.locator('#olive-oil-benefits');
    await expect(benefits).toContainText(expectedBenefit);
    await expect(hero.locator('h1')).toBeVisible();
    await expect(hero.locator('img')).toHaveCount(0);
    const appearsBeforeHeadline = await benefits.evaluate((element) => {
      const headline = document.querySelector('#store-hero h1');
      return Boolean(headline && (element.compareDocumentPosition(headline) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    expect(appearsBeforeHeadline).toBe(true);
  }
});

test('store information is organized into separate localized pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'طريقة الطلب' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'الأسئلة الشائعة' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'طريقة الطلب' }).last()).toHaveAttribute('href', '/how-to-order');
  await expect(page.getByRole('link', { name: 'التوصيل' }).last()).toHaveAttribute('href', '/delivery');
  await expect(page.getByRole('link', { name: 'الأسئلة الشائعة' }).last()).toHaveAttribute('href', '/faq');

  await page.goto('/how-to-order');
  await expect(page.getByRole('heading', { name: 'طريقة الطلب' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(4);

  await page.goto('/en/faq');
  await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Do I need an account to order?' })).toBeVisible();
  await page.getByRole('link', { name: 'العربية' }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.getByRole('heading', { name: 'الأسئلة الشائعة' })).toBeVisible();
});

test('dark mode toggle applies the theme and keeps the saved choice', async ({ page }) => {
  await page.goto('/en');
  await page.evaluate(() => window.localStorage.setItem('olive-oil-theme', 'light'));
  await page.reload();
  await expect.poll(() => page.getByRole('link', { name: 'Sign up' }).evaluate((link) => getComputedStyle(link).color)).toBe('rgb(255, 255, 255)');
  const browseProductsButton = page.getByRole('link', { name: 'Browse products' });
  await expect.poll(() => browseProductsButton.evaluate((link) => getComputedStyle(link).color)).toBe('rgb(255, 255, 255)');
  await expect.poll(() => browseProductsButton.evaluate((link) => getComputedStyle(link).backgroundColor)).toBe('rgb(61, 81, 56)');

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).toBe('rgb(21, 26, 21)');
  await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--button-secondary-bg').trim())).toBe('#293227');
  await expect.poll(() => browseProductsButton.evaluate((link) => getComputedStyle(link).color)).toBe('rgb(255, 255, 255)');
  await expect.poll(() => browseProductsButton.evaluate((link) => getComputedStyle(link).backgroundColor)).toBe('rgb(82, 105, 66)');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en');
  await page.evaluate(() => window.localStorage.setItem('olive-oil-theme', 'light'));
  await page.reload();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

const recoveryEmailIsConfigured = Boolean(
  process.env.RESEND_API_KEY &&
  process.env.RESEND_API_KEY !== 'False' &&
  process.env.RESEND_FROM_EMAIL &&
  process.env.RESEND_FROM_EMAIL !== 'False' &&
  /^[a-fA-F0-9]{64}$/.test(process.env.APP_ENCRYPTION_KEY ?? ''),
);

test('forgot-password form explains when email recovery is not configured', async ({ page }) => {
  test.skip(recoveryEmailIsConfigured, 'Recovery email is configured in this environment.');
  await page.goto('/en/account/forgot-password');
  await page.getByLabel('Email address').fill('customer@example.com');
  await page.getByRole('button', { name: 'Send verification code' }).click();
  await expect(page.locator("p[role='alert']")).toContainText('not configured yet');
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
