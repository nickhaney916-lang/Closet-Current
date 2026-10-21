// Fail-closed release-candidate scope audit. A green audit is NOT permission to deploy.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';

export const INTEGRATED_HEAD='c921cfc4ec72ccf5f333df99e6c4d6a20719541d';
const ALLOWED=new Set([
 'scripts/audit-pilot-release-preflight.mjs',
 'tests/pilot-release-preflight.test.mjs',
 '.github/workflows/pilot-release-preflight-qa.yml',
 'docs/PILOT-RELEASE-PREFLIGHT-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
export const DEPLOY_FILES=['.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'];

export function auditPilotReleasePreflight(input){
 assert.ok(input&&typeof input==='object','Missing source proof');
 assert.equal(input.parentPresent,true,'Integrated exact source is not an ancestor');
 assert.equal(input.integratedAlreadyInMain,false,'Cannot claim a development-only candidate after production promotion');
 assert.deepEqual([...new Set(input.changedFiles)].sort(),input.changedFiles.slice().sort(),
  'Duplicate changed-file records');
 for(const p of input.changedFiles){
  assert.ok(ALLOWED.has(p),'Customer/deployment source changed without independent audit: '+p);
 }
 assert.deepEqual(Object.keys(input.deployWorkflows).sort(),DEPLOY_FILES.slice().sort(),
  'Both deployed hosting workflows must be audited');
 for(const [name,source] of Object.entries(input.deployWorkflows)){
  assert.equal(typeof source,'string','Deployment workflow missing: '+name);
  // Only main pushes can publish automatically. Manual dispatch is acknowledged
  // separately: this branch does NOT edit those workflows or grant permission.
  const triggers=source.slice(0,source.indexOf('\npermissions:')<0?undefined:source.indexOf('\npermissions:'));
  assert.match(triggers,/^on:\s*\n\s*push:\s*\n\s*branches:\s*\[main\]/m,
   'Deployment push must remain restricted to main: '+name);
  assert.doesNotMatch(triggers,/^\s*(pull_request|pull_request_target|schedule|workflow_run):/m,
   'Unexpected deployment trigger in '+name);
  assert.match(triggers,/^\s*workflow_dispatch:/m,
   'Manual deploy trigger must be acknowledged and reviewed: '+name);
 }
 assert.equal(input.human?.suppliedSubmissions,0,
  'New independent human data must be privately and separately verified before changing this gate');
 assert.equal(input.human?.approvedModelAccuracy,null,'No validated human gold score exists');
 assert.equal(input.human?.productionPromotion,'BLOCKED','Independent review source unexpectedly permits release');
 return Object.freeze({
  schemaVersion:1,
  technicalPreflight:'PASS',
  integrationHead:INTEGRATED_HEAD,
  auditScope:'new QA and documentation only; customer runtime and deployment workflows unmodified',
  deployedFromThisBranch:false,
  automaticDeploymentTargets:['main'],
  manualWorkflowDispatchExists:true,
  manualWorkflowDispatchBlockedByThisAudit:false,
  actualPhysicalAndroidEvidenceAccepted:0,
  actualPhysicalIPhoneEvidenceAccepted:0,
  independentlyVerifiedHumanReviewCount:0,
  validatedOriginalPhotoRecognitionAccuracy:null,
  liveTwoAccountSupabaseIsolationVerified:false,
  customerPrivacyTermsAndDeletionApproved:false,
  realFigureArtRightsApproved:false,
  productionReleaseApproved:false,
  productionPromotion:'BLOCKED',
  releaseBlockers:[
   'Independent blinded original-photo garment reviewers and measured gold accuracy',
   'Actual installed Android and iPhone owner-run camera, storage, update/offline and screen-reader checks',
   'Live disposable two-account Supabase Auth, backup restore and owner-isolation checks',
   'External email/domain, privacy/terms, deletion and figure rights human signoff',
   'Explicit approval for merge and production deployment'
  ]
 });
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
export function auditRepository(){
 execFileSync('git',['merge-base','--is-ancestor',INTEGRATED_HEAD,'HEAD']);
 const mainIsDeployed=spawnSync('git',['merge-base','--is-ancestor',INTEGRATED_HEAD,'origin/main'],{encoding:'utf8'});
 assert.ok(mainIsDeployed.status===0||mainIsDeployed.status===1,
  'Cannot determine whether integrated source was merged into main');
 const changed=git('diff','--name-only',INTEGRATED_HEAD,'HEAD','--').split('\n').filter(Boolean);
 const human=reconcile(packetFromLock(readFileSync(LOCK)),[]);
 const deployWorkflows=Object.fromEntries(DEPLOY_FILES.map(p=>[p,readFileSync(p,'utf8')]));
 return auditPilotReleasePreflight({
  parentPresent:true,integratedAlreadyInMain:mainIsDeployed.status===0,
  changedFiles:changed,deployWorkflows,human
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 console.log(JSON.stringify(auditRepository(),null,2));
}
