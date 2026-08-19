/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_E2E_AUTH_EMAIL?: string;
  readonly VITE_E2E_AUTH_USER_ID?: string;
  readonly VITE_ENABLE_E2E_AUTH?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
}
