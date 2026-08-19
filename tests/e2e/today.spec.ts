import { expect, test } from '@playwright/test';

test('creates, preserves and updates today focus from local data', async ({
  context,
  page
}, testInfo) => {
  const dbName = `hoopnote-e2e-today-${testInfo.workerIndex}-${Date.now()}`;

  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopnote:e2e-auth', '1');
    window.sessionStorage.setItem('hoopnote:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopnote:e2e-db-name', name);
  }, dbName);

  await page.goto('/app');

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await expect(page.getByText('Planned', { exact: true })).toBeVisible();

  const focusTitle = page.locator('section[aria-label="Daily focus"] h2').first();
  const initialTitle = await focusTitle.textContent();

  await page.getByRole('button', { name: 'Mark viewed' }).first().click();
  await expect(page.getByText('Viewed', { exact: true })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await expect(page.getByText('Viewed', { exact: true })).toBeVisible();
  await expect(focusTitle).toHaveText(initialTitle ?? '');

  await page.getByRole('button', { name: 'Complete' }).click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByText('Skipped', { exact: true })).toBeVisible();
  await context.setOffline(false);
});
