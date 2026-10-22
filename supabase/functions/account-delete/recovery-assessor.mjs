// SERVER-ONLY, UNDEPLOYED, READ-ONLY account-deletion incident assessment.
// This module never removes photos, deletes Auth, lifts locks or claims cleanup.
// Do not import into public/, bind to the disabled HTTP function or deploy.
const UID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE=/^[a-f0-9]{64}\.jpg$/;
const TICKET=/^CC-INC-[A-Z0-9]{8,24}$/;
function boolean(value,what){
 if(typeof value!=='boolean')throw Error('Unverified '+what+' state');
 return value;
}
export function createDeletionRecoveryAssessor(deps={}){
 const {enabled=false,authorizeOperator,readWriteLock,readCleanupClaim,
  listPhotos,hasBackup,readAuthState}=deps;
 const funcs=[authorizeOperator,readWriteLock,readCleanupClaim,listPhotos,hasBackup,readAuthState];
 if(funcs.some(fn=>typeof fn!=='function'))throw Error('Missing server-only recovery inspection dependency');
 async function assess({uid,incidentTicket,operatorContext}={}){
  if(enabled!==true)throw Error('Recovery inspection disabled');
  if(typeof uid!=='string'||!UID.test(uid))throw Error('Invalid account identity');
  if(typeof incidentTicket!=='string'||!TICKET.test(incidentTicket))
   throw Error('Valid operator incident reference required');
  // The server-only authorizer MUST verify this operator is entitled to
  // inspect this specific owner. The ticket itself is not authorization.
  // Do not query/return any account state before it returns strict true.
  if(await authorizeOperator({uid,incidentTicket,operatorContext})!==true)
   throw Error('Recovery inspection not authorized');
  // The snapshot is diagnostic only. Another worker may mutate data between
  // reads; never infer that a worker has crashed or grant destructive access.
  const locked=boolean(await readWriteLock(uid),'write-lock');
  const claimed=boolean(await readCleanupClaim(uid),'cleanup-claim');
  const photos=await listPhotos(uid,1);
  if(!Array.isArray(photos)||photos.length>1||
    photos.some(name=>typeof name!=='string'||!FILE.test(name)))
   throw Error('Private object inventory cannot be verified');
  const hasPrivatePhotos=photos.length!==0;
  const backupPresent=boolean(await hasBackup(uid),'backup');
  const auth=await readAuthState(uid);
  if(auth!=='present'&&auth!=='absent')
   throw Error('Auth deletion state unavailable');
  let state;
  if(claimed&&!locked)state='CLAIM_WITHOUT_WRITE_LOCK';
  else if(!locked&&auth==='absent')state='AUTH_ABSENT_WITHOUT_TOMBSTONE';
  else if(!locked)state='NO_DELETION_LOCK';
  else if(!claimed&&auth==='absent')state='ORPHANED_WITHOUT_CLAIM';
  else if(!claimed)state='WRITE_LOCKED_NOT_CLAIMED';
  else if(auth==='absent'&&(hasPrivatePhotos||backupPresent))
   state='AUTH_REMOVED_WITH_PRIVATE_DATA_REMAINING';
  else if(hasPrivatePhotos)state='STORAGE_REMAINS_WORKER_STATUS_UNKNOWN';
  else if(backupPresent)state='BACKUP_REMAINS_WORKER_STATUS_UNKNOWN';
  else if(auth==='present')state='AUTH_REMAINS_WORKER_STATUS_UNKNOWN';
  else state='APPARENTLY_EMPTY_REQUIRES_INDEPENDENT_CONFIRMATION';
  const needsIncidentResponse=state!=='NO_DELETION_LOCK';
  return Object.freeze({
   code:state,
   // Return no UID, account email, filenames, JWT, password, keys or ticket.
   // The caller must keep any incident identity only in an approved audit log.
   writeLocked:locked,cleanupClaimed:claimed,
   privatePhotoObjectsPresent:hasPrivatePhotos,
   backupPresent,authUserPresent:auth==='present',
   workerActiveOrStopped:'UNKNOWN',
   inventoryExhaustivelyVerified:false,
   deletionVerified:false,
   mayResumeAutomatically:false,mayReleaseTombstone:false,
   mayStartCleanupWorker:false,mayChangeAuth:false,
   requiresSeparateOperatorReview:needsIncidentResponse,
   requiredNextStep:!needsIncidentResponse?
    'No deletion lock; do not enter recovery. Confirm request status privately.':
    'Verify the previous worker has stopped, preserve the tombstone and claim, reconcile private Storage bytes/backups/Auth in an approved operator incident; do not retry automatically.'
  });
 }
 return Object.freeze({assess});
}
