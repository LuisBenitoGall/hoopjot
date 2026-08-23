export interface LegalConfig {
  appName: string;
  backendProvider: string;
  backendRegion: string;
  dpoEmail: string;
  effectiveDate: string;
  hostingProvider: string;
  ownerAddress: string;
  ownerEmail: string;
  ownerName: string;
  ownerNif: string;
  ownerPhone: string;
  privacyEmail: string;
  siteUrl: string;
  tradeRegister: string;
}

export function getLegalConfig(): LegalConfig {
  const ownerEmail = readEnvValue(import.meta.env.VITE_LEGAL_OWNER_EMAIL);

  return {
    appName: 'Hoopjot',
    backendProvider: readEnvValue(import.meta.env.VITE_LEGAL_BACKEND_PROVIDER) || 'Supabase',
    backendRegion: readEnvValue(import.meta.env.VITE_LEGAL_SUPABASE_REGION),
    dpoEmail: readEnvValue(import.meta.env.VITE_LEGAL_DPO_EMAIL),
    effectiveDate: readEnvValue(import.meta.env.VITE_LEGAL_EFFECTIVE_DATE) || '2026-08-23',
    hostingProvider: readEnvValue(import.meta.env.VITE_LEGAL_HOSTING_PROVIDER) || 'Vercel',
    ownerAddress: readEnvValue(import.meta.env.VITE_LEGAL_OWNER_ADDRESS),
    ownerEmail,
    ownerName: readEnvValue(import.meta.env.VITE_LEGAL_OWNER_NAME),
    ownerNif: readEnvValue(import.meta.env.VITE_LEGAL_OWNER_NIF),
    ownerPhone: readEnvValue(import.meta.env.VITE_LEGAL_OWNER_PHONE),
    privacyEmail: readEnvValue(import.meta.env.VITE_LEGAL_PRIVACY_EMAIL) || ownerEmail,
    siteUrl: readEnvValue(import.meta.env.VITE_LEGAL_SITE_URL),
    tradeRegister: readEnvValue(import.meta.env.VITE_LEGAL_TRADE_REGISTER)
  };
}

export function createLegalInterpolationValues(
  config: LegalConfig,
  missingValue: string,
  notApplicableValue: string,
): Record<keyof LegalConfig, string> {
  return {
    appName: config.appName,
    backendProvider: config.backendProvider || missingValue,
    backendRegion: config.backendRegion || notApplicableValue,
    dpoEmail: config.dpoEmail || notApplicableValue,
    effectiveDate: config.effectiveDate || missingValue,
    hostingProvider: config.hostingProvider || missingValue,
    ownerAddress: config.ownerAddress || missingValue,
    ownerEmail: config.ownerEmail || missingValue,
    ownerName: config.ownerName || missingValue,
    ownerNif: config.ownerNif || missingValue,
    ownerPhone: config.ownerPhone || notApplicableValue,
    privacyEmail: config.privacyEmail || missingValue,
    siteUrl: config.siteUrl || missingValue,
    tradeRegister: config.tradeRegister || notApplicableValue
  };
}

function readEnvValue(value: string | undefined): string {
  return value?.trim() ?? '';
}
