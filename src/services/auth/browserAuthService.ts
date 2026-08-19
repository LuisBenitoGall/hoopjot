import { MissingSupabaseAuthService, SupabaseAuthService } from './authService';
import { createE2EAuthService } from './e2eAuthService';
import { createSupabaseBrowserClient, getSupabaseBrowserConfig } from './supabaseClient';
import type { AuthService } from './types';

export function createBrowserAuthService(): AuthService {
  const e2eAuthService = createE2EAuthService();

  if (e2eAuthService) {
    return e2eAuthService;
  }

  const config = getSupabaseBrowserConfig();

  if (!config) {
    return new MissingSupabaseAuthService();
  }

  return new SupabaseAuthService(createSupabaseBrowserClient(config), {
    resetRedirectUrl:
      typeof globalThis.location === 'undefined' ? undefined : `${globalThis.location.origin}/recovery`
  });
}
