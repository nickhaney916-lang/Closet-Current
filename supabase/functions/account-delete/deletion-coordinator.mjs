// Closet Current deletion coordinator — SERVER ONLY, intentionally not deployed.
// Owner ID comes exclusively from a verified bearer token. A recent password
// verification must independently return that same ID. No user_id inputs.
// Requires a durable per-user cloud-write lock BEFORE any destructive work.
const UID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE=/^[a-f0-9]{64}\.jpg$/;
const PHRASE='DELETE MY ACCOUNT';
const PAGE_SIZE=100;
export function createAccountDeletionCoordinator(deps){
 const {enabled=false,verifySession,verifyPassword,lockWrites,claimCleanup,
  listPhotos,removePhotos,deleteBackup,hasBackup,deleteUser,verifyUserDeleted}=deps||{};
 const fn=[verifySession,verifyPassword,lockWrites,claimCleanup,listPhotos,removePhotos,
  deleteBackup,hasBackup,deleteUser,verifyUserDeleted];
 if(fn.some(x=>typeof x!=='function'))throw Error('Missing server-only deletion dependency');
 const deletion=async({bearer,confirmation,password}={})=>{
  if(enabled!==true)throw Error('Deletion service disabled');
  if(typeof bearer!=='string'||bearer.length<20||bearer.length>8192||
     typeof password!=='string'||password.length<8||password.length>256||
     confirmation!==PHRASE)throw Error('Deletion needs reauthentication and exact confirmation');
  const uid=await verifySession(bearer);
  if(typeof uid!=='string'||!UID.test(uid))throw Error('Unverified account');
  // Different account: do not obtain the write lock or touch any data.
  if(await verifyPassword(uid,password)!==uid)throw Error('Recent password verification failed');
  // A lock prevents new backup uploads and changes until Auth deletion.
  // Must be durable across workers and enforced by the cloud-write backend,
  // not merely an in-process mutex.
  const locked=await lockWrites(uid);
  if(locked!==true)throw Error('Verified durable account write lock unavailable');
  // A durable write tombstone can be acquired repeatedly for recovery, but
  // that must not permit two workers to remove the SAME photos and Auth user.
  // An exclusive claim is independently granted once per account. Its lifetime
  // is permanent until an audited manual recovery/takeover mechanism exists.
  // Fail closed rather than racing or automatically expiring a cleanup lease.
  if(await claimCleanup(uid)!==true)
   throw Error('Another account deletion cleanup is already claimed; manual recovery required');
  let photosDeleted=0,rounds=0;
  while(true){
   if(++rounds>10000)throw Error('Photo cleanup page limit reached');
   const list=await listPhotos(uid,PAGE_SIZE);
   if(!Array.isArray(list)||list.length>PAGE_SIZE)
    throw Error('Untrusted photo listing');
   if(list.length===0)break;
   const paths=list.map(file=>{
    if(typeof file!=='string'||!FILE.test(file))
     throw Error('Unexpected file in private account prefix; manual cleanup required');
    return uid+'/'+file;
   });
   if(new Set(paths).size!==paths.length)throw Error('Duplicate private object names');
   await removePhotos(uid,paths);
   // A Storage API returning 200 is not sufficient if objects survive.
   // Verify this entire deleted batch disappeared before advancing.
   const subsequent=await listPhotos(uid,PAGE_SIZE);
   if(!Array.isArray(subsequent)||subsequent.length>PAGE_SIZE||
      subsequent.some(name=>paths.includes(uid+'/'+name)))
    throw Error('Deleted private photos remain in Storage');
   photosDeleted+=paths.length;
  }
  // Two separately checked empty passes catch a backend that eventually
  // returns a stale page during deletion. Never claim a complete wipe if
  // another file is still present.
  for(let n=0;n<2;n++){
   const remaining=await listPhotos(uid,1);
   if(!Array.isArray(remaining)||remaining.length)throw Error('Private photos remain');
  }
  await deleteBackup(uid);
  if(await hasBackup(uid)!==false)throw Error('Private backup still exists');
  // Authentication LAST; deletion of Auth is not a substitute for
  // removal of storage objects, and short-lived JWTs may remain valid.
  await deleteUser(uid);
  if(await verifyUserDeleted(uid)!==true)throw Error('Auth account deletion unverified');
  return {completed:true,deletedPhotoObjects:photosDeleted,backupRemoved:true,
   authUserRemoved:true,needsLocalDeviceCleanup:true};
 };
 return Object.freeze({deleteAccount:deletion});
}
export const ACCOUNT_DELETION_CONFIRMATION=PHRASE;
