/**
 * Issue #240 research-only owned-outfit lifecycle:
 * - NEVER wired to the production client without integration review.
 * - No customer data, service access, paid inference or persistent writes.
 * - Original photo pixels are never transformed or cached.
 * - Owner is the verified caller supplied session, NOT a security credential.
 * - Explicit SHA-256 cache versions cover source and clothing attributes.
 */
const SLOT_IDS=new Set(['top','bottom','shoes','layer','layer2','layer3','bag','accessory','finish']);
const SOURCE_FIELDS=['image','originalPhoto','recognitionPhoto'];
const ATTR_FIELDS=['id','category','itemType','color','colorSource','pattern','seasons','sleeveLength','fit','material','name','originalSourceVersion','outfitSourceId','cropBounds'];
const cleanStr=v=>typeof v==='string'?v:'';
const stringify=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
async function digest(value){
 const bytes=new TextEncoder().encode(value),hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function fingerprintItem(item){
 if(!item||typeof item.id!=='string'||!item.id)throw Error('Missing saved clothing identity');
 if(typeof item.image!=='string'||!item.image.trim())throw Error('Blank saved clothing source');
 const source={image:item.image,originalPhoto:item.originalPhoto?.image||null,recognitionPhoto:item.recognitionPhoto?.image||null};
 if(item.outfitSourceId&&!source.originalPhoto)throw Error('Multi-garment original source missing');
 // Hash each exact in-app saved string; original full image is a separate
 // field and will change the SHA even if a crop preview is unchanged.
 const imageHashes={};
 for(const [field,value]of Object.entries(source))imageHashes[field]=value?await digest(value):null;
 const attributes=Object.fromEntries(ATTR_FIELDS.map(field=>[field,field==='originalSourceVersion'?item[field]??null:item[field]??null]));
 return digest(stringify({attributes,imageHashes}));
}
export async function snapshotCloset(owner,closet){
 if(typeof owner!=='string'||owner.length<2||!Array.isArray(closet))throw Error('Verified account and closet required');
 const versions=new Map();
 for(const item of closet){
  if(versions.has(item?.id))throw Error('Duplicate clothing IDs cannot be resolved');
  versions.set(item.id,await fingerprintItem(item));
 }
 const wardrobeVersion=await digest(stringify([...versions].sort(([a],[b])=>a.localeCompare(b))));
 return {owner,versions,wardrobeVersion};
}
export function validateOutfitSlots(slots,items,slotAllows){
 if(!slots||typeof slots!=='object'||Array.isArray(slots))throw Error('Saved outfit slots missing');
 const owned=new Map();
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id||owned.has(item.id))throw Error('Duplicate or invalid owned clothing');
  owned.set(item.id,item);
 }
 const used=new Set();
 for(const [slot,id]of Object.entries(slots)){
  if(!SLOT_IDS.has(slot)||typeof id!=='string'||used.has(id))throw Error('Invalid or duplicate outfit selection');
  used.add(id);
  const item=owned.get(id);
  if(!item||!slotAllows(slot,item))throw Error('Outfit contains missing or incompatible owned item');
 }
 const top=owned.get(slots.top);
 if(top?.category==='Dresses'&&['bottom','layer','layer2','layer3'].some(s=>slots[s]))throw Error('Dress cannot contain hidden bottom/layer');
 return true;
}
export function createOutfitLifecycle({ownerId,readOwner,readCloset,generate,cleanBoard,slotAllows}){
 if(typeof ownerId!=='string'||!ownerId||![readOwner,readCloset,generate,cleanBoard,slotAllows].every(x=>typeof x==='function'))throw Error('Owned outfit lifecycle integration required');
 let active=null;
 const pins=new Map();
 function account(){if(readOwner()!==ownerId)throw Error('Account changed; refuse prior owner recommendation/board');}
 async function context(){
  account();const items=readCloset();
  if(!Array.isArray(items))throw Error('Closet unavailable');
  const fingerprint=await snapshotCloset(ownerId,items);
  account(); // guard the owner after async hashing
  return {items,fingerprint};
 }
 function allows(slot,item){return SLOT_IDS.has(slot)&&slotAllows(slot,item);}
 function checked(items,slots){
  validateOutfitSlots(slots,items,allows);
  return true;
 }
 function pinnedInventory(items){
  const pinned=[...pins],filter=new Map();
  for(const [slot,id]of pinned){
   const current=items.find(x=>x.id===id);
   if(!current||!allows(slot,current))throw Error('Pinned clothing deleted or recategorized: '+slot);
   if(filter.has(id))throw Error('Same garment cannot be pinned to multiple outfit slots');
   filter.set(id,slot);
  }
  // Top/bottom/shoe are ranked by the current real stylist engine.
  // Constrain only within the same structural slot before re-running it.
  const req=['top','bottom','shoes'];
  return items.filter(item=>req.every(slot=>{
   const pinnedId=pins.get(slot);
   return !pinnedId||!allows(slot,item)||item.id===pinnedId;
  }));
 }
 function applyPinned(board,items){
  const slots={...board.slots};
  for(const [slot,id]of pins)slots[slot]=id;
  const clean=cleanBoard({...board,slots},items);
  for(const [slot,id]of pins)if(clean.slots[slot]!==id)throw Error('Cannot apply pinned garment without changing hidden or incompatible slots');
  checked(items,clean.slots);
  return clean;
 }
 const choose=(board,items)=>checked(items,board.slots)&&board;
 async function refresh(request={}){
  const {items,fingerprint}=await context(),params=structuredClone(request);
  const pool=pinnedInventory(items),generated=generate(pool,params)||[];
  if(!Array.isArray(generated))throw Error('Invalid wardrobe recommendation provider');
  const results=[],signatures=new Set();
  for(const source of generated){
   if(!source?.board||!source?.context)continue;
   let board;
   try{board=applyPinned(source.board,items);}catch{continue;}
   const signature=stringify(board.slots);
   if(signatures.has(signature))continue;
   signatures.add(signature);results.push({...source,board,signature});
   if(results.length===3)break;
  }
  account();
  active={owner:ownerId,version:fingerprint.wardrobeVersion,versions:fingerprint.versions,request:params,results};
  return {status:'fresh',version:fingerprint.wardrobeVersion,results:structuredClone(results)};
 }
 async function checkedActive(){
  if(!active)throw Error('Recommendations not yet created');
  const {items,fingerprint}=await context();
  if(fingerprint.wardrobeVersion!==active.version)throw Error('Recommendations stale: clothing added, removed, edited, reclassified, recolored or original image changed; refresh required');
  return {items,fingerprint};
 }
 async function visible(){
  if(!active)return {status:'empty',results:[]};
  try{await checkedActive();return {status:'fresh',results:structuredClone(active.results)};}
  catch{return {status:'stale',results:[]};}
 }
 async function pin(slot,id){
  if(!SLOT_IDS.has(slot))throw Error('Unknown pin slot');
  const {items}=await context();
  if(id!==null&&id!==''){
   const item=items.find(x=>x.id===id);
   if(!item||!allows(slot,item))throw Error('Invalid pinned saved garment');
   for(const [other,otherId]of pins)if(other!==slot&&otherId===id)throw Error('Garment already pinned');
   pins.set(slot,id);
  }else pins.delete(slot);
  active=null;
  return {pins:Object.fromEntries(pins)};
 }
 async function swap(index,slot,id){
  const {items}=await checkedActive();
  if(!Number.isInteger(index)||index<0||index>=active.results.length)throw Error('Unknown recommendation');
  if(!SLOT_IDS.has(slot))throw Error('Unknown swap slot');
  if(pins.has(slot)&&pins.get(slot)!==id)throw Error('Pinned garment cannot be swapped');
  const target=items.find(x=>x.id===id);
  if(!target||!allows(slot,target))throw Error('Swap item must be a compatible owned garment');
  const prior=active.results[index],nextSlots={...prior.board.slots,[slot]:id};
  if(Object.entries(nextSlots).some(([key,v])=>key!==slot&&v===id))throw Error('Swap would reuse the same clothing twice');
  const board=cleanBoard({...prior.board,slots:nextSlots},items);
  if(board.slots[slot]!==id)throw Error('Swap lost selected garment');
  for(const [key,value]of Object.entries(prior.board.slots))if(key!==slot&&board.slots[key]!==value)throw Error('One-piece swap would unexpectedly change another slot');
  checked(items,board.slots);
  const result={...prior,board,signature:stringify(board.slots)};
  active.results[index]=result;
  return structuredClone(result);
 }
 async function save(index){
  const {items,fingerprint}=await checkedActive();
  const result=active.results[index];
  if(!result)throw Error('Unknown recommendation');
  const slots=choose(result.board,items).slots,selectedVersions={};
  for(const id of Object.values(slots))selectedVersions[id]=fingerprint.versions.get(id);
  return {kind:'issue240-owned-outfit-v1',owner:ownerId,board:structuredClone(result.board),
   selectedVersions,createdFromVersion:fingerprint.wardrobeVersion};
 }
 async function restore(saved){
  const {items,fingerprint}=await context();
  if(!saved||saved.kind!=='issue240-owned-outfit-v1'||saved.owner!==ownerId)throw Error('Outfit owner/session mismatch');
  if(!saved.selectedVersions||!saved.board?.slots)throw Error('Saved outfit provenance missing');
  const board=cleanBoard(saved.board,items);
  if(stringify(board.slots)!==stringify(saved.board.slots))throw Error('Outfit references deleted or recategorized clothes');
  checked(items,board.slots);
  for(const id of Object.values(board.slots))if(fingerprint.versions.get(id)!==saved.selectedVersions[id])throw Error('Saved garment changed color, category or photo source; review required');
  return {status:'restored',board:structuredClone(board),owner:ownerId};
 }
 return {refresh,visible,pin,swap,save,restore,getPins:()=>Object.fromEntries(pins)};
}
