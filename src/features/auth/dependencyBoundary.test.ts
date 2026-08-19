const presentationSources = {
  ...import.meta.glob('../../app/**/*.{ts,tsx}', {
    eager: true,
    import: 'default',
    query: '?raw'
  }),
  ...import.meta.glob('../../components/**/*.{ts,tsx}', {
    eager: true,
    import: 'default',
    query: '?raw'
  }),
  ...import.meta.glob('../../features/**/*.{ts,tsx}', {
    eager: true,
    import: 'default',
    query: '?raw'
  })
} as Record<string, string>;

describe('auth dependency boundaries', () => {
  it('keeps Supabase calls out of React presentation modules', () => {
    const violations = Object.entries(presentationSources)
      .filter(([path]) => !path.includes('.test.'))
      .filter(([, source]) => source.includes('@supabase/supabase-js') || source.includes('createClient('))
      .map(([path]) => path);

    expect(violations).toEqual([]);
  });
});
