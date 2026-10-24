/**
 * Family Alpha — protected staging PREFLIGHT ONLY.
 *
 * NO DEPLOY, NO AUTH USER TESTS, NO LIVE HOST PROBES BY DEFAULT.
 * Validates the isolated staged build and defines a future owner-approved
 * anonymous HEAD probe. A Cloudflare challenge is only limited evidence:
 * it cannot attest to an approved access list, successful legitimate login,
 * signed-in Supabase RLS, or object/signed-URL access restrictions.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertStagingAuthCandidate,STAGE_BASE,PROD_BASE,OUT} from './build-family-alpha-staging-auth-hold.mjs';
const FROZEN=Object.freeze;
const NON_PUBLIC=/^(?:localhost|127\.0\.0\.1|0\.0\.0\.0)$/;
const HOST_TEST_SUFFIX=/(?:\.invalid|\.test|\.localhost|\.example)$/;
const CLOUDFLARE_SUFFIX='.cloudflareaccess.com';
const result=(id,status,detail)=>FROZEN({id,status,detail});
const expectedApproval=FROZEN([
 'Approve the exact private HTTPS origin and staging redirect with Cloudflare Access in front of every app and image route',
 'Verify unauthenticated requests cannot fetch the staging app or cached bundles, including alternate domains and service worker scopes',
 'Confirm approved users and devices can log in and unapproved users are rejected by real Cloudflare Access',
 'Register that exact redirect in the separate staging Supabase Auth URL allowlist; verify confirmation and recovery emails',
 'Build a NEW isolated approved routing artifact with its matching staging publishable key only after authorization',
 'Using disposable staging Auth identities, prove each user can save/reload their own backup and JPEG',
 'Prove signed-in Account A cannot read/update/delete Account B rows, JPEG objects or signed URLs and vice versa',
 'Review production excessive backup-table privileges, and obtain consent for subsequent physical family photo/phone tests'
]);
export function validateProposedStagingUrl(value){
 if(typeof value!=='string'||!value.trim())return null;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port||
   url.search||url.hash||url.hostname.toLowerCase()!==url.hostname||
   !['/','/Closet-Current/'].includes(url.pathname)||
   NON_PUBLIC.test(url.hostname)||HOST_TEST_SUFFIX.test(url.hostname)||
   url.hostname.endsWith('.github.io')||url.hostname.endsWith('.supabase.co')||
   url.hostname.endsWith(CLOUDFLARE_SUFFIX)||
   !url.hostname.includes('.')||
   /\[[^\]]+\]/.test(url.host)||
   /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname))
   return null;
  return url.href;
 }catch{return null;}
}
export async function inspectProtectedStagingCandidate({root=resolve('.')}={}){
 const manifest=await assertStagingAuthCandidate({root});
 const candidate=join(resolve(root),OUT);
 const [config,auth,cloud,preflight,index,preview,sw]=await Promise.all([
  'alpha-stage-config.js','auth.js','cloud-backup.js','family-alpha-2d-auth-preflight.mjs',
  'index.html','family-alpha-preview-boot.js','pwa.js'
 ].map(x=>readFile(join(candidate,x),'utf8')));
 const blockers=[];
 const warnings=[];
 if(manifest.routingReadyForQa!==false||manifest.emailRedirect!==null||
  manifest.keyFingerprint!==null||!config.includes('"redirect":""')||
  !config.includes('"key":""')||
  !config.includes('HOLD-NO-CALLBACK-OR-KEY'))
  throw Error('The unapproved staged Auth build must have blank callback and key');
 if(auth.includes(PROD_BASE)||cloud.includes(PROD_BASE)||preflight.includes(PROD_BASE)||
  !preflight.includes(STAGE_BASE+'/auth/v1/user')||
  !auth.includes('closet-alpha-staging-auth-v1')||
  !auth.includes('const URL=stage.base')||
  !cloud.includes('BASE=stage.base,KEY=stage.key')||
  !index.includes('alpha-stage-config.js')||
  index.indexOf('alpha-stage-config.js')>index.indexOf('src="auth.js')||
  !preview.includes("host!=='localhost'&&host!=='127.0.0.1'")||
  sw.includes('serviceWorker.register'))
  throw Error('Staging source environment or startup fail-closed gate changed');
 blockers.push(result('staging.origin-approval','NOT VERIFIED',
  'No approved protected HTTPS origin or verified Cloudflare Access hostname is recorded'));
 blockers.push(result('staging.callback-allowlist','NOT VERIFIED',
  'Staging Supabase registered Auth callback and email redirects were not checked or modified'));
 blockers.push(result('staging.access-allowlist','NOT VERIFIED',
  'Cloudflare unauthorized and authorized access checks have not been performed on the actual site'));
 blockers.push(result('staging.auth-activation','BLOCKED',
  'Public staging key and approved HTTPS callback deliberately omitted; stage sign-in and cloud restore remain unavailable'));
 blockers.push(result('staging.live-rls','NOT VERIFIED',
  'No real separate signed-in synthetic test-account backup/photo allow/deny requests performed'));
 blockers.push(result('staging.family-phones','NOT VERIFIED',
  'No consented physical Android/iPhone camera, photo-quality or family feedback signoff'));
 warnings.push(result('staging.service-worker-scope','REVIEW',
  'The staged PWA registers no service worker; any pre-existing worker/cached protected pages need a separate-origin check'));
 warnings.push(result('staging.host-probe-limits','REVIEW',
  'Anonymous Access challenge alone does not prove approved users can log in or all routes are protected'));
 return FROZEN({releaseGate:'HOLD',
  generatedFrom:'local source-pinned isolated candidate, NOT live host',
  projectRef:manifest.projectRef,
  stageApiUrl:manifest.stageApiUrl,
  changedNormalProductionDist:false,
  routeIsolatedFromProduction:true,liveAccessTested:false,
  protectedAccessVerified:false,realBackendAuthorizationTested:false,
  readyToDeploy:false,readyForFamily:false,
  blockers:FROZEN(blockers),warnings:FROZEN(warnings),
  nextApprovals:expectedApproval
 });
}
function safeCloudflareRedirect(location){
 if(typeof location!=='string')return false;
 try{
  const link=new URL(location);
  return link.protocol==='https:'&&!link.username&&!link.password&&
   link.hostname.endsWith(CLOUDFLARE_SUFFIX)&&
   link.hostname.length>CLOUDFLARE_SUFFIX.length&&
   link.pathname.startsWith('/cdn-cgi/access/');
 }catch{return false;}
}
/**
 * Only for a LATER explicit owner-approved check of one exact HTTPS origin.
 * Method HEAD with no cookies/token, no redirect following, and no body.
 * No real host is probed by the default CLI or CI.
 */
