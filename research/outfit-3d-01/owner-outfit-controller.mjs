/**
 * OUTFIT-3D-01 isolated research: actual owner-scoped saved closet IDs -> durable
 * existing 'outfit-board' state -> source-honest anatomical preview decisions.
 * Zero image transformations, remote calls, new database tables or deployments.
 * INDEX-01/02 stay separate PRs; 3D68 performs original-byte SHA verification.
 */
import {indexAuthenticatedSavedCloset} from '../three-d-68/saved-closet-3d-adapter.mjs';

export const OUTFIT3D_SLOTS=Object.freeze(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const slots=new Set(OUTFIT3D_SLOTS);
const outer=new Set(['Jacket','Blazer','Vest','Cardigan','Coat','Raincoat']);
const fits=(slot,item)=>{
 if(!item)return false;
 if(slot==='top')return ['Tops','Dresses'].includes(item.category);
 if(slot==='bottom')return item.category==='Bottoms';
 if(slot==='layer')return item.category==='Tops'||item.category==='Outerwear'&&['Cardigan','Vest'].includes(item.itemType);
 if(slot==='layer2')return item.category==='Outerwear'&&['Jacket','Blazer','Cardigan','Vest'].includes(item.itemType);
 if(slot==='layer3')return item.category==='Outerwear'&&['Coat','Raincoat'].includes(item.itemType);
 if(slot==='shoes')return item.category==='Shoes';
 if(slot==='bag')return item.category==='Accessories'&&item.itemType==='Bag';
 if(slot==='accessory')return item.category==='Accessories'&&['Jewelry','Sunglasses'].includes(item.itemType);
 if(slot==='finish')return item.category==='Accessories'&&['Belt','Hat','Scarf'].includes(item.itemType);
 return false;
};
const stext=(s,n=80)=>typeof s==='string'?s.slice(0,n).trim():'';
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const sha=/^[0-9a-f]{64}$/;
const slotsFrom=src=>{
 const value={};
 if(!object(src))return value;
 for(const [k,id]of Object.entries(src)){
  if(!slots.has(k)||typeof id!=='string'||!id||id.length>160)throw Error('Unsupported outfit slot or ID');
  value[k]=id;
 }
 return value;
};
const copyBoard=board=>({
 name:stext(board?.name)||'My outfit',slots:slotsFrom(board?.slots||{}),ideas:{},
 occasion:stext(board?.occasion)||'Casual',season:stext(board?.season)||'Fall',
 audience:stext(board?.audience)||'All',size:stext(board?.size,30),
 budget:Math.max(0,Math.min(10000,Number(board?.budget)||0)),
 layerCount:Number.isInteger(board?.layerCount)?Math.max(0,Math.min(3,board.layerCount)):0,
 ...(typeof board?.outfit3dId==='string'&&board.outfit3dId?{outfit3dId:board.outfit3dId}:{})
});
function enforceSelection(board,index){
 const items=board.slots,ids=Object.values(items);
 if(new Set(ids).size!==ids.length)throw Error('One saved garment cannot be placed in two slots');
 const top=index.get(items.top),dress=top?.category==='Dresses';
 if(dress){
  if(items.bottom||items.layer)throw Error('Dress covers bottoms and shirt layers');
 }else if(!items.top&&(items.layer||items.layer2||items.layer3))
  throw Error('Add a base top before layering');
 if(items.layer3&&!items.top)throw Error('Outer coat requires a base outfit');
 for(const [slot,id]of Object.entries(items)){
  const item=index.get(id);
  if(item&&!fits(slot,item))throw Error('Corrected clothing type no longer fits '+slot+'; review the saved outfit');
 }
 return board;
}
function snapshotKey(state){
 if(!object(state))throw Error('Invalid existing outfit-board state');
 const current=copyBoard(state.current||{}),saved=Array.isArray(state.saved)?state.saved:[];
 if(saved.length>50)throw Error('Existing saved-outfit list too large');
 return JSON.stringify({current:state.current||{},saved:state.saved||[]});
}
const defaultState=()=>({current:{name:'My outfit',slots:{}},saved:[]});
export function createOwnerOutfit3DController({auth,readSavedItems,loadOutfitState,commitOutfitState,
 createId=()=>globalThis.crypto.randomUUID()}={}){
 if(!auth?.ready||typeof auth.getSessionGeneration!=='function'||
  typeof readSavedItems!=='function'||typeof loadOutfitState!=='function'||
  typeof commitOutfitState!=='function'||typeof createId!=='function')
  throw Error('Authenticated closet and existing outfit-board adapters required');
 let owner=null,generation=-1,index=new Map(),records=new Map(),review=new Map(),
  board=copyBoard({}),saved=[],fingerprint=null,loaded=false,closed=false;
 function live(){
  if(closed)throw Error('Outfit controller closed');
  const id=auth.user?.id,gen=auth.getSessionGeneration();
  if(typeof id!=='string'||!id||!Number.isSafeInteger(gen)||gen<0)
   throw Error('Signed-in owner required');
  return {authenticated:true,ownerId:id,generation:gen};
 }
 function check(){
  const now=live();
  if(!loaded||now.ownerId!==owner||now.generation!==generation)
   throw Error('Owner session changed: outfit and private photos invalidated');
  return now;
 }
 function clear(){
  owner=null;generation=-1;index=new Map();records=new Map();review=new Map();
  board=copyBoard({});saved=[];fingerprint=null;loaded=false;
 }
 function sessionNow(){return live();}
 async function refresh(){
  clear();await auth.ready;
  const lease=live(),raw=await readSavedItems(lease);
  if(!Array.isArray(raw)||raw.length>1000)throw Error('Invalid owner wardrobe snapshot');
  const newer=new Map(),privateRows=new Map(),pending=new Map();
  for(const item of raw){
   if(live().ownerId!==lease.ownerId||live().generation!==lease.generation){clear();throw Error('Owner changed during wardrobe read');}
   if(!object(item)||typeof item.id!=='string'||!item.id||privateRows.has(item.id))
    throw Error('Invalid or duplicate saved garment identity');
   if(item.ownerId!==undefined&&item.ownerId!==lease.ownerId)
    throw Error('Cross-owner garment in authenticated wardrobe snapshot');
   privateRows.set(item.id,item);
   try{
    const session={...lease};
    const snapshot={authenticated:true,ownerId:lease.ownerId,generation:lease.generation,
     origin:'authenticated-account-scoped-closet-read',items:[item]};
    const row=await indexAuthenticatedSavedCloset(snapshot,session,{getCurrentSession:live});
    const verified=row.byId.get(item.id);
    if(item.sourceSHA256!==undefined&&item.sourceSHA256!==verified.sourceSHA256)
     throw Error('Saved source SHA differs from verified original JPEG');
    if(item.originalPhoto?.sha256!==undefined&&item.originalPhoto.sha256!==verified.sourceSHA256)
     throw Error('Original-photo field SHA mismatch');
    newer.set(item.id,verified);
   }catch(e){
    const current=live();
    if(current.ownerId!==lease.ownerId||current.generation!==lease.generation){clear();throw Error('Owner changed while hashing original photos');}
    pending.set(item.id,stext(e.message,160)||'Original photograph or garment confirmation required');
   }
  }
  const state=await loadOutfitState(lease);
  const latest=live();
  if(latest.ownerId!==lease.ownerId||latest.generation!==lease.generation){clear();throw Error('Owner changed during outfit load');}
  const available=object(state)?state:defaultState();
  const key=snapshotKey(available);
  index=newer;records=privateRows;review=pending;
  saved=(available.saved||[]).map((b,i)=>({...copyBoard(b),outfit3dId:b?.outfit3dId||'legacy-'+i}));
  board=copyBoard(available.current||{});
  fingerprint=key;owner=lease.ownerId;generation=lease.generation;loaded=true;
  return Object.freeze({ownerId:owner,generation,verifiedSavedPieces:index.size,reviewItems:review.size,savedOutfits:saved.length});
 }
 function plan(){
  check();
  const fields=[],missing=[],unsupported=[];
  for(const [slot,id]of Object.entries(board.slots)){
   const item=index.get(id),stored=records.get(id);
   if(!stored){missing.push(Object.freeze({slot,itemId:id,reason:'deleted-saved-garment'}));continue;}
   if(!item){unsupported.push(Object.freeze({slot,itemId:id,reason:review.get(id)||'Requires category or source review'}));continue;}
   if(!fits(slot,item)){unsupported.push(Object.freeze({slot,itemId:id,reason:'corrected-type-does-not-fit-slot'}));continue;}
   fields.push(Object.freeze({slot,itemId:id,category:item.category,itemType:item.itemType,
    originalSHA256:item.sourceSHA256,color:item.color,
    preview:'original-photo',meshApproved:false,originalOutfitGroup:item.originalOutfitGroup}));
  }
  const top=fields.find(x=>x.slot==='top');
  const dress=top?.category==='Dresses';
  const conflict=dress&&['bottom','layer'].some(s=>board.slots[s]);
  return Object.freeze({
   ownerId:owner,generation,name:board.name,
   selected:Object.freeze(fields),missing:Object.freeze(missing),
   needsReview:Object.freeze(unsupported),dress:!!dress,
   conflict:!!conflict,slots:Object.freeze({...board.slots}),
   saveReady:fields.length>0&&!missing.length&&!unsupported.length&&!conflict,
   releaseAuthorized:false,originalImagesNeverRewritten:true
  });
 }
 function available(slot){
  check();if(!slots.has(slot))throw Error('Unknown outfit slot');
  return Object.freeze([...index.values()].filter(x=>fits(slot,x)).map(x=>Object.freeze({
   id:x.id,category:x.category,itemType:x.itemType,color:x.color,sourceSHA256:x.sourceSHA256
  })));
 }
 function setSlot(slot,itemId){
  check();if(!slots.has(slot))throw Error('Unsupported outfit slot');
  if(itemId!==null&&itemId!==undefined&&itemId!==''){
   const item=index.get(itemId);
   if(!item||!fits(slot,item))throw Error('Cannot dress unsupported or wrong-category garment');
  }
  const next=copyBoard(board);
  for(const [k,id]of Object.entries(next.slots))if(id===itemId&&k!==slot)delete next.slots[k];
  if(itemId)next.slots[slot]=itemId;
  else delete next.slots[slot];
  const top=index.get(next.slots.top),dress=top?.category==='Dresses';
  if(slot==='top'){
   if(dress){delete next.slots.bottom;delete next.slots.layer;}
  }else if(slot==='bottom'||slot==='layer'){
   if(dress)throw Error('Dress covers bottoms and additional shirt layer');
  }
  // A fresh non-dress base top never silently adds back old bottoms.
  enforceSelection(next,index);
  board=next;return plan();
 }
 function swap(slot,itemId){return setSlot(slot,itemId);}
 function setName(name){
  check();const next=stext(name);if(!next)throw Error('Outfit name required');board={...board,name:next};return plan();
 }
 function clearSelection(){
  check();board=copyBoard({name:'My outfit',slots:{}});return plan();
 }
 function listSaved(){
  check();return Object.freeze(saved.map(x=>Object.freeze({
   id:x.outfit3dId,name:x.name,selectedCount:Object.keys(x.slots).length
  })));
 }
 function openSaved(savedId){
  check();const target=saved.find(x=>x.outfit3dId===savedId);
  if(!target)throw Error('Saved outfit not found in this owner account');
  // Do NOT normalize against the current wardrobe here: deleted IDs must survive
  // as visible missing-piece warnings, not silently become other garments.
  board=copyBoard(target);return plan();
 }
 async function save({updateId=null}={}){
  const lease=check(),p=plan();
  if(!p.saveReady)throw Error('Review missing, uncertain or conflicting pieces before saving');
  if(saved.length>=50&&!updateId)throw Error('Maximum 50 saved outfits');
  let nextId=updateId||board.outfit3dId;
  if(nextId&&!saved.some(x=>x.outfit3dId===nextId))
   throw Error('Cannot overwrite a saved outfit from another account or stale snapshot');
  if(!nextId){nextId='outfit3d-'+createId();if(saved.some(x=>x.outfit3dId===nextId))throw Error('Duplicate saved outfit ID');}
  const nextBoard={...copyBoard(board),outfit3dId:nextId};
  const nextSaved=updateId||saved.some(x=>x.outfit3dId===nextId)?
   saved.map(x=>x.outfit3dId===nextId?nextBoard:x):[...saved,nextBoard];
  const state={current:nextBoard,saved:nextSaved};
  await commitOutfitState({lease,expectedFingerprint:fingerprint,state,operation:'save'});
  const after=live();
  if(after.ownerId!==lease.ownerId||after.generation!==lease.generation){clear();throw Error('Owner changed before save acknowledgement');}
  fingerprint=snapshotKey(state);saved=nextSaved;board=nextBoard;
  return Object.freeze({saved:true,id:nextId,selectedCount:p.selected.length});
 }
 async function deleteSaved(savedId){
  const lease=check(),target=saved.find(x=>x.outfit3dId===savedId);
  if(!target)throw Error('Cannot delete an outfit outside this account');
  const nextSaved=saved.filter(x=>x.outfit3dId!==savedId);
  const nextCurrent=board.outfit3dId===savedId?copyBoard({}):copyBoard(board);
  const state={current:nextCurrent,saved:nextSaved};
  await commitOutfitState({lease,expectedFingerprint:fingerprint,state,operation:'delete'});
  const after=live();
  if(after.ownerId!==lease.ownerId||after.generation!==lease.generation){clear();throw Error('Owner changed before delete acknowledgement');}
  fingerprint=snapshotKey(state);saved=nextSaved;board=nextCurrent;
  return Object.freeze({deleted:true,id:savedId});
 }
 function labelFor(itemId){
  check();const item=records.get(itemId);
  if(!item)return 'Missing saved garment';
  return stext(item.name)||[stext(item.color,35),stext(item.itemType,55)].filter(Boolean).join(' ')||'Saved garment';
 }
 function photoFor(itemId){
  check();const record=records.get(itemId);
  if(!record)return null;
  const original=record.originalPhoto?.image||record.image;
  if(typeof original!=='string'||!original.startsWith('data:image/jpeg;base64,'))return null;
  const display=typeof record.image==='string'&&record.image.startsWith('data:image/')?record.image:original;
  return Object.freeze({display,original,sourceKind:record.originalPhoto?.image?'outfit-source':'original-single'});
 }
 function sourceIndex(){
  check();return Object.freeze({ownerId:owner,generation,byId:new Map(index),releaseAuthorized:false});
 }
 return Object.freeze({refresh,plan,available,swap,setSlot,setName,clearSelection,listSaved,openSaved,
  save,deleteSaved,labelFor,photoFor,sourceIndex,checkCurrentSession:check,
  invalidate:clear,close(){clear();closed=true;},researchOnly:true,productionConnected:false});
}
