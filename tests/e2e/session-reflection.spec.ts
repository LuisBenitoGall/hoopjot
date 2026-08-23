import { expect, test } from '@playwright/test';

test('records a session and rating-only reflection locally while offline', async ({
  context,
  page
}, testInfo) => {
  const dbName = `hoopjot-e2e-session-${testInfo.workerIndex}-${Date.now()}`;

  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);

  await page.goto('/app');

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Session and reflection' })).toBeVisible();

  await context.setOffline(true);

  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByText('In progress')).toBeVisible();

  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByRole('button', { name: 'Complete + save reflection' }).click();

  await expect(page.getByRole('heading', { name: 'Reflection saved' })).toBeVisible();
  await expect(page.getByText('Reflection saved with focus rating 4 of 5.')).toBeVisible();

  await context.setOffline(false);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Reflection saved' })).toBeVisible();
  await expect(page.getByText('Reflection saved with focus rating 4 of 5.')).toBeVisible();
});
