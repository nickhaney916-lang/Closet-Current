/** Research-only orchestration. Adapters must verify geometry independently.
 * No consumer admission, photo persistence, network or wardrobe writes.
 */
const slots=['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish'];
const hex=/^[a-f0-9]{64}$/;
export function createOutfitJob86({readState,readOriginal,sha256,reconstruct,dispose=()=>{}}){
 if([readState,readOriginal,sha256,reconstruct,dispose].some(f=>typeof f!=='function'))throw Error('P86 adapters required');
 let generation=0,controller=null,pending=new Set();
 const clear=resources=>{for(const r of resources.splice(0))dispose(r);};
 const revoke=()=>{generation++;controller?.abort();controller=null;for(const r of pending)clear(r);};
 const key=s=>JSON.stringify([s?.ownerId,s?.sessionEpoch,s?.wardrobeRevision,s?.boardRevision,
  slots.map(k=>[k,s?.slots?.[k]??null])]);
 const valid=s=>!!s?.ownerId&&Number.isSafeInteger(s.sessionEpoch)&&
  Number.isSafeInteger(s.wardrobeRevision)&&Number.isSafeInteger(s.boardRevision)&&
  s.active===true&&s.researchOptIn===true&&s.slots&&
  Object.keys(s.slots).every(k=>slots.includes(k));
 async function run(){
  revoke(); const ticket=generation,abort=new AbortController();controller=abort;
  const resources=[];pending.add(resources);
  const start=structuredClone(readState());const bound=key(start);
  const live=()=>ticket===generation&&!abort.signal.aborted&&valid(readState())&&key(readState())===bound;
  const denied=reason=>({mode:'original-photo-2d-required',reason,items:[],releaseAuthorized:false,familyAlpha:'HOLD'});
  if(!valid(start)){pending.delete(resources);return denied('inactive-or-unbound-owner');}
  const selected=slots.filter(k=>start.slots[k]);const out=[];
  try{
   for(const slot of selected){
    const itemId=start.slots[slot];
    const photo=await readOriginal({ownerId:start.ownerId,itemId,signal:abort.signal});
    if(!live())throw Error('stale-owner-or-outfit');
    if(photo?.ownerId!==start.ownerId||photo.itemId!==itemId||photo.ownerConfirmed!==true||
       !hex.test(photo.sha256||'')||!(photo.bytes instanceof Uint8Array)||!photo.bytes.length)
     throw Error('unverified-original-photo');
    // Copy: a worker may transfer/detach its input; never transfer stored bytes.
    const bytes=photo.bytes.slice(),hash=await sha256(bytes);
    if(!live())throw Error('stale-owner-or-outfit');
    if(hash!==photo.sha256)throw Error('original-photo-hash-mismatch');
    const result=await reconstruct({ownerId:start.ownerId,itemId,slot,sourceSHA256:hash,
     bytes,signal:abort.signal});
    // Track even late results so cancellation cannot leak GPU/image handles.
    if(result)resources.push(result);
    if(!live())throw Error('stale-owner-or-outfit');
    const matches=result?.sourceSHA256===hash&&result?.itemId===itemId&&result?.ownerId===start.ownerId;
    out.push({slot,itemId,sourceSHA256:hash,mode:'original-photo-2d-required',
     reason:matches?'independent-fit-and-material-acceptance-required':'reconstruction-source-mismatch'});
   }
   if(!live())throw Error('stale-owner-or-outfit');
   // This broker never upgrades numerical research receipts to consumer 3D.
   clear(resources); return {mode:'original-photo-2d-required',items:out,
    ownerId:start.ownerId,boardRevision:start.boardRevision,
    releaseAuthorized:false,familyAlpha:'HOLD'};
  }catch(e){if(ticket===generation)revoke();return denied(e.message);}
  finally{clear(resources);pending.delete(resources);}
 }
 return Object.freeze({run,revoke});
}
