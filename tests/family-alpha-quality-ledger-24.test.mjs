import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateQualityLedger24 as evaluate,renderQualityLedger24 as render}
 from '../scripts/family-alpha-quality-ledger-24.mjs';

const source=JSON.parse(readFileSync('research/family-alpha-quality-ledger-24/manifest.json','utf8'));
const clone=x=>structuredClone(x);
function fixture(){
 const prs={},runs={};
 for(const r of source.research){
  prs[String(r.pr)]={number:r.pr,head:{sha:r.pinnedHead||'e'.repeat(40)},
   base:{repo:{full_name:source.repository}},draft:true,state:'open',merged:false};
  if(r.dedicatedRunId!==null)runs[String(r.dedicatedRunId)]={
   id:r.dedicatedRunId,name:'Research original-photo evidence NO DEPLOY',
   head_sha:r.pinnedHead,head_repository:{full_name:source.repository},
   status:'completed',conclusion:'success',event:'pull_request',
   html_url:'https://github.com/'+source.repository+'/actions/runs/'+r.dedicatedRunId
  };
 }
 return {checkedAt:'2026-11-04T18:22:00.000Z',
  issue:{number:255,state:'open'},prs,runs};
}
test('new ledger pinning is complete, truthful, exact SHA and fail-closed HOLD',()=>{
 const report=evaluate(source,fixture());
 assert.equal(report.decision,'HOLD');
 assert.equal(report.alphaIssueState,'open');
 assert.equal(report.totalResearchPRs,9);
 assert.equal(report.verifiedNarrowResearch,3);
 assert.equal(report.technicalGreenWithScienceFail,5);
 assert.equal(report.researchNeedingFurtherWork,6);
 assert.equal(report.releaseGatesRemaining,9);
 assert.equal(report.knownScientificFailures.length,5);
 assert.deepEqual(report.knownScientificFailures.map(x=>x.pr),[570,572,575,578,580]);
 assert.deepEqual(report.knownScientificFailures.map(x=>x.exactDedicatedCi),[true,true,true,true,true]);
 assert.ok(report.research.find(x=>x.pr===573).status==='IN_PROGRESS');
 assert.equal(report.work29.gitHubEvidence,'NO_GITHUB_HANDOFF_OBSERVED_SESSION_STATUS_UNKNOWN');
 assert.equal(report.work29.sessionIsRunning,null);
 assert.equal(report.work29.genuineTwoSignedAccountsCertified,false);
 assert.equal(report.deploymentAuthorized,false);
 assert.equal(report.mergeAuthorized,false);
 assert.equal(report.alphaActivationAuthorized,false);
 assert.equal(report.candidateForIndependentControllerReview,false);
});
test('even a reported Work29 GitHub branch/PR does not certify signed RLS or session status',()=>{
 const report=evaluate(source,fixture(),{
  candidatePRs:['#581 SIGNED-OWNER-PRIVACY-25 research (draft)'],
  candidateBranches:['research/signed-owner-privacy-25-work29-HOLD']
 });
 assert.equal(report.work29.gitHubEvidence,'GITHUB_CANDIDATE_OBSERVED_NOT_SECURITY_CERTIFIED');
 assert.equal(report.work29.genuineTwoSignedAccountsCertified,false);
 assert.equal(report.work29.sessionIsRunning,null);
 assert.equal(report.releaseRequirements.find(x=>x.id==='signed-account-rls').state,'UNVERIFIED');
 assert.equal(report.decision,'HOLD');
});
test('duplicate candidate references are sanitized and no branch can fake a signed account',()=>{
 const r=evaluate(source,fixture(),{
  candidatePRs:['#581 unverified','#581 unverified'],
  candidateBranches:['research/signed-owner-privacy-25-HOLD','research/signed-owner-privacy-25-HOLD']
 });
 assert.deepEqual(r.work29.candidatePRs,['#581 unverified']);
 assert.deepEqual(r.work29.candidateBranches,['research/signed-owner-privacy-25-HOLD']);
 const unsafe={candidatePRs:['<script>alert(1)</script>'],candidateBranches:[]};
 assert.throws(()=>evaluate(source,fixture(),unsafe),/untrusted external Work29 reference/);
});
test('CI success on a different SHA never certifies photo accuracy or release',()=>{
 const actual=fixture();
 actual.runs['41882755511'].head_sha='b'.repeat(40);
 const r=evaluate(source,actual);
 assert.equal(r.research.find(x=>x.pr===580).status,'MISSING_EXACT_HEAD_CI');
 assert.equal(r.releaseDecision,'HOLD');
 assert.equal(r.deploymentAuthorized,false);
});
test('new PR head has drifted while old run is green: fail narrow provenance status',()=>{
 const actual=fixture();
 actual.prs['579'].head.sha='a'.repeat(40);
 const r=evaluate(source,actual);
 assert.equal(r.research.find(x=>x.pr===579).status,'STALE_HEAD');
 assert.equal(r.decision,'HOLD');
});
test('green workflow with wrong repository, deployment name or merge is not accepted',()=>{
 const a=fixture();a.runs['41884473096'].head_repository.full_name='attacker/repo';
 assert.equal(evaluate(source,a).research.find(x=>x.pr===579).status,'MISSING_EXACT_HEAD_CI');
 const b=fixture();b.runs['41884473096'].name='Deploy production';
 assert.equal(evaluate(source,b).research.find(x=>x.pr===579).status,'MISSING_EXACT_HEAD_CI');
 const c=fixture();c.prs['579'].draft=false;c.prs['579'].merged=true;
 assert.equal(evaluate(source,c).research.find(x=>x.pr===579).status,'NOT_SAFE_DRAFT');
});
test('scientifically failed real color PR cannot be relabeled accepted even with green CI',()=>{
 const m=clone(source);
 m.research.find(x=>x.pr===580).scientificStatus='NARROW_RESEARCH_VERIFIED';
 assert.throws(()=>evaluate(m,fixture()),/scientific failure cannot be declared accepted/);
});
test('new segmentation scientific failure cannot be hidden by its successful test run',()=>{
 const m=clone(source);
 m.research.find(x=>x.pr===575).scientificStatus='NARROW_RESEARCH_VERIFIED';
 assert.throws(()=>evaluate(m,fixture()),/scientific failure cannot be declared accepted/);
});
test('original #578 narrow color acceptance is not proof of new-cohort cross-browser robustness',()=>{
 const m=clone(source);
 m.research.find(x=>x.pr===578).scientificStatus='NARROW_RESEARCH_VERIFIED';
 assert.throws(()=>evaluate(m,fixture()),/scientific failure cannot be declared accepted/);
});
test('49 original-photo counts, 45 provisional labels and accepted wrong colors cannot be inflated',()=>{
 const m=clone(source);
 m.scientificFacts.color.chromium.currentCorrect=44;
 assert.throws(()=>evaluate(m,fixture()),/published scientific counts changed/);
 const n=clone(source);
 n.scientificFacts.color.humanIndependentlyValidated=49;
 assert.throws(()=>evaluate(n,fixture()),/color benchmark evidence dimensions invalid/);
 const o=clone(source);
 o.scientificFacts.color.chromium.accepted=30;
 assert.throws(()=>evaluate(o,fixture()),/inconsistent color denominators/);
});
test('segmentation 8/35 hits and no mask/human ground truth must stay explicitly unverified',()=>{
 const m=clone(source);
 m.scientificFacts.segmentation.secondReviewerCount=2;
 assert.throws(()=>evaluate(m,fixture()),/segmentation quality limitations cannot be removed/);
 const n=clone(source);
 n.scientificFacts.segmentation.directChromiumProposals=12;
 assert.throws(()=>evaluate(n,fixture()),/worker false-positive denominator changed/);
});
test('nine required Family Alpha blockers cannot be self-certified by green research CI',()=>{
 const m=clone(source);
 m.releaseRequirements[3].state='VERIFIED_WITH_EXTERNAL_RECEIPT';
 m.releaseRequirements[3].receipt={explicitAuthorization:true,
  evidenceUri:'https://example.com/auth',reviewer:'research author'};
 assert.throws(()=>evaluate(m,fixture()),/every mandatory pilot release gate must remain unverified/);
 const p=clone(source);p.releaseRequirements.pop();
 assert.throws(()=>evaluate(p,fixture()),/mandatory pilot release gate/);
});
test('research gate Work29 scope and active state cannot be falsely asserted',()=>{
 const m=clone(source);
 m.scientificFacts.work29.signedIndependentAccountAandBHttpProof=true;
 assert.throws(()=>evaluate(m,fixture()),/Work29 signed account proof is missing/);
 const n=clone(source);
 n.projectWorkstreams.find(w=>w.id==='work-29').releaseCertified=true;
 assert.throws(()=>evaluate(n,fixture()),/invisible external session/);
});
test('closing Family Alpha issue requires separate manual reconciliation; never auto-activate',()=>{
 const x=fixture();x.issue.state='closed';
 assert.throws(()=>evaluate(source,x),/Family Alpha issue #255 no longer open/);
});
test('saved review provenance is not retroactive certification of color model accuracy',()=>{
 const m=clone(source);
 m.scientificFacts.colorProvenance.scientificColorAccuracyCertified=true;
 assert.throws(()=>evaluate(m,fixture()),/source provenance must not certify/);
});
test('markdown remains actionable, truthfully qualifies independent labels and separate sessions',()=>{
 const r=evaluate(source,fixture());
 const md=render(r);
 for(const s of ['HOLD','49','45','17/45','16/45','19','8/35','NEEDS_REWORK',
  'Work #29','cannot see','NO DEPLOY','SIGNED','#580','#575','#579'])
  assert.ok(md.includes(s),'missing important limitation: '+s);
 assert.ok(!md.includes('95% READY'));
 assert.ok(!md.includes('Signed owner proof: PASS'));
 assert.ok(!md.includes('data:image/'));
});
