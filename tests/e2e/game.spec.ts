import { expect, test } from '@playwright/test';

test('redirects legacy Game routes to Plan routes', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
  });

  await page.goto('/game');
  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.getByRole('heading', { name: 'Plan' })).toBeVisible();

  await page.goto('/game/def.rebound.find-player-first');
  await expect(page).toHaveURL(/\/plan\/def\.rebound\.find-player-first$/);
  await expect(page.getByRole('heading', { name: 'Plan' })).toBeVisible();
});
