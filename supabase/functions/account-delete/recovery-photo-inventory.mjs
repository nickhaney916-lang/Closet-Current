// SERVER ONLY, UNDEPLOYED, read-only account incident inventory.
// Names are content-addressed hints, NOT verified object bytes or deletion proof.
// Never return object names to a caller or touch a user storage account.
import {createHash} from 'node:crypto';
const UID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE=/^[a-f0-9]{64}\.jpg$/;
const PAGE_SIZE=100,MAX_FILES=10000;
export function createDeletionReviewPhotoInventory({enabled=false,listPage}={}){
 if(typeof listPage!=='function')throw Error('Missing privileged read-only Storage page inspector');
 async function inspect({uid}={}){
  if(enabled!==true)throw Error('Recovery inventory inspection disabled');
  if(typeof uid!=='string'||!UID.test(uid))throw Error('Invalid scoped owner');
  const names=[],seen=new Set();
  let pages=0,previous='';
  for(let offset=0;offset<=MAX_FILES;offset+=PAGE_SIZE){
   const page=await listPage({uid,limit:PAGE_SIZE,offset});
   pages++;
   if(!Array.isArray(page)||page.length>PAGE_SIZE)
    throw Error('Unverified or oversized private-photo page');
   for(const name of page){
    if(typeof name!=='string'||!FILE.test(name)||seen.has(name)||name<=previous)
     throw Error('Private-photo inventory is malformed, unsorted or duplicated');
    seen.add(name);names.push(name);previous=name;
    if(names.length>MAX_FILES)throw Error('Private-photo inventory exceeds bounded review limit');
   }
   if(page.length<PAGE_SIZE){
    // Hash exact ordered names with a version and account namespace;
    // never return filenames, names list, or private account ID.
    const digest=createHash('sha256')
     .update('cc-account-photo-review-names-v1\0')
     .update(uid.toLowerCase()).update('\0')
     .update(names.join('\n')).digest('hex');
    return Object.freeze({digest,count:names.length,pages,ownerScoped:true,
     filenamesEnumerated:true,photoBytesVerified:false});
   }
  }
  throw Error('Private-photo inventory not exhaustively paginated');
 }
 return Object.freeze({inspect});
}
