import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateFamilyAlpha18 as evaluate,renderFamilyAlphaMarkdown18 as render,REQUIRED_GATES_18} from '../scripts/family-alpha-evidence-gate-18.mjs';

const manifest=JSON.parse(readFileSync('research/family-alpha-evidence-gate-18/manifest.json','utf8'));
const clone=x=>structuredClone(x);
function sourceFixture(){
 const prs={},runs={};
 for(const r of manifest.research){
  prs[String(r.pr)]={number:r.pr,head:{sha:r.pinnedHead||'f'.repeat(40)},
   base:{repo:{full_name:manifest.repository}},draft:true,state:'open',merged:false};
  if(r.dedicatedRunId!==null)runs[String(r.dedicatedRunId)]={
   id:r.dedicatedRunId,name:'Independent exact head research NO DEPLOY',
   head_sha:r.pinnedHead,head_repository:{full_name:manifest.repository},
   status:'completed',conclusion:'success',event:'pull_request',
   html_url:'https://github.com/nickhaney916-lang/Closet-Current/actions/runs/'+r.dedicatedRunId
  };
 }
 return {checkedAt:'2026-11-04T16:00:00.000Z',issue:{number:255,state:'open'},prs,runs};
}
test('Main controller release is HOLD even when all pinned technical CI is green',()=>{
 const out=evaluate(manifest,sourceFixture());
 assert.equal(out.releaseDecision,'HOLD');
 assert.equal(out.alphaIssueState,'open');
 assert.equal(out.totalResearchPRs,5);
 assert.equal(out.verifiedNarrowResearch,2);
 assert.equal(out.technicalGreenWithScienceFail,2);
 assert.equal(out.researchNeedingFurtherWork,3);
 assert.equal(out.releaseGatesRemaining,9);
 assert.equal(out.deploymentAuthorized,false);
 assert.equal(out.mergeAuthorized,false);
 assert.equal(out.candidateForIndependentControllerReview,false);
 assert.ok(out.research.find(x=>x.pr===573).status==='IN_PROGRESS');
 assert.ok(out.research.find(x=>x.pr===572).status==='TECHNICAL_PASS_SCIENTIFIC_FAIL');
});
test('A successful CI run from another SHA never certifies the PR',()=>{
 const live=sourceFixture();live.runs['41848650852'].head_sha='f'.repeat(40);
 const out=evaluate(manifest,live);
 assert.equal(out.research.find(x=>x.pr===571).status,'MISSING_EXACT_HEAD_CI');
 assert.equal(out.releaseDecision,'HOLD');
});
test('Moving a pinned head invalidates acceptance even with a green old workflow',()=>{
 const live=sourceFixture();live.prs['569'].head.sha='e'.repeat(40);
 const out=evaluate(manifest,live);
 assert.equal(out.research.find(x=>x.pr===569).status,'STALE_HEAD');
 assert.equal(out.releaseDecision,'HOLD');
});
test('Wrong repository, fake workflow name, draft state and absent CI are rejected',()=>{
 const live=sourceFixture();live.prs['571'].base.repo.full_name='another/repo';
 assert.throws(()=>evaluate(manifest,live),/untrusted PR identity/);
 const w=sourceFixture();w.runs['41848650852'].name='Deploy production app';
 assert.equal(evaluate(manifest,w).research.find(x=>x.pr===571).exactWorkflow,false);
 const d=sourceFixture();d.prs['571'].draft=false;
 assert.equal(evaluate(manifest,d).research.find(x=>x.pr===571).status,'NOT_SAFE_DRAFT');
 const m=sourceFixture();delete m.runs['41848650852'];
 assert.equal(evaluate(manifest,m).research.find(x=>x.pr===571).status,'MISSING_EXACT_HEAD_CI');
});
test('Any release gate omission, duplicate or unreviewed status is rejected',()=>{
 assert.deepEqual(manifest.releaseRequirements.map(x=>x.id),REQUIRED_GATES_18);
 let m=clone(manifest);m.releaseRequirements.pop();
 assert.throws(()=>evaluate(m,sourceFixture()),/release requirements missing/);
 m=clone(manifest);m.releaseRequirements[0].id=m.releaseRequirements[1].id;
 assert.throws(()=>evaluate(m,sourceFixture()),/unknown\/duplicate/);
 m=clone(manifest);m.releaseRequirements[0].state='VERIFIED';
 assert.throws(()=>evaluate(m,sourceFixture()),/invalid release gate state/);
});
test('Release proof cannot be self-asserted without externally reviewed acceptance receipt',()=>{
 const m=clone(manifest);
 m.releaseRequirements[0].state='VERIFIED_WITH_EXTERNAL_RECEIPT';
 assert.throws(()=>evaluate(m,sourceFixture()),/cannot self-certify/);
 m.releaseRequirements[0].receipt={explicitAuthorization:true,evidenceUri:'https://github.com/abc',reviewer:'main controller'};
 const out=evaluate(m,sourceFixture());
 assert.equal(out.releaseGatesRemaining,8);
 assert.equal(out.releaseDecision,'HOLD');
});
test('Unknown Family Alpha issue status, wrong hold number and released manifest fail closed',()=>{
 const l=sourceFixture();l.issue={number:255,state:'not_found'};
 assert.throws(()=>evaluate(manifest,l),/unverified Family Alpha issue/);
 const m=clone(manifest);m.alphaIssue=256;
 assert.throws(()=>evaluate(m,sourceFixture()),/release hold issue/);
 const mm=clone(manifest);mm.governance.productionDeployAllowed=true;
 assert.throws(()=>evaluate(mm,sourceFixture()),/forbidden production/);
});
test('Closed hold issue alone never makes a scientifically incomplete app pilot-ready',()=>{
 const l=sourceFixture();l.issue.state='closed';
 const out=evaluate(manifest,l);
 assert.equal(out.releaseDecision,'HOLD');
 assert.equal(out.releaseGatesRemaining,9);
 assert.equal(out.candidateForIndependentControllerReview,false);
});
test('Changing moving PR #573 does not accidentally create pinned acceptance',()=>{
 const l=sourceFixture();l.prs['573'].head.sha='a'.repeat(40);
 const out=evaluate(manifest,l);
 const p=out.research.find(x=>x.pr===573);
 assert.equal(p.currentHead,'a'.repeat(40));
 assert.equal(p.status,'IN_PROGRESS');
 assert.equal(p.exactWorkflow,false);
});
test('Read-only report calls out scientific failures, physical phones and authorization',()=>{
 const out=evaluate(manifest,sourceFixture());
 const md=render(out);
 assert.match(md,/NEEDS_REWORK/);
 assert.match(md,/physical/i);
 assert.match(md,/NO/);
 assert.match(md,/PR/);
 assert.match(md,/UNVERIFIED/);
 assert.ok(!md.includes('Authorization: YES'));
 assert.ok(!md.includes('data:image/'));
});