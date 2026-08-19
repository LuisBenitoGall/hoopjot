import { expect, test } from '@playwright/test';

test('browses bundled Game content and opens detail after going offline', async ({
  context,
  page
}) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hoopnote:e2e-auth', '1');
    window.sessionStorage.setItem('hoopnote:e2e-onboarded', '1');
  });

  await page.goto('/game');

  await expect(page.getByRole('heading', { name: 'Basketball knowledge base' })).toBeVisible();

  await page.getByRole('button', { name: 'Defense' }).click();
  await page.getByLabel('Subcategory').selectOption('rebounding');

  const reboundingGuideline = page.getByRole('link', {
    name: 'Open guideline: Find your player first'
  });

  await expect(reboundingGuideline).toBeVisible();

  await context.setOffline(true);
  await reboundingGuideline.click();

  await expect(page.getByRole('heading', { name: 'Find your player first' })).toBeVisible();
  await expect(page.getByText('SHOT / PLAYER / CONTACT / BALL')).toBeVisible();

  await context.setOffline(false);
});
