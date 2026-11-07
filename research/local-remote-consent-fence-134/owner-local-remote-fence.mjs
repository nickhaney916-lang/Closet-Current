/**
 * Closet Current P134 — local + remote owner-decision source fence.
 * RESEARCH ONLY. Never attaches to shipping app, backend, or existing staging.
 *
 * P133 binds owner consent to the remotely observed manifest and P132/P129
 * enforce remote CAS. But the local wardrobe can change while the owner reads
 * the replacement warning. P134 binds the same decision to a complete local
 * IndexedDB snapshot, checks genuine original/cutout JPEG owner-review proof,
 * and refuses a changed local snapshot before proceeding to the writer.
 *
 * P129 separately checks the live local fingerprint during uploads. For the
 * actual bridge, P134 also checks the approved snapshot immediately before
 * forwarding the backup RPC. Remote and local updates across two independent
 * systems cannot form a distributed transaction; no such guarantee is claimed.
 */
import {createOwnerRemotePreview133} from '../remote-cloud-reviewed-preview-133/remote-preview-owner.mjs';
import {readOwnerSnapshot01,exportBackup01,validateRestore01}
 from '../restore-atomic-01/atomic-restore.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(code,message)=>{const e=Error('P134 '+message);e.code=code;throw e;};
export const LOCAL_REMOTE_FENCE_134=Object.freeze({
 researchOnly:true,localAndRemoteReviewed:true,
 originalAndCutoutSHARequired:true,localSnapshotBoundToConsent:true,
 beforeRPCFingerprintRechecked:true,noAutomaticCloudMerge:true,
 liveSignedJWTVerified:false,physicalDeviceVerified:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});

/** confirmReplace is a caller-owned UI decision returning literal boolean true.
 * The callback receives only item/look COUNTS, remote revision and warning,
 * never wardrobe items, labels, photos, source hashes or raw snapshots.
 */
