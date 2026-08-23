import { expect, test } from '@playwright/test';

test('navigates from a saved session to the offline journal detail', async ({
  context,
  page
}, testInfo) => {
  const dbName = `hoopjot-e2e-journal-${testInfo.workerIndex}-${Date.now()}`;

  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);

  await page.goto('/app');

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByLabel('What happened?').fill('Closed out before watching the ball.');
  await page.getByRole('button', { name: 'Complete + save reflection' }).click();
  await expect(page.getByRole('heading', { name: 'Reflection saved' })).toBeVisible();

  await context.setOffline(true);
  await page.getByRole('link', { name: 'Journal' }).click();

  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
  await expect(page.getByText('Reflection saved')).toBeVisible();

  await page.getByRole('link', { name: /Open session detail: Practice/ }).click();

  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Daily focus' })).toBeVisible();
  await expect(page.getByText('4 of 5')).toBeVisible();
  await expect(page.getByText('Closed out before watching the ball.')).toBeVisible();

  await context.setOffline(false);
});
