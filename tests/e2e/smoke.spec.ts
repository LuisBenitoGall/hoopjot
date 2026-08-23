import { expect, test } from '@playwright/test';

test('renders auth welcome and smoke route', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Hoopjot' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your basketball notebook starts here' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();

  await page.goto('/smoke');

  await expect(page.getByRole('heading', { name: 'Smoke test route' })).toBeVisible();
  await expect(page.getByText('The smoke route rendered through React Router.')).toBeVisible();
});

test('redirects unauthenticated app access to sign in', async ({ page }) => {
  await page.goto('/app');

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('renders public legal pages and cookie settings', async ({ page }) => {
  await page.goto('/legal/privacy');

  await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Legal documents' })).toBeVisible();

  await page.goto('/legal/cookies');

  await expect(page.getByRole('heading', { name: 'Cookie policy' })).toBeVisible();
  await page.getByRole('article').getByRole('button', { name: 'Manage cookies' }).click();
  await expect(page.getByRole('dialog', { name: 'Cookie preferences' })).toBeVisible();
});

for (const width of [360, 430]) {
  test(`auth screens have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 820 });
    await page.goto('/sign-in');

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(hasHorizontalOverflow).toBe(false);
  });
}
