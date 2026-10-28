import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeIsolationReview,safeIsolationTips,ISOLATION_TIP_TEXT}
 from '../research/work50/isolation-review-guidance.mjs';
import {readFile} from 'node:fs/promises';
import {patchProvider,patchConfirmation,verify}
 from '../scripts/build-family-alpha-64-isolation-guidance-hold.mjs';
test('review guidance highlights source-bounded pale fabric, straps and mannequin but never approves',()=>{
 const r=summarizeIsolationReview({confidence:{reasons:[
  'pale-fabric-or-background-ambiguity','possible-separation-or-narrow-detail-loss',
  'semantic-mannequin-hanger-and-fabric-review-required'
 ]}});
 assert.deepEqual(r.codes,['all-edges','pale','straps','mannequin']);
 assert.equal(r.automaticApproval,false);
 assert.equal(r.requiresHumanReview,true);
 assert.equal(r.quality,'REVIEW');
 assert.equal(Object.isFrozen(r),true);
 assert.deepEqual(safeIsolationTips(r),[
  ISOLATION_TIP_TEXT['all-edges'],ISOLATION_TIP_TEXT.pale,
  ISOLATION_TIP_TEXT.straps,ISOLATION_TIP_TEXT.mannequin
 ]);
});
test('unknown reason text, private IDs or injected markup never reach UI labels',()=>{
 const secret='PRIVATE_EMAIL_abc@example.com<script>alert(1)</script>';
 const r=summarizeIsolationReview({confidence:{reasons:[secret,'shoe-pair-requires-explicit-confirmation']}});
 const t=safeIsolationTips(r);
 assert.equal(t.join(' ').includes(secret),false);
 assert.equal(t.join(' ').includes('PRIVATE_EMAIL'),false);
 assert.ok(t.includes(ISOLATION_TIP_TEXT.other));
 assert.ok(t.includes(ISOLATION_TIP_TEXT.shoes));
 assert.ok(!JSON.stringify(r).includes(secret));
});
test('malformed/forged UI details fall back to a fixed safe advisory, never trust user-provided labels',()=>{
 for(const bad of [
  {},null,{schema:'closet-alpha-64-isolation-review-v1',quality:'PASS',codes:['shoes'],automaticApproval:true,requiresHumanReview:false},
  {schema:'closet-alpha-64-isolation-review-v1',quality:'REVIEW',automaticApproval:false,requiresHumanReview:true,codes:['unknown <img src=x>']},
  {schema:'closet-alpha-64-isolation-review-v1',quality:'REVIEW',automaticApproval:false,requiresHumanReview:true,codes:['all-edges','mannequin','pale','shoes','straps']}
 ])assert.deepEqual(safeIsolationTips(bad),[ISOLATION_TIP_TEXT.other]);
});
test('provider adds one-source bounded advisory only inside existing guarded explicit review callback',async()=>{
 const raw=await readFile('dist-family-alpha-63-auto-portable-HOLD/__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs','utf8');
 const next=patchProvider(raw);
 assert.match(next,/isolationReview:summarizeIsolationReview\(raw\)/);
 assert.equal(next.replace("\nimport {summarizeIsolationReview} from '../work50/isolation-review-guidance.mjs';",'').replace("\n   isolationReview:summarizeIsolationReview(raw),",''),raw);
 assert.match(next,/await auditMask/);
 assert.match(next,/validScope\(getScope,ownerId,epoch,isCurrent\)/);
 assert.match(next,/const approved=await reviewPreview/);
});
test('UI shows only fixed safe tips and original photo; trusted active click still required',async()=>{
 const raw=await readFile('dist-family-alpha-63-auto-portable-HOLD/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs','utf8');
 const next=patchConfirmation(raw);
 assert.match(next,/safeIsolationTips\(detail.isolationReview\)/);
 assert.match(next,/panel.append\(title,caption,row,advisory,actions\)/);
 assert.match(next,/if\(!event.isTrusted\)return/);
 assert.match(next,/done\(isActive\(\)\)/);
 assert.match(next,/imageCard\('Original photo',detail.originalImage\)/);
 assert.doesNotMatch(next,/innerHTML|fetch\(|localStorage|indexedDB|sendBeacon/);
});
test('byte-exact original mask/wardrobe/private Auth pipeline and deployment HOLD',async()=>{
 const info=await verify();
 assert.equal(info.decision,'HOLD');
 assert.equal(info.onlyUIExplanations,true);
 assert.equal(info.automaticApproved,false);
 assert.equal(info.deploymentAuthorized,false);
});
