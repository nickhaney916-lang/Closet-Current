/**
 * Closet Current P132 — explicit cloud revision and owner replacement gate.
 *
 * Research-only wrapper around P129's existing owner-scoped, double-JPEG,
 * revision-CAS writer. This code CANNOT auto-merge concurrent changes. The
 * PHOTO130 proof shows field-wise merging can misbind human-reviewed clothing
 * labels onto a different genuine original photo. A remote replacement therefore
 * requires a typed, pre-observed revision AND a literal true owner confirmation.
 *
 * Nothing here registers itself in the shipping app, changes auth, Supabase,
 * wardrobe storage, existing staging or production.
 */
import {createSignedOwnerCloud129} from '../signed-owner-cloud-integration-129/native-cloud-bridge.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function denied(code,reason){
 const e=Error('P132 '+reason);e.code=code;throw e;
}
function revision(x,min){
 if(!Number.isSafeInteger(x)||x<min)
  denied('revision-precondition','an explicit previously observed cloud revision is required');
 return x;
}
export const OWNER_CLOUD_REVISION_132=Object.freeze({
 researchOnly:true,requiresObservedRevision:true,
 remoteReplaceRequiresLiteralOwnerApproval:true,
 automaticReviewSourceMerge:false,releaseAuthorized:false,
 signedJWTIndependentlyVerified:false,familyAlpha:'HOLD'
});

/**
 * confirmRemoteReplace is a UI-provided callback, not a real owner identity
 * proof; identity is rechecked via the existing authenticated P129 client.
 * The caller must present the last observed revision from a separately trusted
 * owner-scoped read. A current or guessed revision does not mean the two
 * devices have the same contents: replacement remains a deliberate destructive
 * user decision, never an automatic cloud synchronization or silent merge.
 */
export function createOwnerCloudRevision132({
 auth,db,baseURL,anonKey,fetcher,confirmRestore,onRestored,subtle,
 confirmRemoteReplace,
 bridge:existingBridge
}={}){
 if(!auth||typeof auth.getAccessToken!=='function'||!auth.user)
  denied('owner-session-required','authenticated owner client required');
 const bridge=existingBridge||createSignedOwnerCloud129({
  auth,db,baseURL,anonKey,fetcher,confirmRestore,onRestored,subtle
 });
 if(!bridge||typeof bridge.backup!=='function'||typeof bridge.restore!=='function'||
    typeof bridge.revoke!=='function')
  denied('bridge-required','existing native owner cloud bridge required');
 let busy=false,epoch=0;
 async function capture(){
  auth.assertCurrent?.();
  const ownerId=auth.user?.id;
  if(!UUID.test(ownerId||''))denied('owner-session-required','active owner unavailable');
  const token=await auth.getAccessToken();
  if(typeof token!=='string'||token.length<20)
   denied('owner-session-required','active access token unavailable');
  auth.assertCurrent?.();
  if(auth.user?.id!==ownerId)
   denied('owner-session-revoked','owner changed during authentication');
  return {ownerId,token,epoch};
 }
 async function stillCurrent(lease){
  if(epoch!==lease.epoch)
   denied('owner-session-revoked','owner operation revoked');
  auth.assertCurrent?.();
  if(auth.user?.id!==lease.ownerId)
   denied('owner-session-revoked','owner changed during decision');
  const token=await auth.getAccessToken();
  if(epoch!==lease.epoch||token!==lease.token||auth.user?.id!==lease.ownerId)
   denied('owner-session-revoked','owner token changed during decision');
 }
 async function guarded(run){
  if(busy)denied('owner-operation-busy','a cloud owner decision is already active');
  busy=true;
  try{return await run();}
  finally{busy=false;}
 }
 async function backup({expectedRemoteRevision,strategy='create-only'}={}){
  revision(expectedRemoteRevision,0);
  if(expectedRemoteRevision===0&&strategy!=='create-only')
   denied('revision-precondition','a new cloud backup must use create-only');
  if(expectedRemoteRevision>0&&strategy!=='owner-approved-replace')
   denied('owner-review-required','automatic remote overwrite and unsafe per-field source/review merge refused');
  return guarded(async()=>{
   const lease=await capture();
   if(expectedRemoteRevision>0){
    if(typeof confirmRemoteReplace!=='function')
     denied('owner-review-required','remote replacement needs an explicit owner decision');
    const prompt=Object.freeze({
     ownerId:lease.ownerId,expectedRemoteRevision,
     action:'replace-entire-existing-cloud-wardrobe',
     replacesRemoteItems:true,automaticMerge:false,
     warning:'The existing remote wardrobe may contain edits made on another device. Replacing it discards those remote-only edits.',
     familyAlpha:'HOLD'
    });
    const approved=await confirmRemoteReplace(prompt);
    await stillCurrent(lease);
    if(approved!==true)
     return Object.freeze({saved:false,cancelled:true,ownerId:lease.ownerId,
      existingCloudUntouchedBy132:true,releaseAuthorized:false,familyAlpha:'HOLD'});
   }
   await stillCurrent(lease);
   // P129 re-reads the remote revision and applies its own authenticated
   // server-side CAS, local-fingerprint check and two-JPEG source proof.
   const receipt=await bridge.backup({expectedRemoteRevision});
   await stillCurrent(lease);
   return Object.freeze({...receipt,ownerApprovalForReplace:expectedRemoteRevision>0,
    automaticSourceReviewMerge:false,releaseAuthorized:false,familyAlpha:'HOLD'});
  });
 }
 async function restore({expectedRemoteRevision}={}){
  revision(expectedRemoteRevision,1);
  return guarded(async()=>{
   const lease=await capture();
   await stillCurrent(lease);
   // The P129 delegate separately awaits its literal affirmative restore
   // callback and performs P126 owner-only atomic local replacement.
   const receipt=await bridge.restore({expectedRemoteRevision});
   await stillCurrent(lease);
   return Object.freeze({...receipt,ownerCloudRevisionPrecondition:true,
    releaseAuthorized:false,familyAlpha:'HOLD'});
  });
 }
 function revoke(){epoch++;bridge.revoke();}
 return Object.freeze({backup,restore,revoke,
  status:()=>Object.freeze({...OWNER_CLOUD_REVISION_132,busy,
   ownerId:busy?auth.user?.id:null,bridgeResearchOnly:true})});
}
