import test from 'node:test';
import assert from 'node:assert/strict';
import {
 AUDITED_ASSETS,STAGING_REF,RECOGNITION_REF,STAGING_PROJECT,PRODUCTION_PROJECT,
 computeIntegrationAudit,runIntegrationAudit
} from '../scripts/audit-family-alpha-recognition-bridge.mjs';

// Synthetic stand-ins to exercise the decision engine. A separate test reads
// ACTUAL pinned Git blobs, and CI verifies a real disabled stage artifact.
const prod='https://'+PRODUCTION_PROJECT+'.supabase.co';
function inputs(){
 const stage={},recognition={};
 for(const key of AUDITED_ASSETS){stage[key]='stage-'+key;recognition[key]='recognition-'+key;}
 stage['public/taxonomy.js']='same-taxonomy';recognition['public/taxonomy.js']='same-taxonomy';
 stage['public/app.js']='async function recognizeItem(item){}';
 recognition['public/app.js']='async function recognizeItem(item){}\n'
 +'function recognitionSourcePhoto(item){return item?.image;}\n'
 +'const verifiedColorAdmission=new WeakMap();\n'
 +'function canConfirmReviewedColor(item){return !!item;}\n'
 +'item.recognitionReviewRequired=false;';
 stage['public/index.html']='<script src="family-alpha-preview-boot.js"></script>';
 recognition['public/index.html']='<script src="local-worker.mjs"></script>';
 stage['public/family-alpha-preview-boot.js']='local preview -- disabled';
 recognition['public/family-alpha-preview-boot.js']=null;
 stage['public/auth.js']=prod+' staging source auth transform pending';
 recognition['public/auth.js']=prod+' raw recognition Auth source';
 return {stage,recognition};
}
const artifactInput=(x)=>({
 'app.js':x.stage['public/app.js'],
 'auth.js':'https://'+STAGING_PROJECT+'.supabase.co staged auth',
 'alpha-stage-config.js':'{"intent":"HOLD-NO-CALLBACK-OR-KEY","releaseGate":"HOLD","key":""}'
});
test('both independently pinned refs compare safely without a deployable result',()=>{
 assert.equal(STAGING_REF.length,40);
 assert.equal(RECOGNITION_REF.length,40);
 assert.notEqual(STAGING_REF,RECOGNITION_REF);
 const {stage,recognition}=inputs();
 const result=computeIntegrationAudit(stage,recognition,artifactInput({stage}));
 assert.equal(result.releaseGate,'HOLD');
 assert.equal(result.status,'INTEGRATION_BLOCKED_DO_NOT_DEPLOY');
 assert.equal(result.appParity,false);
 assert.equal(result.artifactCheck.latestHumanColorAdmissionInStage,false);
 assert.equal(result.artifactCheck.stageAppUnchangedByAuthBuilder,true);
 assert.equal(result.artifactCheck.stagingAuthRuntime,'HOLD-NO-CALLBACK-OR-KEY');
 assert.equal(result.artifactCheck.credentialsRequired,false);
});
test('shared taxonomy does not imply original-photo recognizer/controller compatibility',()=>{
 const {stage,recognition}=inputs(),r=computeIntegrationAudit(stage,recognition);
 assert.deepEqual(r.comparison.identical,['public/taxonomy.js']);
 for(const path of ['public/app.js','public/index.html','public/recognition-engine.mjs',
  'public/local-worker.mjs','public/clothing-details.js','public/photo-color.js',
  'public/outfit-board.js','public/auth.js']){
  assert.ok(r.comparison.divergent.some(x=>x.path===path));
 }
 assert.equal(r.recognitionBranchMissingStageBoot,true);
});
test('raw recognition production Auth can never be passed off as a stage-auth artifact',()=>{
 const x=inputs(),artifact=artifactInput(x);
 artifact['auth.js']=x.recognition['public/auth.js'];
 assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition,artifact),/routes to production/);
});
test('previous staging Auth source must not silently switch to another backend',()=>{
 const x=inputs();
 x.stage['public/auth.js']='https://'+STAGING_PROJECT+'.supabase.co';
 assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition),/production routed/);
});
test('default-disabled staging artifact may not acquire a callback or ready state',()=>{
 const x=inputs(),artifact=artifactInput(x);
 artifact['alpha-stage-config.js']='{"intent":"explicit-qa-only","releaseGate":"HOLD"}';
 assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition,artifact),/not in default blocked/);
});
test('staging app with partial unreviewed recognition transplant fails rather than certifying safe',()=>{
 const x=inputs(),artifact=artifactInput(x);
 artifact['app.js']+=x.recognition['public/app.js'];
 assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition,artifact),/changed app.js/);
});
test('stage missing its local review preview fails; cannot wholesale replace index with recognition version',()=>{
 const x=inputs();
 x.stage['public/index.html']=x.recognition['public/index.html'];
 assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition),/stage original-JPEG avatar local preview/);
});
test('recognition source must include original photo, human color review and transient proof',()=>{
 for(const needle of [
  'function recognitionSourcePhoto(item)',
  'const verifiedColorAdmission=new WeakMap()',
  'function canConfirmReviewedColor(item)'
 ]){
  const x=inputs();
  x.recognition['public/app.js']=x.recognition['public/app.js'].replace(needle,'REMOVED');
  assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition),/contract missing|admission missing/);
 }
});
test('stage already integrated recognition should force explicit rebaseline, not use stale report',()=>{
 const x=inputs();
 x.stage['public/app.js']+=x.recognition['public/app.js'];
 assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition),/stage has new recognition helper/);
});
test('missing pinned source is not replaced by a moving branch or inferred file',()=>{
 const x=inputs();delete x.recognition['public/app.js'];
 assert.throws(()=>computeIntegrationAudit(x.stage,x.recognition),/all allowed assets required/);
});
test('source-audit report includes zero app secrets, customer data or deployment claims',()=>{
 const {stage,recognition}=inputs(),r=computeIntegrationAudit(stage,recognition);
 const report=JSON.stringify(r);
 assert.ok(report.includes('INTEGRATION_BLOCKED_DO_NOT_DEPLOY'));
 assert.ok(report.includes('NO USER PHOTOS'));
 assert.ok(!report.includes('sb_secret_'));
 assert.ok(!report.includes('sb_publishable_'));
 assert.ok(!report.includes('re_'));
 assert.equal(r.dataAccess,'NO USER PHOTOS / NO SMTP / NO CLOUD / NO SECRETS / NO DEPLOY');
});
test('real current GH staging and recognition source commits remain incompatible and auditable',async()=>{
 const r=await runIntegrationAudit();
 assert.equal(r.releaseGate,'HOLD');
 assert.equal(r.status,'INTEGRATION_BLOCKED_DO_NOT_DEPLOY');
 assert.equal(r.stageRecognitionMissing,true);
 assert.equal(r.comparison.identical.includes('public/taxonomy.js'),true);
 assert.ok(r.comparison.divergent.length>=8);
});
