import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const require = createRequire(import.meta.url);

// istanbul-lib-coverage's ESM export is incomplete — use createRequire for CJS interop
const { createCoverageMap } = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

// Read coverage from both runs
const nodeCoverage = JSON.parse(
  readFileSync('coverage/node/coverage-final.json', 'utf8')
);
const browserCoverage = JSON.parse(
  readFileSync('coverage/browser/coverage-final.json', 'utf8')
);

// Merge
const mergedMap = createCoverageMap(nodeCoverage);
mergedMap.merge(browserCoverage);

// Write merged JSON
mkdirSync('coverage/merged', { recursive: true });
writeFileSync(
  'coverage/merged/coverage-final.json',
  JSON.stringify(mergedMap.toJSON())
);

// Generate reports
const context = libReport.createContext({
  dir: 'coverage/merged',
  coverageMap: mergedMap,
});
reports.create('text').execute(context);
reports.create('html').execute(context);
reports.create('lcov').execute(context);

console.log('Coverage reports merged to coverage/merged/');
