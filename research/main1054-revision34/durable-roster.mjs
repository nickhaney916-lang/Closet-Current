/**
 * MAIN1054 M34 — opt-in, content-derived durable private wardrobe revision.
 * A revision is derived from the actual owner-named IndexedDB saved items,
 * not a volatile tab counter that misses writes by older code or cloud restore.
 * No row/photo bytes, JWT or private DB handle ever leave the closure.
 *
 * This intentionally does not write a counter to private state. A monotonic
 * counter cannot honestly cover older writers without updating EVERY writer.
 * Exact entire-roster CAS in the same outfit-write transaction complements
 * the asynchronous source digest and catches cross-tab edits/restores.
 */
const fail=reason=>{throw Error('MAIN1054_M34 '+reason);};
const MAX_ITEMS=10000,MAX_JSON_CHARS=128*1024*1024;
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=200&&x.trim()===x;
const generation=x=>(typeof x==='number'&&Number.isSafeInteger(x)&&x>=0)||
 (typeof x==='string'&&x.length>=8&&x.length<=160);
const ref=x=>x!==null&&(typeof x==='object'||typeof x==='function');
function captureSession(getSession,getRevision){
 let s,v;
 try{s=getSession();v=getRevision(s);s?.authRef?.assertCurrent?.();}
 catch{fail('signed-owner-unavailable');}
 if(!s||s.authenticated!==true||!validId(s.ownerId)||
    !generation(s.epoch)||!generation(s.operationEpoch)||!generation(v)||
    !ref(s.authRef)||!ref(s.privateDbRef)||s.authRef.user?.id!==s.ownerId||
    s.privateDbName!=='closet-current-user-'+s.ownerId||
    s.privateDbRef.name!==s.privateDbName)
  fail('signed-owner-unavailable');
 return Object.freeze({ownerId:s.ownerId,epoch:s.epoch,
  operationEpoch:s.operationEpoch,privateDbName:s.privateDbName,
  authRef:s.authRef,privateDbRef:s.privateDbRef,revision:v});
}
const same=(a,b)=>a.ownerId===b.ownerId&&a.epoch===b.epoch&&
 a.operationEpoch===b.operationEpoch&&a.privateDbName===b.privateDbName&&
 a.authRef===b.authRef&&a.privateDbRef===b.privateDbRef&&
 a.revision===b.revision;
function exactRoster(records,ownerId){
 if(!Array.isArray(records)||records.length>MAX_ITEMS)
  fail('private-roster-unavailable');
 const ids=new Set();
 const ordered=records.slice();
 for(const record of ordered){
  if(!record||typeof record!=='object'||!validId(record.id)||
     ids.has(record.id)||
     (record.ownerId!==undefined&&record.ownerId!==ownerId))
   fail('private-roster-invalid');
  ids.add(record.id);
 }
 ordered.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 let serial;
 try{serial=JSON.stringify(ordered);}catch{fail('private-roster-unavailable');}
 if(typeof serial!=='string'||serial.length>MAX_JSON_CHARS)
  fail('private-roster-too-large');
 return serial;
}
async function sha(serial,cryptoProvider){
 let result;
 try{
  if(typeof cryptoProvider?.subtle?.digest!=='function')
   fail('secure-digest-unavailable');
  const bytes=new TextEncoder().encode(serial);
  if(bytes.byteLength>MAX_JSON_CHARS*2)fail('private-roster-too-large');
  result=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes));
 }catch{fail('secure-digest-unavailable');}
 return [...result].map(v=>v.toString(16).padStart(2,'0')).join('');
}
/**
 * Seal an actual original owner-named IndexedDB getAll() snapshot that has
 * already been captured during M33 source verification.
 *
 * verify() asynchronously re-reads all saved rows, catching edits to ANY
 * garment (selected or not) across tabs/restore. matchesRows() is synchronous
 * and MUST be called from the original outfit write transaction's items
 * getAll(). It uses byte-exact serialized records, no probabilistic hash CAS.
 */
export async function sealDurablePrivateWardrobe34({
 getSession,getRevision,readOwnerItems,records,
 cryptoProvider=globalThis.crypto
}={}){
 if([getSession,getRevision,readOwnerItems].some(x=>typeof x!=='function'))
  fail('owner-adapter-required');
 const initial=captureSession(getSession,getRevision);
 const serial=exactRoster(records,initial.ownerId);
 const current=()=>{
  if(!same(initial,captureSession(getSession,getRevision)))
   fail('session-or-roster-revision-changed');
 };
 current();
 const digest=await sha(serial,cryptoProvider);
 current();
 let disposed=false;
 const assertCurrent=()=>{
  if(disposed)fail('disposed');
  current();
 };
 return Object.freeze({
  status:'content-derived-private-idb-roster',
  // SHA is metadata only and is intentionally not published to outfit cards.
  revision:'sha256:'+digest,
  itemCount:records.length,
  assertCurrent,
  async verify(){
   assertCurrent();
   let fresh;
   try{fresh=await readOwnerItems(Object.freeze({...initial,assertCurrent}));}
   catch{fail('private-roster-reread-failed');}
   assertCurrent();
   const freshSerial=exactRoster(fresh,initial.ownerId);
   if(freshSerial!==serial)fail('private-roster-changed');
   const freshDigest=await sha(freshSerial,cryptoProvider);
   assertCurrent();
   if(freshDigest!==digest)fail('private-roster-changed');
   return true;
  },
  matchesRows(rows){
   assertCurrent();
   return exactRoster(rows,initial.ownerId)===serial;
  },
  dispose(){disposed=true;}
 });
}
