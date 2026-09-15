export const PRODUCTION_APP_ORIGIN = 'https://hoopjot.com';
const STALE_APP_ORIGIN = 'https://hoopjot.vercel.app';

export function getAuthAppOrigin(
  env: Pick<ImportMetaEnv, 'VITE_SITE_URL' | 'VITE_LEGAL_SITE_URL'> = import.meta.env,
): string {
  const currentOrigin = readCurrentOrigin();

  if (currentOrigin) {
    return currentOrigin;
  }

  return (
    usableOrigin(env.VITE_SITE_URL) ??
    usableOrigin(env.VITE_LEGAL_SITE_URL) ??
    PRODUCTION_APP_ORIGIN
  );
}

export function getAuthEmailRedirectTo(
  env?: Pick<ImportMetaEnv, 'VITE_SITE_URL' | 'VITE_LEGAL_SITE_URL'>,
): string {
  return getAuthAppOrigin(env);
}

export function getAuthPasswordResetRedirectTo(
  env?: Pick<ImportMetaEnv, 'VITE_SITE_URL' | 'VITE_LEGAL_SITE_URL'>,
): string {
  // Same origin as signup so Site URL / Redirect URLs only need https://hoopjot.com.
  // The app relocates recovery callbacks to /recovery without dropping query/hash.
  return getAuthAppOrigin(env);
}

function readCurrentOrigin(): string | undefined {
  if (typeof globalThis.location === 'undefined') {
    return undefined;
  }

  return usableOrigin(globalThis.location.origin);
}

function usableOrigin(value: string | undefined): string | undefined {
  const origin = normalizeOrigin(value);

  if (!origin || isLoopbackOrigin(origin) || origin === STALE_APP_ORIGIN) {
    return undefined;
  }

  return origin;
}

function normalizeOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return undefined;
  }
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return true;
  }
}
