/**
 * Family Alpha #255: owner-observed Cloudflare staging root and complete-app
 * offline handoff. No fetch(), mutations, secrets, login or deployment.
 * A green bundle integrity check NEVER changes releaseGate from HOLD.
 */
import {readFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertDisabledIntegratedCandidate,OUTPUT} from './build-family-alpha-recognition-integrated-hold.mjs';
import {STAGE_ID,PROD_ID} from './build-family-alpha-staging-auth-hold.mjs';

export const STAGING_ROOT='https://closet-current-staging.pages.dev/';
export const OBSERVED_STAGE_DEPLOYMENT=Object.freeze({
  evidence:'Owner Cloudflare screenshots, 2026-10-25; not a current provider API read',
  deploymentPrefix:'a15254d6',
  deployedAt:'2026-10-22T12:59:00',
  uploadedAssets:Object.freeze(['index.html']),
  ownerAccessChallengeAndLoginObserved:true,
  unauthorizedUserDenialVerified:false,
  allStaticRoutesProtectedVerified:false
});
/** Owner-reported browser checks, NOT an API export or live authorization proof.
 * Logged in this audit only after the owner personally tested each URL.
 * Staging still serves the one-file Access placeholder; no release approval.
 */
export const OWNER_OBSERVED_ACCESS_SMOKE=Object.freeze({
  observedOn:'2026-10-25',
  source:'OWNER_REPORTED_INCOGNITO_BROWSER',
  checks:Object.freeze([
    Object.freeze({url:'https://closet-current-staging.pages.dev/',result:'CLOUDFLARE_LOGIN'}),
    Object.freeze({url:'https://closet-current-staging.pages.dev/index.html',result:'CLOUDFLARE_LOGIN'}),
    Object.freeze({url:'https://pilot-access-check.closet-current-staging.pages.dev/',result:'CLOUDFLARE_LOGIN'}),
    Object.freeze({url:'https://a15254d6.closet-current-staging.pages.dev/',result:'CLOUDFLARE_LOGIN'})
  ]),
  approvedOwnerReachedAccessPlaceholder:true,
  unapprovedEmailCodeNotReceived:true,
  unapprovedSessionDenialVerified:false,
  allStaticAssetsProtectedVerified:false
});
const EXPECTED_ACCESS_ROUTES=Object.freeze([
 'https://closet-current-staging.pages.dev/',
 'https://closet-current-staging.pages.dev/index.html',
 'https://pilot-access-check.closet-current-staging.pages.dev/',
 'https://a15254d6.closet-current-staging.pages.dev/'
]);
/** A login prompt alone is not a blocked unapproved identity. */
export function verifyOwnerAccessSmoke(smoke=OWNER_OBSERVED_ACCESS_SMOKE){
 if(smoke?.source!=='OWNER_REPORTED_INCOGNITO_BROWSER'||
    smoke?.observedOn!=='2026-10-25'||
    !Array.isArray(smoke?.checks)||smoke.checks.length!==EXPECTED_ACCESS_ROUTES.length||
    smoke.checks.some((v,i)=>v?.url!==EXPECTED_ACCESS_ROUTES[i]||v?.result!=='CLOUDFLARE_LOGIN')||
    smoke.approvedOwnerReachedAccessPlaceholder!==true||
    smoke.unapprovedEmailCodeNotReceived!==true||
    smoke.unapprovedSessionDenialVerified!==false||
    smoke.allStaticAssetsProtectedVerified!==false)
  throw Error('Cloudflare Access smoke evidence is incomplete or overstated');
 return Object.freeze({
  checkedUrls:EXPECTED_ACCESS_ROUTES,
  observedChallenges:EXPECTED_ACCESS_ROUTES.length,
  rootLoginChallengeObserved:true,
  indexHtmlLoginChallengeObserved:true,
  previewLoginChallengeObserved:true,
  hashedDeployLoginChallengeObserved:true,
  approvedOwnerReachedPlaceholder:true,
  unapprovedEmailCodeNotReceived:true,
  unapprovedIdentityDenialProven:false,
  allStaticAssetsProven:false
 });
}
const REQUIRED_FILES=Object.freeze([
  'index.html','app.js','auth.js','cloud-backup.js',
  'alpha-stage-config.js','family-alpha-preview-boot.js',
  'family-alpha-2d-saved-board.mjs','family-alpha-2d-auth-preflight.mjs',
  'recognition-engine.mjs','local-worker.mjs',
  'wardrobe-backup-engine.js','style.css'
]);

/**
 * A future staging root callback cannot silently use the live production
 * Pages site, a deployment-hash/branch preview, or the pilot-only test host.
 * This is only *syntactic* validation, not Cloudflare policy authorization.
 */
