import { expect, test } from '@playwright/test';

test('creates, preserves and completes today focus from quick feedback', async ({
  context,
  page
}, testInfo) => {
  const dbName = `hoopjot-e2e-today-${testInfo.workerIndex}-${Date.now()}`;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);

  await page.goto('/app');

  await expect(page.getByRole('heading', { name: "TODAY'S FOCUS" })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log how it went' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark viewed' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skip' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start session' })).toHaveCount(0);
  await expect(page.getByText('What was it today?')).toHaveCount(0);

  const focusTitle = page.locator('section[aria-label="Daily focus"] h2').first();
  const initialTitle = await focusTitle.textContent();

  await page.getByRole('button', { name: 'Log how it went' }).click();
  await expect(page.getByText('What was it today?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Practice' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Game' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Learning' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Recovery' })).toHaveCount(0);
  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: "TODAY'S FOCUS" })).toBeVisible();
  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();
  await expect(focusTitle).toHaveText(initialTitle ?? '');

  await context.setOffline(true);
  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();
  await context.setOffline(false);
});
