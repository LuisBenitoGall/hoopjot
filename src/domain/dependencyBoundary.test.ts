const domainSources = import.meta.glob('./**/*.ts', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>;

const forbiddenImportPatterns = [
  /from\s+['"]react(?:\/[^'"]*)?['"]/,
  /from\s+['"]react-dom(?:\/[^'"]*)?['"]/,
  /from\s+['"]dexie(?:\/[^'"]*)?['"]/,
  /from\s+['"]@supabase\/supabase-js['"]/
];

const forbiddenBrowserApiPatterns = [
  /\bwindow\b/,
  /\bdocument\b/,
  /\bnavigator\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/
];

describe('domain dependency boundary', () => {
  it('does not import React, Dexie, Supabase or browser APIs', () => {
    const violations = Object.entries(domainSources)
      .filter(([filePath]) => !filePath.includes('.test.'))
      .flatMap(([filePath, source]) =>
        [...forbiddenImportPatterns, ...forbiddenBrowserApiPatterns]
          .filter((pattern) => pattern.test(source))
          .map((pattern) => `${filePath}: ${pattern.source}`),
      );

    expect(violations).toEqual([]);
  });
});

