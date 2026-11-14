import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('../scripts/audit-main-crossmission-19.mjs', import.meta.url));
function git(dir, ...args) { return execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim(); }
function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'cc-audit19-'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.name', 'Source Fixture');
  git(dir, 'config', 'user.email', 'fixture@example.invalid');
  mkdirSync(join(dir, 'public')); mkdirSync(join(dir, 'research'));
  writeFileSync(join(dir, 'public/app.js'), 'initial\n');
  git(dir, 'add', '.'); git(dir, 'commit', '-qm', 'initial');
  const root = git(dir, 'rev-parse', 'HEAD');
  git(dir, 'checkout', '-qb', 'controller');
  writeFileSync(join(dir, 'public/app.js'), 'controller\n');
  git(dir, 'add', '.'); git(dir, 'commit', '-qm', 'controller');
  const controller = git(dir, 'rev-parse', 'HEAD');
  git(dir, 'checkout', '-qb', 'donor', root);
  writeFileSync(join(dir, 'public/app.js'), 'donor\n');
  git(dir, 'add', '.'); git(dir, 'commit', '-qm', 'donor');
  const donor = git(dir, 'rev-parse', 'HEAD');
  git(dir, 'checkout', '-qb', 'other', root);
  writeFileSync(join(dir, 'research/novel.txt'), 'isolated\n');
  git(dir, 'add', '.'); git(dir, 'commit', '-qm', 'other');
  const other = git(dir, 'rev-parse', 'HEAD');
  return { dir, root, controller, donor, other };
}
function audit(dir, ...args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
}

test('divergent consumer source edits are flagged without claiming a merge conflict', () => {
  const f = setup();
  try {
    const output = audit(f.dir, '--controller', f.controller, '--donor', 'mission3=' + f.donor);
    assert.equal(output.status, 0, output.stderr);
    const doc = JSON.parse(output.stdout);
    assert.equal(doc.schema, 'closet-crossmission-ancestry-19-v1');
    assert.equal(doc.results[0].mergeBase, f.root);
    assert.equal(doc.results[0].controllerOnlyCommits, 1);
    assert.equal(doc.results[0].donorOnlyCommits, 1);
    assert.deepEqual(doc.results[0].overlappingConsumerPaths, ['public/app.js']);
    assert.equal(doc.results[0].integrationReviewRequired, true);
    assert.match(doc.warning, /not a proven textual or semantic merge conflict/i);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test('independent research-only donor shows zero consumer overlap', () => {
  const f = setup();
  try {
    const output = audit(f.dir, '--controller', f.controller, '--donor', 'p86=' + f.other);
    assert.equal(output.status, 0, output.stderr);
    assert.deepEqual(JSON.parse(output.stdout).results[0].overlappingConsumerPaths, []);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test('rejects invalid or missing source commit without fabricating a result', () => {
  const f = setup();
  try {
    const invalid = audit(f.dir, '--controller', f.controller, '--donor', 'bad=not-a-sha');
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /AUDIT BLOCKED/);
    const unknown = audit(f.dir, '--controller', f.controller, '--donor', 'missing=' + '0'.repeat(40));
    assert.equal(unknown.status, 2);
    assert.match(unknown.stderr, /AUDIT BLOCKED/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
