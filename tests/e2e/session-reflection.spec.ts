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

  await expect(page.getByRole('heading', { name: "TODAY'S FOCUS" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Session and reflection' })).toHaveCount(0);

  await context.setOffline(true);

  await page.getByRole('button', { name: 'Log how it went' }).click();
  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();

  await context.setOffline(false);
  await page.reload();

  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();
});
