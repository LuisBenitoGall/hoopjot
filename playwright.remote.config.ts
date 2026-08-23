import { defineConfig } from '@playwright/test';

const baseURL = readRemoteBaseUrl();

export default defineConfig({
  testDir: './tests/e2e-remote',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 90_000,
  outputDir: 'test-results/remote',
  use: {
    actionTimeout: 15_000,
    baseURL,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    viewport: { height: 844, width: 390 },
  },
  projects: [
    {
      name: 'remote-chromium',
      use: { browserName: 'chromium' },
    },
  ],
});

function readRemoteBaseUrl(): string {
  const rawValue = process.env.PLAYWRIGHT_BASE_URL?.trim();

  if (!rawValue) {
    throw new Error(
      'PLAYWRIGHT_BASE_URL is required for the remote E2E suite. Point it at the deployed Hoopjot URL.',
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawValue);
  } catch {
    throw new Error('PLAYWRIGHT_BASE_URL must be an absolute http(s) URL.');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('PLAYWRIGHT_BASE_URL must use http or https.');
  }

  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedUrl.hostname)) {
    throw new Error(
      'PLAYWRIGHT_BASE_URL must point at a deployed environment, not a local server.',
    );
  }

  parsedUrl.hash = '';
  parsedUrl.search = '';

  return parsedUrl.toString().replace(/\/$/, '');
}
