import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  getInitialConnectionStatus,
  PwaContext,
  type PwaConnectionStatus,
  type PwaContextValue
} from './pwaContext';

interface PwaProviderProps {
  children: ReactNode;
}

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

const reconnectingStatusDurationMs = 1200;
const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`;
const connectivityProbeTimeoutMs = 3000;

export function PwaProvider({ children }: PwaProviderProps) {
  const updateServiceWorkerRef = useRef<UpdateServiceWorker | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<PwaConnectionStatus>(
    getInitialConnectionStatus,
  );
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registrationError, setRegistrationError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let mounted = true;
    let reconnectingTimer: number | undefined;

    const clearReconnectingTimer = () => {
      if (reconnectingTimer) {
        window.clearTimeout(reconnectingTimer);
      }
    };

    const markOffline = () => {
      clearReconnectingTimer();
      setConnectionStatus('offline');
    };

    const markReconnecting = () => {
      clearReconnectingTimer();
      setConnectionStatus('reconnecting');
      void probeConnection().then((status) => {
        reconnectingTimer = window.setTimeout(() => {
          if (mounted) {
            setConnectionStatus(status);
          }
        }, reconnectingStatusDurationMs);
      });
    };

    void probeConnection().then((status) => {
      if (mounted) {
        setConnectionStatus(status);
      }
    });

    window.addEventListener('offline', markOffline);
    window.addEventListener('online', markReconnecting);

    return () => {
      mounted = false;
      clearReconnectingTimer();
      window.removeEventListener('offline', markOffline);
      window.removeEventListener('online', markReconnecting);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return undefined;
    }

    let mounted = true;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl);

        if (!mounted) {
          return;
        }

        setIsServiceWorkerRegistered(true);
        updateServiceWorkerRef.current = createUpdateHandler(registration);
        watchRegistrationForUpdates(registration, () => {
          if (mounted) {
            setIsUpdateAvailable(true);
          }
        });

        await navigator.serviceWorker.ready;

        if (mounted) {
          setIsOfflineReady(true);
        }

        if (registration.waiting && navigator.serviceWorker.controller) {
          setIsUpdateAvailable(true);
        }
      } catch {
        if (mounted) {
          setRegistrationError(true);
        }
      }
    };

    void register();

    return () => {
      mounted = false;
      updateServiceWorkerRef.current = null;
    };
  }, []);

  const refreshApp = useCallback(async () => {
    if (!updateServiceWorkerRef.current) {
      return;
    }

    setIsApplyingUpdate(true);

    try {
      await updateServiceWorkerRef.current(true);
    } finally {
      setIsApplyingUpdate(false);
    }
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      connectionStatus,
      isApplyingUpdate,
      isOfflineReady,
      isServiceWorkerRegistered,
      isUpdateAvailable,
      refreshApp,
      registrationError
    }),
    [
      connectionStatus,
      isApplyingUpdate,
      isOfflineReady,
      isServiceWorkerRegistered,
      isUpdateAvailable,
      refreshApp,
      registrationError
    ],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

function watchRegistrationForUpdates(
  registration: ServiceWorkerRegistration,
  onUpdateAvailable: () => void,
): void {
  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;

    if (!installingWorker) {
      return;
    }

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        onUpdateAvailable();
      }
    });
  });
}

function createUpdateHandler(registration: ServiceWorkerRegistration): UpdateServiceWorker {
  return async (reloadPage = true) => {
    if (!registration.waiting) {
      await registration.update();
      return;
    }

    const controllerChange = reloadPage
      ? new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => {
              window.location.reload();
              resolve();
            },
            { once: true },
          );
        })
      : Promise.resolve();

    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    await controllerChange;
  };
}

async function probeConnection(): Promise<PwaConnectionStatus> {
  if (typeof window === 'undefined' || typeof AbortController === 'undefined') {
    return getInitialConnectionStatus();
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), connectivityProbeTimeoutMs);

  try {
    await fetch(
      new URL(`${import.meta.env.BASE_URL}__hoopjot-connectivity-check`, window.location.origin),
      {
        cache: 'no-store',
        method: 'HEAD',
        signal: controller.signal
      },
    );

    return 'online';
  } catch {
    return 'offline';
  } finally {
    window.clearTimeout(timeoutId);
  }
}
