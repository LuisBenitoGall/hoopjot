/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { compileGuideSourceBundle, serializeGuideCompiledBundle } from './guideCompilation';
import {
  loadAndValidateGuideSources,
  serializeGuideSourceBundle,
} from './sourceIngestion';

const projectRoot = resolve(process.cwd());
const guideRootDir = join(projectRoot, 'docs/editorial/guide');
const generatedDir = join(projectRoot, 'src/content/guide/generated');

const sourceBundle = loadAndValidateGuideSources(guideRootDir);
const compiledBundle = compileGuideSourceBundle(sourceBundle);

assertGeneratedFileCurrent(
  join(generatedDir, 'sourceBundle.json'),
  serializeGuideSourceBundle(sourceBundle),
);
assertGeneratedFileCurrent(
  join(generatedDir, 'compiledBundle.json'),
  serializeGuideCompiledBundle(compiledBundle),
);

function assertGeneratedFileCurrent(path: string, expected: string): void {
  const actual = readFileSync(path, 'utf8');

  if (actual !== expected) {
    throw new Error(`${path} is out of date. Run pnpm guide:build.`);
  }
}
