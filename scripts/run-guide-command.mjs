/* global console, process */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { build } from 'vite';

const commands = {
  build: 'src/content/guide/guideBuild.ts',
  check: 'src/content/guide/guideCheck.ts',
};

const command = process.argv[2];

if (!command || !(command in commands)) {
  console.error('Usage: node scripts/run-guide-command.mjs <build|check>');
  process.exitCode = 1;
} else {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'hoopjot-guide-'));
  const entry = path.resolve(commands[command]);
  const outputFile = 'guide-command.mjs';

  try {
    await build({
      build: {
        emptyOutDir: true,
        minify: false,
        outDir: tempDir,
        rollupOptions: {
          output: {
            entryFileNames: outputFile,
            format: 'esm',
          },
        },
        ssr: entry,
        target: 'node20',
      },
      configFile: false,
      logLevel: 'error',
    });

    await import(pathToFileURL(path.join(tempDir, outputFile)).href);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}
