/**
 * Family Alpha issue #255 — owner-facing activation preflight, NO DEPLOY.
 * OFFLINE ONLY. No provider/network calls, passwords, JWTs, API keys, uploads,
 * test accounts, configuration changes or deployment permissions.
 *
 * Output is only a HOLD checklist. It cannot authorize publication.
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 STAGE_ID,PROD_ID,STAGE_BASE,APPROVED_STAGE_CALLBACK
} from './build-family-alpha-staging-auth-hold.mjs';
import {auditStageStaticAssets} from './audit-family-alpha-stage-assets-hold.mjs';
import {
 auditStageHandoff,verifyOwnerAccessSmoke
} from './audit-family-alpha-staging-root-handoff.mjs';

export const STAGE_PAGES_PROJECT='closet-current-staging';
export const PRODUCTION_PAGES_PROJECT='closet-current';
export const STAGE_AUTH_CONFIG_URL='https://supabase.com/dashboard/project/'+STAGE_ID+'/auth/url-configuration';
export const PILOT_SITE_URL='https://pilot-access-check.closet-current-staging.pages.dev/';

/** DATED observations, not a live Cloudflare or Supabase settings API read. */
export const OWNER_OBSERVATIONS=Object.freeze({
 captureDate:'2026-10-25',
 evidence:'OWNER_DASHBOARD_SCREENSHOTS_AND_STAGING_READ_ONLY_METADATA',
 projectRef:STAGE_ID,
 pagesProject:STAGE_PAGES_PROJECT,
 approvedRoot:APPROVED_STAGE_CALLBACK,
 siteUrlLastObserved:PILOT_SITE_URL,
 allowedRedirectUrlsLastObserved:Object.freeze([APPROVED_STAGE_CALLBACK,PILOT_SITE_URL]),
 publicSignupLastObserved:false,
 customSmtpLastObserved:true,
 stagingPublishableKeyExistsReadOnly:true,
 stagingAccountCountLastReadOnly:1,
 fullAppLiveDeploymentObserved:false,
 actualUnapprovedIdentityDenialVerified:false,
 signedInJwtAccountIsolationVerified:false,
 postDeploymentAssetProtectionVerified:false,
 actualPhoneCaptureVerified:false,
 userAuthorizedDeployment:false
});
const EXPECTED_OBSERVATION_KEYS=Object.freeze(Object.keys(OWNER_OBSERVATIONS).sort());
function exactUrl(input){
 if(typeof input!=='string'||!input)return null;
 try{
  const url=new URL(input);
  if(url.protocol!=='https:'||url.username||url.password||url.port||
     url.search||url.hash||url.pathname!=='/'||url.href!==input)
    return null;
  return url.href;
 }catch{return null;}
}
export function inspectOwnerObservations(observations=OWNER_OBSERVATIONS){
 if(!observations||typeof observations!=='object'||
   Object.keys(observations).sort().join('|')!==EXPECTED_OBSERVATION_KEYS.join('|')||
   observations.captureDate!=='2026-10-25'||
   observations.evidence!=='OWNER_DASHBOARD_SCREENSHOTS_AND_STAGING_READ_ONLY_METADATA'||
   observations.projectRef!==STAGE_ID||observations.pagesProject!==STAGE_PAGES_PROJECT||
   observations.approvedRoot!==APPROVED_STAGE_CALLBACK||
   observations.fullAppLiveDeploymentObserved!==false||
   observations.actualUnapprovedIdentityDenialVerified!==false||
   observations.signedInJwtAccountIsolationVerified!==false||
   observations.postDeploymentAssetProtectionVerified!==false||
   observations.actualPhoneCaptureVerified!==false||
   observations.userAuthorizedDeployment!==false||
   observations.publicSignupLastObserved!==false||
   observations.customSmtpLastObserved!==true||
   observations.stagingPublishableKeyExistsReadOnly!==true||
   observations.stagingAccountCountLastReadOnly!==1)
  throw Error('Unverified or unsafe staging activation observations');
 const siteUrl=exactUrl(observations.siteUrlLastObserved);
 if(!siteUrl||
    ![PILOT_SITE_URL,APPROVED_STAGE_CALLBACK].includes(siteUrl)||
    !Array.isArray(observations.allowedRedirectUrlsLastObserved)||
    observations.allowedRedirectUrlsLastObserved.length!==2||
    new Set(observations.allowedRedirectUrlsLastObserved).size!==2||
    !observations.allowedRedirectUrlsLastObserved.includes(APPROVED_STAGE_CALLBACK)||
    !observations.allowedRedirectUrlsLastObserved.includes(PILOT_SITE_URL)||
    observations.allowedRedirectUrlsLastObserved.some(url=>!exactUrl(url)))
  throw Error('Unapproved Site URL or staging redirect allowlist evidence');
 return Object.freeze({
  rootRedirectLastObservedAllowlisted:true,
  siteUrlLastObserved:siteUrl,
  siteUrlMatchesApprovedStagingRoot:siteUrl===APPROVED_STAGE_CALLBACK,
  siteUrlRequiresOwnerReview:siteUrl!==APPROVED_STAGE_CALLBACK,
  stagingAuthSignupLastObservedOff:true,
  stagingKeyExistenceObserved:true,
  noActualJwtAuthorizationProof:true
 });
}
export function assessActivationChecklist({
 observation=OWNER_OBSERVATIONS,
 staticAudit,
 stageHandoff,
 browserSmoke,
 prodDeploymentWorkflow
}={}){
 const verified=inspectOwnerObservations(observation);
 if(!staticAudit||staticAudit.releaseGate!=='HOLD'||
    staticAudit.deployAllowed!==false||staticAudit.uploadAuthorized!==false||
    staticAudit.fullAppDeployed!==false||
    staticAudit.stageProjectRef!==STAGE_ID||
    staticAudit.stagingOrigin!==APPROVED_STAGE_CALLBACK||
    staticAudit.missingReferencedAssets!==0||
    !Number.isSafeInteger(staticAudit.candidateAssetCount)||
    staticAudit.candidateAssetCount<60)
  throw Error('Protected complete-app artifact not independently audited');
 if(!stageHandoff||stageHandoff.releaseGate!=='HOLD'||
    stageHandoff.deployAllowed!==false||stageHandoff.familyInvitesAllowed!==false||
    stageHandoff.actualFullAppDeployed!==false||
    stageHandoff.actualDeployedStaging!=='ACCESS_TEST_PLACEHOLDER')
  throw Error('One-file Access placeholder must not be declared full staging app');
 if(!browserSmoke||browserSmoke.observedChallenges!==4||
    browserSmoke.unapprovedIdentityDenialProven!==false||
    browserSmoke.allStaticAssetsProven!==false)
  throw Error('Cloudflare Access challenges are not complete authorization proof');
 if(typeof prodDeploymentWorkflow!=='string'||
    !prodDeploymentWorkflow.includes('branches: [main]')||
    !prodDeploymentWorkflow.includes('pages deploy dist --project-name=closet-current --branch=main')||
    prodDeploymentWorkflow.includes('--project-name=closet-current-staging')||
    !prodDeploymentWorkflow.includes('name: Deploy Closet Current to Cloudflare Pages'))
  throw Error('Production deployment workflow changed: require independent review');
 if(APPROVED_STAGE_CALLBACK!=='https://closet-current-staging.pages.dev/'||
    STAGE_BASE!=='https://fbnplztkbsteuzrmbgib.supabase.co'||
    STAGE_ID===PROD_ID||STAGE_PAGES_PROJECT===PRODUCTION_PAGES_PROJECT)
  throw Error('Production/staging routing confusion');
 const gates=[
  {id:'cloudflare-owner-access',status:'OWNER_OBSERVED',details:'4 unauthenticated challenges and approved owner placeholder login'},
  {id:'full-staging-app-bundle',status:'OFFLINE_PASS',details:'Source-pinned full app bundled with references checked; not deployed'},
  {id:'exact-staging-root-redirect',status:'OWNER_OBSERVED',details:'Staging root in allowed redirect list; not a fresh provider API export'},
  {id:'site-url',status:verified.siteUrlRequiresOwnerReview?'OWNER_REVIEW_REQUIRED':'LAST_OBSERVED_MATCH',details:verified.siteUrlRequiresOwnerReview?'Site URL was last observed on the pilot preview host':'Staging Site URL was last observed matching root; refresh before deployment'},
  {id:'real-stage-auth',status:'BLOCKED',details:'Staging key and callback intentionally blank in generated runtime; no live login'},
  {id:'2d-photo-avatar',status:'BLOCKED',details:'Separate photo-avatar owner-approved rollout flag remains false'},
  {id:'public-signup',status:'LAST_OBSERVED_OFF',details:'Staging-only dashboard flag was off; direct server denial not exercised'},
  {id:'cross-account-jwt-rls-storage',status:'NOT_TESTED',details:'Existing one account; requires disposable adult A/B test with explicit approval'},
  {id:'unauthorized-identity-denial',status:'NOT_PROVEN',details:'No code arrived to unauthorized address; not definitive identity denial'},
  {id:'live-staging-asset-protection',status:'NOT_TESTED',details:'New complete-app script/CSS/worker routes not yet deployed'},
  {id:'actual-family-device-photo-test',status:'NOT_TESTED',details:'Physical camera + original JPEG + saved closet + layered avatar pending'},
  {id:'deployment-authorization',status:'NOT_GRANTED',details:'No owner GO, no merge, no deploy, no invitations'}
 ];
 return Object.freeze({
  project:'Closet Current',milestone:'Family Alpha v0.1',
  stageProjectRef:STAGE_ID,cloudflarePagesProject:STAGE_PAGES_PROJECT,
  approvedOrigin:APPROVED_STAGE_CALLBACK,
  authUrlSettings:STAGE_AUTH_CONFIG_URL,
  ownerEvidenceDate:observation.captureDate,
  evidenceIsHistorical:true,rootRedirectAllowlistedLastObserved:true,
  publishableKeyExistenceOnly:true,
  keyEmbeddedIntoStageArtifact:false,
  sourceOfCurrentCloudflareDeployment:'ONE_FILE_ACCESS_TEST_PLACEHOLDER',
  offlineCandidateAssets:staticAudit.candidateAssetCount,
  releaseGate:'HOLD',stagingDeploymentAuthorized:false,
  productionDeploymentAuthorized:false,realJwtTestAuthorized:false,
  readiness:'NOT_READY_FOR_STAGE_ACTIVATION',
  gates:Object.freeze(gates),
  nextOwnerAction:'Read-only: inspect staging Supabase Authentication > URL Configuration Site URL; do not save or change without approval.'
 });
}
export async function auditStageActivation({root=resolve('.')}={}){
 const [staticAudit,stageHandoff,prodDeploymentWorkflow]=await Promise.all([
  auditStageStaticAssets({root}),
  auditStageHandoff({root}),
  readFile(resolve(root,'.github/workflows/cloudflare-pages.yml'),'utf8')
 ]);
 return assessActivationChecklist({staticAudit,stageHandoff,
  browserSmoke:verifyOwnerAccessSmoke(),prodDeploymentWorkflow});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No URL, deployment flags, credentials or live host arguments accepted');
 const report=await auditStageActivation();
 console.log('FAMILY_ALPHA_STAGE_ACTIVATION_CHECKLIST_HOLD '+JSON.stringify(report));
}
