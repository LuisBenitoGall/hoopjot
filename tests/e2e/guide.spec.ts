import { expect, type Page, test } from '@playwright/test';

test('opens Guide from Plan and keeps it available after direct reload', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enableE2EAuthService(page, `hoopjot-e2e-guide-${testInfo.workerIndex}-${Date.now()}`);
  await createSyntheticPlayer(page);

  await page.goto('/plan');

  await expect(page.getByRole('heading', { level: 1, name: 'Your game plan' })).toBeVisible();
  await expectPrimaryNavigation(page);

  await page.locator('main').getByRole('link', { name: /Guide/ }).click();

  await expect(page).toHaveURL(/\/guide$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'HOOPJOT — WORK AND HABITS GUIDE' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'ABOUT THIS GUIDE' })).toBeVisible();
  await expect(page.getByTestId('guide-chapter')).toHaveCount(6);
  await expect(page.getByTestId('guide-point')).toHaveCount(30);
  await expect(page.getByText('INSERT')).toHaveCount(0);
  await expect(page.getByText('OVERRIDE')).toHaveCount(0);
  await expect(page.getByText('BRIDGE')).toHaveCount(0);
  await expect(page.getByText('PG_SG')).toHaveCount(0);
  await expectPrimaryNavigation(page);

  await page.reload();

  await expect(page).toHaveURL(/\/guide$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'HOOPJOT — WORK AND HABITS GUIDE' }),
  ).toBeVisible();
  await expect(page.getByTestId('guide-point')).toHaveCount(30);
});

async function createSyntheticPlayer(page: Page): Promise<void> {
  await page.goto('/sign-up');
  await page.getByLabel('Email').fill('player@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Pick your language' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Birth year').fill('2004');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Primary position').selectOption('point_guard');
  await page.getByLabel('Secondary position').selectOption('shooting_guard');
  await page.getByLabel('Competitive level').selectOption('club');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Fundamentals' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Ready to start' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('heading', { name: "TODAY'S FOCUS" })).toBeVisible();
}

async function enableE2EAuthService(page: Page, dbName: string): Promise<void> {
  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth-service', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);
}

async function expectPrimaryNavigation(page: Page): Promise<void> {
  const primaryNavigation = page.getByRole('navigation', { name: 'Primary' });

  await expect(primaryNavigation.getByRole('link')).toHaveCount(4);
  await expect(primaryNavigation.getByRole('link', { name: 'Today' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Plan' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Guide' })).toHaveAttribute(
    'href',
    '/guide',
  );
  await expect(primaryNavigation.getByRole('link', { name: 'Journal' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Game' })).toHaveCount(0);
  await expect(primaryNavigation.getByRole('link', { name: 'Progress' })).toHaveCount(0);
}
