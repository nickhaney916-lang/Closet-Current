/**
 * MISSION3-V4-OWNER-ACCEPTANCE — explicit research-only owner workflow.
 * Integrates the verified RESTORE01 v4 validation and atomic IndexedDB
 * restore without the nativeLossless04 board migration or hosted cloud.
 * No deploy, no changes to the ordinary v3 saved-only export/import.
 */
import {
 validateRestore01,readOwnerSnapshot01,exportBackup01,restoreOwner01
} from '../research/restore-atomic-01/atomic-restore.mjs';

const sha=/^[0-9a-f]{64}$/;
const jpeg=/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ownerIdPattern=/^[A-Za-z0-9][A-Za-z0-9-]{0,159}$/;
const MAX_BYTES=100*1024*1024;
const exact=x=>JSON.stringify(x);
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const fail=(code)=>{throw Error('M3_V4_'+code);};
const goodId=id=>typeof id==='string'&&id.length>0&&id.length<=160&&
 !/[\u0000-\u001f]/.test(id);
const idbOwner=(db,ownerId,assertLease)=>{
 if(typeof ownerId!=='string'||!ownerIdPattern.test(ownerId)||
    !db||db.name!=='closet-current-user-'+ownerId||
    typeof assertLease!=='function')fail('SIGNED_OWNER_REQUIRED');
};
async function checkSHA(image,claimed){
 if(!sha.test(claimed))fail('INVALID_SOURCE_SHA');
 if(typeof image!=='string'||!jpeg.test(image))fail('MISSING_OR_INVALID_SOURCE');
 let raw;
 try{raw=Uint8Array.from(atob(image.slice('data:image/jpeg;base64,'.length)),
  s=>s.charCodeAt(0));}catch{fail('MISSING_OR_INVALID_SOURCE');}
 if(raw.length<4||raw[0]!==255||raw[1]!==216)fail('CORRUPT_SOURCE_JPEG');
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',raw));
 const actual=[...digest].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(actual!==claimed)fail('SOURCE_SHA_MISMATCH');
}
async function verifyOriginalIdentities(data,ownerId,check){
 const draft=data.state?.draft;
 if(draft!==undefined){
  if(!draft||draft.id!=='draft'||!Array.isArray(draft.batch)||
     draft.batch.length>60)fail('INVALID_DRAFT');
 }
 const ids=new Set();
 for(const row of draft?.batch||[]){
  if(!row||!goodId(row.id)||ids.has(row.id)||
     row.ownerId!==undefined&&row.ownerId!==ownerId)
   fail('INVALID_DRAFT_OWNER_OR_ID');
  ids.add(row.id);
  if(!row.image||typeof row.image!=='string')fail('MISSING_DRAFT_JPEG');
 }
 for(const row of [...data.items,...(draft?.batch||[])]){
  check();
  if(row.sourceSHA256&&row.originalPhoto?.sha256&&
     row.sourceSHA256!==row.originalPhoto.sha256)
   fail('SOURCE_IDENTITIES_DISAGREE');
  if(row.originalPhoto?.sha256&&!row.originalPhoto?.image)
   fail('MISSING_PINNED_ORIGINAL');
  if(row.sourceSHA256){
   const original=row.originalPhoto?.image||row.image;
   await checkSHA(original,row.sourceSHA256);
  }else if(row.originalPhoto?.sha256){
   await checkSHA(row.originalPhoto.image,row.originalPhoto.sha256);
  }
 }
 check();
}
// Source freeze is the last line of defense against an attacker-supplied
// mutable object during an asynchronous SHA-256 digest or confirmation.
async function verifiedTarget(data,ownerId,check){
 check();
 const target=structuredClone(data);
 if(!target||target.format!=='closet-current'||target.version!==4||
    target.ownerId!==ownerId)fail('OWNER_BOUND_V4_REQUIRED');
 const json=exact(target);
 if(new TextEncoder().encode(json).byteLength>MAX_BYTES)
  fail('EXCEEDS_100MB_FILE_LIMIT');
 const receipt=await validateRestore01(target,{ownerId});
 check();
 await verifyOriginalIdentities(target,ownerId,check);
 check();
 return {target,receipt,json};
}
export async function exportLosslessV4M3({
 ownerDB,ownerId,assertLease,assertIdle=()=>{}
}={}){
 idbOwner(ownerDB,ownerId,assertLease);
 if(typeof assertIdle!=='function')fail('IDLE_CHECK_REQUIRED');
 const check=()=>{assertLease();assertIdle();};
 check();
 const first=await readOwnerSnapshot01(ownerDB,check);
 check();
 const backup=exportBackup01({ownerId,rows:first.rows});
 const {target,receipt,json}=await verifiedTarget(backup,ownerId,check);
 // The checksum effort can be lengthy on 60 drafts. Recheck the exact
 // private DB snapshot AFTER hashing; never silently export a stale backup
 // if another same-owner tab changed a record during verification.
 const second=await readOwnerSnapshot01(ownerDB,check);
 if(second.fingerprint!==first.fingerprint)fail('SNAPSHOT_CHANGED_RETRY');
 check();
 return Object.freeze({data:target,json,receipt,ownerId,
  savedCount:target.items.length,
  pendingOriginals:target.state.draft?.batch.length||0,
  fullLosslessV4:true,releaseAuthorized:false});
}
export async function restoreLosslessV4M3({
 ownerDB,ownerId,assertLease,assertIdle=()=>{},
 data,confirm=async()=>false,onStage=null
}={}){
 idbOwner(ownerDB,ownerId,assertLease);
 if(typeof assertIdle!=='function'||typeof confirm!=='function')
  fail('OWNER_CONFIRMATION_REQUIRED');
 const check=()=>{assertLease();assertIdle();};
 check();
 const {target,receipt}=await verifiedTarget(data,ownerId,check);
 const before=await readOwnerSnapshot01(ownerDB,check);
 check();
 const yes=await confirm({
  incoming:receipt,existing:before.rows.items.length,
  savedExisting:before.restore.state['outfit-board']?.saved?.length||0,
  existingDrafts:before.restore.state.draft?.batch?.length||0,
  incomingDrafts:target.state.draft?.batch?.length||0
 });
 check();
 // Confirmation can be async. A Promise is truthy even if it resolves false.
 if(yes!==true)return {cancelled:true,unchanged:true,releaseAuthorized:false};
 const result=await restoreOwner01({
  db:ownerDB,assertLease:check,backup:target,ownerId,
  expectedFingerprint:before.fingerprint,confirmed:true,onStage
 });
 check();
 return {...result,receipt,pendingOriginals:target.state.draft?.batch.length||0,
  releaseAuthorized:false};
}
