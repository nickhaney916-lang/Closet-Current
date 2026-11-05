import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve('.'),read=p=>readFileSync(resolve(root,p),'utf8');
const matrix=JSON.parse(read('research/full-integration-ci-repair-83/failure-matrix.json'));
assert.equal(matrix.historical.length,15);
assert.equal(matrix.actual_dependency_failure.run_id,42130927627);
assert.equal(new Set(matrix.historical.map(x=>x.run_id)).size,15);
const sha=/^[a-f0-9]{40}$/;
for(const h of matrix.historical){
 assert.match(h.reference_sha,sha);
 assert.ok(h.run_id>0);
 assert.equal(h.test_steps_executed,false);
 assert.equal(h.first_unapproved_path,'.github/workflows/allowlisted-review-snapshot-78-no-deploy.yml');
 const yaml=read(h.workflow);
 assert.ok(yaml.includes('git merge-base --is-ancestor')||yaml.includes('git merge-base'),'Preserve actual ancestor gate: '+h.id);
 assert.ok(yaml.includes(h.reference_sha),'Historical locked SHA must match observed failed run '+h.id);
 // This audit is read-only: it does NOT rewrite or mark old workflows green.
}
const scenario=read('.github/workflows/camera-scenarios.yml');
assert.match(scenario,/npm install --no-save --no-package-lock --no-audit --no-fund/);
for(const asset of ['fake-indexeddb@6.2.4','three@0.180.0','three-mesh-bvh@0.9.2','playwright@1.56.1','sharp@0.34.3'])
 assert.ok(scenario.includes(asset),'Pinned runtime needed for full Node tests: '+asset);
assert.match(scenario,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.mjs/);
assert.match(scenario,/permissions:\s*\n\s*contents: read/);
assert.ok(!/\bnpm publish\b|\bwrangler deploy\b|\bsupabase deploy\b/.test(scenario));
console.log('CI83: 15/15 original historical-gated checks preserved and accounted for, one broad camera-scenarios dependency defect repaired. This audit does not turn historical checks green.');
