import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const sourceFields = ['jpeg', 'model', 'jsep'];
const cells = ['chromium', 'webkit'].flatMap(engine =>
  [320, 390, 430].map(width => `${engine}/${width}`));

export function evaluateCloseout({ candidate, source, browsers }) {
  if (!/^[a-f0-9]{40}$/.test(candidate) ||
      !sourceFields.every(key => /^[a-f0-9]{64}$/.test(source?.[key])) ||
      !Array.isArray(browsers) || browsers.some(row => !row || typeof row !== 'object')) {
    throw new TypeError('Expected a full candidate SHA, three pinned SHA-256 digests and browser receipts');
  }

  const failures = browsers.filter(row => row.status === 'FAIL');
  const candidateRows = browsers.filter(row => row.checkout === candidate &&
    row.profile === 'original-owner-journey');
  const reasons = [];
  for (const cell of cells) {
    const rows = candidateRows.filter(row => `${row.engine}/${row.width}` === cell);
    const [row] = rows;
    if (rows.length !== 1) {
      reasons.push(`${cell}: expected one receipt, found ${rows.length}`);
      continue;
    }
    if (row.status !== 'PASS' || row.attempt !== 1 ||
        typeof row.process !== 'string' || !row.process.trim() ||
        row.observed?.process !== row.process ||
        !sourceFields.every(key => row.observed[key] === source[key])) {
      reasons.push(`${cell}: missing first-attempt PASS or same-process source identity`);
    }
  }
  const processes = candidateRows.map(row => row.process);
  if (new Set(processes).size !== processes.length) reasons.push('Duplicate browser process identity');
  if (candidateRows.some(row => !cells.includes(`${row.engine}/${row.width}`))) {
    reasons.push('Unexpected browser matrix cell');
  }
  const candidateFailed = candidateRows.some(row => row.status === 'FAIL');
  return { candidate, browserGate: candidateFailed ? 'FAIL' : reasons.length ? 'BLOCKED' : 'PASS',
    reasons, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = evaluateCloseout(JSON.parse(readFileSync(process.argv[2], 'utf8')));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = { PASS: 0, FAIL: 1, BLOCKED: 2 }[result.browserGate];
}
