import { expect, type Page, test } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const mobileViewport = { height: 844, width: 390 };
const desktopViewport = { height: 900, width: 1440 };
const remoteScreenshotDir = path.join(process.cwd(), 'screenshots', 'remote');

const signInHeading = /^(Sign in|Iniciar sesión)$/;
const emailLabel = /^Email$/;
const passwordLabel = /^(Password|Contraseña)$/;
const signInButton = /^(Sign in|Iniciar sesión)$/;
const primaryNavigation = /^(Primary|Principal)$/;
const loadingStatus =
  /^(Checking session|Comprobando sesión|Loading .+|Cargando .+|Syncing|Sincronizando|Reconnecting|Reconectando)$/;

const fatalTextPatterns: Array<{ cause: string; pattern: RegExp }> = [
  {
    cause: 'Vercel is missing browser-safe Supabase environment variables.',
    pattern: /Supabase (is not configured|no está configurado)/i,
  },
  {
    cause:
      'Supabase profile bootstrap failed. Check table migrations, Data API grants, RLS policies and the anon/publishable key.',
    pattern: /(Profile sync unavailable|Sincronización de perfil no disponible)/i,
  },
  {
    cause: 'The app-level React error boundary rendered.',
    pattern: /(Hoopjot needs a reload|Hoopjot necesita recargarse)/i,
  },
  {
    cause: 'Supabase Auth rejected the session or the credentials.',
    pattern: /(Authentication could not be completed|No se pudo completar la autenticación)/i,
  },
  {
    cause: 'The deployed app could not reach Supabase Auth.',
    pattern:
      /(A network connection is required for this auth action|Se necesita conexión para esta acción de autenticación)/i,
  },
  {
    cause: 'The remote sync queue entered a needs-attention state.',
    pattern: /(Sync needs attention|Sync necesita atención)/i,
  },
  {
    cause: 'An authenticated route rendered a fatal local data load error.',
    pattern:
      /(Focus unavailable|Foco no disponible|Journal unavailable|Diario no disponible|Progress unavailable|Progreso no disponible|Profile unavailable|Perfil no disponible|Profile not found|Perfil no encontrado)/i,
  },
];

