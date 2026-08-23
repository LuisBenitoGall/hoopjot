import { expect, type Page, test } from '@playwright/test';

test('pilot user can sign up, onboard in Spanish and complete the daily loop on mobile', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enableE2EAuthService(page, `hoopjot-e2e-release-es-${testInfo.workerIndex}-${Date.now()}`);

  await page.goto('/sign-up');
  await page.getByLabel('Email').fill('player@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Pick your language' })).toBeVisible();
  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.getByRole('heading', { name: 'Elige tu idioma' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByLabel('Año de nacimiento').fill('2010');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Posición principal').selectOption('point_guard');
  await page.getByLabel('Nivel competitivo').selectOption('club');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Fundamentos' }).click();
  await page.getByRole('button', { name: 'Defensa' }).click();
  await page.getByRole('button', { exact: true, name: 'Confianza' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Marca tu punto de partida' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Añade contexto físico' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Listo para empezar' })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar' }).click();

  await expect(page.getByRole('heading', { name: 'Foco de hoy' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.locator('input[name="energy"][value="4"] + span').click();
  await page.locator('input[name="confidence"][value="3"] + span').click();
  await page.locator('input[name="physical-feeling"][value="5"] + span').click();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('En curso')).toBeVisible();
  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByLabel('¿Qué pasó?').fill('Cerré el espacio y recordé la señal.');
  await page.getByRole('button', { name: 'Completar y guardar reflexión' }).click();

  await expect(page.getByRole('heading', { name: 'Reflexión guardada' })).toBeVisible();
  await page.getByRole('link', { name: 'Diario' }).click();
  await expect(page.getByRole('heading', { name: 'Diario' })).toBeVisible();
  await expect(page.getByText('Hay una reflexión guardada para esta sesión.')).toBeVisible();
  await page.getByRole('link', { name: /Abrir detalle de sesión: Entrenamiento/ }).click();
  await expect(page.getByRole('heading', { name: 'Check-in previo' })).toBeVisible();
  await expect(page.getByText('Energía')).toBeVisible();
  await expect(page.getByText('Confianza')).toBeVisible();
  await expect(page.getByText('Sensación corporal')).toBeVisible();
  await expect(page.getByText('3 de 5')).toBeVisible();
  await expect(page.getByText('4 de 5').first()).toBeVisible();
  await expect(page.getByText('5 de 5')).toBeVisible();
});

test('authenticated primary screens stay responsive on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 820 });
  await enableAuthenticatedE2EUser(
    page,
    `hoopjot-e2e-release-responsive-${testInfo.workerIndex}-${Date.now()}`,
  );

  const screens = [
    { heading: "Today's focus", path: '/app' },
    { heading: 'Plan', path: '/plan' },
    { heading: 'Journal', path: '/journal' },
    { heading: 'Profile', path: '/profile' }
  ];

  for (const screen of screens) {
    await page.goto(screen.path);
    await expect(page.getByRole('heading', { exact: true, level: 1, name: screen.heading })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expectAccessiblePrimarySurface(page);
  }
});

test('queued local changes sync after reconnect with the controlled remote adapter', async ({
  context,
  page
}, testInfo) => {
  await enableAuthenticatedE2EUser(
    page,
    `hoopjot-e2e-release-sync-${testInfo.workerIndex}-${Date.now()}`,
    { remoteSync: true },
  );

  await page.goto('/app');
  await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();

  await context.setOffline(true);
  await page.locator('input[name="energy"][value="4"] + span').click();
  await page.locator('input[name="confidence"][value="4"] + span').click();
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.locator('input[name="focus-rating"][value="4"] + span').click();
  await page.getByLabel('What happened?').fill('Queued offline release sync note.');
  await page.getByRole('button', { name: 'Complete + save reflection' }).click();
  await expect(page.getByRole('heading', { name: 'Reflection saved' })).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const rawValue = window.sessionStorage.getItem('hoopjot:e2e-remote-data');
        const data = rawValue ? JSON.parse(rawValue) : null;

        return {
          checkIns: data?.checkIns?.length ?? 0,
          reflections: data?.reflections?.length ?? 0,
          sessions: data?.sessions?.length ?? 0
        };
      }),
    )
    .toEqual({ checkIns: 1, reflections: 1, sessions: 1 });
});

async function enableE2EAuthService(page: Page, dbName: string): Promise<void> {
  await page.addInitScript((name) => {
    window.sessionStorage.setItem('hoopjot:e2e-auth-service', '1');
    window.sessionStorage.setItem('hoopjot:e2e-db-name', name);
  }, dbName);
}

async function enableAuthenticatedE2EUser(
  page: Page,
  dbName: string,
  options: { remoteSync?: boolean } = {},
): Promise<void> {
  await page.addInitScript(
    ({ name, remoteSync }) => {
      window.sessionStorage.setItem('hoopjot:e2e-auth', '1');
      window.sessionStorage.setItem('hoopjot:e2e-onboarded', '1');
      window.sessionStorage.setItem('hoopjot:e2e-db-name', name);

      if (remoteSync) {
        window.sessionStorage.setItem('hoopjot:e2e-remote-sync', '1');
      }
    },
    { name: dbName, remoteSync: Boolean(options.remoteSync) },
  );
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    )
    .toBe(true);
}

async function expectAccessiblePrimarySurface(page: Page): Promise<void> {
  await expectNoHorizontalOverflow(page);
  await expectNamedInteractiveControls(page);
  await expectUsableTapTargets(page);
  await expectKeyboardFocusVisible(page);
  await expectReadableTextContrast(page);
}

