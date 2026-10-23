import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const base='93252a3b6f570b7e38473bd1683ed3468aad84d1';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('merge-base','--is-ancestor',base,'HEAD');
const allowed=new Set(['benchmark/issue201-synthetic-wardrobes.mjs','benchmark/issue201-results.json',
 'scripts/issue201-outfit-benchmark.mjs','scripts/test-issue201-outfit-browsers.mjs','scripts/check-issue201-qa-scope.mjs',
 'tests/issue201-outfit-benchmark.test.mjs','.github/workflows/issue201-outfit-benchmark-qa.yml',
 'docs/ISSUE-201-OUTFIT-BENCHMARK.md','docs/PROGRESS-CHECKPOINT.md']);
const changed=git('diff','--name-only',base).split('\n').filter(Boolean);assert.ok(changed.length>0);
for(const p of changed)assert.ok(allowed.has(p),'Out of QA-only scope: '+p);
const previous=execFileSync('git',['show',base+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(previous));
assert.doesNotMatch(readFileSync('.github/workflows/issue201-outfit-benchmark-qa.yml','utf8'),/secrets\.|id-token:\s*write|wrangler|supabase\s+(db|functions)/);
console.log('ISSUE201_QA_ONLY_SCOPE '+JSON.stringify({base,changedPaths:changed.length,publicAndBackendUnchanged:true,priorWorkflowsUnchanged:true,deployAuthorized:false}));
