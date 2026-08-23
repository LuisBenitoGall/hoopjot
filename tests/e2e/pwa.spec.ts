import { expect, type Page, test } from '@playwright/test';

test('publishes an installable manifest and active service worker', async ({ page }) => {
  await page.goto('/');

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifestResponse = await page.request.get(new URL(manifestHref ?? '', page.url()).toString());
  expect(manifestResponse.ok()).toBe(true);

  const manifest = (await manifestResponse.json()) as {
    display?: string;
    icons?: Array<{ purpose?: string; sizes?: string; src?: string }>;
    name?: string;
    short_name?: string;
    scope?: string;
    start_url?: string;
  };

  expect(manifest.name).toBe('Hoopjot');
  expect(manifest.short_name).toBe('Hoopjot');
  expect(manifest.display).toBe('standalone');
  expect(manifest.scope).toBe('/');
  expect(manifest.start_url).toBe('/');
  expect(manifest.icons?.some((icon) => icon.sizes === '192x192')).toBe(true);
  expect(manifest.icons?.some((icon) => icon.sizes === '512x512')).toBe(true);
  expect(manifest.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);

  await activateServiceWorker(page);

  const cdpSession = await page.context().newCDPSession(page);
  const installability = (await cdpSession.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: Array<{ errorArguments: unknown[]; errorId: string }>;
  };

  expect(installability.installabilityErrors).toEqual([]);

  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.some((name) => name.toLowerCase().includes('supabase'))).toBe(false);
});

test('keeps core local flows and curated content usable after connectivity is disabled', async ({
  context,
  page
}, testInfo) => {
  const dbName = `hoopjot-e2e-pwa-${testInfo.workerIndex}-${Date.now()}`;

  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
    window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);

  await page.goto('/app');
  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
  await activateServiceWorker(page);

  await page.getByRole('link', { name: 'Game' }).click();
  await expect(page.getByRole('heading', { name: 'Basketball knowledge base' })).toBeVisible();
  await expect(page.getByText('12 guidelines')).toBeVisible();

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Basketball knowledge base' })).toBeVisible();
  await expect(page.getByText('Offline ready')).toBeVisible();

  await page.getByRole('link', { name: 'Today' }).click();
  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();

  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByText('In progress')).toBeVisible();
  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByLabel('What happened?').fill('Offline shell still lets local reflection work.');
  await page.getByRole('button', { name: 'Complete + save reflection' }).click();

  await expect(page.getByRole('heading', { name: 'Reflection saved' })).toBeVisible();

  await page.getByRole('link', { name: 'Journal' }).click();
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
  await expect(page.getByText('A reflection is saved for this session.')).toBeVisible();
  await page.getByRole('link', { name: /Open session detail: Practice/ }).click();
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();
  await expect(page.getByText('Offline shell still lets local reflection work.')).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByText('Reconnecting')).toBeVisible();
});

test('requires network for a new unauthenticated sign-in', async ({ context, page }) => {
  await page.goto('/sign-in');
  await activateServiceWorker(page);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill('player@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByText('A network connection is required for this auth action.'),
  ).toBeVisible();

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
