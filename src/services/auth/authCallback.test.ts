import {
  clearPasswordRecoveryIntent,
  getPasswordRecoveryRedirectTarget,
  hasPasswordRecoveryIntent,
  relocatePasswordRecoveryCallback,
} from './authCallback';

describe('password recovery callback', () => {
  const originalHref = globalThis.location.href;

  afterEach(() => {
    clearPasswordRecoveryIntent();
    globalThis.history.replaceState(null, '', originalHref);
  });

  it('moves a recovery callback from the origin to /recovery without dropping search or hash', () => {
    globalThis.history.replaceState(null, '', '/?type=recovery#type=recovery');

    relocatePasswordRecoveryCallback();

    expect(globalThis.location.pathname).toBe('/recovery');
    expect(globalThis.location.search).toBe('?type=recovery');
    expect(globalThis.location.hash).toBe('#type=recovery');
    expect(hasPasswordRecoveryIntent()).toBe(true);
  });

  it('does not rewrite signup callbacks or ordinary pages', () => {
    globalThis.history.replaceState(null, '', '/?type=signup');
    relocatePasswordRecoveryCallback();
    expect(globalThis.location.pathname).toBe('/');

    globalThis.history.replaceState(null, '', '/app');
    relocatePasswordRecoveryCallback();
    expect(globalThis.location.pathname).toBe('/app');
  });

  it('keeps search and hash when building an in-app recovery redirect', () => {
    globalThis.history.replaceState(null, '', '/?code=callback-code&type=recovery#type=recovery');

    expect(getPasswordRecoveryRedirectTarget()).toEqual({
      hash: '#type=recovery',
      pathname: '/recovery',
      search: '?code=callback-code&type=recovery',
    });
  });

  it('remembers recovery intent after the callback fragment is cleared', () => {
    globalThis.history.replaceState(null, '', '/recovery?type=recovery');
    expect(hasPasswordRecoveryIntent()).toBe(true);

    globalThis.history.replaceState(null, '', '/recovery#');
    expect(hasPasswordRecoveryIntent()).toBe(true);

    clearPasswordRecoveryIntent();
    expect(hasPasswordRecoveryIntent()).toBe(false);
  });
});
