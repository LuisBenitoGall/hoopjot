import { expect, test } from '@playwright/test';

test('redirects legacy Progress route to Journal', async ({ page }, testInfo) => {
  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, `hoopjot-e2e-progress-redirect-${testInfo.workerIndex}-${Date.now()}`);

  await page.goto('/progress');
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
});
