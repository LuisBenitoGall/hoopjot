import { relocatePasswordRecoveryCallback } from './authCallback';
import { getAuthEmailRedirectTo, getAuthPasswordResetRedirectTo } from './authRedirectUrl';
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

  // Move recovery tokens/code onto /recovery before the client reads the URL.
  relocatePasswordRecoveryCallback();

  return new SupabaseAuthService(createSupabaseBrowserClient(config), {
    // Kept for the commented confirmation-email client flow in SupabaseAuthService.signUp.
    emailRedirectTo: getAuthEmailRedirectTo(),
    resetRedirectUrl: getAuthPasswordResetRedirectTo(),
  });
}
