import { readFileSync, writeFileSync } from 'fs';

// Read merged Istanbul coverage, calculate line coverage %, and update the
// static shields.io badge URL in README.md.

interface CoverageFile {
  statementMap: Record<string, { start: { line: number } }>;
  s: Record<string, number>;
}

const coverage = JSON.parse(
  readFileSync('coverage/merged/coverage-final.json', 'utf8')
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

const badgeUrl = `https://img.shields.io/badge/coverage-${pct}%25-${color}`;

// Replace the coverage badge line in README.md
const readme = readFileSync('README.md', 'utf8');
const updated = readme.replace(
  /https:\/\/img\.shields\.io\/badge\/coverage-[^"')]+/,
  badgeUrl
);
writeFileSync('README.md', updated);

console.log(`Coverage badge updated in README.md: ${pct}%`);
