import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseBrowserConfig {
  anonKey: string;
  url: string;
}

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { anonKey, url };
}

export function createSupabaseBrowserClient(config: SupabaseBrowserConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      // Implicit hash tokens and PKCE `?code=` both need to be read before React Router
      // navigation. Do not set flowType to pkce without an `/auth/confirm` token-hash route.
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}
