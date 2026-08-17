import { expect, test } from '@playwright/test';

test('renders the app shell and smoke route', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Hoopnote' })).toBeVisible();
  await expect(page.getByText('Frontend foundation ready.')).toBeVisible();

  await page.goto('/smoke');

  await expect(page.getByRole('heading', { name: 'Smoke test route' })).toBeVisible();
  await expect(page.getByText('The smoke route rendered through React Router.')).toBeVisible();
});

