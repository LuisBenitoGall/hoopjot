/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_E2E_AUTH_EMAIL?: string;
  readonly VITE_E2E_AUTH_USER_ID?: string;
  readonly VITE_ENABLE_E2E_AUTH?: string;
  readonly VITE_LEGAL_BACKEND_PROVIDER?: string;
  readonly VITE_LEGAL_DPO_EMAIL?: string;
  readonly VITE_LEGAL_EFFECTIVE_DATE?: string;
  readonly VITE_LEGAL_HOSTING_PROVIDER?: string;
  readonly VITE_LEGAL_OWNER_ADDRESS?: string;
  readonly VITE_LEGAL_OWNER_EMAIL?: string;
  readonly VITE_LEGAL_OWNER_NAME?: string;
  readonly VITE_LEGAL_OWNER_NIF?: string;
  readonly VITE_LEGAL_OWNER_PHONE?: string;
  readonly VITE_LEGAL_PRIVACY_EMAIL?: string;
  readonly VITE_LEGAL_SITE_URL?: string;
  readonly VITE_LEGAL_SUPABASE_REGION?: string;
  readonly VITE_LEGAL_TRADE_REGISTER?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
}