export async function probeUnauthenticatedAccess({
 approvedOrigin,ownerApproved=false,fetchFn,signal
}={}){
 const url=validateProposedStagingUrl(approvedOrigin);
 if(!ownerApproved||!url||typeof fetchFn!=='function')
  throw Error('Explicit approved exact HTTPS staging origin and probe approval required');
 let response;
 try{
  response=await fetchFn(url,{method:'HEAD',credentials:'omit',
   redirect:'manual',cache:'no-store',referrerPolicy:'no-referrer',signal});
 }catch{
  return FROZEN({status:'INCONCLUSIVE',challengeObserved:false,
   releaseGate:'HOLD',reason:'Network failed; no staging access protection verified'});
 }
 if(!Number.isInteger(response?.status))
  throw Error('Invalid Access probe response');
 const location=response.headers?.get?.('location');
 if(response.status>=200&&response.status<300)
  return FROZEN({status:'FAIL_PUBLIC',challengeObserved:false,releaseGate:'HOLD',
   reason:'An unauthenticated HEAD succeeded; do not distribute this staged artifact'});
 if([301,302,303,307,308].includes(response.status)&&safeCloudflareRedirect(location))
  return FROZEN({status:'ACCESS_CHALLENGE_OBSERVED',challengeObserved:true,releaseGate:'HOLD',
   reason:'An unauthenticated Cloudflare Access redirect was observed, but authorized access, alternate origins and private routes remain unverified'});
 if(response.status===401||response.status===403)
  return FROZEN({status:'DENIED_SOURCE_UNVERIFIED',challengeObserved:false,releaseGate:'HOLD',
   reason:'Unauthenticated request denied, but response origin and Access policy cannot be established by status alone'});
 return FROZEN({status:'INCONCLUSIVE',challengeObserved:false,releaseGate:'HOLD',
  reason:'No recognized Cloudflare Access challenge; site protection not verified'});
}
export function preflightSummary(report){
 if(report?.releaseGate!=='HOLD')throw Error('Unsafe Family Alpha release claim');
 return JSON.stringify({
  releaseGate:'HOLD',projectRef:report.projectRef,
  routeIsolatedFromProduction:report.routeIsolatedFromProduction,
  liveAccessTested:false,protectedAccessVerified:false,
  realBackendAuthorizationTested:false,readyToDeploy:false,readyForFamily:false,
  blockers:report.blockers.map(b=>({id:b.id,status:b.status})),
  warnings:report.warnings.map(w=>w.id)
 },null,2)+'\n';
}
async function main(){
 if(process.argv.length>2)throw Error('Default staging preflight accepts NO live hostname, tokens or credentials');
 const result=await inspectProtectedStagingCandidate();
 const summary=preflightSummary(result);
 console.log('Family Alpha protected staging PRE-FLIGHT (offline):\n'+summary);
 console.log('NO LIVE HOST PROBED; NO SUPABASE USER DATA ACCESSED; RELEASE HOLD.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 await main();