export function exactObservedStagingRoot(url){
  if(typeof url!=='string'||!url)return false;
  try{
    const u=new URL(url);
    return u.href===STAGING_ROOT &&
      u.origin==='https://closet-current-staging.pages.dev' &&
      u.username===''&&u.password===''&&u.port===''&&
      u.search===''&&u.hash===''&&u.pathname==='/';
  }catch{return false;}
}
export function classifyAssets(paths){
  if(!Array.isArray(paths))throw Error('Asset inventory required');
  const items=new Set();
  for(const path of paths){
    if(typeof path!=='string'||!path||
      path.startsWith('/')||path.includes('..')||
      path.includes('\\')||!/^[-A-Za-z0-9_./]+$/.test(path)||
      items.has(path))throw Error('Untrusted or duplicated asset name');
    items.add(path);
  }
  const missing=REQUIRED_FILES.filter(x=>!items.has(x));
  const kind=items.size===1&&items.has('index.html')
    ?'ACCESS_TEST_PLACEHOLDER'
    :missing.length===0?'OFFLINE_FULL_APP_FILES':'INCOMPLETE_BUNDLE';
  return Object.freeze({kind,assetCount:items.size,missing:Object.freeze(missing)});
}
async function files(dir,prefix=''){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.isSymbolicLink())throw Error('Symlink in Family Alpha release candidate');
    const key=prefix+entry.name;
    if(entry.isDirectory())out.push(...await files(join(dir,entry.name),key+'/'));
    else if(entry.isFile())out.push(key);
    else throw Error('Unsupported staging asset');
  }
  return out.sort();
}
export function makeGate({candidate,config,boot,index,manifest,accessSmoke=OWNER_OBSERVED_ACCESS_SMOKE}){
  if(candidate.kind!=='OFFLINE_FULL_APP_FILES')throw Error('Full offline app files absent');
  if(manifest.releaseGate!=='HOLD'||manifest.stageAuthBlocked!==true||
    manifest.missingPublishableKey!==true||manifest.missingApprovedCallback!==true||
    manifest.previewOffOutsideLocalhost!==true||manifest.stagingProjectRef!==STAGE_ID)
    throw Error('Unsafe candidate release flags');
  if(typeof config!=='string'||!config.includes('HOLD-NO-CALLBACK-OR-KEY')||
    !config.includes('"key":""')||!config.includes('"redirect":""')||
    typeof boot!=='string'||!boot.includes("host!=='localhost'&&host!=='127.0.0.1'")||
    typeof index!=='string'||!index.includes('alpha-stage-config.js')||
    !index.includes('family-alpha-preview-boot.js'))
    throw Error('Staging sign-in or local-only preview changed');
  if([config,boot,index].some(v=>v.includes('https://'+PROD_ID+'.supabase.co')))
    throw Error('Production Supabase project embedded');
  const observedAccess=verifyOwnerAccessSmoke(accessSmoke);
  const deployed=classifyAssets(OBSERVED_STAGE_DEPLOYMENT.uploadedAssets);
  if(deployed.kind!=='ACCESS_TEST_PLACEHOLDER')
    throw Error('Historical staging screenshot evidence changed; re-verify');
  return Object.freeze({
    releaseGate:'HOLD',
    provenance:'OFFLINE GitHub build plus dated owner Cloudflare screenshots; not a fresh deployed-site check',
    expectedRoot:STAGING_ROOT,
    actualDeployedStaging:deployed.kind,
    offlineCandidate: candidate.kind,
    candidateAssetCount:candidate.assetCount,
    stageSupabaseProject:STAGE_ID,
    stagingAuthDefaultBlocked:true,
    stagingCallbackRegisteredWithLiveAuth:false,
    actualFullAppDeployed:false,
    ownerAllowedAccessChallengeObserved:true,
    ownerObservedIncognitoChallenges:observedAccess.observedChallenges,
    ownerObservedAccessPaths:observedAccess.checkedUrls,
    indexHtmlLoginChallengeObserved:observedAccess.indexHtmlLoginChallengeObserved,
    ownerReachedPlaceholderAfterAuthentication:observedAccess.approvedOwnerReachedPlaceholder,
    unapprovedEmailCodeNotReceived:observedAccess.unapprovedEmailCodeNotReceived,
    unauthorizedAccountDenialTested:false,
    unapprovedIdentityDeniedProven:false,
    protectedStaticAssetPathsTested:false,
    realStagingJwtRlsAndStorageTested:false,
    nativePhoneCaptureTested:false,
    ownerAuthorizedRelease:false,
    deployAllowed:false,
    familyInvitesAllowed:false,
    remainingBlockers:Object.freeze([
      'Explicit deployment approval and source-pinned deployable staging bundle',
      'Unapproved identity denial after full verification; broader asset/alias protection and re-check after full staging deployment',
      'Staging-only publishable key and registered root callback after approval',
      'Direct staging Auth signup policy, real approved test-account login and reset',
      'JWT A/B owner-scoped backup and private JPEG read/write denial proofs',
      'Android/iPhone camera, original-photo clothing, avatar and 4-user tests'
    ])
  });
}
export async function auditStageHandoff({root=resolve('.')}={}){
  const manifest=await assertDisabledIntegratedCandidate({root});
  const folder=join(resolve(root),OUTPUT);
  const inventory=classifyAssets(await files(folder));
  const [config,boot,index]=await Promise.all(
    ['alpha-stage-config.js','family-alpha-preview-boot.js','index.html']
    .map(f=>readFile(join(folder,f),'utf8'))
  );
  return makeGate({candidate:inventory,config,boot,index,manifest});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==2)throw Error('No live host, publishable keys, approval or arguments accepted');
  const report=await auditStageHandoff();
  console.log('FAMILY_ALPHA_STAGING_ROOT_HANDOFF_HOLD '+JSON.stringify(report));
}
