/**
 * Family Alpha #50 — privacy-minimal physical phone evidence review.
 *
 * This checker CAN validate the shape/consistency of a manually supplied
 * Android+iPhone acceptance report. It CANNOT observe physical hardware or
 * verify a human's self-report. It NEVER issues release approval.
 * No app/HTTP/DB access. Report and errors never echo personal input.
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const COMBINED_CANDIDATE='be35089adea220b8cbc69b27b0232cbfc02d4a62';
export const STEPS=Object.freeze([
 'hardware_camera','manual_photo_quality','hands_free_start_stop',
 'whole_outfit_review','original_photo_indexing','category_color_correction',
 'three_owned_outfits','original_photo_board','one_piece_swap',
 'favorites_save_reload','offline_recovery','switch_browser_session',
 'cloud_backup_restore','two_owner_privacy'
]);
export const LIVE_GATES=Object.freeze([
 'switch_browser_session','cloud_backup_restore','two_owner_privacy'
]);
const STATUS=['NOT_TESTED','PASS','FAIL','BLOCKED'];
const PRIVACY=Object.freeze([
 'photoBytesIncluded','garmentNamesIncluded','originalFileNamesIncluded',
 'emailAddressesIncluded','accountIdsIncluded','tokensIncluded',
 'deviceIdentifiersIncluded','rawErrorMessagesIncluded'
]);
const exactKeys=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&
 Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(o,k));
const ROOT=['schema','observedOn','candidateCommit','source',
 'ownerVisualAcceptance','stageHostProtected','realTwoOwnerJwtIsolation',
 'physicalAndroidIphoneAuthorized','release','deploymentAuthorized',
 'productionModified','stagingModified','privacy','devices'];
const DEV=['platform','browser','physicalHardwareObserved','steps'];
export function evaluatePhoneEvidence(e){
 const issues=[];
 const fail=msg=>issues.push(msg);
 if(!exactKeys(e,ROOT))fail('Schema keys missing or unexpected personal-data fields');
 if(e?.schema!=='closet-family-alpha-50-physical-phones-v1'||
  e?.candidateCommit!==COMBINED_CANDIDATE)fail('Evidence cannot be detached from the exact protected development candidate');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(e?.observedOn||'')||
  !Number.isFinite(Date.parse(e.observedOn+'T00:00:00Z')))
  fail('Observation date invalid');
 if(!['UNTESTED_MANUAL_DEVICE_TEMPLATE','HUMAN_RECORDED_SELF_REPORT'].includes(e?.source))
  fail('Evidence source cannot be labeled as cryptographically verified or automated hardware proof');
 if(e?.ownerVisualAcceptance!=='NOT_GIVEN'&&e?.ownerVisualAcceptance!=='REVIEW_REQUESTED')
  fail('Human aesthetic approval may not be fabricated in this tool');
 if(!STATUS.includes(e?.stageHostProtected)||!STATUS.includes(e?.realTwoOwnerJwtIsolation))
  fail('Live host and JWT test status must remain explicit');
 if(typeof e?.physicalAndroidIphoneAuthorized!=='boolean')fail('Physical-test consent state absent');
 if(e?.release!=='HOLD'||e?.deploymentAuthorized!==false||
  e?.stagingModified!==false||e?.productionModified!==false)
  fail('This evidence cannot deploy, merge or claim production changes');
 if(!exactKeys(e?.privacy,PRIVACY)||PRIVACY.some(k=>e?.privacy?.[k]!==false))
  fail('Only redacted status labels are permitted; no user, image or device information');
 if(!Array.isArray(e?.devices)||e.devices.length!==2||
   e.devices[0]?.platform!=='Android'||e.devices[1]?.platform!=='iPhone')
  fail('Require separate Android and iPhone evidence records');
 let passed=0,blocked=0,failed=0,untested=0,observed=0;
 const all=[];
 for(const [i,device] of (Array.isArray(e?.devices)?e.devices:[]).entries()){
  if(!exactKeys(device,DEV)||!exactKeys(device?.steps,STEPS))
   fail('Physical device checklist incomplete or contains unexpected fields');
  if(device?.platform!==['Android','iPhone'][i])fail('Device identity and order must be unambiguous');
  const browsers=i===0?['NOT_TESTED','Chrome','Samsung Internet']:['NOT_TESTED','Safari','Chrome'];
  if(!browsers.includes(device?.browser))fail('Device browser type inconsistent');
  if(typeof device?.physicalHardwareObserved!=='boolean')fail('Hardware-observation flag missing');
  if(device?.physicalHardwareObserved){
   observed++;
   if(!e?.physicalAndroidIphoneAuthorized||device?.browser==='NOT_TESTED'||
     e?.source!=='HUMAN_RECORDED_SELF_REPORT')
    fail('Human-observed physical test must be explicitly authorized and self-described');
  }
  for(const step of STEPS){
   const value=device?.steps?.[step];
   if(!STATUS.includes(value))fail('Checklist status invalid or missing');
   else if(value==='PASS')passed++;
   else if(value==='FAIL')failed++;
   else if(value==='BLOCKED')blocked++;
   else untested++;
   if(['PASS','FAIL'].includes(value)&&device?.physicalHardwareObserved!==true)
    fail('Simulated device result cannot masquerade as physical hardware acceptance');
   if(value==='PASS'&&LIVE_GATES.includes(step)&&
     (e?.stageHostProtected!=='PASS'||
     (step==='two_owner_privacy'&&e?.realTwoOwnerJwtIsolation!=='PASS')))
    fail('Cannot claim live backup, cross-browser or owner isolation without matching live stage evidence');
   all.push(value);
  }
 }
 if(e?.source==='UNTESTED_MANUAL_DEVICE_TEMPLATE'&&
   (observed!==0||passed!==0||failed!==0))
  fail('Unstarted template may not assert real physical results');
 const ready=observed===2&&passed===2*STEPS.length&&
  e?.stageHostProtected==='PASS'&&e?.realTwoOwnerJwtIsolation==='PASS';
 return Object.freeze({
  decision:'HOLD',
  evidenceConsistent:issues.length===0,
  issues:[...new Set(issues)],
  checklistStatus:issues.length?'INVALID':
    ready?'READY_FOR_MANUAL_OWNER_REVIEW_NOT_RELEASE':
    failed?'FAILED_REQUIRES_REVIEW':blocked?'BLOCKED':
    untested===2*STEPS.length?'NOT_STARTED':'INCOMPLETE',
  deviceTypes:['Android','iPhone'],
  physicallyObservedDevices:observed,
  checkedSteps:passed,failedSteps:failed,blockedSteps:blocked,untestedSteps:untested,
  totalRequiredSteps:2*STEPS.length,
  actualHardwareVerifiableByScript:false,
  realJwtVerifiableByScript:false,
  humanVisualApprovalGrantedByScript:false,
  cloudBackupVerifiedByScript:false,
  ownerExplicitGoApproval:false,
  deploymentAuthorized:false,
  productionModified:false,stagingModified:false,
  sourceIdentity:COMBINED_CANDIDATE
 });
}
export async function checkPhoneEvidenceFile(path='docs/family-alpha-50/physical-device-acceptance-template.json'){
 const source=await readFile(path);
 if(source.length>24000)throw Error('Evidence file too large; do not include personal content');
 let parsed;
 try{parsed=JSON.parse(source.toString('utf8'));}catch{throw Error('Invalid phone evidence JSON');}
 return evaluatePhoneEvidence(parsed);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv.length>3)throw Error('Only one evidence path allowed');
  const result=await checkPhoneEvidenceFile(process.argv[2]);
  console.log('FAMILY_ALPHA_50_PHYSICAL_PHONE_EVIDENCE_HOLD',JSON.stringify(result));
  if(!result.evidenceConsistent)process.exitCode=1;
 }catch{
  console.error('FAMILY_ALPHA_50_EVIDENCE_INVALID_NO_USER_DATA_ECHO');
  process.exitCode=1;
 }
}