async function expectNamedInteractiveControls(page: Page): Promise<void> {
  const unnamedControls = await page.evaluate(() => {
    const isVisibleElement = (element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    };
    const describeElement = (element: HTMLElement): string => {
      const label =
        element.getAttribute('aria-label') ??
        element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) ??
        element.tagName.toLowerCase();

      return `${element.tagName.toLowerCase()} "${label}"`;
    };
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, a[href], input:not([type="hidden"]), select, textarea',
      ),
    );

    return controls
      .filter(isVisibleElement)
      .filter((element) => !hasAccessibleName(element))
      .map(describeElement)
      .slice(0, 5);

    function hasAccessibleName(element: HTMLElement): boolean {
      const ariaLabel = element.getAttribute('aria-label')?.trim();

      if (ariaLabel) {
        return true;
      }

      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const label = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ')
          .trim();

        if (label) {
          return true;
        }
      }

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) {
        if (element.labels && Array.from(element.labels).some((label) => label.textContent?.trim())) {
          return true;
        }
      }

      return Boolean(element.textContent?.trim() || element.title.trim());
    }
  });

  expect(unnamedControls).toEqual([]);
}

async function expectUsableTapTargets(page: Page): Promise<void> {
  const smallTargets = await page.evaluate(() => {
    const isVisibleElement = (element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    };
    const describeElement = (element: HTMLElement): string => {
      const label =
        element.getAttribute('aria-label') ??
        element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) ??
        element.tagName.toLowerCase();

      return `${element.tagName.toLowerCase()} "${label}"`;
    };
    const controls = [
      ...Array.from(document.querySelectorAll<HTMLElement>('button, a[href], select, textarea')),
      ...Array.from(document.querySelectorAll<HTMLElement>('label')).filter((label) =>
        label.querySelector('input[type="radio"]'),
      )
    ];

    return controls
      .filter(isVisibleElement)
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          description: describeElement(element),
          height: Math.round(rect.height),
          width: Math.round(rect.width)
        };
      })
      .filter((target) => target.height < 36 || target.width < 32)
      .slice(0, 5);
  });

  expect(smallTargets).toEqual([]);
}

async function expectKeyboardFocusVisible(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => {
      const isVisibleElement = (element: HTMLElement): boolean => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        );
      };
      const describeElement = (element: HTMLElement): string => {
        const label =
          element.getAttribute('aria-label') ??
          element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) ??
          element.tagName.toLowerCase();

        return `${element.tagName.toLowerCase()} "${label}"`;
      };
      const element = document.activeElement;

      if (!(element instanceof HTMLElement) || element === document.body) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const outlineWidth = Number.parseFloat(style.outlineWidth);
      const hasOutline = style.outlineStyle !== 'none' && outlineWidth > 0;
      const hasRing = style.boxShadow !== 'none';

      if (!isVisibleElement(element) || rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      return hasOutline || hasRing ? describeElement(element) : null;
    });

    if (focused) {
      expect(focused).toBeTruthy();
      return;
    }
  }

  throw new Error('No visibly focused interactive element found after tabbing.');
}

async function expectReadableTextContrast(page: Page): Promise<void> {
  const lowContrastText = await page.evaluate(() => {
    const isVisibleElement = (element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    };
    const describeElement = (element: HTMLElement): string => {
      const label =
        element.getAttribute('aria-label') ??
        element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) ??
        element.tagName.toLowerCase();

      return `${element.tagName.toLowerCase()} "${label}"`;
    };
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a, button, dd, dt, h1, h2, h3, label, legend, p, span',
      ),
    );

    return elements
      .filter(isVisibleElement)
      .filter((element) => Boolean(element.textContent?.trim()))
      .map((element) => getContrastFailure(element))
      .filter((failure): failure is string => Boolean(failure))
      .slice(0, 5);

    function getContrastFailure(element: HTMLElement): string | null {
      const style = getComputedStyle(element);
      const color = parseRgb(style.color);
      const background = findOpaqueBackground(element);

      if (!color || !background) {
        return null;
      }

      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10);
      const minimumRatio = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700) ? 3 : 4.5;
      const ratio = getContrastRatio(color, background);

      return ratio >= minimumRatio
        ? null
        : `${describeElement(element)} contrast ${ratio.toFixed(2)} below ${minimumRatio}`;
    }

    function findOpaqueBackground(element: HTMLElement): Rgb | null {
      let current: HTMLElement | null = element;

      while (current) {
        const style = getComputedStyle(current);
        const background = parseRgb(style.backgroundColor);

        if (background && background.alpha >= 0.95 && style.backgroundImage === 'none') {
          return background;
        }

        current = current.parentElement;
      }

      const bodyBackground = parseRgb(getComputedStyle(document.body).backgroundColor);

      return bodyBackground?.alpha ? bodyBackground : null;
    }

    function getContrastRatio(foreground: Rgb, background: Rgb): number {
      const foregroundLuminance = getRelativeLuminance(foreground);
      const backgroundLuminance = getRelativeLuminance(background);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);

      return (lighter + 0.05) / (darker + 0.05);
    }

    function getRelativeLuminance(color: Rgb): number {
      const [red, green, blue] = [color.red, color.green, color.blue].map((channel) => {
        const normalized = channel / 255;

        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });

      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }

    function parseRgb(value: string): Rgb | null {
      const match = value.match(/rgba?\(([^)]+)\)/);

      if (!match) {
        return null;
      }

      const [red, green, blue, alpha = '1'] = match[1]
        .split(',')
        .map((part) => part.trim());

      return {
        alpha: Number.parseFloat(alpha),
        blue: Number.parseFloat(blue),
        green: Number.parseFloat(green),
        red: Number.parseFloat(red)
      };
    }

    interface Rgb {
      alpha: number;
      blue: number;
      green: number;
      red: number;
    }
  });

  expect(lowContrastText).toEqual([]);
}
