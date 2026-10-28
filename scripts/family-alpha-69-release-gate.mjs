/**
 * Family Alpha #69: an OFFLINE, fail-closed release evidence gate.
 * A passing test suite is not evidence of live accounts, RLS, family phones,
 * human visual approval, or permission to deploy. No network, photos or PII.
 */
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
export const PIN='d8d95bf7297b91bdde2a5cfa274203ca12cbc1f1';
export const FORMAT='closet-current-family-alpha-release-evidence-v1';
export const REQUIRED_GATES=Object.freeze({
 humanVisualApproval:'Human approval of original/cutout/worn-avatar examples',
 fourDistinctFamilyAccounts:'Four genuinely separate signed-in staging accounts',
 liveTwoOwnerJwtIsolation:'Two-account JWT, storage and database RLS enforcement',
 realCloudBackupRestore:'Authenticated original-photo and wardrobe cloud restore',
 androidPhysicalPhone:'Physical Android capture, save, reload and outfit swap',
 iphonePhysicalPhone:'Physical iPhone capture, save, reload and outfit swap',
 protectedStagingAccess:'Protected staging entry and authenticated owner-only access',
 privateBugReporting:'Private feedback channel that does not expose family photos'
});
const fixedKeys=(value,expected,label)=>{
 assert.ok(value&&typeof value==='object'&&!Array.isArray(value),label+' must be a record');
 assert.deepEqual(Object.keys(value).sort(),[...expected].sort(),label+' fields changed/extra data forbidden');
};
const equal=(actual,expected,label)=>assert.equal(actual,expected,label+' mismatches independently verified HOLD source');
export function assertSnapshot(s){
 fixedKeys(s,['format','repository','source','ci','visual','checks','decision'],'snapshot');
 equal(s.format,FORMAT,'format');
 equal(s.repository,'nickhaney916-lang/Closet-Current','repository');
 fixedKeys(s.source,['pr','head'],'source');
 equal(s.source.pr,382,'source PR');
 equal(s.source.head,PIN,'source SHA');
 fixedKeys(s.ci,['integration','inherited'],'CI');
 fixedKeys(s.ci.integration,['run','status'],'integration CI');
 fixedKeys(s.ci.inherited,['run','attempt','status'],'inherited CI');
 equal(s.ci.integration.run,'https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40745955804','integration run');
 equal(s.ci.integration.status,'SUCCESS','integration CI result');
 equal(s.ci.inherited.run,'https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40745955911','inherited run');
 equal(s.ci.inherited.attempt,2,'inherited retry attempt');
 equal(s.ci.inherited.status,'SUCCESS','inherited retry result');
 fixedKeys(s.visual,['licensedOriginals','pass','review','fail','humanApproved'],'visual');
 for(const [key,val] of [['licensedOriginals',15],['pass',0],['review',5],['fail',10],['humanApproved',false]])
  equal(s.visual[key],val,'visual '+key);
 fixedKeys(s.checks,Object.keys(REQUIRED_GATES),'checks');
 for(const key of Object.keys(REQUIRED_GATES))
  equal(s.checks[key],'NOT_VERIFIED','check '+key);
 fixedKeys(s.decision,['status','deployAuthorized','stagingModified','productionModified'],'decision');
 equal(s.decision.status,'HOLD','decision');
 equal(s.decision.deployAuthorized,false,'deployment');
 equal(s.decision.stagingModified,false,'staging change');
 equal(s.decision.productionModified,false,'production change');
 return s;
}
export function assessSnapshot(s){
 assertSnapshot(s);
 return Object.freeze({
  decision:'HOLD',
  releaseAuthorized:false,
  checksPassedInOfflineCI:true,
  evidenceSourcePR:382,
  integratedSourceSHA:PIN,
  realPhotoVisual:{...s.visual},
  outstanding:Object.freeze(Object.keys(REQUIRED_GATES).map(key=>Object.freeze({
   id:key,required:REQUIRED_GATES[key],status:'NOT_VERIFIED'
  }))),
  actualFourUserLiveVerified:false,
  physicalPhoneVerified:false,
  liveOwnerJwtRlsVerified:false,
  realCloudBackupRestoreVerified:false,
  noDeployment:true,
  note:'Green CI is not four-person Alpha approval. Human owner decides after live/physical/visual evidence is privately verified.'
 });
}
export async function readReleaseEvidence(path=new URL('../research/family-alpha-69/evidence-HOLD.json',import.meta.url)){
 const raw=await readFile(path,'utf8');
 assert.ok(raw.length>0&&raw.length<12000,'Evidence exceeds fixed small local JSON budget');
 return JSON.parse(raw);
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const output=assessSnapshot(await readReleaseEvidence());
 console.log('FAMILY_ALPHA_69_NO_DEPLOY_GATE',JSON.stringify(output));
 assert.equal(output.decision,'HOLD');
 assert.equal(output.releaseAuthorized,false);
}
