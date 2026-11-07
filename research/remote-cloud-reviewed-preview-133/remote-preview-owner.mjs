/**
 * Closet Current P133: privacy-safe, remote-observed consent preflight.
 *
 * Research ONLY. An owner-supplied expected revision is insufficient evidence
 * that a cloud wardrobe was actually inspected. P133 reads the current private
 * owner manifest before requesting a destructive replacement decision, binds
 * the decision to that exact remotely observed version, re-reads the manifest
 * after approval, and delegates the actual CAS + double-JPEG backup to P132/P129.
 *
 * It NEVER merges owner-reviewed colors/types with different photographed
 * sources and does not mount anything in the shipping app.
 */
import {createOwnerCloudRevision132} from '../owner-cloud-revision-consent-132/revision-owner-gate.mjs';
import {assertOwnerCloudPaths128} from '../two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(code,reason)=>{
 const error=Error('P133 '+reason);
 error.code=code;
 throw error;
};
const hashText=async(text,subtle)=>{
 const digest=new Uint8Array(await subtle.digest('SHA-256',new TextEncoder().encode(text)));
 return Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
};
export const OWNER_REMOTE_PREVIEW_133=Object.freeze({
 researchOnly:true,privateManifestReadOnly:true,
 verifyBeforeAndAfterConsent:true,requiresServerRevisionCAS:true,
 noAutomaticSourceReviewMerge:true,independentSignedJWTVerified:false,
 productionAuthorized:false,familyAlpha:'HOLD'
});

/**
 * The injected bridge is only useful in tests. Normally the unchanged P129
 * bridge is created by P132 and retains authenticated JPEG Storage, owner
 * snapshot rechecking, CAS and the existing P126 atomic restore.
 *
 * confirmReplace receives COUNT + REVISION metadata only. No JPEG, cutout,
 * garment labels, notes, item names, raw manifest or object path is returned.
 */
