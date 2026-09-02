/// <reference types="node" />

import { join, resolve } from 'node:path';

import { writeGuideCompiledBundle } from './guideCompilation';
import { writeGuideSourceBundle } from './sourceIngestion';

const projectRoot = resolve(process.cwd());
const guideRootDir = join(projectRoot, 'docs/editorial/guide');
const generatedDir = join(projectRoot, 'src/content/guide/generated');

writeGuideSourceBundle({
  guideRootDir,
  outputPath: join(generatedDir, 'sourceBundle.json'),
});

writeGuideCompiledBundle({
  guideRootDir,
  outputPath: join(generatedDir, 'compiledBundle.json'),
});
