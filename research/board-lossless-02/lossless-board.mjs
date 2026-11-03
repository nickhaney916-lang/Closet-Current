/**
 * BOARD-LOSSLESS-02 — isolated owner-private, lossless saved outfit editor.
 * It never calls cleanOutfitBoard or writes on read, view, cancel or preview.
 * Explicit edit+transaction CAS only. No production entry point.
 */
export const BOARD02=Object.freeze({slots:Object.freeze(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']),
 maxSaved:50,optIn:'boardLossless02=research',releaseAuthorized:false,familyAlpha:'HOLD'});
const allowed=new Set(BOARD02.slots), own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const obj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
const goodId=s=>typeof s==='string'&&s.length>0&&s.length<=160&&!/[\u0000-\u001f]/.test(s);
const sha=/^[0-9a-f]{64}$/;
const clone=x=>structuredClone(x);
function walk(x,depth=0,seen=new WeakSet()){
 if(depth>40)throw Error('BOARD02 oversized nested outfit metadata');
 if(x===null||typeof x==='string'||typeof x==='boolean'||typeof x==='number'){
  if(typeof x==='number'&&!Number.isFinite(x))throw Error('BOARD02 invalid metadata number');
  if(typeof x==='string'&&x.length>100000)throw Error('BOARD02 oversized outfit metadata');
  return;
 }
 if(!obj(x)&&!Array.isArray(x))throw Error('BOARD02 non-JSON outfit metadata');
 if(seen.has(x))throw Error('BOARD02 circular outfit metadata');
 seen.add(x);
 if(Object.keys(x).length>1500)throw Error('BOARD02 oversized outfit record');
 for(const [k,v]of Object.entries(x)){
  if(['__proto__','prototype','constructor'].includes(k))throw Error('BOARD02 unsafe metadata property');
  walk(v,depth+1,seen);
 }
 seen.delete(x);
}
export function validateBoard02(value,{ownerId=null}={}){
 walk(value);
 if(!obj(value)||!obj(value.current)||!Array.isArray(value.saved)||value.saved.length>50)
  throw Error('BOARD02 existing native outfit board required (max 50)');
 if(value.id!==undefined&&value.id!=='outfit-board')throw Error('BOARD02 wrong state key');
 const all=[value.current,...value.saved],seen=new Map();
 for(let i=0;i<all.length;i++){
  const board=all[i];if(!obj(board)||!obj(board.slots))throw Error('BOARD02 invalid saved outfit');
  if(board.ownerId!==undefined&&board.ownerId!==ownerId&&ownerId!==null)
   throw Error('BOARD02 cross-account outfit owner');
  const used=new Set();
  for(const [slot,id]of Object.entries(board.slots)){
   if(!allowed.has(slot)||!goodId(id))throw Error('BOARD02 invalid outfit slot/garment identity');
   if(used.has(id))throw Error('BOARD02 duplicate garment placement');
   used.add(id);
  }
  for(const key of ['id','outfit3dId','outfitId'])if(board[key]!==undefined&&!goodId(board[key]))
   throw Error('BOARD02 corrupt durable saved-outfit identity');
  if(i>0){
   // Native cloud merge keys by id; PR541 3D opens by outfit3dId. BOTH
   // namespaces must stay unique, including cross-namespace collisions.
   for(const alias of [board.id,board.outfit3dId,board.outfitId].filter(Boolean)){
    const prior=seen.get(alias);
    if(prior!==undefined&&prior!==i)
     throw Error('BOARD02 duplicate persistent saved-outfit ID');
    seen.set(alias,i);
   }
  }
 }
 const serialized=JSON.stringify(value);
 if(serialized.length>2_000_000)throw Error('BOARD02 outfit state too large');
 return true;
}
export function boardFingerprint02(row){validateBoard02(row);return JSON.stringify(row);}
function keyFor(board,index){return board.id||board.outfit3dId||board.outfitId||'legacy-index:'+index;}
function slotFits(slot,item){
 if(!item)return false;
 const type=item.itemType,cat=item.category;
 if(slot==='top')return cat==='Tops'||cat==='Dresses';
 if(slot==='bottom')return cat==='Bottoms';
 if(slot==='layer')return cat==='Tops'||cat==='Outerwear'&&['Cardigan','Vest','Sweater'].includes(type);
 if(slot==='layer2')return cat==='Outerwear'&&['Jacket','Blazer','Vest','Cardigan'].includes(type);
 if(slot==='layer3')return cat==='Outerwear'&&['Coat','Raincoat'].includes(type);
 if(slot==='shoes')return cat==='Shoes';
 if(slot==='bag')return cat==='Accessories'&&type==='Bag';
 if(slot==='accessory')return cat==='Accessories'&&['Jewelry','Sunglasses'].includes(type);
 if(slot==='finish')return cat==='Accessories'&&['Scarf','Belt','Hat'].includes(type);
 return false;
}
export function inspectOutfit02(board,wardrobe,{ownerId}={}){
 if(!obj(board)||!obj(board.slots)||!Array.isArray(wardrobe))throw Error('BOARD02 original garment selection required');
 const map=new Map();
 for(const item of wardrobe){
  if(!obj(item)||!goodId(item.id)||map.has(item.id))
   throw Error('BOARD02 duplicate or invalid owner wardrobe item');
  if(ownerId!==undefined&&item.ownerId!==undefined&&item.ownerId!==ownerId)
   throw Error('BOARD02 cross-owner wardrobe garment');
  map.set(item.id,item);
 }
 const entries=[],missing=[],review=[],selected=[];
 for(const [slot,itemId]of Object.entries(board.slots)){
  if(!allowed.has(slot)||!goodId(itemId))throw Error('BOARD02 malformed saved slot');
  const item=map.get(itemId),src=board.slotSources?.[slot]||null;
  if(!item){
   const record={slot,itemId,status:'MISSING',reason:'Original garment is missing; replace manually or restore exact identity',sourceSHA256:src?.sha256||null};
   entries.push(record);missing.push(record);continue;
  }
  const old=src?.categoryAtSave||board.slotCategories?.[slot]||null;
  const sourceHash=item.originalPhoto?.sha256||item.sourceSHA256||null;
  const pinnedHash=src?.sha256||null;
  const identityMismatch=!!(pinnedHash&&sourceHash&&pinnedHash!==sourceHash);
  const compatible=slotFits(slot,item);
  if(!compatible||identityMismatch){
   const record={slot,itemId,status:'REVIEW',category:item.category,categoryAtSave:old,
    reason:identityMismatch?'Original photograph SHA does not match saved identity':
    'Recategorized or incompatible with original slot; original placement retained',
    sourceSHA256:pinnedHash||sourceHash};
   entries.push(record);review.push(record);continue;
  }
  const record={slot,itemId,status:'PRESENT',category:item.category,itemType:item.itemType,
   sourceSHA256:sourceHash||pinnedHash||null,categoryAtSave:old,
   originalPhotoAvailable:!!(item.originalPhoto?.image||item.image)};
  entries.push(record);selected.push(record);
 }
 const top=map.get(board.slots.top),dress=top?.category==='Dresses';
 const incompatibleDress=dress&&!!(board.slots.bottom||board.slots.layer);
 if(incompatibleDress)review.push({slot:'top',itemId:board.slots.top,status:'REVIEW',reason:'Dress conflicts with an existing bottom or inner layer; outer jacket and coat remain supported'});
 return Object.freeze({entries,selected,missing,review,dress,outerwear:entries.filter(x=>['layer2','layer3'].includes(x.slot)),
  preserveAllSlots:true,sourceHonest:true,releaseAuthorized:false});
}
export async function verifyPhoto02(item){
 const str=item?.originalPhoto?.image||item?.image;
 const expected=item?.originalPhoto?.sha256||item?.sourceSHA256;
 if(!str||typeof str!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(str)||!sha.test(expected||''))
  return Object.freeze({verified:false,reason:'No SHA-pinned original JPEG; photo-only review required'});
 if(typeof crypto?.subtle?.digest!=='function'||typeof atob!=='function')
  return Object.freeze({verified:false,reason:'Secure original photo hash unavailable'});
 try{
  const binary=atob(str.split(',')[1]);if(binary.length>8_388_608||binary.length<100)
   return Object.freeze({verified:false,reason:'Original JPEG size invalid'});
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  if(bytes[0]!==0xff||bytes[1]!==0xd8)return Object.freeze({verified:false,reason:'Original JPEG identity invalid'});
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const actual=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  return Object.freeze({verified:actual===expected,sourceSHA256:actual,
   reason:actual===expected?'Exact original JPEG verified':'Original JPEG SHA mismatch'});
 }catch{return Object.freeze({verified:false,reason:'Original JPEG bytes unreadable'});}
}
function leaseFor(auth){
 const id=auth?.user?.id,gen=auth?.getSessionGeneration?.();
 if(!goodId(id)||!Number.isSafeInteger(gen)||gen<0)throw Error('BOARD02 authenticated owner generation required');
 return {authenticated:true,ownerId:id,generation:gen};
}
export function createLosslessBoard02({auth,io,makeId=()=>crypto.randomUUID()}={}){
 if(!auth?.ready||typeof auth.getSessionGeneration!=='function'||!io||
    typeof io.read!=='function'||typeof io.compareAndWrite!=='function'||typeof makeId!=='function')
  throw Error('BOARD02 requires existing owner/authenticated CAS adapter');
 let loaded=false,closed=false,owner=null,generation=null,stored=null,wardrobe=[],cloud=null,
  fingerprint=null,opened=null,draft=null,dirty=false,pins=new Set(),lastReceipt=null;
 const reset=()=>{loaded=false;owner=null;generation=null;stored=null;wardrobe=[];cloud=null;
  fingerprint=null;opened=null;draft=null;dirty=false;pins=new Set();lastReceipt=null;};
 const live=()=>{if(closed)throw Error('BOARD02 editor disposed');return leaseFor(auth);};
 const check=()=>{
  let current;
  try{current=live();}catch(e){reset();throw Error('BOARD02 owner/session revoked; private draft invalidated');}
  if(!loaded||current.ownerId!==owner||current.generation!==generation){
   reset();throw Error('BOARD02 owner/session changed; previous private edit discarded');
  }
  return current;
 };
 async function refresh(){
  reset();await auth.ready;const lease=live(),snapshot=await io.read(lease);
  if(live().ownerId!==lease.ownerId||live().generation!==lease.generation)
   throw Error('BOARD02 account switched while reading storage');
  validateBoard02(snapshot.board,{ownerId:lease.ownerId});
  if(!Array.isArray(snapshot.items)||snapshot.items.length>1000)
   throw Error('BOARD02 authenticated wardrobe snapshot invalid');
  for(const item of snapshot.items)if(item.ownerId!==undefined&&item.ownerId!==lease.ownerId)
   throw Error('BOARD02 cross-owner item');
  owner=lease.ownerId;generation=lease.generation;
  stored=clone(snapshot.board);wardrobe=clone(snapshot.items);
  fingerprint=boardFingerprint02(stored);cloud=clone(snapshot.cloud||null);loaded=true;
  return Object.freeze({ownerId:owner,generation,savedCount:stored.saved.length,
   existingStateUnmodified:true,releaseAuthorized:false});
 }
 function list(){check();return Object.freeze(stored.saved.map((v,i)=>Object.freeze({
  id:keyFor(v,i),name:v.name||'My outfit',slots:Object.keys(v.slots).length,
  missing:inspectOutfit02(v,wardrobe,{ownerId:owner}).missing.length,
  review:inspectOutfit02(v,wardrobe,{ownerId:owner}).review.length
 })));}
 function open(id){check();if(!goodId(id))throw Error('BOARD02 saved ID required');
  const ix=stored.saved.findIndex((v,i)=>keyFor(v,i)===id);if(ix<0)throw Error('BOARD02 saved outfit not found');
  opened=ix;draft=clone(stored.saved[ix]);dirty=false;pins=new Set();
  return inspect();
 }
 function inspect(){check();if(!draft)throw Error('BOARD02 open existing saved outfit first');
  return Object.freeze({...inspectOutfit02(draft,wardrobe,{ownerId:owner}),
   id:keyFor(draft,opened===null?stored.saved.length:opened),
   name:draft.name||'My outfit',slots:clone(draft.slots),dirty,currentlyPinned:[...pins],
   ownerId:owner,generation,metadataPreserved:true});
 }
 function editName(name){check();if(!draft)throw Error('Open outfit first');
  if(typeof name!=='string'||!name.trim()||name.trim().length>80)throw Error('BOARD02 invalid outfit name');
  draft.name=name.trim();dirty=true;return inspect();}
 function pin(slot,enabled=true){check();if(!draft||!allowed.has(slot))throw Error('BOARD02 unknown pinned slot');
  if(enabled){if(!draft.slots[slot])throw Error('BOARD02 pin requires an existing piece');pins.add(slot);}
  else pins.delete(slot);return inspect();
 }
 function setSlot(slot,itemId,{overridePin=false}={}){
  check();if(!draft||!allowed.has(slot))throw Error('BOARD02 unknown outfit slot');
  if(pins.has(slot)&&!overridePin)throw Error('BOARD02 pinned garment must be explicitly unpinned');
  if(itemId!==null&&itemId!==''&&!goodId(itemId))throw Error('BOARD02 replacement garment ID required');
  if(itemId&&Object.entries(draft.slots).some(([k,id])=>k!==slot&&id===itemId))
   throw Error('BOARD02 duplicate garment cannot occupy multiple slots');
  const item=itemId?wardrobe.find(x=>x.id===itemId):null;
  if(itemId&&(!item||!slotFits(slot,item)))throw Error('BOARD02 replacement must exist in owner closet and fit slot');
  if(itemId&&item.ownerId!==undefined&&item.ownerId!==owner)throw Error('BOARD02 owner mismatch');
  if(!itemId){delete draft.slots[slot];if(obj(draft.slotSources))delete draft.slotSources[slot];}
  else{
   const originalHash=item.originalPhoto?.sha256||item.sourceSHA256;
   // Existing owner records without verified photo hashes may be edited in
   // photo-only research, but must never be labelled approved 3D.
   if(originalHash!==undefined&&!sha.test(originalHash))throw Error('BOARD02 malformed original photo SHA');
   draft.slots[slot]=itemId;
   draft.slotSources={...(draft.slotSources||{}),[slot]:{
    ...(obj(draft.slotSources?.[slot])?draft.slotSources[slot]:{}),
    ...(originalHash?{sha256:originalHash}:{}),
    categoryAtSave:item.category,itemTypeAtSave:item.itemType||'Unknown',
    ownerId:owner}};
  }
  dirty=true;return inspect();
 }
 const swapShoes=id=>setSlot('shoes',id);
 function cancel(){check();if(opened===null){draft=null;dirty=false;pins.clear();return {cancelled:true};}
  draft=clone(stored.saved[opened]);dirty=false;pins.clear();
  return Object.freeze({cancelled:true,id:keyFor(draft,opened),storedUnchanged:true});
 }
 async function save({asNew=false}={}){
  const lease=check();if(!draft||!dirty)throw Error('BOARD02 explicit changed draft required');
  if(asNew&&stored.saved.length>=50)throw Error('BOARD02 maximum 50 saved outfits');
  const proposed=clone(stored),updated=clone(draft);
  if(asNew){
   const id='outfit3d-'+makeId();if(!goodId(id)||stored.saved.some((v,i)=>keyFor(v,i)===id))
    throw Error('BOARD02 duplicate new outfit ID');
   updated.id=id;updated.outfit3dId=id;updated.ownerId=owner;
   proposed.saved.push(updated);
  }else{
   if(opened===null)throw Error('BOARD02 open original before updating');
   const old=stored.saved[opened];
   if(!obj(old)||!obj(old.slots))throw Error('BOARD02 original saved outfit missing');
   const identity=keyFor(old,opened);
   if(!old.id&&!old.outfit3dId&&!old.outfitId){
    const id='outfit3d-'+makeId();if(!goodId(id))throw Error('BOARD02 new durable ID invalid');
    updated.id=id;updated.outfit3dId=id;
   }else if(!old.id){updated.id=old.outfit3dId||old.outfitId;}
   // Never change any pre-existing durable identity or unknown metadata.
   updated.ownerId=old.ownerId||owner;
   proposed.saved[opened]=updated;
   if(keyFor(old,opened)!==identity)throw Error('BOARD02 saved identity changed');
  }
  validateBoard02(proposed,{ownerId:owner});
  await io.compareAndWrite({lease,expectedFingerprint:fingerprint,expectedCloud:cloud,
   nextBoard:proposed,operation:asNew?'save-new':'save-existing'});
  check();
  stored=proposed;fingerprint=boardFingerprint02(proposed);
  // Always reload the exact committed cloud revision and authoritative data.
  const proof=await io.read(lease);
  check();
  if(boardFingerprint02(proof.board)!==fingerprint)throw Error('BOARD02 committed state no longer current; reload to continue');
  cloud=clone(proof.cloud||null);
  opened=asNew?stored.saved.length-1:opened;draft=clone(updated);
  dirty=false;pins.clear();
  lastReceipt=Object.freeze({saved:true,id:keyFor(updated,opened),asNew,ownerId:owner,
   sourceOriginalsUntouched:true,releaseAuthorized:false});
  return lastReceipt;
 }
 async function remove({confirmedId}={}){
  const lease=check();if(opened===null||!draft)throw Error('BOARD02 open outfit to delete');
  const id=keyFor(stored.saved[opened],opened);
  if(confirmedId!==id)throw Error('BOARD02 explicit deletion confirmation must match outfit ID');
  const proposed=clone(stored);proposed.saved.splice(opened,1);
  await io.compareAndWrite({lease,expectedFingerprint:fingerprint,expectedCloud:cloud,nextBoard:proposed,operation:'delete'});
  check();
  const proof=await io.read(lease);check();
  const newKey=boardFingerprint02(proposed);
  if(boardFingerprint02(proof.board)!==newKey)throw Error('BOARD02 deletion storage changed; reload required');
  stored=proposed;fingerprint=newKey;cloud=clone(proof.cloud||null);opened=null;draft=null;dirty=false;pins.clear();
  return Object.freeze({deleted:true,id,confirmed:true,ownerId:owner});
 }
 function originalSnapshot(){check();return clone(stored);}
 function lastSave(){check();return lastReceipt;}
 function toPreview(){const state=inspect(),lookup=new Map(wardrobe.map(x=>[x.id,x]));
  const selected=state.selected.map(x=>({...x,claimedSHA256:x.sourceSHA256,
   originalSHA256:null,sourceVerified:false,
   color:lookup.get(x.itemId)?.color||'Unknown'}));
  return Object.freeze({ownerId:owner,generation,name:state.name,
   selected,missing:state.missing,needsReview:state.review,
   slots:state.slots,renderOnly:true,releaseAuthorized:false});
 }
 async function toVerified3DPlan(){
  const lease=check(),base=toPreview(),verified=[];
  for(const field of base.selected){
   const item=wardrobe.find(x=>x.id===field.itemId),proof=await verifyPhoto02(item);
   const after=check();
   if(after.ownerId!==lease.ownerId||after.generation!==lease.generation)
    throw Error('BOARD02 private original JPEG verification interrupted by owner change');
   verified.push(Object.freeze({...field,
    originalSHA256:proof.verified?proof.sourceSHA256:null,
    sourceVerified:proof.verified,sourceReviewReason:proof.reason}));
  }
  return Object.freeze({...base,selected:Object.freeze(verified),
   originalJPEGsByteVerified:verified.every(x=>x.sourceVerified),
   unverifiedCount:verified.filter(x=>!x.sourceVerified).length,
   releaseAuthorized:false});
 }
 function invalidate(){reset();}
 return Object.freeze({refresh,list,open,inspect,editName,pin,setSlot,swapShoes,cancel,
  save,remove,originalSnapshot,lastSave,toPreview,toVerified3DPlan,invalidate,
  dispose(){reset();closed=true;},researchOnly:true,releaseAuthorized:false});
}
