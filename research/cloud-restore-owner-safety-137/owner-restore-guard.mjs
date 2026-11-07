/**
 * CLOSET CURRENT — MAIN P137 owner-reviewed cloud RESTORE research.
 *
 * The P129 native cloud adapter already validates original + cutout JPEGs,
 * requests literal true and atomically replaces local IndexedDB. But its owner
 * decision is not bound to a pre-observed local snapshot or the private remote
 * manifest after an asynchronous confirmation dialog. P137 adds both checks.
 *
 * Research-only: never registers in the shipping app or modifies cloud SQL.
 * Genuine signed-JWT/two-account HTTP security and physical phones unverified.
 */
import {createSignedOwnerCloud129}
 from '../signed-owner-cloud-integration-129/native-cloud-bridge.mjs';
import {readOwnerSnapshot01}
 from '../restore-atomic-01/atomic-restore.mjs';
import {assertOwnerCloudPaths128}
 from '../two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(code,message)=>{
 const e=Error('P137 '+message);e.code=code;throw e;
};
const digest=async(value,subtle)=>{
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 const hash=new Uint8Array(await subtle.digest('SHA-256',bytes));
 return [...hash].map(x=>x.toString(16).padStart(2,'0')).join('');
};
export const CLOUD_RESTORE_GUARD_137=Object.freeze({
 researchOnly:true,localSnapshotBoundToRestore:true,
 remoteManifestBoundToRestore:true,preAndPostConsentChecked:true,
 originalAndCutoutProofDelegatedToP129:true,
 serverIssuedSignedJWTIndependentlyVerified:false,
 atomicIDBDelegatedToP126:true,noAutomaticMerge:true,
 productionAuthorized:false,familyAlpha:'HOLD'
});
export function createCloudRestoreGuard137({
 auth,db,baseURL,anonKey,fetcher=globalThis.fetch,
 subtle=globalThis.crypto?.subtle,confirmReplaceLocal,
 onRestored=async()=>{}
}={}){
 if(!auth||typeof auth.getAccessToken!=='function'||
    !db||typeof db.transaction!=='function'||
    typeof fetcher!=='function'||typeof baseURL!=='string'||
    typeof anonKey!=='string'||!subtle?.digest||
    typeof onRestored!=='function')
  fail('configuration-required','existing owner session, IndexedDB and authenticated transport required');
 let busy=false,epoch=0,pending=null;
 function sync(lease){
  auth.assertCurrent?.();
  if(!lease||lease.epoch!==epoch||auth.user?.id!==lease.ownerId)
   fail('owner-session-revoked','active owner changed during restore');
 }
 async function check(lease){
  sync(lease);
  const token=await auth.getAccessToken();
  sync(lease);
  if(token!==lease.token)
   fail('owner-session-revoked','owner access token rotated during restore');
 }
 async function begin(){
  auth.assertCurrent?.();
  const ownerId=auth.user?.id,version=epoch;
  if(!UUID.test(ownerId||''))
   fail('owner-session-revoked','valid owner identity required');
  const token=await auth.getAccessToken();
  if(typeof token!=='string'||token.length<20)
   fail('owner-session-revoked','authenticated owner token required');
  const ctx={ownerId,token,epoch:version};
  await check(ctx);
  return ctx;
 }
 async function local(ctx){
  sync(ctx);
  const rows=await readOwnerSnapshot01(db,()=>sync(ctx));
  await check(ctx);
  return Object.freeze({
   fingerprint:rows.fingerprint,
   garmentCount:rows.rows.items.length,
   savedOutfitCount:rows.restore.state['outfit-board']?.saved?.length||0
  });
 }
 async function assertSameLocal(ctx,expected){
  const current=await local(ctx);
  if(!expected||current.fingerprint!==expected.fingerprint)
   fail('local-changed','owner wardrobe changed since restore inspection');
  return current;
 }
 async function remote(ctx){
  await check(ctx);
  const url=baseURL+'/rest/v1/closet_backups?owner_id=eq.'+
   encodeURIComponent(ctx.ownerId)+'&select=owner_id,revision,document';
  const res=await fetcher(url,{
   method:'GET',cache:'no-store',
   headers:{apikey:anonKey,Authorization:'Bearer '+ctx.token}
  });
  await check(ctx);
  if(!res?.ok)fail('cloud-unavailable','owner backup could not be safely inspected');
  const rows=await res.json();
  await check(ctx);
  if(!Array.isArray(rows)||rows.length!==1)
   fail('cloud-missing','exactly one existing owner backup required');
  const row=rows[0],doc=row?.document;
  if(row?.owner_id!==ctx.ownerId||
     !Number.isSafeInteger(row.revision)||row.revision<1||
     !doc||typeof doc!=='object'||Array.isArray(doc)||
     doc.ownerId!==ctx.ownerId||doc.schemaVersion!==1||
     !Array.isArray(doc.items)||doc.items.length>1000||
     !doc.state||typeof doc.state!=='object'||Array.isArray(doc.state))
   fail('remote-invalid','invalid owner cloud backup manifest');
  try{assertOwnerCloudPaths128(doc,ctx.ownerId);}
  catch{fail('remote-invalid','foreign or malformed private JPEG path');}
  const ids=new Set();
  for(const item of doc.items){
   if(!item||typeof item!=='object'||Array.isArray(item)||
      item.ownerId!==ctx.ownerId||typeof item.id!=='string'||
      !item.id||ids.has(item.id))
    fail('remote-invalid','invalid or duplicate owner garment');
   ids.add(item.id);
  }
  const board=doc.state['outfit-board'];
  if(board!==undefined&&(!board||typeof board!=='object'||Array.isArray(board)))
   fail('remote-invalid','invalid saved outfit state');
  if(board?.saved!==undefined&&!Array.isArray(board.saved))
   fail('remote-invalid','invalid saved outfit collection');
  const serialized=JSON.stringify(doc);
  if(serialized.length>20_000_000)fail('remote-invalid','oversized cloud metadata');
  const fingerprint=await digest(doc,subtle);
  await check(ctx);
  return Object.freeze({
   revision:row.revision,fingerprint,
   garmentCount:doc.items.length,savedOutfitCount:board?.saved?.length||0
  });
 }
 async function assertSameRemote(ctx,expected){
  const latest=await remote(ctx);
  if(!expected||latest.revision!==expected.revision||
    latest.fingerprint!==expected.fingerprint)
   fail('remote-changed','cloud backup changed since owner review');
  return latest;
 }
 async function guarded(fn){
  if(busy)fail('owner-operation-busy','restore or preview already running');
  busy=true;
  try{return await fn();}
  finally{busy=false;pending=null;}
 }
 const bridge=createSignedOwnerCloud129({
  auth,db,baseURL,anonKey,fetcher,subtle,onRestored,
  confirmRestore:async proof=>{
   const item=pending;
   if(!item?.ctx||!item?.source||!item?.target)
    fail('review-required','restore started without both owner snapshots');
   const {ctx,source,target}=item;
   await check(ctx);
   if(proof?.ownerId!==ctx.ownerId||
      proof?.revision!==target.revision||
      proof?.itemCount!==target.garmentCount||
      proof?.savedOutfitCount!==target.savedOutfitCount||
      proof?.originalAndCutoutJPEGSHAValid!==true)
    fail('remote-changed','verified photo recovery no longer matches owner preview');
   await assertSameLocal(ctx,source);
   await assertSameRemote(ctx,target);
   if(typeof confirmReplaceLocal!=='function')
    fail('owner-review-required','destructive restore needs owner-visible approval');
   const safe=Object.freeze({
    ownerId:ctx.ownerId,
    action:'replace-entire-local-wardrobe-from-cloud',
    remoteRevision:target.revision,
    remoteGarmentCount:target.garmentCount,
    remoteSavedOutfitCount:target.savedOutfitCount,
    localGarmentCount:source.garmentCount,
    localSavedOutfitCount:source.savedOutfitCount,
    bothJPEGSHA256Verified:true,
    originalAndCutoutBytesExposed:false,
    privateGarmentDetailsExposed:false,
    automaticMerge:false,
    warning:'This replaces the current local closet and saved outfits with the cloud version. Local-only changes will be discarded.',
    familyAlpha:'HOLD'
   });
   const approved=await confirmReplaceLocal(safe);
   await check(ctx);
   if(approved!==true)return false;
   await assertSameLocal(ctx,source);
   await assertSameRemote(ctx,target);
   return true;
   // P129 performs a further local IndexedDB CAS inside P126 after this.
   // An independent concurrent remote writer after this check is NOT
   // transactionally locked. P137 does not promise a distributed rollback.
  }
 });
 async function previewRestore(){
  return guarded(async()=>{
   const ctx=await begin();
   const source=await local(ctx),target=await remote(ctx);
   await assertSameLocal(ctx,source);
   return Object.freeze({
    remoteRevision:target.revision,
    localGarmentCount:source.garmentCount,
    localSavedOutfitCount:source.savedOutfitCount,
    remoteGarmentCount:target.garmentCount,
    remoteSavedOutfitCount:target.savedOutfitCount,
    originalAndCutoutBytesExposed:false,
    privateGarmentDetailsExposed:false,
    destructiveRestoreRequiresLiteralOwnerApproval:true,
    productionAuthorized:false,familyAlpha:'HOLD'
   });
  });
 }
 async function restoreWithOwnerReview(){
  return guarded(async()=>{
   const ctx=await begin();
   const source=await local(ctx),target=await remote(ctx);
   await assertSameLocal(ctx,source);
   pending={ctx,source,target};
   // The unchanged P129 bridge fetches and independently verifies ORIGINAL
   // and CUTOUT JPEG bytes from protected owner Storage before confirming.
   const result=await bridge.restore({expectedRemoteRevision:target.revision});
   await check(ctx);
   return Object.freeze({
    ...result,localAndRemoteReviewBound:true,
    ownerReviewOfRestoreRequired:true,
    automaticSourceReviewMerge:false,
    releaseAuthorized:false,familyAlpha:'HOLD'
   });
  });
 }
 function revoke(){
  epoch++;pending=null;bridge.revoke();
 }
 return Object.freeze({
  previewRestore,restoreWithOwnerReview,revoke,
  status:()=>Object.freeze({...CLOUD_RESTORE_GUARD_137,busy})
 });
}
