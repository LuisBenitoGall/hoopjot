import {
  PRODUCTION_APP_ORIGIN,
  getAuthAppOrigin,
  getAuthEmailRedirectTo,
  getAuthPasswordResetRedirectTo,
} from './authRedirectUrl';

describe('auth redirect URLs', () => {
  it('always sends https://hoopjot.com for signup and recovery emails', () => {
    expect(PRODUCTION_APP_ORIGIN).toBe('https://hoopjot.com');
    expect(getAuthAppOrigin()).toBe('https://hoopjot.com');
    expect(getAuthEmailRedirectTo()).toBe('https://hoopjot.com');
    expect(getAuthPasswordResetRedirectTo()).toBe('https://hoopjot.com');
  });

  it('does not derive email redirects from the current browsing origin', () => {
    expect(getAuthEmailRedirectTo()).toBe(PRODUCTION_APP_ORIGIN);
    expect(getAuthPasswordResetRedirectTo()).toBe(PRODUCTION_APP_ORIGIN);
  });
});
