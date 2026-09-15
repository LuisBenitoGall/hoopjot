export const PRODUCTION_APP_ORIGIN = 'https://hoopjot.vercel.app';

export function getAuthAppOrigin(
  env: Pick<ImportMetaEnv, 'VITE_SITE_URL' | 'VITE_LEGAL_SITE_URL'> = import.meta.env,
): string {
  return (
    normalizeOrigin(env.VITE_SITE_URL) ??
    normalizeOrigin(env.VITE_LEGAL_SITE_URL) ??
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
  // Use the same origin as signup. `/recovery` is not in the hosted allow list unless
  // `https://hoopjot.vercel.app/**` was added; Auth then falls back to Site URL
  // (`http://localhost:3000` by default). The app routes `type=recovery` to `/recovery`.
  return getAuthAppOrigin(env);
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
