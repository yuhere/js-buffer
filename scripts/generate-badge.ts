import { readFileSync, writeFileSync } from 'fs';
import { existsSync } from 'fs';

// Update the version badge and (when available) coverage badge in README.md.

// ── version ────────────────────────────────────────────────────────────────
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const versionBadge = `https://img.shields.io/badge/npm-v${pkg.version}-blue`;

// ── coverage ───────────────────────────────────────────────────────────────
let coverageBadge = '';
const coverageFile = 'coverage/merged/coverage-final.json';

if (existsSync(coverageFile)) {
  interface CoverageFile {
    statementMap: Record<string, { start: { line: number } }>;
    s: Record<string, number>;
  }

  const coverage = JSON.parse(
    readFileSync(coverageFile, 'utf8')
  ) as Record<string, CoverageFile>;

  const lineHits = new Map<number, boolean>();
  for (const data of Object.values(coverage)) {
    for (const [stmtId, count] of Object.entries(data.s)) {
      const stmt = data.statementMap[stmtId];
      if (stmt) {
        const line = stmt.start.line;
        if (count > 0) lineHits.set(line, true);
        else if (!lineHits.has(line)) lineHits.set(line, false);
      }
    }
  }

  const total = lineHits.size;
  const covered = [...lineHits.values()].filter(Boolean).length;
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const color = pct >= 80 ? 'brightgreen' : pct >= 60 ? 'yellow' : 'red';
  coverageBadge = `https://img.shields.io/badge/coverage-${pct}%25-${color}`;
}

// ── update README ──────────────────────────────────────────────────────────
const readme = readFileSync('README.md', 'utf8');

let updated = readme.replace(
  /https:\/\/img\.shields\.io\/badge\/npm-v[^"')]+/,
  versionBadge
);

if (coverageBadge) {
  updated = updated.replace(
    /https:\/\/img\.shields\.io\/badge\/coverage-[^"')]+/,
    coverageBadge
  );
}

if (updated !== readme) {
  writeFileSync('README.md', updated);
  console.log(`README.md updated: version=${pkg.version}${coverageBadge ? `, coverage updated` : ''}`);
} else {
  console.log('README.md already up to date');
}