export function createOwnerRemotePreview133({
 auth,db,baseURL,anonKey,fetcher=globalThis.fetch,
 subtle=globalThis.crypto?.subtle,confirmReplace,
 confirmRestore,onRestored,bridge
}={}){
 if(!auth||typeof auth.getAccessToken!=='function'||typeof fetcher!=='function'||
   typeof baseURL!=='string'||typeof anonKey!=='string'||!subtle?.digest)
  fail('configuration-required','owner-scoped native client, HTTP transport and SHA-256 are required');
 let busy=false,epoch=0,active=null;
 async function lease(){
  auth.assertCurrent?.();
  const ownerId=auth.user?.id,version=epoch;
  if(!UUID.test(ownerId||''))fail('owner-session-revoked','valid active owner unavailable (type='+typeof ownerId+', length='+(typeof ownerId==='string'?ownerId.length:0)+')');
  const token=await auth.getAccessToken();
  if(typeof token!=='string'||token.length<20)
   fail('owner-session-revoked','active owner token unavailable');
  auth.assertCurrent?.();
  if(epoch!==version||auth.user?.id!==ownerId)
   fail('owner-session-revoked','owner changed during cloud preview');
  return {ownerId,token,version};
 }
 async function check(ctx){
  if(epoch!==ctx.version)
   fail('owner-session-revoked','owner session revoked');
  auth.assertCurrent?.();
  if(auth.user?.id!==ctx.ownerId)
   fail('owner-session-revoked','owner changed during cloud decision');
  const current=await auth.getAccessToken();
  if(epoch!==ctx.version||auth.user?.id!==ctx.ownerId||current!==ctx.token)
   fail('owner-session-revoked','owner token changed during cloud decision');
 }
 async function readRemote(ctx){
  await check(ctx);
  const path='/rest/v1/closet_backups?owner_id=eq.'+
   encodeURIComponent(ctx.ownerId)+'&select=owner_id,revision,document';
  const response=await fetcher(baseURL+path,{
   method:'GET',cache:'no-store',
   headers:{apikey:anonKey,Authorization:'Bearer '+ctx.token}
  });
  await check(ctx);
  if(!response?.ok)
   fail('remote-read-failed','owner cloud manifest could not be inspected');
  const rows=await response.json();
  await check(ctx);
  if(!Array.isArray(rows)||rows.length>1)
   fail('remote-manifest-invalid','invalid owner cloud response');
  if(rows.length===0)return null;
  const [row]=rows;
  if(!row||row.owner_id!==ctx.ownerId||
    !Number.isSafeInteger(row.revision)||row.revision<1)
   fail('remote-manifest-invalid','owner or revision mismatch');
  const document=row.document;
  if(!document||typeof document!=='object'||Array.isArray(document)||
     document.ownerId!==ctx.ownerId||document.schemaVersion!==1||
     !Array.isArray(document.items)||document.items.length>5000||
     !document.state||typeof document.state!=='object'||Array.isArray(document.state))
   fail('remote-manifest-invalid','invalid private owner manifest');
  // Inspect all nested image paths BEFORE any image object fetch. This method
  // never requests storage, even for a valid owner path.
  try{assertOwnerCloudPaths128(document,ctx.ownerId);}
  catch{fail('remote-manifest-invalid','private JPEG ownership path is invalid');}
  const seen=new Set();
  for(const item of document.items){
   if(!item||typeof item!=='object'||Array.isArray(item)||
      item.ownerId!==ctx.ownerId||typeof item.id!=='string'||
      !item.id||seen.has(item.id))
    fail('remote-manifest-invalid','duplicate or foreign reviewed garment');
   seen.add(item.id);
  }
  const board=document.state['outfit-board'];
  if(board!==undefined&&(board===null||typeof board!=='object'||Array.isArray(board)))
   fail('remote-manifest-invalid','invalid saved outfit metadata');
  const saved=board?.saved;
  if(saved!==undefined&&!Array.isArray(saved))
   fail('remote-manifest-invalid','invalid saved outfit collection');
  const serialized=JSON.stringify(document);
  if(typeof serialized!=='string'||serialized.length>20_000_000)
   fail('remote-manifest-invalid','remote backup metadata exceeds limits');
  const fingerprint=await hashText(serialized,subtle);
  await check(ctx);
  const summary=Object.freeze({
   ownerId:ctx.ownerId,revision:row.revision,
   reviewedGarmentCount:document.items.length,
   savedOutfitCount:saved?.length||0,
   imageBytesExposed:false,garmentDetailsExposed:false,
   action:'replace-entire-cloud-wardrobe',
   risk:'Remote-only edits could be lost. No automatic merge will occur.',
   familyAlpha:'HOLD'
  });
  return Object.freeze({summary,revision:row.revision,fingerprint});
 }
 async function guard(fn){
  if(busy)fail('owner-operation-busy','another owner cloud operation is active');
  busy=true;
  try{return await fn();}finally{busy=false;active=null;}
 }
 const ownerGate=createOwnerCloudRevision132({
  auth,db,baseURL,anonKey,fetcher,subtle,confirmRestore,onRestored,bridge,
  confirmRemoteReplace:async prompt=>{
   const pending=active;
   if(!pending||!pending.observed||!pending.ctx||
     pending.ctx.ownerId!==prompt.ownerId||
     pending.observed.revision!==prompt.expectedRemoteRevision)
    fail('remote-observation-required','no matching private remote preview');
   await check(pending.ctx);
   if(typeof confirmReplace!=='function')
    fail('owner-confirmation-required','a visible owner replacement decision is required');
   const approved=await confirmReplace(pending.observed.summary);
   await check(pending.ctx);
   if(approved!==true)return false;
   const latest=await readRemote(pending.ctx);
   if(!latest||latest.revision!==pending.observed.revision||
      latest.fingerprint!==pending.observed.fingerprint)
    fail('remote-changed','cloud wardrobe changed since owner preview; reload and decide again');
   await check(pending.ctx);
   return true; // P132 performs a SECOND literal approval and owner-token gate.
  }
 });
 async function preview(){
  return guard(async()=>{
   const ctx=await lease(),observed=await readRemote(ctx);
   await check(ctx);
   return Object.freeze({
    exists:!!observed,
    revision:observed?.revision||0,
    reviewedGarmentCount:observed?.summary.reviewedGarmentCount||0,
    savedOutfitCount:observed?.summary.savedOutfitCount||0,
    imageBytesExposed:false,garmentDetailsExposed:false,
    familyAlpha:'HOLD',productionAuthorized:false
   });
  });
 }
 async function backupWithOwnerPreview(){
  return guard(async()=>{
   const ctx=await lease();
   const observed=await readRemote(ctx);
   active={ctx,observed};
   await check(ctx);
   const receipt=observed?
    await ownerGate.backup({expectedRemoteRevision:observed.revision,
     strategy:'owner-approved-replace'}):
    await ownerGate.backup({expectedRemoteRevision:0,strategy:'create-only'});
   await check(ctx);
   return Object.freeze({...receipt,
    remoteRevisionObserved:true,remotePreviewShown:!!observed,
    cloudSourceReviewAutoMerged:false,productionAuthorized:false,
    familyAlpha:'HOLD'});
  });
 }
 function revoke(){
  epoch++;
  active=null;
  ownerGate.revoke();
 }
 return Object.freeze({
  preview,backupWithOwnerPreview,revoke,
  status:()=>Object.freeze({...OWNER_REMOTE_PREVIEW_133,busy})
 });
}
