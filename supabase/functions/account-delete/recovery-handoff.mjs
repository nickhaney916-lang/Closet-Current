// Closet Current operator handoff REVIEW only. SERVER-ONLY. NEVER DEPLOYED.
// This is NOT a deletion worker, recovery executor, capability or unlock token.
// Its injected verification functions must be privileged and independently audited.
const UID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TICKET=/^CC-INC-[A-Z0-9]{8,24}$/;
const STATES=new Set([
 'WRITE_LOCKED_NOT_CLAIMED','ORPHANED_WITHOUT_CLAIM',
 'STORAGE_REMAINS_WORKER_STATUS_UNKNOWN','BACKUP_REMAINS_WORKER_STATUS_UNKNOWN',
 'AUTH_REMAINS_WORKER_STATUS_UNKNOWN','AUTH_REMOVED_WITH_PRIVATE_DATA_REMAINING',
 'APPARENTLY_EMPTY_REQUIRES_INDEPENDENT_CONFIRMATION'
]);
const FENCE=/^FENCE-[A-Za-z0-9-]{8,48}$/;
const MAX_AGE_MS=2*60*1000;
function ageOk(t,now){
 return Number.isSafeInteger(t)&&t<=now&&now-t<=MAX_AGE_MS;
}
function snapshotState(s){
 if(!s||typeof s!=='object'||!STATES.has(s.code)||
  s.writeLocked!==true||typeof s.cleanupClaimed!=='boolean'||
  typeof s.privatePhotoObjectsPresent!=='boolean'||
  typeof s.backupPresent!=='boolean'||typeof s.authUserPresent!=='boolean'||
  s.workerActiveOrStopped!=='UNKNOWN'||
  s.deletionVerified!==false||s.mayResumeAutomatically!==false||
  s.mayReleaseTombstone!==false||s.mayStartCleanupWorker!==false||
  s.mayChangeAuth!==false||s.requiresSeparateOperatorReview!==true||
  s.inventoryExhaustivelyVerified!==false)
  throw Error('Recovery inventory is not a trusted, still-locked read-only assessment');
 return [s.code,s.writeLocked,s.cleanupClaimed,s.privatePhotoObjectsPresent,
  s.backupPresent,s.authUserPresent].join('|');
}
function verifiedPhotoInventory(value,photoPresent){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  value.ownerScoped!==true||value.filenamesEnumerated!==true||
  value.photoBytesVerified!==false||
  typeof value.digest!=='string'||!/^[a-f0-9]{64}$/.test(value.digest)||
  !Number.isSafeInteger(value.count)||value.count<0||value.count>10000||
  !Number.isSafeInteger(value.pages)||value.pages<1||value.pages>101||
  photoPresent!==(value.count>0))
  throw Error('Privileged, bounded owner photo-name inventory unavailable');
 return {digest:value.digest,count:value.count};
}
function attestedFence(value,now){
 if(!value||value.quiescent!==true||value.fenceEnforced!==true||
  typeof value.fenceEpoch!=='string'||!FENCE.test(value.fenceEpoch)||
  !ageOk(value.verifiedAtMs,now))
  throw Error('Independently fenced and recently verified worker cessation required');
 return value.fenceEpoch;
}
function approvedIdentity(value,role,now){
 if(!value||value.verified!==true||value.role!==role||
  value.boundToOwnerIncidentAndSnapshot!==true||
  value.readOnlyReviewOnly!==true||typeof value.principalId!=='string'||
  !/^[A-Za-z0-9_-]{8,64}$/.test(value.principalId)||
  !ageOk(value.verifiedAtMs,now))
  throw Error('Independent scoped operator approval verification failed');
 return value.principalId;
}
export function createDeletionRecoveryHandoff(deps={}){
 const {enabled=false,authorizeIncident,assess,verifyApproval,
  verifyWorkerFenced,serverNow,readPhotoInventory}=deps;
 if([authorizeIncident,assess,verifyApproval,verifyWorkerFenced,serverNow,readPhotoInventory]
  .some(fn=>typeof fn!=='function'))
  throw Error('Missing independent server-only recovery handoff dependency');
 async function prepare({uid,incidentTicket,operatorContext,
  incidentApprovalProof,securityApprovalProof}={}){
  if(enabled!==true)throw Error('Recovery handoff remains disabled');
  if(typeof uid!=='string'||!UID.test(uid)||
   typeof incidentTicket!=='string'||!TICKET.test(incidentTicket))
   throw Error('Valid account and incident required');
  // Authorization must be granted for this specific account BEFORE
  // any account-specific private read or review step.
  if(typeof incidentApprovalProof!=='string'||incidentApprovalProof.length<16||
   incidentApprovalProof.length>8192||
   typeof securityApprovalProof!=='string'||securityApprovalProof.length<16||
   securityApprovalProof.length>8192||
   incidentApprovalProof===securityApprovalProof)
   throw Error('Two distinct opaque review proofs required');
  if(await authorizeIncident({uid,incidentTicket,operatorContext})!==true)
   throw Error('Operator not authorized for account recovery review');
  const now=await serverNow();
  if(!Number.isSafeInteger(now)||now<=0)
   throw Error('Verified server clock unavailable');
  const first=await assess({uid,incidentTicket,operatorContext});
  const fingerprint=snapshotState(first);
  if(!first.cleanupClaimed)
   throw Error('No exclusive worker claim; a different approved incident path is required');
  // The assessor can't tell if the first worker is dead. Only an
  // independently enforced worker fence may attest its quiescence.
  const fence1=attestedFence(await verifyWorkerFenced({
   uid,incidentTicket,operatorContext,stage:'before-review'
  }),now);
  // Full owner photo-name checks catch drift even when the presence flag stays true.
  // This is read-only diagnostic comparison, NOT verified bytes or erasure.
  const firstInventory=verifiedPhotoInventory(await readPhotoInventory({
   uid,incidentTicket,operatorContext,stage:'before-approvals',fenceEpoch:fence1
  }),first.privatePhotoObjectsPresent);
  const a=approvedIdentity(await verifyApproval({
   role:'incident_owner',proof:incidentApprovalProof,uid,incidentTicket,
   snapshot:first,fenceEpoch:fence1,photoInventoryDigest:firstInventory.digest
  }),'incident_owner',now);
  const b=approvedIdentity(await verifyApproval({
   role:'security_reviewer',proof:securityApprovalProof,uid,incidentTicket,
   snapshot:first,fenceEpoch:fence1,photoInventoryDigest:firstInventory.digest
  }),'security_reviewer',now);
  if(a===b)throw Error('Two distinct independently verified operators required');
  // A changed backup/photo/Auth state or an unfenced worker means the
  // approvals describe the wrong world; abort without issuing any plan.
  const second=await assess({uid,incidentTicket,operatorContext});
  if(snapshotState(second)!==fingerprint)
   throw Error('Recovery state changed during review; approvals invalidated');
  const secondInventory=verifiedPhotoInventory(await readPhotoInventory({
   uid,incidentTicket,operatorContext,stage:'after-approvals',fenceEpoch:fence1
  }),second.privatePhotoObjectsPresent);
  if(secondInventory.digest!==firstInventory.digest||
     secondInventory.count!==firstInventory.count)
   throw Error('Recovery private-photo inventory changed during review');
  const fence2=attestedFence(await verifyWorkerFenced({
   uid,incidentTicket,operatorContext,stage:'after-review'
  }),now);
  if(fence1!==fence2)
   throw Error('Worker fence changed; review must restart');
  // Deliberately NO bearer token, certificate, signature, actor identity,
  // owner UUID, object name or executable instruction is emitted. This
  // output must never be accepted by a future destructive endpoint.
  return Object.freeze({
   kind:'ACCOUNT_DELETION_READ_ONLY_HANDOFF_REVIEW',
   outcome:'READY_FOR_SEPARATE_MANUAL_INCIDENT_REVIEW',
   snapshotCode:first.code,
   workerFenceObserved:true,
   independentlyReviewedByTwoOperators:true,
   identityDetailsIncluded:false,
   inventoryExhaustivelyVerified:false,
   deletionVerified:false,
   recoveryAuthorized:false,
   mayUnlock:false,mayRemoveClaim:false,mayRetryCleanup:false,
   mayDeleteStorage:false,mayDeleteAuth:false,
   requiresSeparateOfflineApproval:true,
   requiresNewHostedSecurityAudit:true
  });
 }
 return Object.freeze({prepare});
}
