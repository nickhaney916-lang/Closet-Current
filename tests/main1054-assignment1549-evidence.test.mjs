import assert from 'node:assert/strict';
import test from 'node:test';
import { branch, candidate, parent, steps, verifyEvidence, workflow } from '../research/main1054/assignment1549-evidence.mjs';

function fixture() {
 const gateSha = 'a'.repeat(40);
 return { gateSha, candidateSha:candidate, candidateParent:parent,
  run:{ id:1, head_sha:gateSha, head_branch:branch, path:workflow, event:'pull_request',
   run_attempt:1, status:'completed', conclusion:'success' },
  jobs:[{ id:2, run_id:1, name:'application-node', status:'completed', conclusion:'success',
   steps:steps.map(name=>({name,status:'completed',conclusion:'success'})) }],
  claims:{ familyAlpha:'HOLD', nativeRepair:false, originalOwnerFlow:false, chromium:false, webkit:false } };
}

test('accepts complete scoped receipt',()=>assert.equal(verifyEvidence(fixture()).status,'PASS'));
for (const [name, mutate] of [
 ['absent job', x=>x.jobs=[]],
 ['wrong SHA', x=>x.run.head_sha='b'.repeat(40)],
 ['wrong branch', x=>x.run.head_branch='other'],
 ['unapproved candidate', x=>x.candidateSha='b'.repeat(40)],
 ['unreviewed parent', x=>x.candidateParent='b'.repeat(40)],
 ['rerun', x=>x.run.run_attempt=2],
 ['different run job', x=>x.jobs[0].run_id=3],
 ['cancelled job', x=>x.jobs[0].conclusion='cancelled'],
 ['skipped step', x=>x.jobs[0].steps[1].conclusion='skipped'],
 ['missing owner regression', x=>x.jobs[0].steps.splice(2,1)],
 ['fixture as owner flow', x=>x.claims.originalOwnerFlow=true],
 ['browser overclaim', x=>Object.assign(x.claims,{chromium:true,webkit:true})],
 ['native repair overclaim', x=>x.claims.nativeRepair=true],
 ['hold removal', x=>x.claims.familyAlpha='RELEASE'],
]) test('blocks '+name,()=>{
 const input=fixture();
 mutate(input);
 assert.equal(verifyEvidence(input).status,'BLOCKED');
});
test('preserves first failure',()=>{
 const input=fixture();
 input.run.conclusion='failure';
 assert.equal(verifyEvidence(input).status,'FAIL');
});
