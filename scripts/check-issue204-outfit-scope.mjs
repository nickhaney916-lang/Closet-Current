import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const base='ad16d788e386e1e52d02aae3b94aa02791cc4cda';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('merge-base','--is-ancestor',base,'HEAD');
const allowed=new Set(['public/closet-stylist-engine.js','public/closet-stylist.js','public/outfit-board.js',
 'scripts/issue201-outfit-benchmark.mjs','scripts/test-issue201-outfit-browsers.mjs','scripts/check-issue204-outfit-scope.mjs',
 'benchmark/issue201-results.json','tests/helpers/issue204-photo.cjs','tests/issue204-outfit-source-guards.test.mjs',
 'tests/closet-stylist.test.cjs','tests/customer-original-styling-integration.test.cjs','tests/issue201-outfit-benchmark.test.mjs',
 'tests/mobile-owned-outfit-reliability.test.cjs','tests/outfit-save-recovery.test.cjs','tests/style-preview-recovery.test.cjs',
 'tests/stylist-jacket-coat-swap.test.cjs','tests/stylist-owned-source-commit.test.cjs','tests/stylist-unpinned-layer-placement.test.cjs',
 '.github/workflows/issue204-outfit-source-qa.yml','docs/ISSUE-204-OUTFIT-SOURCE-GUARDS.md','docs/ISSUE-201-OUTFIT-BENCHMARK.md','docs/PROGRESS-CHECKPOINT.md']);
const changed=git('diff','--name-only',base).split('\n').filter(Boolean);assert.ok(changed.length>0);
for(const p of changed)assert.ok(allowed.has(p),'Out of two-defect scope: '+p);
const old=p=>execFileSync('git',['show',base+':'+p],{encoding:'utf8'});
assert.ok(readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(old('docs/PROGRESS-CHECKPOINT.md')));
const current=readFileSync('scripts/issue201-outfit-benchmark.mjs','utf8'),prior=old('scripts/issue201-outfit-benchmark.mjs');
const extract=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
assert.equal(extract(current,'export function oracle(','export function sourceGuard('),extract(prior,'export function oracle(','export function sourceGuard('),'Independent oracle must remain byte-identical');
assert.equal(extract(current," check('original-only-change-invalidates-prepared-source'"," check('raw-engine-refuses-blank-photo-record'"),extract(prior," check('original-only-change-invalidates-prepared-source'"," check('raw-engine-refuses-blank-photo-record'"),'Original-only failure gate unchanged');
assert.ok(current.includes("assert.equal(style(f,'new-top').length,0"),'No-photo rejection assertion must stay');
const report=JSON.parse(readFileSync('benchmark/issue201-results.json','utf8'));assert.equal(report.passed,22);assert.equal(report.failed,0);assert.equal(report.checks.length,22);
assert.doesNotMatch(readFileSync('.github/workflows/issue204-outfit-source-qa.yml','utf8'),/secrets\.|id-token:\s*write|wrangler|supabase\s+(db|functions)/);
console.log('ISSUE204_SOURCE_SCOPE '+JSON.stringify({base,changedPaths:changed.length,independentOracleUnchanged:true,originalFailureAssertionUnchanged:true,noPhotoRejectionAssertionUnchanged:true,backendAndExistingWorkflowsUnchanged:true,deployAuthorized:false}));
