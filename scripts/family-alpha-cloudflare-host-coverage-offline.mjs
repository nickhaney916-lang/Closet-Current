/**
 * Closet Current Family Alpha — previously recorded Cloudflare host inventory.
 * OFFLINE ONLY. Does not call Cloudflare, Supabase or a live preview URL.
 *
 * A pages.dev root-host destination is NOT evidence that *.pages.dev preview
 * hosts are protected; neither an Access policy name nor a 522 counts as an
 * authenticated/unauthenticated Access test.
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectProtectedStagingCandidate,validateProposedStagingUrl} from './check-family-alpha-protected-staging-preflight.mjs';

export const INVENTORY_PATH='research/family-alpha-access/known-cloudflare-setup-20261021.json';
export const EXPECTED_ROOT='closet-current-staging.pages.dev';
export const EXPECTED_WILDCARD='*.'+EXPECTED_ROOT;
const CHECK_URLS=Object.freeze([
 {id:'root',host:EXPECTED_ROOT,kind:'root pages.dev hostname'},
 {id:'branch-alias-example',host:'branch-alpha.'+EXPECTED_ROOT,kind:'representative branch preview'},
 {id:'deployment-preview-example',host:'commit-preview.'+EXPECTED_ROOT,kind:'representative preview or deployment hostname'}
]);
const frozen=(x)=>Object.freeze(x);
const finding=(id,status,detail)=>frozen({id,status,detail});
const normalHost=(value)=>{
 if(typeof value!=='string'||!value||value.includes('://')||value.includes('/')||
    value.includes('?')||value.includes('#')||value.includes(':')||
    value!==value.toLowerCase()||value.endsWith('.')||
    !/^[a-z0-9.*-]+(?:\.[a-z0-9-]+)+$/.test(value))return null;
 return value;
};
/** This is a local proposed-rule evaluation, NEVER a live policy audit. */
export function evaluateProposedAccessCoverage({
 applications=[],approvedTesterRulesRecorded=false,allowAnyOtherHostname=false
}={}){
 if(!Array.isArray(applications))throw Error('Explicit reviewed proposed application array required');
 const patterns=new Set();
 const unsafe=[];
 for(const app of applications){
  if(!app||!Array.isArray(app.hostnames)||!Array.isArray(app.policies))
   throw Error('Malformed hypothetical Access application');
  for(const host of app.hostnames){
   const parsed=normalHost(host);
   if(!parsed)throw Error('Bad hypothetical hostname');
   patterns.add(parsed);
  }
  for(const policy of app.policies){
   if(!policy||typeof policy.action!=='string'||!Array.isArray(policy.include))
    throw Error('Malformed hypothetical policy');
   if(policy.action.toLowerCase()==='bypass'||
      policy.action.toLowerCase()==='allow'&&
      policy.include.some(rule=>rule?.type==='everyone'||
        rule?.type==='email_domain'&&rule?.explicitApproved!==true||
        rule?.type==='email_wildcard')){
    unsafe.push('broad-or-bypass-policy');
   }
  }
 }
 const root=patterns.has(EXPECTED_ROOT);
 const previews=patterns.has(EXPECTED_WILDCARD);
 if(!root)unsafe.push('root-not-listed');
 if(!previews)unsafe.push('preview-wildcard-not-listed');
 if(allowAnyOtherHostname)unsafe.push('unreviewed-alternate-host');
 const policiesPresent=applications.some(app=>app.policies.some(p=>p.action.toLowerCase()==='allow'&&p.include.length>0));
 if(!policiesPresent)unsafe.push('no-allow-policy-reviewed');
 if(!approvedTesterRulesRecorded)unsafe.push('tester-rules-unreviewed');
 return frozen({
  rootDeclared:root,previewWildcardDeclared:previews,
  wildcardCovers:CHECK_URLS.slice(1).every(x=>x.host.endsWith('.'+EXPECTED_ROOT)),
  allowedToDeploy:false,
  liveEnforcementVerified:false,
  ruleChecklistComplete:unsafe.length===0,
  riskFlags:frozen([...new Set(unsafe)]),
  verdict:unsafe.length?'COVERAGE_GAPS':'PROPOSED_COVERAGE_ONLY_NOT_VERIFIED'
 });
}
export function auditRecordedCloudflareInventory(checkpoint,offlinePreflight){
 if(checkpoint?.schemaVersion!==1||
    checkpoint?.currentReleaseGate!=='HOLD'||
    checkpoint?.refreshedByLiveCloudflareRead!==false||
    checkpoint?.capturedDate!=='2026-10-21'||
    checkpoint?.confirmedRootHostname!==EXPECTED_ROOT||
    checkpoint?.previewCoverageTarget!==EXPECTED_WILDCARD||
    offlinePreflight?.releaseGate!=='HOLD'||
    offlinePreflight?.readyForFamily!==false||
    offlinePreflight?.routeIsolatedFromProduction!==true)
  throw Error('Invalid or overstated historical Cloudflare access snapshot');
 if(checkpoint.rootEnforcementVerified!==false||
    checkpoint.previewWildcardApplicationVerified!==false||
    checkpoint.policyIncludeRulesVerified!==false||
    checkpoint.policyRequireRulesVerified!==false||
    checkpoint.policyExcludeRulesVerified!==false||
    checkpoint.ownerAuthorizedStagingDeployment!==false)
  throw Error('Historical evidence cannot be elevated into live verification');
 const entries=[
  finding('staging.root-host','KNOWN_UNVERIFIED',
    'Root host '+EXPECTED_ROOT+' was the configured Access destination in a prior screenshot, not verified enforcement'),
  finding('staging.root-522','INCONCLUSIVE',
    'An HTTP 522 is not a Cloudflare Access allow/deny result and does not prove the staging site is protected'),
  finding('staging.preview-wildcard','NOT VERIFIED',
    'No separate *.'+EXPECTED_ROOT+' Access application/policy enforcement has been confirmed'),
  finding('staging.policy-identities','NOT VERIFIED',
    'Named Allow policy exists but Include/Require/Exclude and approved tester identities were not independently inspected'),
  finding('staging.other-aliases','NOT VERIFIED',
    'Branch aliases, deployment preview aliases and alternate hostnames require independent deny/allow checks'),
  finding('staging.auth-callback','NOT VERIFIED',
    'Exact staged Supabase Auth Site URL/redirect allowlist and email delivery remain unchecked'),
  finding('staging.deployed-app','NOT DEPLOYED',
    'Checkpoint showed no actual Pages application deployment; offline staging-auth HOLD build remains inert'),
  finding('staging.real-accounts','NOT VERIFIED',
    'No approved real staging JWT A/B database/photo Storage/signed URL checks were performed')
 ];
 const url='https://'+EXPECTED_ROOT+'/';
 if(validateProposedStagingUrl(url)!==url)
  throw Error('Exact recorded staging URL unexpectedly rejected by strict validator');
 return frozen({
  releaseGate:'HOLD',recordedHostname:EXPECTED_ROOT,
  proposedRootOrigin:url,previewPattern:EXPECTED_WILDCARD,
  hostnameSourceDate:checkpoint.capturedDate,
  liveCloudflareRead:false,anonymousHostProbePerformed:false,
  stagedCallbackApproved:false,deployAuthorized:false,
  readyForFamily:false,
  requiredReviewHosts:frozen(CHECK_URLS),
  checks:frozen(entries),
  summary:'Known host only — neither root nor wildcard preview access has been independently verified'
 });
}
export async function evaluateSavedAccessCheckpoint(){
 const [text,artifact]=await Promise.all([
  readFile(INVENTORY_PATH,'utf8'),inspectProtectedStagingCandidate()
 ]);
 return auditRecordedCloudflareInventory(JSON.parse(text),artifact);
}
async function main(){
 if(process.argv.length!==2)
  throw Error('Offline-only historical access report takes no URL, tokens, approval flag or test identities');
 const report=await evaluateSavedAccessCheckpoint();
 console.log('FAMILY_ALPHA_CLOUDFLARE_OFFLINE_COVERAGE_HOLD '+JSON.stringify(report));
 console.log('No Cloudflare or staging URL visited; root, wildcard and policy identity checks remain UNVERIFIED');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