export function createLocalRemoteFence134({
 auth,db,baseURL,anonKey,fetcher=globalThis.fetch,
 subtle=globalThis.crypto?.subtle,confirmReplace,
 confirmRestore,onRestored,bridge
}={}){
 if(!auth||typeof auth.getAccessToken!=='function'||
    !db||typeof db.transaction!=='function'||
    typeof fetcher!=='function'||typeof baseURL!=='string'||
    typeof anonKey!=='string'||!subtle?.digest)
  fail('configuration-required','active owner database, auth and private transport required');
 let active=null,busy=false,epoch=0,service=null;
 function checkSync(lease){
  auth.assertCurrent?.();
  if(!lease||lease.epoch!==epoch||auth.user?.id!==lease.ownerId)
   fail('owner-session-revoked','owner lease revoked');
  return true;
 }
 async function check(lease){
  checkSync(lease);
  const token=await auth.getAccessToken();
  checkSync(lease);
  if(token!==lease.token)
   fail('owner-session-revoked','owner token replaced during decision');
 }
 async function capture(){
  auth.assertCurrent?.();
  const ownerId=auth.user?.id,observedEpoch=epoch;
  if(!UUID.test(ownerId||''))
   fail('owner-session-revoked','valid authenticated owner unavailable');
  const token=await auth.getAccessToken();
  if(typeof token!=='string'||token.length<20)
   fail('owner-session-revoked','valid owner token unavailable');
  const lease={ownerId,token,epoch:observedEpoch};
  checkSync(lease);
  return lease;
 }
 async function readLocal(lease){
  checkSync(lease);
  const snapshot=await readOwnerSnapshot01(db,()=>checkSync(lease));
  await check(lease);
  // Full V4 provenance + original AND independently reviewed cutout SHA,
  // not just a garment count or a byte-level snapshot of unknown validity.
  const backup=exportBackup01({ownerId:lease.ownerId,rows:snapshot.rows});
  const proof=await validateRestore01(backup,{ownerId:lease.ownerId,mode:'file'});
  await check(lease);
  return Object.freeze({
   fingerprint:snapshot.fingerprint,
   reviewedGarmentCount:backup.items.length,
   savedOutfitCount:backup.state['outfit-board']?.saved?.length||0,
   originalJPEGFieldsVerified:proof.photoFieldsVerified,
   reviewedCutoutJPEGsVerified:proof.reviewedCutoutJPEGsVerified
  });
 }
 async function assertSameLocal(lease,baseline){
  checkSync(lease);
  if(!baseline)fail('local-observation-required','local wardrobe was not observed');
  const current=await readOwnerSnapshot01(db,()=>checkSync(lease));
  await check(lease);
  if(current.fingerprint!==baseline.fingerprint)
   fail('local-changed','local wardrobe changed after review; inspect both versions again');
  return true;
 }
 async function guarded(fn){
  if(busy)fail('owner-operation-busy','another cloud owner decision is active');
  busy=true;
  try{return await fn();}
  finally{busy=false;active=null;}
 }
 const fencedFetch=async(url,options)=>{
  // The actual P129 writer calls this on the final mutation boundary.
  // A pre-dispatch local edit cannot sneak in after owner consent.
  if(typeof url==='string'&&url.endsWith('/rest/v1/rpc/save_closet_backup')&&
      options?.method==='POST'){
   const current=active;
   if(!current?.lease||!current?.local)
    fail('local-observation-required','remote cloud write without owner preview refused');
   await assertSameLocal(current.lease,current.local);
   await check(current.lease);
  }
  return fetcher(url,options);
 };
 service=createOwnerRemotePreview133({
  auth,db,baseURL,anonKey,fetcher:fencedFetch,subtle,
  confirmRestore,onRestored,bridge,
  confirmReplace:async remote=>{
   const pending=active;
   if(!pending?.lease||!pending.local)
    fail('local-observation-required','cloud confirmation is missing an owner-local snapshot');
   const {lease,local}=pending;
   await check(lease);
   await assertSameLocal(lease,local); // also blocks changes during initial remote fetch
   if(typeof confirmReplace!=='function')
    fail('owner-review-required','owner-visible confirmation function required');
   const summary=Object.freeze({
    ownerId:lease.ownerId,
    remoteRevision:remote.revision,
    remoteReviewedGarments:remote.reviewedGarmentCount,
    remoteSavedOutfits:remote.savedOutfitCount,
    localReviewedGarments:local.reviewedGarmentCount,
    localSavedOutfits:local.savedOutfitCount,
    localOriginalJPEGFieldsVerified:local.originalJPEGFieldsVerified,
    localReviewedCutoutJPEGsVerified:local.reviewedCutoutJPEGsVerified,
    photoBytesExposed:false,garmentDetailsExposed:false,
    automaticMerge:false,
    action:'replace-entire-remote-wardrobe',
    warning:'Replacing the cloud backup can discard newer clothes and saved outfits from another device. Both wardrobes must be reviewed.',
    familyAlpha:'HOLD'
   });
   const approved=await confirmReplace(summary);
   await check(lease);
   if(approved!==true)return false;
   await assertSameLocal(lease,local);
   return true; // P133 independently rechecks remote SHA/revision; P132 and P129 enforce CAS.
  }
 });
 async function previewBoth(){
  return guarded(async()=>{
   const lease=await capture();
   const local=await readLocal(lease);
   active={lease,local};
   const remote=await service.preview();
   await assertSameLocal(lease,local);
   return Object.freeze({
    localReviewedGarments:local.reviewedGarmentCount,
    localSavedOutfits:local.savedOutfitCount,
    localOriginalJPEGFieldsVerified:local.originalJPEGFieldsVerified,
    localReviewedCutoutJPEGsVerified:local.reviewedCutoutJPEGsVerified,
    remoteExists:remote.exists,remoteRevision:remote.revision,
    remoteReviewedGarments:remote.reviewedGarmentCount,
    remoteSavedOutfits:remote.savedOutfitCount,
    photoBytesExposed:false,garmentDetailsExposed:false,
    releaseAuthorized:false,familyAlpha:'HOLD'
   });
  });
 }
 async function backupWithReviewedConsent(){
  return guarded(async()=>{
   const lease=await capture();
   const local=await readLocal(lease);
   active={lease,local};
   const receipt=await service.backupWithOwnerPreview();
   await check(lease);
   if(receipt.saved===true)
    await assertSameLocal(lease,local);
   return Object.freeze({
    ...receipt,localSourceReviewProved:true,
    localSnapshotBoundToDecision:true,remoteRevisionObserved:true,
    noAutomaticSourceReviewMerge:true,releaseAuthorized:false,
    familyAlpha:'HOLD'
   });
  });
 }
 function revoke(){epoch++;active=null;service.revoke();}
 return Object.freeze({
  previewBoth,backupWithReviewedConsent,revoke,
  status:()=>Object.freeze({...LOCAL_REMOTE_FENCE_134,busy})
 });
}
