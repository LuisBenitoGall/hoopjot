import { expect, test } from '@playwright/test';

test('renders the Plan manual and guideline detail from bundled content', async ({
  page,
}, testInfo) => {
  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, `hoopjot-e2e-plan-${testInfo.workerIndex}-${Date.now()}`);

  await page.goto('/plan');

  await expect(page.getByRole('heading', { level: 1, name: 'Your game plan' })).toBeVisible();
  await expect(page.getByText('See the whole map')).toBeVisible();

  const map = page.getByTestId('development-map');
  await expect(map.getByRole('heading', { level: 2 }).nth(0)).toHaveText('Attack');
  await expect(map.getByRole('heading', { level: 2 }).nth(1)).toHaveText('Defense');
  await expect(map.getByRole('heading', { level: 2 }).nth(2)).toHaveText('Transition');
  await expect(map.getByRole('heading', { level: 2 }).nth(3)).toHaveText(
    'Communication & decisions',
  );
  await expect(map.getByRole('heading', { level: 2 }).nth(4)).toHaveText('Habits & attention');
  await expect(map.getByRole('link', { name: 'Find your player first' })).toHaveAttribute(
    'href',
    '/plan/def.rebound.find-player-first',
  );

  await page.getByRole('link', { name: 'Find your player first' }).click();

  await expect(page).toHaveURL(/\/plan\/def\.rebound\.find-player-first$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Find your player first' }),
  ).toBeVisible();
  await expect(page.getByText('SHOT / PLAYER / CONTACT / BALL')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Plan' })).toHaveAttribute('href', '/plan');
});
