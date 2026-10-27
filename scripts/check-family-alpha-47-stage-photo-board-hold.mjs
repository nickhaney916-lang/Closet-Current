/**
 * Family Alpha #47 — source-pinned photo-board + fresh staging security evidence.
 * READ ONLY, NO DEPLOY. Not an automated way to approve photos/accounts.
 *
 * This assessment explicitly couples the #349 authenticated original-photo
 * board's exact compiled source guard to the previously frozen #346
 * four-person stage and visual gate, plus a new read-only stage snapshot.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {assertWork43HOLD} from './build-work43-photo-board-hold.mjs';
import {assessIntegrated,readIntegratedSnapshot} from './check-family-alpha-44-integrated-readiness-hold.mjs';
export const PIN='b771329a5502cf53e495c860fe8c342d7ca3443a';
export const STAGING='fbnplztkbsteuzrmbgib';
const FROZEN='docs/family-alpha-47/live-staging-metadata-20261027.json';
const observed={accounts:1,sessions:1,backups:1,owners:1,objects:1,buckets:1};
export function assessMetadataEvidence(e,{today='2026-10-27'}={}){
 const issues=[];
 if(e?.schema!=='closet-current-family-alpha-47-live-staging-readonly-v1' ||
    e?.stagingProjectId!==STAGING || e?.projectStatus!=='ACTIVE_HEALTHY')
  issues.push('Staging project metadata or exact source identity missing');
 const t=Date.parse(e?.capturedOn+'T00:00:00Z'),now=Date.parse(today+'T00:00:00Z');
 if(!Number.isFinite(t)||!Number.isFinite(now)||t>now||now-t>86400000)
  issues.push('Read-only snapshot is stale/future; run fresh stage metadata inspection');
 const counts=[
  [e?.registeredUsers,observed.accounts],
  [e?.distinctUnexpiredSessionUsers,observed.sessions],
  [e?.backup?.rows,observed.backups],
  [e?.backup?.distinctOwnerCount,observed.owners],
  [e?.photos?.storageObjects,observed.objects],
  [e?.photos?.storageBuckets,observed.buckets]
 ];
 if(counts.some(([x,expected])=>!Number.isInteger(x)||x!==expected))
  issues.push('Frozen read-only stage counts changed; a new verified audit is needed');
 const b=e?.backup||{},p=e?.photos||{},a=e?.advisors||{};
 if(b.table!=='public.closet_backups'||b.rlsEnabled!==true||
  b.authenticatedSelectGrant!==true||b.authenticatedInsertGrant!==false||
  b.authenticatedUpdateGrant!==false||b.ownerUsingClause!==true||
  b.ownerWithCheckClause!==true||b.writerRole!=='closet_backup_writer'||
  b.writerSelectInsertUpdateGrant!==true)
  issues.push('Frozen cloud-backup owner scope / role grants not reproduced');
 if(p.bucket!=='closet-private'||p.private!==true||
  p.storageRlsEnabled!==true||p.authenticatedOwnerFolderScope!==true||
  p.mimeTypes?.length!==1||p.mimeTypes[0]!=='image/jpeg'||
  p.maxUploadBytes!==8388608||p.authenticatedUpdatePolicyPresent!==false||
  !['closet_photos_read','closet_photos_insert','closet_photos_delete'].every(
    s=>p.authenticatedPolicies?.includes(s)))
  issues.push('Private JPEG owner-scoped storage metadata not reproduced');
 if(a.leakedPasswordProtection!=='WARN_DISABLED')
  issues.push('Security advisor snapshot must accurately preserve password-protection warning');
 const rls=e?.syntheticNonownerReadProbes||{}, cases=rls.independentFixtures;
 if(rls.method!=='LIVE_STAGING_SQL_READ_ONLY_TRANSACTION_ROLE_SIMULATION'||
    rls.observedOn!==e?.capturedOn||
    rls.roleEmulationNotJwt!==true||rls.realJwtSessionCountUsed!==0||
    rls.newAccountsCreated!==0||rls.rowContentsAccessed!==false||
    rls.photoBytesAccessed!==false||rls.transactionsRolledBack!==true||
    rls.provesRealCrossAccountIsolation!==false||
    rls.result!=='NONOWNER_READ_VISIBILITY_PASS_SQL_SIMULATION_ONLY'||
    !rls.exactSqlPattern?.includes('BEGIN TRANSACTION READ ONLY')||
    !rls.exactSqlPattern?.includes('SET LOCAL ROLE authenticated')||
    !rls.exactSqlPattern?.includes('ROLLBACK')||
    !Array.isArray(cases)||cases.length!==2||
    cases[0]?.identity!=='synthetic-nonowner-A'||cases[1]?.identity!=='synthetic-nonowner-B'||
    cases.some(x=>x.roleVerified!==true||x.claimVerified!==true||
      x.visibleBackupRows!==0||x.visiblePhotoObjects!==0))
  issues.push('Synthetic nonowner SQL role probe must be exact, denied, read-only, and never mislabeled JWT or release evidence');
 const w=e?.backupRpcRuntime||{},correction=e?.auditCorrection||{};
 const controls={
  observedOn:e?.capturedOn,
  method:'LIVE_STAGING_READ_ONLY_PG_PROC_ROLE_FUNCTION_DEFINITION_AND_ACL_INSPECTION',
  publicEntry:'public.save_closet_backup(bigint,jsonb)',publicEntryOwner:'postgres',
  publicEntrySecurityDefiner:false,publicEntryInvokesQualifiedPrivateFunction:true,
  publicEntryInvokes:'closet_rpc_private.save_checked(bigint,jsonb)',
  authenticatedPublicExecute:true,authenticatedDirectTableSelect:true,
  authenticatedDirectTableInsert:false,authenticatedDirectTableUpdate:false,
  authenticatedPrivateSchemaUsage:true,authenticatedPrivateHelperExecute:true,
  anonPublicExecute:false,anonPrivateHelperExecute:false,anonPrivateSchemaUsage:false,
  privateHelperSecurityDefiner:true,privateHelperOwner:'closet_backup_writer',
  privateHelperSearchPathEmpty:true,privateHelperUsesRequestJwtSub:true,
  privateHelperValidatesPayloadAndRevision:true,privateHelperUsesOwnerScopedInsertUpdate:true,
  writerRoleNoLogin:true,writerRoleNoBypassRls:true,writerRoleIsTableOwner:false,
  writerRoleCanSelectInsertUpdate:true,writerRoleOwnerScopedRlsPolicyPresent:true,
  liveRpcWriteAttempted:false,ownerContentAccessed:false,actualHttpOutcome:'NOT TESTED',
  likelyNormalAuthenticatedCloudBackupWritable:'UNKNOWN_UNTIL_REAL_JWT_FUNCTIONAL_TEST',
  status:'RESTRICTED_PRIVATE_WRITER_CHAIN_PRESENT_NO_GRANT_BLOCKER_ESTABLISHED'
 };
 if(Object.entries(controls).some(([key,val])=>w[key]!==val)||
   correction.supersedes!=='BLOCKER_PROBABLE_AUTHENTICATED_SAVE_PERMISSION_DENIAL'||
   correction.currentFinding!=='SECURE_WRITER_CHAIN_CONFIGURED_METADATA_ONLY'||
   correction.liveHttpWriteVerified!==false||correction.requiresAnyPermissionChange!==false)
  issues.push('Restricted wrapper/private-definer writer chain not intact, or prior false blocker not corrected');
 if(e?.photoBoardCandidate?.referencePR!==349||
    e?.photoBoardCandidate?.sourceHead!==PIN||
    e.photoBoardCandidate?.fullSourceProvenanceTests!=='PASS_OFFLINE')
  issues.push('Work43 private original-source candidate is not exact and source-pinned');
 if(e?.photoBoardCandidate?.humanVisualApproval!=='NOT GIVEN'||
    e?.photoBoardCandidate?.realAccountRlsProof!=='NOT TESTED')
  issues.push('Cannot synthesize owner visual approval or live owner JWT test');
 const v=e?.verification||{};
 for(const label of ['twoDifferentAuthenticatedUserJwtSessions','fourDistinctFamilySessions',
  'physicalAndroid','physicalIphone','protectedCloudflareAccess',
  'actualOwnerSourceToStagingIntegration'])
  if(v[label]!=='NOT TESTED')issues.push('Offline report cannot claim a live test: '+label);
 if(e?.release!=='HOLD'||e?.deploymentAuthorized!==false||
  e?.stagingModified!==false||e?.productionModified!==false)
  issues.push('Unapproved release or modification flag');
 return Object.freeze({
  decision:'HOLD',evidenceConsistent:issues.length===0,issues,
  verifiedStagingAccounts:observed.accounts,
  realDistinctOwnerJwtValidation:'NOT TESTED',
  screenshotOrSoftwareCiIsReleaseApproval:false,
  allowedPresentationUntilHumanReview:'PHOTO_PREVIEW_ONLY',
  stageCloudBackupWriteStatus:'RESTRICTED_WRITER_CHAIN_PRESENT_LIVE_WRITE_UNTESTED',
  actualBackupSaveHttpVerified:false,
  deploymentAuthorized:false,productionModified:false,stagingModified:false
 });
}
export async function auditCurrentPhotoBoardStage(){
 const built=await assertWork43HOLD();
 assert.equal(built.releaseGate,'HOLD');
 assert.equal(built.deployAuthorized,false);
 assert.equal(built.wornPreviewEnabled,false);
 assert.equal(built.realAccountVerified,false);
 const [family,oldStage,oldVisual]=await readIntegratedSnapshot();
 const previous=assessIntegrated(family,oldStage,oldVisual,{today:'2026-10-27'});
 const fresh=JSON.parse(await readFile(FROZEN,'utf8'));
 const latest=assessMetadataEvidence(fresh,{today:'2026-10-27'});
 if(previous.decision!=='HOLD'||previous.deploymentAuthorized!==false||
  previous.visual.photoOnlyFallbackVerified!==false||!latest.evidenceConsistent||
  latest.decision!=='HOLD')
  throw Error('Source privacy and real family-stage HOLD no longer verified');
 return Object.freeze({
  decision:'HOLD',work43PrivateOriginalPhotoSource:'SOURCE_PINNED_OFFLINE',
  stagingReadOnlyEvidence:latest,unchangedFamilyVisualStageGate:previous.decision,
  humanVisualApproval:'NOT GIVEN',fourUniqueLiveJwtSessions:'NOT TESTED',
  physicalAndroidIphone:'NOT TESTED',
  deploymentsAuthorized:false,productionModified:false,stagingModified:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const output=await auditCurrentPhotoBoardStage();
 console.log(JSON.stringify(output,null,2));
 console.log('FAMILY_ALPHA_47_STAGING_PHOTO_BOARD_CORRECTLY_HELD');
}
