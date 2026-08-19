import { createContext, useContext } from 'react';

export type PwaConnectionStatus = 'offline' | 'online' | 'reconnecting';

export interface PwaContextValue {
  connectionStatus: PwaConnectionStatus;
  isApplyingUpdate: boolean;
  isOfflineReady: boolean;
  isServiceWorkerRegistered: boolean;
  isUpdateAvailable: boolean;
  registrationError: boolean;
  refreshApp: () => Promise<void>;
}

export const defaultPwaContextValue: PwaContextValue = {
  connectionStatus: getInitialConnectionStatus(),
  isApplyingUpdate: false,
  isOfflineReady: false,
  isServiceWorkerRegistered: false,
  isUpdateAvailable: false,
  registrationError: false,
  refreshApp: async () => undefined
};

export const PwaContext = createContext<PwaContextValue>(defaultPwaContextValue);

export function usePwaStatus(): PwaContextValue {
  return useContext(PwaContext);
}

export function getInitialConnectionStatus(): PwaConnectionStatus {
  if (typeof navigator === 'undefined') {
    return 'online';
  }

  return navigator.onLine ? 'online' : 'offline';
}
