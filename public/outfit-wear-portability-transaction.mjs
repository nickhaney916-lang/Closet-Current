import {serializeWearHistory,planWearHistoryRestore} from './outfit-wear-portability.mjs';

const key='outfit-wear-history-v1';
function guard(ownerDB,ownerId,assertLease){
 if(typeof ownerId!=='string'||!ownerId.trim()||ownerDB?.name!=='closet-current-user-'+ownerId||typeof assertLease!=='function')
  throw Error('Wear history requires the current private owner database.');
 assertLease();
}
function readRow(ownerDB,ownerId,assertLease){
 guard(ownerDB,ownerId,assertLease);
 return new Promise((resolve,reject)=>{
  const tx=ownerDB.transaction('state','readonly');
  const request=tx.objectStore('state').get(key);
  tx.oncomplete=()=>{try{guard(ownerDB,ownerId,assertLease);resolve(request.result);}catch(e){reject(e);}};
  tx.onabort=()=>reject(tx.error||Error('Wear history read interrupted.'));
 });
}

// Research-only adapter. Not a public backup format or a replacement for
// the shared wardrobe atomic import transaction. The controller must approve
// integration of the section and its conflict check into that transaction.
export async function exportOwnerWearSection({ownerDB,ownerId,assertLease}){
 const row=await readRow(ownerDB,ownerId,assertLease);
 guard(ownerDB,ownerId,assertLease);
 return serializeWearHistory(ownerId,row);
}
export async function prepareOwnerWearRestore({ownerDB,ownerId,assertLease,section}){
 const snapshot=structuredClone(section);
 const row=await readRow(ownerDB,ownerId,assertLease);
 const next=planWearHistoryRestore(ownerId,snapshot,row);
 guard(ownerDB,ownerId,assertLease);
 return {ownerId,expected:JSON.stringify(row??null),section:snapshot,count:next.events.length};
}
export async function commitOwnerWearRestore({ownerDB,ownerId,assertLease,prepared,confirmed=false,onStage}){
 if(confirmed!==true)throw Error('Wear history restore requires owner confirmation.');
 guard(ownerDB,ownerId,assertLease);
 const plan=structuredClone(prepared);
 if(plan?.ownerId!==ownerId||typeof plan.expected!=='string')throw Error('Invalid wear history restore plan.');
 return new Promise((resolve,reject)=>{
  const tx=ownerDB.transaction('state','readwrite');
  const store=tx.objectStore('state'),request=store.get(key);
  let failure,restored;
  request.onsuccess=()=>{
   try{
    guard(ownerDB,ownerId,assertLease);
    if(JSON.stringify(request.result??null)!==plan.expected)throw Error('Wear history changed; review and retry.');
    restored=planWearHistoryRestore(ownerId,plan.section,request.result);
    store.put(restored);
    onStage?.();
    guard(ownerDB,ownerId,assertLease);
   }catch(e){failure=e;tx.abort();}
  };
  tx.onabort=()=>reject(failure||tx.error||Error('Wear history restore rolled back.'));
  tx.oncomplete=()=>{
   try{guard(ownerDB,ownerId,assertLease);resolve({committed:true,count:restored.events.length});}
   catch{reject(Error('Wear history committed; session ended. Reopen the private wardrobe to verify.'));}
  };
 });
}
