import test from 'node:test';
import assert from 'node:assert/strict';
import {
 APPROVED_STAGE_CALLBACK,STAGE_ID,OWNER_OBSERVATIONS,PILOT_SITE_URL,
 inspectOwnerObservations,assessActivationChecklist
} from '../scripts/audit-family-alpha-staging-activation-checklist-hold.mjs';
import {verifyOwnerAccessSmoke} from '../scripts/audit-family-alpha-staging-root-handoff.mjs';
const staticAudit=()=>({
 releaseGate:'HOLD',deployAllowed:false,uploadAuthorized:false,
 fullAppDeployed:false,stageProjectRef:STAGE_ID,stagingOrigin:APPROVED_STAGE_CALLBACK,
 missingReferencedAssets:0,candidateAssetCount:113
});
const stageHandoff=()=>({
 releaseGate:'HOLD',deployAllowed:false,familyInvitesAllowed:false,
 actualFullAppDeployed:false,actualDeployedStaging:'ACCESS_TEST_PLACEHOLDER'
});
const workflow=[
 'name: Deploy Closet Current to Cloudflare Pages',
 'on:',
 '  push:',
 '    branches: [main]',
 '  workflow_dispatch:',
 'run: pages deploy dist --project-name=closet-current --branch=main'
].join('\n');
const args=overrides=>({
 observation:OWNER_OBSERVATIONS,staticAudit:staticAudit(),stageHandoff:stageHandoff(),
 browserSmoke:verifyOwnerAccessSmoke(),prodDeploymentWorkflow:workflow,
 ...overrides
});
test('owner-observed staging Site URL is still pilot; allowed callback root is a distinct setting',()=>{
 const r=inspectOwnerObservations();
 assert.equal(r.rootRedirectLastObservedAllowlisted,true);
 assert.equal(r.siteUrlLastObserved,PILOT_SITE_URL);
 assert.equal(r.siteUrlMatchesApprovedStagingRoot,false);
 assert.equal(r.siteUrlRequiresOwnerReview,true);
 assert.equal(r.stagingKeyExistenceObserved,true);
 assert.equal(r.noActualJwtAuthorizationProof,true);
});
test('a last-observed exact root Site URL clears only its mismatch, not the release HOLD',()=>{
 const rootObservation={...OWNER_OBSERVATIONS,siteUrlLastObserved:APPROVED_STAGE_CALLBACK};
 const r=inspectOwnerObservations(rootObservation);
 assert.equal(r.siteUrlMatchesApprovedStagingRoot,true);
 assert.equal(r.siteUrlRequiresOwnerReview,false);
 const gate=assessActivationChecklist(args({observation:rootObservation}));
 assert.equal(gate.gates.find(x=>x.id==='site-url').status,'LAST_OBSERVED_MATCH');
 assert.equal(gate.releaseGate,'HOLD');
 assert.equal(gate.stagingDeploymentAuthorized,false);
 assert.equal(gate.readiness,'NOT_READY_FOR_STAGE_ACTIVATION');
});
test('date-bound checklist reports exact protected root, isolated project, owner action and no deployment',()=>{
 const r=assessActivationChecklist(args());
 assert.equal(r.stageProjectRef,'fbnplztkbsteuzrmbgib');
 assert.equal(r.cloudflarePagesProject,'closet-current-staging');
 assert.equal(r.approvedOrigin,'https://closet-current-staging.pages.dev/');
 assert.equal(r.ownerEvidenceDate,'2026-10-25');
 assert.equal(r.evidenceIsHistorical,true);
 assert.equal(r.releaseGate,'HOLD');
 assert.equal(r.sourceOfCurrentCloudflareDeployment,'ONE_FILE_ACCESS_TEST_PLACEHOLDER');
 assert.equal(r.keyEmbeddedIntoStageArtifact,false);
 assert.equal(r.stagingDeploymentAuthorized,false);
 assert.equal(r.productionDeploymentAuthorized,false);
 assert.equal(r.realJwtTestAuthorized,false);
 assert.equal(r.gates.find(x=>x.id==='site-url').status,'OWNER_REVIEW_REQUIRED');
 assert.equal(r.gates.find(x=>x.id==='real-stage-auth').status,'BLOCKED');
 assert.equal(r.gates.find(x=>x.id==='cross-account-jwt-rls-storage').status,'NOT_TESTED');
 assert.equal(r.gates.find(x=>x.id==='unauthorized-identity-denial').status,'NOT_PROVEN');
 assert.match(r.nextOwnerAction,/do not save or change/);
 assert.equal(JSON.stringify(r).includes('sb_publishable_'),false);
});
test('incorrect project, production URLs, false release claims or unapproved redirects fail closed',()=>{
 for(const change of [
  {projectRef:'hlkgymugtfbirlpunsra'},
  {pagesProject:'closet-current'},
  {approvedRoot:'https://closet-current.pages.dev/'},
  {siteUrlLastObserved:'https://closet-current.pages.dev/'},
  {siteUrlLastObserved:'https://a15254d6.closet-current-staging.pages.dev/'},
  {siteUrlLastObserved:APPROVED_STAGE_CALLBACK+'?qa=1'},
  {allowedRedirectUrlsLastObserved:['https://closet-current.pages.dev/',PILOT_SITE_URL]},
  {allowedRedirectUrlsLastObserved:[APPROVED_STAGE_CALLBACK,APPROVED_STAGE_CALLBACK]},
  {fullAppLiveDeploymentObserved:true},
  {actualUnapprovedIdentityDenialVerified:true},
  {signedInJwtAccountIsolationVerified:true},
  {postDeploymentAssetProtectionVerified:true},
  {actualPhoneCaptureVerified:true},
  {userAuthorizedDeployment:true},
  {publicSignupLastObserved:true},
  {stagingPublishableKeyExistsReadOnly:false},
  {stagingAccountCountLastReadOnly:2}
 ]){
  assert.throws(()=>inspectOwnerObservations({...OWNER_OBSERVATIONS,...change}),
    /Unverified|Unapproved/,JSON.stringify(change));
 }
});
test('offline candidate missing modules, deployment authorization or incorrect projects cannot pass audit',()=>{
 for(const change of [
  {missingReferencedAssets:1},
  {releaseGate:'GO'},
  {deployAllowed:true},
  {uploadAuthorized:true},
  {fullAppDeployed:true},
  {stageProjectRef:'hlkgymugtfbirlpunsra'},
  {stagingOrigin:'https://closet-current.pages.dev/'},
  {candidateAssetCount:1}
 ])assert.throws(()=>assessActivationChecklist(args({
  staticAudit:{...staticAudit(),...change}
 })),/Protected complete-app artifact/);
});
test('Access login prompts cannot be promoted to full unauthorized identity denial',()=>{
 const smoke=verifyOwnerAccessSmoke();
 for(const override of [
  {observedChallenges:1},
  {unapprovedIdentityDenialProven:true},
  {allStaticAssetsProven:true}
 ])assert.throws(()=>assessActivationChecklist(args({
  browserSmoke:{...smoke,...override}
 })),/Cloudflare Access challenges/);
});
test('safeguard main-only production deployment workflow and placeholder classification',()=>{
 for(const bad of [
  workflow.replace('branches: [main]','branches: [any-branch]'),
  workflow.replace('--project-name=closet-current','--project-name=closet-current-staging'),
  'on: push; deploy everything'
 ])assert.throws(()=>assessActivationChecklist(args({
  prodDeploymentWorkflow:bad
 })),/Production deployment workflow/);
 assert.throws(()=>assessActivationChecklist(args({
  stageHandoff:{...stageHandoff(),actualFullAppDeployed:true}
 })),/One-file Access placeholder/);
});
