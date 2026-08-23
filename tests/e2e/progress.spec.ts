import { expect, type Page, test } from '@playwright/test';

test('generates and preserves a local-first weekly progress review', async ({
  context,
  page
}, testInfo) => {
  const dbName = `hoopjot-e2e-progress-${testInfo.workerIndex}-${Date.now()}`;

  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);

  await page.goto('/app');

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.locator('input[name="focus-rating"][value="5"] + span').click();
  await page.getByLabel('What happened?').fill('Tracked my player before the ball.');
  await page.getByRole('button', { name: 'Complete + save reflection' }).click();
  await expect(page.getByRole('heading', { name: 'Reflection saved' })).toBeVisible();

  await activateServiceWorker(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: 'Progress' }).click();

  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent sessions' })).toBeVisible();
  await expect(page.getByText('Reflection saved')).toBeVisible();

  await page.getByRole('button', { name: 'Generate weekly review' }).click();
  await expect(page.getByLabel('What improved?')).toBeVisible();
  await page.getByLabel('What improved?').fill('Closeouts felt calmer.');
  await page.getByLabel('What to improve next?').fill('Keep finding the player first.');
  await page.getByRole('button', { name: 'Save notes' }).click();
  await expect(page.getByText('Saved locally')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(page.getByLabel('What improved?')).toHaveValue('Closeouts felt calmer.');
  await expect(page.getByLabel('What to improve next?')).toHaveValue(
    'Keep finding the player first.',
  );

  await context.setOffline(false);
});

async function activateServiceWorker(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => 'serviceWorker' in navigator))
    .toBe(true);

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  const hasController = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));

  if (!hasController) {
    await page.reload();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
  }

  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}
