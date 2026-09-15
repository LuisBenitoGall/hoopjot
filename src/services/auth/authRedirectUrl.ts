/** Official public origin. Hosted Auth Site URL / Redirect URLs must match this value. */
export const PRODUCTION_APP_ORIGIN = 'https://hoopjot.com';

/**
 * Origin sent as `emailRedirectTo` / `resetPasswordForEmail({ redirectTo })`.
 *
 * Always the canonical public origin, not `window.location.origin`. Preview hosts,
 * www, and leftover Vercel URLs are not on the hosted allow-list; Auth then rejects
 * the request and no signup/recovery email is sent.
 */
export function getAuthAppOrigin(): string {
  return PRODUCTION_APP_ORIGIN;
}

export function getAuthEmailRedirectTo(): string {
  return PRODUCTION_APP_ORIGIN;
}

export function getAuthPasswordResetRedirectTo(): string {
  // Same origin as signup so Site URL / Redirect URLs only need https://hoopjot.com.
  // The app relocates recovery callbacks to /recovery without dropping query/hash.
  return PRODUCTION_APP_ORIGIN;
}