const authenticatedScreens: Array<{
  heading: RegExp;
  path: string;
  screenshot: string;
}> = [
  { heading: /^(Today's focus|Foco de hoy)$/, path: '/app', screenshot: '02-today.png' },
  { heading: /^Your game plan$/, path: '/plan', screenshot: '03-plan.png' },
  { heading: /^(Journal|Diario)$/, path: '/journal', screenshot: '04-journal.png' },
  { heading: /^(Profile|Perfil)$/, path: '/profile', screenshot: '05-profile.png' },
];

interface DiagnosticEvent {
  detail?: string;
  method?: string;
  route: string;
  status?: number;
  url: string;
}

interface RemoteDiagnostics {
  consoleErrors: string[];
  failedRequests: DiagnosticEvent[];
  pageErrors: string[];
  responses: DiagnosticEvent[];
}

class RemoteE2EFailure extends Error {}

test('authenticates against deployed Hoopjot and captures authenticated navigation', async ({
  page,
}) => {
  const email = readRequiredEnvironmentValue('E2E_EMAIL');
  const password = readRequiredEnvironmentValue('E2E_PASSWORD');
  const diagnostics = collectRemoteDiagnostics(page);

  try {
    await page.setViewportSize(mobileViewport);
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await waitForSettledPage(page);
    await expect(page.getByRole('heading', { name: signInHeading })).toBeVisible();
    await assertNoFatalText(page, diagnostics);
    await saveRemoteScreenshot(page, '01-sign-in.png');

    await page.getByLabel(emailLabel).fill(email);
    await page.getByLabel(passwordLabel).fill(password);
    await page.getByRole('button', { name: signInButton }).click();

    const bootstrapState = await waitForAuthenticatedBootstrap(page, diagnostics);

    if (bootstrapState === 'onboarding-required') {
      failWithDiagnostics(
        'Authentication succeeded, but this account requires onboarding. This remote test does not create or overwrite production profile data, so primary authenticated navigation was not exercised.',
        diagnostics,
      );
    }

    for (const screen of authenticatedScreens) {
      await validateAuthenticatedScreen(page, screen, diagnostics);
    }

    await page.setViewportSize(desktopViewport);
    await validateAuthenticatedScreen(
      page,
      {
        heading: /^(Today's focus|Foco de hoy)$/,
        path: '/app',
        screenshot: '07-today-desktop.png',
      },
      diagnostics,
    );
  } catch (error) {
    if (error instanceof RemoteE2EFailure) {
      throw error;
    }

    failWithDiagnostics(
      `Remote Vercel/Supabase E2E failed: ${getErrorMessage(error)}`,
      diagnostics,
    );
  }
});

async function validateAuthenticatedScreen(
  page: Page,
  screen: { heading: RegExp; path: string; screenshot: string },
  diagnostics: RemoteDiagnostics,
): Promise<void> {
  await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
  await waitForSettledPage(page);
  await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible();
  await expect(page.getByRole('navigation', { name: primaryNavigation })).toBeVisible();
  await expectStableAuthenticatedApp(page, diagnostics);
  await assertNoFatalText(page, diagnostics);
  await saveRemoteScreenshot(page, screen.screenshot);
}

async function waitForAuthenticatedBootstrap(
  page: Page,
  diagnostics: RemoteDiagnostics,
): Promise<'completed-profile' | 'onboarding-required'> {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const route = getCurrentRoute(page);

    if (route.startsWith('/onboarding')) {
      await assertNoFatalText(page, diagnostics);
      return 'onboarding-required';
    }

    if (
      route.startsWith('/app') &&
      (await page
        .getByRole('heading', { level: 1, name: /^(Today's focus|Foco de hoy)$/ })
        .isVisible())
    ) {
      await expectStableAuthenticatedApp(page, diagnostics);
      return 'completed-profile';
    }

    await assertNoFatalText(page, diagnostics);
    await page.waitForTimeout(500);
  }

  failWithDiagnostics(
    'Timed out waiting for authenticated Hoopjot bootstrap to reach either the app shell or onboarding.',
    diagnostics,
  );
}

async function expectStableAuthenticatedApp(
  page: Page,
  diagnostics: RemoteDiagnostics,
): Promise<void> {
  await waitForSettledPage(page);
  await expect(page.getByText(loadingStatus)).toHaveCount(0, { timeout: 20_000 });
  await assertNoFatalText(page, diagnostics);
}

async function assertNoFatalText(page: Page, diagnostics: RemoteDiagnostics): Promise<void> {
  const fatalText = await findVisibleFatalText(page);

  if (fatalText) {
    failWithDiagnostics(
      `The deployed app rendered a fatal state: ${fatalText.pattern.source}`,
      diagnostics,
      fatalText.cause,
    );
  }
}

async function findVisibleFatalText(
  page: Page,
): Promise<{ cause: string; pattern: RegExp } | null> {
  for (const fatalText of fatalTextPatterns) {
    const matches = page.getByText(fatalText.pattern);
    const count = await matches.count();

    for (let index = 0; index < count; index += 1) {
      if (await matches.nth(index).isVisible()) {
        return fatalText;
      }
    }
  }

  return null;
}

async function saveRemoteScreenshot(page: Page, fileName: string): Promise<void> {
  await fs.mkdir(remoteScreenshotDir, { recursive: true });
  await page.screenshot({
    animations: 'disabled',
    path: path.join(remoteScreenshotDir, fileName),
  });
}

async function waitForSettledPage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  await page.waitForTimeout(300);
}

function collectRemoteDiagnostics(page: Page): RemoteDiagnostics {
  const diagnostics: RemoteDiagnostics = {
    consoleErrors: [],
    failedRequests: [],
    pageErrors: [],
    responses: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(redactSecrets(message.text()));
    }
  });

  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(redactSecrets(error.message));
  });

  page.on('requestfailed', (request) => {
    diagnostics.failedRequests.push({
      detail: redactSecrets(request.failure()?.errorText ?? 'request failed'),
      method: request.method(),
      route: getCurrentRoute(page),
      url: sanitizeUrl(request.url()),
    });
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      diagnostics.responses.push({
        method: response.request().method(),
        route: getCurrentRoute(page),
        status: response.status(),
        url: sanitizeUrl(response.url()),
      });
    }
  });

  return diagnostics;
}

