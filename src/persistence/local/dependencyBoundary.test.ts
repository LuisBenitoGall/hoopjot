const localPersistenceSources = import.meta.glob('./**/*.ts', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>;

describe('local persistence boundary', () => {
  it('does not store domain data in localStorage', () => {
    const violations = Object.entries(localPersistenceSources)
      .filter(([filePath]) => !filePath.includes('.test.'))
      .filter(([, source]) => /\blocalStorage\b/.test(source))
      .map(([filePath]) => filePath);

    expect(violations).toEqual([]);
  });
});

