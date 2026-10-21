import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditPilotReleasePreflight,INTEGRATED_HEAD,DEPLOY_FILES} from '../scripts/audit-pilot-release-preflight.mjs';
const yml='name: deploy\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\npermissions:\n  contents: read\n';
const standard=()=>({
 parentPresent:true,integratedAlreadyInMain:false,changedFiles:[
  '.github/workflows/pilot-release-preflight-qa.yml',
  'docs/PILOT-RELEASE-PREFLIGHT-20261021.md',
  'scripts/audit-pilot-release-preflight.mjs',
  'tests/pilot-release-preflight.test.mjs'
 ],
 deployWorkflows:Object.fromEntries(DEPLOY_FILES.map(x=>[x,yml])),
 human:{suppliedSubmissions:0,approvedModelAccuracy:null,productionPromotion:'BLOCKED'}
});
test('safe isolated pilot preflight passes while real pilot and release remain blocked',()=>{
 const r=auditPilotReleasePreflight(standard());
 assert.equal(r.technicalPreflight,'PASS');
 assert.equal(r.integrationHead,INTEGRATED_HEAD);
 assert.equal(r.productionReleaseApproved,false);
 assert.equal(r.productionPromotion,'BLOCKED');
 assert.equal(r.validatedOriginalPhotoRecognitionAccuracy,null);
 assert.equal(r.actualPhysicalAndroidEvidenceAccepted,0);
 assert.equal(r.actualPhysicalIPhoneEvidenceAccepted,0);
 assert.equal(r.manualWorkflowDispatchBlockedByThisAudit,false);
 assert.ok(r.releaseBlockers.length>=5);
});
test('unexpected customer and deployment source edits are rejected',()=>{
 for(const p of ['public/app.js','public/sw.js','supabase/cloud-backup.sql','.github/workflows/pages.yml']){
  const x=standard();x.changedFiles.push(p);
  assert.throws(()=>auditPilotReleasePreflight(x),/Customer\/deployment source changed/);
 }
});
test('automatic pilot branch deployment targets are rejected',()=>{
 for(const value of ['[main, pilot]','[pilot]','[ main ]']){
  const x=standard();x.deployWorkflows[DEPLOY_FILES[0]]=yml.replace('[main]',value);
  assert.throws(()=>auditPilotReleasePreflight(x),/restricted to main/);
 }
});
test('new automatic PR or scheduled deploy triggers are rejected',()=>{
 for(const trigger of ['  pull_request:\n','  pull_request_target:\n','  schedule:\n','  workflow_run:\n']){
  const x=standard();x.deployWorkflows[DEPLOY_FILES[1]]=yml.replace('  workflow_dispatch:\n',trigger+'  workflow_dispatch:\n');
  assert.throws(()=>auditPilotReleasePreflight(x),/Unexpected deployment trigger/);
 }
});
test('source ancestry, unmerged main, and both hosting workflows are required',()=>{
 let x=standard();x.parentPresent=false;
 assert.throws(()=>auditPilotReleasePreflight(x),/ancestor/);
 x=standard();x.integratedAlreadyInMain=true;
 assert.throws(()=>auditPilotReleasePreflight(x),/production promotion/);
 x=standard();delete x.deployWorkflows[DEPLOY_FILES[0]];
 assert.throws(()=>auditPilotReleasePreflight(x),/Both deployed hosting workflows/);
});
test('fabricated human acceptance or approval cannot be marked complete',()=>{
 for(const patch of [
  {suppliedSubmissions:2},
  {approvedModelAccuracy:1},
  {productionPromotion:'APPROVED'}
 ]){
  const x=standard();Object.assign(x.human,patch);
  assert.throws(()=>auditPilotReleasePreflight(x));
 }
});
test('duplicate or extraneous audit entries cannot hide scope changes',()=>{
 const x=standard();x.changedFiles.push(x.changedFiles[0]);
 assert.throws(()=>auditPilotReleasePreflight(x),/Duplicate/);
});
