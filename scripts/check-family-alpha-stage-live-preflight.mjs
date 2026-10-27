import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {assess as assessFamilyGates} from './check-family-alpha-27.mjs';
export const STAGING_REF='fbnplztkbsteuzrmbgib';
export const REQUIRED_LIVE=[
 'signedInOwnerAAndOwnerBReadWriteIsolation',
 'fourDistinctLiveFamilyJwtSessions',
 'fourSimultaneousMobileBrowserSessions',
 'protectedStageAccess',
 'stagingBuildAndBackupProdRoutingAbsenceDeployed',
 'physicalAndroid','physicalIphone','realOriginalPhotoAndCloudRestore'
];
export function evaluateStageMetadata(snapshot,{today='2026-10-27'}={}){
 const issues=[];
 if(snapshot?.kind!=='STAGING_METADATA_ONLY_READ_ONLY_AUDIT'||
    snapshot?.stagingProjectRef!==STAGING_REF||snapshot?.projectStatus!=='ACTIVE_HEALTHY')
  issues.push('Staging project metadata missing or project unhealthy');
 const observed=Date.parse(snapshot?.observedOn+'T00:00:00Z');
 const now=Date.parse(today+'T00:00:00Z');
 if(!Number.isFinite(observed)||!Number.isFinite(now)||
    observed>now||now-observed>24*60*60*1000)
  issues.push('Staging security metadata is stale or future-dated; refresh safely before testing');
 if(!Number.isInteger(snapshot?.registeredAuthAccountCount)||
    snapshot.registeredAuthAccountCount<4)
  issues.push('Four distinct family test accounts are not yet registered; account-count is not identity proof');
 const backup=snapshot?.tables?.closet_backups;
 if(!backup?.rlsEnabled||!backup?.ownerScopedUsing||!backup?.ownerScopedWithCheck||
    !backup?.authenticatedSelectGrant||backup?.authenticatedUnscopedWrites)
  issues.push('Owner-scoped cloud backup policies or privilege boundaries not verified');
 const photos=snapshot?.privatePhotoStorage;
 if(photos?.bucket!=='closet-private'||photos.privateBucketCount<1||
    photos.publicBucketCount!==0||!photos.ownerFolderScopedSelect||
    !photos.ownerFolderScopedInsert||!photos.ownerFolderScopedDelete)
  issues.push('Owner-folder private photo storage policy or bucket privacy check failed');
 if(snapshot?.securityAdvisors?.leakedPasswordProtectionEnabled!==true)
  issues.push('Staging leaked-password protection is not enabled');
 if(snapshot?.familyParticipantsVerifiedByRealJwt!==4)
  issues.push('Four unique real user JWT sessions not verified; role/RLS inspection is not JWT authorization');
 for(const gate of REQUIRED_LIVE){
  if(snapshot?.liveValidations?.[gate]!=='PASS')
   issues.push('Real staging check not completed: '+gate);
 }
 if(snapshot?.ownerReleaseApproval!==true||snapshot?.releaseGate!=='READY_FOR_REVIEW')
  issues.push('Owner has not explicitly approved readiness');
 return Object.freeze({
  decision:issues.length?'HOLD':'READY FOR MAIN-THREAD REVIEW',
  issues,
  stagingProjectRef:STAGING_REF,
  reportedAccounts:snapshot?.registeredAuthAccountCount??null,
  personallyIdentifyingDataAccessed:false,
  note:'Policy metadata cannot substitute for real separate authenticated sessions.'
 });
}
export function assessTogether(report,snapshot,{today='2026-10-27'}={}){
 const family=assessFamilyGates(report);
 const stage=evaluateStageMetadata(snapshot,{today});
 return Object.freeze({
  decision:family.decision==='READY FOR MAIN-THREAD REVIEW'&&
   stage.decision==='READY FOR MAIN-THREAD REVIEW'?'READY FOR MAIN-THREAD REVIEW':'HOLD',
  family,stage,
  deploymentAuthorized:false,
  productionModified:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=JSON.parse(await readFile('docs/family-alpha-27/release-report.json','utf8'));
 const snapshot=JSON.parse(await readFile('docs/family-alpha-27/staging-metadata-audit-20261027.json','utf8'));
 const output=assessTogether(report,snapshot,{today:process.argv[2]||'2026-10-27'});
 console.log(JSON.stringify(output,null,2));
 if(output.decision!=='HOLD')throw Error('Unapproved four-account Family Alpha was unexpectedly certified');
}
