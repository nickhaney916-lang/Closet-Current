/**
 * BOARD-PRESERVE-01 — READ-ONLY, owner-scoped legacy/donor reconciliation.
 *
 * Exact native public/outfit-board-engine.js cleanOutfitBoard() is supplied by
 * the caller; this module never replaces it or writes a customer database.
 * The original state['outfit-board'] remains the sole source of truth.
 *
 * Loss = nonempty saved item/idea/3D-outfit ID that native cleanup would drop
 * or replace. Missing/deleted and reclassified pieces are not silently
 * erased, and a dress with outerwear stays REVIEW rather than unapproved.
 */
export const BOARD_PRESERVE_01=Object.freeze({
 slots:Object.freeze(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']),
 currentAndSaved:true,sourceStateNeverMutated:true,sourcePhotosNeverAltered:true,
 unsafeSaveNeverAuthorized:true,realSupabaseRLSApproved:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const clone=x=>structuredClone(x);
const validString=x=>typeof x==='string'&&x.length>0&&x.length<=160;
function checkLease(lease,live){
 const now=live?.();
 if(!object(lease)||!object(now)||lease.authenticated!==true||
  now.authenticated!==true||!validString(lease.ownerId)||
  lease.ownerId!==now.ownerId||!Number.isSafeInteger(lease.generation)||
  lease.generation<0||lease.generation!==now.generation)
  throw Error('BOARD01 authenticated owner/session changed');
}
function shape(state,closet){
 if(!object(state)||!Array.isArray(state.saved)||state.saved.length>50||
  !object(state.current)||!Array.isArray(closet)||closet.length>1000)
  throw Error('BOARD01 existing saved board and owner closet required');
 const ids=new Set();
 for(const item of closet){
  if(!object(item)||!validString(item.id)||ids.has(item.id))
   throw Error('BOARD01 duplicate or malformed owner wardrobe identity');
  ids.add(item.id);
 }
 for(const [i,board]of [state.current,...state.saved].entries()){
  if(!object(board)||!object(board.slots||{}))
   throw Error('BOARD01 malformed saved outfit '+i);
  for(const [slot,id]of Object.entries(board.slots||{}))
   if(!BOARD_PRESERVE_01.slots.includes(slot)||!validString(id))
    throw Error('BOARD01 malformed saved slot identity');
 }
}
function inspectOne(path,original,normalized,byId){
 if(!object(normalized)||!object(normalized.slots))
  throw Error('BOARD01 actual native cleanup result missing');
 const losses=[],refs=[],count=new Map();
 const isDress=byId.get(original?.slots?.top)?.category==='Dresses';
 for(const [slot,id]of Object.entries(original.slots||{})){
  count.set(id,(count.get(id)||0)+1);
  const kept=normalized.slots[slot]===id;
  const garment=byId.get(id);
  refs.push(Object.freeze({slot,itemId:id,stillSaved:!!garment,
   currentlyCategorized:garment?.category||null,retainedByNative:kept}));
  if(!kept){
   const reason=!garment?'deleted-or-missing-saved-piece':
    isDress&&['layer2','layer3'].includes(slot)?'dress-outerwear-erased':
    garment?.category?'native-category-or-layer-normalizer-removed-piece':
    'unverified-piece';
   losses.push(Object.freeze({path,slot,itemId:id,reason}));
  }
 }
 for(const [id,n]of count)
  if(n>1)losses.push(Object.freeze({path,itemId:id,reason:'same-garment-in-multiple-slots'}));
 for(const [slot,idea]of Object.entries(original.ideas||{})){
  if(!own(normalized.ideas||{},slot)&&object(idea)&&validString(idea.type))
   losses.push(Object.freeze({path,slot,reason:'original-unsaved-inspiration-erased'}));
 }
 if(validString(original.outfit3dId)&&original.outfit3dId!==normalized.outfit3dId)
  losses.push(Object.freeze({path,reason:'durable-3d-outfit-id-erased',
   outfit3dId:original.outfit3dId}));
 if(typeof original.name==='string'&&original.name!==normalized.name)
  losses.push(Object.freeze({path,reason:'saved-outfit-name-rewritten'}));
 return Object.freeze({path,losses:Object.freeze(losses),
  originalRefCount:refs.length,retainedRefCount:refs.filter(x=>x.retainedByNative).length,
  refs:Object.freeze(refs),dress:isDress,
  original3DID:original.outfit3dId||null,
  native3DID:normalized.outfit3dId||null,
  safeForNativeWrite:losses.length===0});
}
/**
 * Audits THE ACTUAL native normalizer through a callback; no alternate
 * app normalizer is substituted as a supposed source of truth.
 */
export function auditNativeBoardPreservation01({state,closet,normalize,lease,live}={}){
 checkLease(lease,live);
 if(typeof normalize!=='function')throw Error('BOARD01 actual native board normalizer required');
 const src=clone(state),owned=clone(closet);
 shape(src,owned);
 for(const item of owned)if(item.ownerId!==undefined&&item.ownerId!==lease.ownerId)
  throw Error('BOARD01 cross-account wardrobe record');
 const byId=new Map(owned.map(x=>[x.id,x]));
 const entries=[['current',src.current],...src.saved.map((b,i)=>['saved:'+i,b])];
 const boards=entries.map(([path,original])=>{
  const normalized=normalize(clone(original),clone(owned));
  checkLease(lease,live);
  return inspectOne(path,original,normalized,byId);
 });
 checkLease(lease,live);
 const losses=boards.flatMap(b=>b.losses);
 const orphaned=losses.filter(x=>x.reason==='deleted-or-missing-saved-piece').length;
 return Object.freeze({ownerId:lease.ownerId,generation:lease.generation,
  boardCount:boards.length,savedCount:src.saved.length,
  issues:Object.freeze(losses),missingReferences:orphaned,
  erasedDressLayers:losses.filter(x=>x.reason==='dress-outerwear-erased').length,
  erased3DIDs:losses.filter(x=>x.reason==='durable-3d-outfit-id-erased').length,
  boards:Object.freeze(boards),
  verdict:losses.length?'REVIEW_DO_NOT_OVERWRITE':'SAFE_READ_ONLY_COMPARISON',
  safeForNativeWrite:losses.length===0,
  ownerPrivate:true,originalSourceIntact:true,releaseAuthorized:false});
}
/**
 * Research-side lease bound to the exact original state. All returned
 * snapshots are copies and no writes are exposed. A caller wanting to save
 * needs an independent verified atomic CAS and explicit user confirmation.
 */
export function createBoardPreserveReview01({auth,readState,readItems,nativeNormalize}={}){
 if(!auth?.ready||typeof auth.getSessionGeneration!=='function'||
  typeof readState!=='function'||typeof readItems!=='function'||
  typeof nativeNormalize!=='function')
  throw Error('BOARD01 existing owner/legacy/donor contracts required');
 let review=null,source=null,owner=null,generation=null;
 const live=()=>({authenticated:!!auth.user?.id,
  ownerId:auth.user?.id,generation:auth.getSessionGeneration()});
 const clear=()=>{review=null;source=null;owner=null;generation=null;};
 async function refresh(){
  clear();
  await auth.ready;
  const lease=live();checkLease(lease,live);
  const src=await readState(lease);
  checkLease(lease,live);
  const owned=await readItems(lease);
  checkLease(lease,live);
  const tested=auditNativeBoardPreservation01({state:src,closet:owned,
   normalize:nativeNormalize,lease,live});
  checkLease(lease,live);
  owner=lease.ownerId;generation=lease.generation;
  source=clone(src);review=tested;
  return tested;
 }
 function current(){
  if(!review)throw Error('BOARD01 load current owner review first');
  checkLease({authenticated:true,ownerId:owner,generation},live);
  return review;
 }
 function originalReadOnly(){
  current();
  return clone(source);
 }
 function assertSafeToConvert(){
  const r=current();
  if(!r.safeForNativeWrite)
   throw Error('BOARD01 refuses destructive native outfit conversion; manual review required');
  // Safety approval is for comparison ONLY. This is NOT database permission.
  return Object.freeze({comparisonSafe:true,ownerId:r.ownerId,
   generation:r.generation,writeAuthorized:false});
 }
 return Object.freeze({refresh,current,originalReadOnly,assertSafeToConvert,
  invalidate:clear,releaseAuthorized:false});
}
