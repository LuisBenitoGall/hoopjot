import { expect, type Page, test } from '@playwright/test';

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

  await expect(page.getByRole('heading', { name: "TODAY'S FOCUS" })).toBeVisible();
  await page.getByRole('button', { name: 'Log how it went' }).click();
  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page
    .getByLabel('What did you notice or want to remember?')
    .fill('Closed out before watching the ball.');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();

  await activateServiceWorker(page);
  await context.setOffline(true);
  await page.getByRole('link', { name: 'Journal' }).click();

  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
  await expect(
    page.getByText('Your practice and game notes, without turning them into a report.'),
  ).toBeVisible();
  const journalEntry = page.getByRole('link', { name: /Open session detail: Practice/ });
  await expect(journalEntry).toBeVisible();
  const focusTitle = (await journalEntry.locator('h2').textContent())?.trim();
  expect(focusTitle).toBeTruthy();
  await expect(page.getByText('4 of 5')).toBeVisible();
  await expect(page.getByText('Closed out before watching the ball.')).toBeVisible();
  await expect(page.getByText('Reflection saved')).toHaveCount(0);

  await journalEntry.click();

  await expect(page.getByRole('heading', { name: focusTitle! })).toBeVisible();
  await expect(page.getByText('4 of 5')).toBeVisible();
  await expect(page.getByText('Closed out before watching the ball.')).toBeVisible();
  await expect(page.getByText('Energy')).toHaveCount(0);
  await expect(page.getByText('Remember next time')).toHaveCount(0);

  await context.setOffline(false);
});

async function activateServiceWorker(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => 'serviceWorker' in navigator)).toBe(true);

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
