/**
 * Parallel #93 research-only adapter. NOT wired to consumer, no owner/deploy.
 * The historical Mission 3 v1-v3 merge accepts multiple saved IDs that share
 * canonical original/display JPEG identity; current normal M4 v3 export/import
 * refuses such a wardrobe. This adapter preserves M3 validation, owner lease
 * and CAS, then denies an unrecoverable combined saved-item snapshot.
 */
import {prepareLegacyAtomicM3} from '../mission3-legacy-atomic-import/legacy-atomic-merge.mjs';

const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const mime='data:image/jpeg;base64,';
const fail=(reason)=>{throw Error('P93_M3_V3_RESTORE_'+reason);};
function canonicalJPEG(image){
 if(typeof image!=='string'||!image.startsWith(mime))return image;
 const pads=image.endsWith('==')?2:image.endsWith('=')?1:0;
 if(!pads)return image;
 const index=image.length-1-pads;
 const sextet=alphabet.indexOf(image[index]);
 return sextet<0?image:
  image.slice(0,index)+alphabet[sextet&(pads===2?48:60)]+image.slice(index+1);
}
function assertRestorableItems(items){
 const ids=new Set(),pictures=new Set(),originalReceipts=new Set();
 for(const row of items){
  if(!row||typeof row.id!=='string'||ids.has(row.id))
   fail('INVALID_SAVED_ID');
  ids.add(row.id);
  const rowPictures=new Set([row.image,row.originalPhoto?.image]
   .filter(image=>typeof image==='string'&&image.length)
   .map(canonicalJPEG));
  const receipt=row.originalPhoto?.sha256||row.sourceSHA256||null;
  if([...rowPictures].some(image=>pictures.has(image))||
     (receipt&&originalReceipts.has(receipt)))
   fail('SHARED_ORIGINAL_OR_PREVIEW_REQUIRES_OWNER_REVIEW');
  for(const image of rowPictures)pictures.add(image);
  if(receipt)originalReceipts.add(receipt);
 }
}
async function readSnapshot(ownerDB,assertLease){
 assertLease();
 return new Promise((resolve,reject)=>{
  try{
   const tx=ownerDB.transaction(['items','state'],'readonly');
   const items=tx.objectStore('items').getAll();
   const state=tx.objectStore('state').getAll();
   tx.oncomplete=()=>{
    try{assertLease();resolve({items:items.result,state:state.result});}
    catch(e){reject(e);}
   };
   tx.onerror=tx.onabort=()=>reject(tx.error||Error('P93_M3_V3_RESTORE_READ_FAILED'));
  }catch(e){reject(e);}
 });
}
/**
 * The result is an unchanged, genuine M3 donor prepared plan. The adapter is
 * checked AFTER its real SHA/owner/data validation, BEFORE owner confirmation.
 * A second owner-signed read is compared to donor's own prepared fingerprint.
 * The M3 commit still rechecks this fingerprint atomically at write time.
 * All alias checks include untouched existing saved rows and incoming changes.
 */
export async function prepareLegacyAtomicM3Restorable(options={}){
 const {ownerDB,ownerId,assertLease}=options;
 if(!ownerDB||typeof ownerId!=='string'||!ownerId||
    ownerDB.name!=='closet-current-user-'+ownerId||
    typeof assertLease!=='function')
  fail('SIGNED_OWNER_REQUIRED');
 assertLease();
 const plan=await prepareLegacyAtomicM3(options);
 const snapshot=await readSnapshot(ownerDB,assertLease);
 if(JSON.stringify(snapshot)!==plan.expectedFingerprint)
  fail('STALE_OWNER_SNAPSHOT');
 const next=new Map(snapshot.items.map(row=>[row.id,row]));
 for(const row of plan.incoming)next.set(row.id,row);
 assertRestorableItems([...next.values()]);
 assertLease();
 return plan;
}
