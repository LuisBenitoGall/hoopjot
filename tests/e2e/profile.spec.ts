import { expect, type Page, test } from '@playwright/test';

test('opens Profile from the bottom nav and persists editable profile fields', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enableE2EAuthService(page, `hoopjot-e2e-profile-${testInfo.workerIndex}-${Date.now()}`);

  await page.goto('/sign-up');
  await page.getByLabel('Email').fill('player@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Pick your language' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Birth year').fill('2004');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Primary position').selectOption('point_guard');
  await page.getByLabel('Competitive level').selectOption('club');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Fundamentals' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Ready to start' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await page.getByRole('link', { name: 'Profile' }).click();

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByLabel('Birth year')).toHaveValue('2004');

  await page.getByLabel('Alias').fill('Lead Guard');
  await page.getByLabel('Height in cm').fill('188');
  await page.getByLabel('Primary position').selectOption('shooting_guard');
  await page.getByRole('button', { name: 'Save profile' }).click();

  await expect(page.getByText('Saved locally')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByLabel('Alias')).toHaveValue('Lead Guard');
  await expect(page.getByLabel('Height in cm')).toHaveValue('188');
  await expect(page.getByLabel('Primary position')).toHaveValue('shooting_guard');
});

async function enableE2EAuthService(page: Page, dbName: string): Promise<void> {
  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth-service', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);
}
