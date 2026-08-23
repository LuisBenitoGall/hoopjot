import { expect, test } from '@playwright/test';

test('completes onboarding locally and unlocks app after reload', async ({ page }, testInfo) => {
  const dbName = `hoopjot-e2e-onboarding-${testInfo.workerIndex}-${Date.now()}`;

  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);

  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: 'Pick your language' })).toBeVisible();
  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.getByRole('heading', { name: 'Elige tu idioma' })).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Pick your language' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Birth year').fill('2011');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Hoopjot is for players 16 and older.')).toBeVisible();

  await page.getByLabel('Birth year').fill('2010');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Primary position').selectOption('point_guard');
  await page.getByLabel('Competitive level').selectOption('club');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('button', { name: 'Fundamentals' }).click();
  await page.getByRole('button', { name: 'Defense' }).click();
  await page.getByRole('button', { exact: true, name: 'Confidence' }).click();
  await page.getByRole('button', { name: 'Rebounding' }).click();
  await expect(page.getByText('Choose no more than three goals.')).toBeVisible();
  await expect(page.getByText('3 of 3 goals selected')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Set your baseline' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Add physical context' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Ready to start' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();

  await page.goto('/onboarding');

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
});

test('restores a remote completed profile before asking for onboarding again', async ({
  page
}, testInfo) => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const timestamp = '2026-08-18T00:00:00.000Z';
  const dbName = `hoopjot-e2e-remote-onboarding-${testInfo.workerIndex}-${Date.now()}`;

  await page.addInitScript(
    ({ name, now, remoteUserId }) => {
      window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
      window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
      window.sessionStorage.setItem('hoopjot:e2e-remote-sync', '1');
      window.sessionStorage.setItem(
        'hoopjot:e2e-remote-data',
        JSON.stringify({
          checkIns: [],
          dailyFocuses: [],
          observations: [],
          playerGoals: [
            {
              active: true,
              createdAt: now,
              goalType: 'fundamentals',
              id: '22222222-2222-4222-8222-222222222222',
              priority: 1,
              updatedAt: now,
              userId: remoteUserId
            }
          ],
          profiles: [
            {
              alias: 'Remote profile',
              birthYear: 2010,
              competitiveLevel: 'club',
              createdAt: now,
              id: '33333333-3333-4333-8333-333333333333',
              locale: 'en',
              onboardingCompletedAt: now,
              primaryPosition: 'point_guard',
              updatedAt: now,
              userId: remoteUserId
            }
          ],
          reflections: [],
          sessions: [],
          skillStates: [],
          weeklyReviews: []
        }),
      );
    },
    { name: dbName, now: timestamp, remoteUserId: userId },
  );

  await page.goto('/app');

  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pick your language' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByLabel('Alias')).toHaveValue('Remote profile');
});