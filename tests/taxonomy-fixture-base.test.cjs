const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const test = require('node:test');

test('taxonomy suite loads its own source even if the caller has a fixture with the same path', t => {
 const cwd = mkdtempSync(join(tmpdir(), 'closet-taxonomy-'));
 t.after(() => rmSync(cwd, { recursive: true, force: true }));
 mkdirSync(join(cwd, 'public'));
 writeFileSync(join(cwd, 'public', 'taxonomy.js'), "throw Error('wrong taxonomy fixture');");
 const run = spawnSync(process.execPath, [join(__dirname, 'taxonomy.test.cjs')], {
  cwd, encoding: 'utf8', timeout: 10_000,
 });
 assert.ifError(run.error);
 assert.equal(run.status, 0, run.stdout + run.stderr);
 assert.match(run.stdout, /Legacy data, multi-season filtering/);
});
