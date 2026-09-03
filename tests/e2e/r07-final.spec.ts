import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

const finalArtifactsDir = path.resolve('artifacts/remodel-final');

test('verifies final remodel contracts and captures release screenshots', async ({
  context,
  page,
}, testInfo) => {
  const dbName = `hoopjot-e2e-r07-${testInfo.workerIndex}-${Date.now()}`;

  await mkdir(finalArtifactsDir, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await enableE2EAuthService(page, dbName);
  await createSyntheticPlayer(page);

  await expect(page.getByRole('heading', { name: "TODAY'S FOCUS" })).toBeVisible();
  await expectPrimaryNavigation(page);
  await expectHeaderProfileOnly(page);
  await expectTodayBeforeFeedback(page);
  await captureViewportScreenshot(page, '01-today.png', { height: 844, width: 390 });

  await page.getByRole('button', { name: 'Log how it went' }).click();
  await expectQuickReflectionOpen(page);
  await captureViewportScreenshot(page, '02-quick-reflection.png', { height: 844, width: 390 });

  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();

  const savedState = await readQuickReflectionState(page, dbName);

  expect(savedState.sessions).toHaveLength(1);
  expect(savedState.reflections).toHaveLength(1);
  expect(savedState.checkIns).toHaveLength(0);
  expect(savedState.sessions[0]?.type).toBe('practice');
  expect(savedState.sessions[0]?.completedAt).toBeTruthy();
  expect(savedState.reflections[0]?.focusRating).toBe(4);
  expect(savedState.reflections[0]?.rememberNextTime).toBeUndefined();
  expect(savedState.dailyFocus[0]?.status).toBe('completed');
  expect(savedState.syncQueueEntityTypes).toEqual(
    expect.arrayContaining(['daily_focus', 'reflections', 'sessions']),
  );

  await page.reload();
  await expect(
    page.getByText('Saved. We will take it into account for the next focuses.'),
  ).toBeVisible();

  const reloadedState = await readQuickReflectionState(page, dbName);

  expect(reloadedState.sessions).toHaveLength(1);
  expect(reloadedState.reflections).toHaveLength(1);

  await page.getByRole('link', { name: 'Journal' }).click();
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
  await expect(page.getByText('Your practice and game notes, without turning them into a report.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Open session detail: Practice/ })).toBeVisible();
  await expect(page.getByText('4 of 5')).toBeVisible();
  await expect(page.getByText('Energy')).toHaveCount(0);
  await expect(page.getByText('Progress signals')).toHaveCount(0);
  await captureViewportScreenshot(page, '06-journal.png', { height: 844, width: 390 });

  await page.locator('header').getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByLabel('App language')).toHaveValue('en');
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByText('Weekly review')).toHaveCount(0);
  await expect(page.getByText('Progress signals')).toHaveCount(0);
  await expectPrimaryNavigation(page);
  await captureViewportScreenshot(page, '07-profile.png', { height: 844, width: 390 });

  await page.goto('/game');
  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Your game plan' })).toBeVisible();

  await page.goto('/game/def.rebound.find-player-first');
  await expect(page).toHaveURL(/\/plan\/def\.rebound\.find-player-first$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Find your player first' }),
  ).toBeVisible();

  await page.goto('/progress');
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();

  await page.goto('/plan');
  await expectPlanStructure(page);
  await captureViewportScreenshot(page, '03-plan-top.png', { height: 844, width: 390 });

  await scrollToLocatorTop(page, page.getByTestId('plan-section-01'), page.getByTestId('plan-section-01'));
  await captureViewportScreenshot(page, '04-plan-map-attack.png', { height: 844, width: 390 });

  await scrollToLocatorTop(
    page,
    page.getByRole('heading', { level: 3, name: 'Rebounding' }),
    page.getByTestId('plan-section-02'),
  );
  await captureViewportScreenshot(page, '05-plan-map-defense.png', { height: 844, width: 390 });

  await activateServiceWorker(page);
  await context.setOffline(true);
  await page.goto('/plan');
  await expectPlanStructure(page);
  await context.setOffline(false);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/plan');
  await expectPlanStructure(page);
  await captureViewportScreenshot(page, '08-plan-desktop.png', { height: 900, width: 1440 });
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
  await page.getByLabel('Competitive level').selectOption('club');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Fundamentals' }).click();
  await page.getByRole('button', { name: 'Defense' }).click();
  await page.getByRole('button', { exact: true, name: 'Confidence' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Ready to start' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();
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
  await expect(primaryNavigation.getByRole('link', { name: 'Profile' })).toHaveCount(0);
  await expect(primaryNavigation.getByRole('link', { name: 'Game' })).toHaveCount(0);
  await expect(primaryNavigation.getByRole('link', { name: 'Progress' })).toHaveCount(0);
}

async function expectHeaderProfileOnly(page: Page): Promise<void> {
  const header = page.locator('header');

  await expect(header.getByRole('link', { name: 'Hoopjot' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  await expect(header.getByText('Online')).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
}

async function expectTodayBeforeFeedback(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: "TODAY'S FOCUS" })).toBeVisible();
  await expect(page.locator('main time')).toBeVisible();
  await expect(page.locator('section[aria-label="Daily focus"]')).toHaveCount(1);
  await expect(page.locator('main button')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Log how it went' })).toBeVisible();
  await expect(page.getByText('Why today')).toBeVisible();
  await expect(page.getByText('Viewed')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mark viewed' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Complete' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skip' })).toHaveCount(0);
  await expect(page.getByText('Energy')).toHaveCount(0);
  await expect(page.getByText('Confidence')).toHaveCount(0);
  await expect(page.getByText('Physical feeling')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start session' })).toHaveCount(0);
}

async function expectQuickReflectionOpen(page: Page): Promise<void> {
  await expect(page.getByText('What was it today?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Practice' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Game' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Learning' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Recovery' })).toHaveCount(0);
  await expect(page.getByText('How did the focus go?')).toBeVisible();
  await expect(page.getByLabel('What did you notice or want to remember?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add coach feedback' })).toBeVisible();
  await expect(page.locator('textarea')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(page.getByText('Remember next time')).toHaveCount(0);
  await expect(page.getByText('Check-in')).toHaveCount(0);
}

async function expectPlanStructure(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: 'Your game plan' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Your starting point' })).toBeVisible();
  await expect(page.getByText('See the whole map')).toBeVisible();

  const map = page.getByTestId('development-map');
  await expect(map.getByRole('heading', { level: 2 }).nth(0)).toHaveText('Attack');
  await expect(map.getByRole('heading', { level: 2 }).nth(1)).toHaveText('Defense');
  await expect(map.getByRole('heading', { level: 2 }).nth(2)).toHaveText('Transition');
  await expect(map.getByRole('heading', { level: 2 }).nth(3)).toHaveText(
    'Communication & decisions',
  );
  await expect(map.getByRole('heading', { level: 2 }).nth(4)).toHaveText('Habits & attention');
  await expect(map.getByRole('heading', { level: 3, name: 'On ball' })).toHaveCount(2);
  await expect(map.getByRole('heading', { level: 3, name: 'Off ball' })).toHaveCount(2);
  await expect(map.getByRole('heading', { level: 3, name: 'Rebounding' })).toBeVisible();
  await expect(map.getByText('TODAY')).toBeVisible();
  await expect(map.getByText(/%/)).toHaveCount(0);
}

async function captureViewportScreenshot(
  page: Page,
  filename: string,
  expectedDimensions: { height: number; width: number },
): Promise<void> {
  const buffer = await page.screenshot({
    fullPage: false,
    path: path.join(finalArtifactsDir, filename),
  });

  expect(readPngDimensions(buffer)).toEqual(expectedDimensions);
}

async function scrollToLocatorTop(page: Page, locator: Locator, revealLocator: Locator): Promise<void> {
  await locator.evaluate((element) => {
    const top = Math.max(0, window.scrollY + element.getBoundingClientRect().top - 16);

    window.scrollTo({ behavior: 'auto', top });
  });
  await expect(locator).toBeInViewport();
  await expect(revealLocator).toHaveCSS('opacity', '1');
}

function readPngDimensions(buffer: Buffer): { height: number; width: number } {
  return {
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  };
}

async function readQuickReflectionState(page: Page, dbName: string) {
  return page.evaluate(async (name) => {
    const readStore = (
      db: IDBDatabase,
      storeName: string,
    ): Promise<Array<Record<string, unknown>>> =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const request = transaction.objectStore(storeName).getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as Array<Record<string, unknown>>);
      });

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    try {
      const [sessions, reflections, checkIns, dailyFocus, syncQueue] = await Promise.all([
        readStore(db, 'sessions'),
        readStore(db, 'reflections'),
        readStore(db, 'checkIns'),
        readStore(db, 'dailyFocus'),
        readStore(db, 'syncQueue'),
      ]);

      return {
        checkIns,
        dailyFocus,
        reflections,
        sessions,
        syncQueueEntityTypes: syncQueue.map((operation) => operation.entityType),
      };
    } finally {
      db.close();
    }
  }, dbName);
}

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

async function enableE2EAuthService(page: Page, dbName: string): Promise<void> {
  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth-service', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);
}
