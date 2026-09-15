const RECOVERY_INTENT_STORAGE_KEY = 'hoopjot:password-recovery-intent';

export function relocatePasswordRecoveryCallback(): void {
  if (typeof globalThis.location === 'undefined' || typeof globalThis.history === 'undefined') {
    return;
  }

  const url = new URL(globalThis.location.href);

  if (url.pathname === '/recovery' || !isPasswordRecoveryCallback(url)) {
    return;
  }

  rememberPasswordRecoveryIntent();
  url.pathname = '/recovery';
  globalThis.history.replaceState(
    globalThis.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function getPasswordRecoveryRedirectTarget(): {
  hash: string;
  pathname: '/recovery';
  search: string;
} {
  if (typeof globalThis.location === 'undefined') {
    return { hash: '', pathname: '/recovery', search: '' };
  }

  if (isPasswordRecoveryCallback(new URL(globalThis.location.href))) {
    rememberPasswordRecoveryIntent();
  }

  return {
    hash: globalThis.location.hash,
    pathname: '/recovery',
    search: globalThis.location.search,
  };
}

export function hasPasswordRecoveryIntent(): boolean {
  if (
    typeof globalThis.location !== 'undefined' &&
    isPasswordRecoveryCallback(new URL(globalThis.location.href))
  ) {
    rememberPasswordRecoveryIntent();
    return true;
  }

  return readPasswordRecoveryIntent();
}

export function clearPasswordRecoveryIntent(): void {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return;
  }

  globalThis.sessionStorage.removeItem(RECOVERY_INTENT_STORAGE_KEY);
}

function isPasswordRecoveryCallback(url: URL): boolean {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));

  return url.searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
}

export function rememberPasswordRecoveryIntent(): void {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return;
  }

  globalThis.sessionStorage.setItem(RECOVERY_INTENT_STORAGE_KEY, '1');
}

function readPasswordRecoveryIntent(): boolean {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return false;
  }

  return globalThis.sessionStorage.getItem(RECOVERY_INTENT_STORAGE_KEY) === '1';
}
