import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('CI83 broad camera and indexing scenario workflow installs pinned test-only deps before full suite',()=>{
 const yaml=file('.github/workflows/camera-scenarios.yml');
 const install=yaml.indexOf('npm install --no-save --no-package-lock --no-audit --no-fund');
 const run=yaml.indexOf('node --test tests/*.test.cjs tests/*.test.mjs');
 assert.ok(install>0&&run>install);
 assert.match(yaml,/fake-indexeddb@6\.2\.4/);
 assert.match(yaml,/permissions:\s*\n\s*contents: read/);
});
test('CI83 fifteen historic failures remain accurately classified rather than falsely green',()=>{
 const data=JSON.parse(file('research/full-integration-ci-repair-83/failure-matrix.json'));
 assert.equal(data.historical.length,15);
 assert.equal(new Set(data.historical.map(r=>r.run_id)).size,15);
 assert.ok(data.historical.every(r=>r.test_steps_executed===false&&r.failed_at.includes('scope')));
 assert.equal(data.actual_dependency_failure.run_id,42130927627);
 assert.match(data.actual_dependency_failure.source_error,/fake-indexeddb/);
});
