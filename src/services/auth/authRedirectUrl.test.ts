import {
  PRODUCTION_APP_ORIGIN,
  getAuthAppOrigin,
  getAuthEmailRedirectTo,
  getAuthPasswordResetRedirectTo,
} from './authRedirectUrl';

describe('auth redirect URLs', () => {
  it('uses https://hoopjot.com when no public origin is configured', () => {
    expect(PRODUCTION_APP_ORIGIN).toBe('https://hoopjot.com');
    expect(getAuthAppOrigin({})).toBe('https://hoopjot.com');
    expect(getAuthEmailRedirectTo({})).toBe('https://hoopjot.com');
    expect(getAuthPasswordResetRedirectTo({})).toBe('https://hoopjot.com');
  });

  it('prefers VITE_SITE_URL over the legal site URL and the production fallback', () => {
    expect(
      getAuthEmailRedirectTo({
        VITE_LEGAL_SITE_URL: 'https://legal.example',
        VITE_SITE_URL: 'https://hoopjot.com/',
      }),
    ).toBe('https://hoopjot.com');
  });

  it('uses VITE_LEGAL_SITE_URL when VITE_SITE_URL is empty', () => {
    expect(
      getAuthAppOrigin({
        VITE_LEGAL_SITE_URL: 'https://hoopjot.com/legal',
        VITE_SITE_URL: '   ',
      }),
    ).toBe('https://hoopjot.com');
  });

  it('ignores invalid configured URLs and the retired vercel.app origin', () => {
    expect(
      getAuthEmailRedirectTo({
        VITE_SITE_URL: 'not-a-url',
      }),
    ).toBe(PRODUCTION_APP_ORIGIN);
    expect(
      getAuthPasswordResetRedirectTo({
        VITE_SITE_URL: 'https://hoopjot.vercel.app',
      }),
    ).toBe(PRODUCTION_APP_ORIGIN);
  });
});