function failWithDiagnostics(
  message: string,
  diagnostics: RemoteDiagnostics,
  causeOverride?: string,
): never {
  throw new RemoteE2EFailure(
    [
      message,
      '',
      'Remote diagnostics:',
      formatDiagnostics(diagnostics),
      '',
      `Likely cause: ${causeOverride ?? inferLikelyCause(diagnostics)}`,
    ].join('\n'),
  );
}

function formatDiagnostics(diagnostics: RemoteDiagnostics): string {
  const sections = [
    formatDiagnosticEvents('HTTP responses >= 400', diagnostics.responses),
    formatDiagnosticEvents('Failed requests', diagnostics.failedRequests),
    formatDiagnosticMessages('Console errors', diagnostics.consoleErrors),
    formatDiagnosticMessages('Page errors', diagnostics.pageErrors),
  ].filter((section) => section.length > 0);

  return sections.length > 0
    ? sections.join('\n\n')
    : 'No failing HTTP responses, request failures, console errors or page errors were captured.';
}

function formatDiagnosticEvents(title: string, events: DiagnosticEvent[]): string {
  if (events.length === 0) {
    return '';
  }

  const lines = events.slice(-8).map((event) => {
    const status = event.status ? ` status=${event.status}` : '';
    const detail = event.detail ? ` detail="${event.detail}"` : '';

    return `- route=${event.route} method=${event.method ?? 'GET'}${status} url=${event.url}${detail}`;
  });

  return [title, ...lines].join('\n');
}

function formatDiagnosticMessages(title: string, messages: string[]): string {
  if (messages.length === 0) {
    return '';
  }

  return [title, ...messages.slice(-8).map((message) => `- ${message}`)].join('\n');
}

function inferLikelyCause(diagnostics: RemoteDiagnostics): string {
  const failedEvents = [...diagnostics.responses, ...diagnostics.failedRequests];

  if (
    failedEvents.some(
      (event) => event.url.includes('/auth/v1/token') && event.status && event.status >= 400,
    )
  ) {
    return 'Supabase Auth rejected the credentials, email/password auth is disabled, or the deployment points at the wrong Supabase project.';
  }

  if (
    failedEvents.some(
      (event) =>
        event.url.includes('/rest/v1/profiles') && (event.status === 401 || event.status === 403),
    )
  ) {
    return 'Supabase profiles access is blocked. Check authenticated role grants, RLS policies and the browser anon/publishable key.';
  }

  if (failedEvents.some((event) => event.url.includes('/rest/v1/') && event.status === 404)) {
    return 'A Supabase REST table endpoint returned 404. The remote migration may not be applied or Data API exposure may be missing.';
  }

  if (
    diagnostics.consoleErrors.some((message) =>
      /Supabase (is not configured|no está configurado)/i.test(message),
    )
  ) {
    return 'The Vercel build is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.';
  }

  return 'Check the failing request, HTTP status, route and console error above against the Vercel deployment and Supabase project.';
}

function getCurrentRoute(page: Page): string {
  try {
    const url = new URL(page.url());

    return `${url.pathname}${url.search}`;
  } catch {
    return page.url();
  }
}

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value);

    for (const key of [...url.searchParams.keys()]) {
      if (/email|key|password|secret|token/i.test(key)) {
        url.searchParams.set(key, '[redacted]');
      }
    }

    return redactSecrets(url.toString());
  } catch {
    return redactSecrets(value);
  }
}

function redactSecrets(value: string): string {
  return [process.env.E2E_EMAIL, process.env.E2E_PASSWORD].reduce((result, secret) => {
    if (!secret) {
      return result;
    }

    return result.split(secret).join('[redacted]');
  }, value);
}

function readRequiredEnvironmentValue(name: 'E2E_EMAIL' | 'E2E_PASSWORD'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the remote E2E suite.`);
  }

  return value;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
