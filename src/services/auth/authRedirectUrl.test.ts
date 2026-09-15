import {
  PRODUCTION_APP_ORIGIN,
  getAuthAppOrigin,
  getAuthEmailRedirectTo,
  getAuthPasswordResetRedirectTo,
} from './authRedirectUrl';

describe('auth redirect URLs', () => {
  it('uses the production app origin already in the repo by default', () => {
    expect(PRODUCTION_APP_ORIGIN).toBe('https://hoopjot.vercel.app');
    expect(getAuthAppOrigin({})).toBe('https://hoopjot.vercel.app');
    expect(getAuthEmailRedirectTo({})).toBe('https://hoopjot.vercel.app');
    expect(getAuthPasswordResetRedirectTo({})).toBe('https://hoopjot.vercel.app/recovery');
  });

  it('prefers VITE_SITE_URL over the legal site URL and the production fallback', () => {
    expect(
      getAuthEmailRedirectTo({
        VITE_LEGAL_SITE_URL: 'https://legal.example',
        VITE_SITE_URL: 'https://hoopjot.vercel.app/',
      }),
    ).toBe('https://hoopjot.vercel.app');
  });

  it('uses VITE_LEGAL_SITE_URL when VITE_SITE_URL is empty', () => {
    expect(
      getAuthAppOrigin({
        VITE_LEGAL_SITE_URL: 'https://hoopjot.vercel.app/legal',
        VITE_SITE_URL: '   ',
      }),
    ).toBe('https://hoopjot.vercel.app');
  });

  it('ignores invalid configured URLs', () => {
    expect(
      getAuthEmailRedirectTo({
        VITE_SITE_URL: 'not-a-url',
      }),
    ).toBe(PRODUCTION_APP_ORIGIN);
  });
});
