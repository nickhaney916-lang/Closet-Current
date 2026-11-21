import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const candidateSha = 'ed340449514255c4bda84eb47f64187e5bd546c8';

// These SHA-1 values are immutable Git blob identities from the reviewed candidate.
// These suites verify limited, named behaviors; none proves a real signed-in owner journey.
export const suites = Object.freeze([
  {
    id: 'account-session-binding',
    file: 'tests/auth.test.cjs',
    blob: 'e263fe55f44d76ba5fc86d49a687c45d7332e2ab',
    requiredCase: 'cloud token refresh cannot switch to a different account',
  },
  {
    id: 'photo-review-failure-visibility',
    file: 'tests/photo-results.test.cjs',
    blob: '90fcce9209e0bcefda148d1276cab57274fa7d17',
    requiredCase: 'failed recognition keeps the photo and offers correction and crop actions without guessing',
  },
  {
    id: 'backup-conflict-protection',
    file: 'tests/cloud-backup.test.cjs',
    blob: '40023bab161729fe00320c7ba79a2ce63febd346',
    requiredCase: 'conflicting labels and edit versus delete require review rather than silent overwrite',
  },
  {
    id: 'outfit-reference-integrity',
    file: 'tests/outfit-board.test.cjs',
    blob: '2eab44c221a776fa5ae88d8461e56a115cab306b',
    requiredCase: 'dress covers top and bottom and incompatible or deleted references are removed',
  },
]);

const block = reason => ({ status: 'BLOCKED', reason, familyAlpha: 'HOLD' });

export function parseTap(stdout) {
  const count = key => {
    const rows = [...stdout.matchAll(new RegExp('^# ' + key + ' (\\d+)\\s*$', 'gm'))];
    return rows.length === 1 ? Number(rows[0][1]) : null;
  };
  return {
    tests: count('tests'),
    pass: count('pass'),
    fail: count('fail'),
    cancelled: count('cancelled'),
    skipped: count('skipped'),
    todo: count('todo'),
    names: [...stdout.matchAll(/^# Subtest: (.+)$/gm)].map(match => match[1].trim()),
  };
}

// Offline verdict only. A green fixture is not an authenticated GitHub Actions receipt.
// The CLI below constructs the evidence by executing real, SHA-pinned checkout files.
export function verifySuiteEvidence(receipt) {
  if (receipt?.sourceSha !== candidateSha) return block('Candidate commit SHA is absent or mismatched');
  if (!receipt.blobs || !Array.isArray(receipt.runs) || receipt.runs.length !== suites.length) {
    return block('Complete file and execution inventory is missing');
  }
  if (new Set(receipt.runs.map(row => row?.file)).size !== suites.length) {
    return block('Missing or duplicated suite execution');
  }
  for (const suite of suites) {
    if (receipt.blobs[suite.file] !== suite.blob) return block('Source blob mismatch: ' + suite.file);
    const result = receipt.runs.find(row => row.file === suite.file);
    if (!result || result.exitCode !== 0 || result.error || result.signal) {
      return block('Suite failed, timed out, or was not executed: ' + suite.file);
    }
    const summary = result.tap;
    if (!summary || !Number.isSafeInteger(summary.tests) || summary.tests < 1 ||
        summary.pass !== summary.tests || summary.fail !== 0 ||
        summary.skipped !== 0 || summary.cancelled !== 0 || summary.todo !== 0) {
      return block('Incomplete, failed, or skipped Node TAP: ' + suite.file);
    }
    if (!Array.isArray(summary.names) || !summary.names.includes(suite.requiredCase)) {
      return block('Required real named behavior missing: ' + suite.file);
    }
  }
  return {
    status: 'PASS',
    sourceSha: candidateSha,
    suites: suites.map(({ id, file }) => ({ id, file })),
    scope: 'Four exact-source ordinary Node suites with named account/photo/backup/outfit checks',
    originalOwnerFlow: false,
    realAccountIsolation: false,
    chromium: false,
    webkit: false,
    nativeRepair: false,
    familyAlpha: 'HOLD',
  };
}

function command(cwd, bin, args, timeout = 90_000) {
  const env = { ...process.env };
  // Node 22's own test process marker would incorrectly make a nested child silent.
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(bin, args, { cwd, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024, env });
  return result;
}

export function collectLocalEvidence(checkout) {
  const cwd = resolve(checkout);
  const git = (...args) => {
    const r = command(cwd, 'git', args);
    if (r.error || r.status !== 0) throw Error('Git checkout identity unavailable: ' + (r.stderr || r.error));
    return r.stdout.trim();
  };
  const receipt = { sourceSha: git('rev-parse', 'HEAD'), blobs: {}, runs: [] };
  for (const suite of suites) {
    receipt.blobs[suite.file] = git('rev-parse', 'HEAD:' + suite.file);
    const result = command(cwd, process.execPath, ['--test', '--test-concurrency=1', suite.file]);
    receipt.runs.push({
      file: suite.file,
      exitCode: result.status,
      signal: result.signal,
      error: result.error?.message ?? null,
      tap: parseTap(result.stdout || ''),
    });
  }
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const receipt = collectLocalEvidence(process.argv[2] || '.');
    const verdict = verifySuiteEvidence(receipt);
    console.log(JSON.stringify({ ...verdict, counts: receipt.runs.map(r => ({
      file: r.file, tests: r.tap.tests, pass: r.tap.pass, fail: r.tap.fail, skipped: r.tap.skipped,
    })) }, null, 2));
    if (verdict.status !== 'PASS') process.exitCode = 1;
  } catch (e) {
    console.error('BLOCKED: ' + e.message);
    process.exitCode = 1;
  }
}
