/**
 * Assignment 244 offline integration QA. This is NOT live Auth. Source is a
 * sealed synthetic account-scoped storage mock. No source ownerId metadata
 * or always-true verifier is ever trusted as an authentication credential.
 * Never copy source image bytes into the renderer, logs or external URLs.
 */
import {decodeOriginalJpegDataUrl} from './reference/pr231/original-jpeg-source.mjs';
import {verifyCapturedOutfitBoard} from './reference/pr231/verified-captured-outfit-board.mjs';
import {createVerifiedOutfitEnvelope,classifySavedOutfitFor3D} from './reference/pr231/saved-outfit-3d-compatibility.mjs';
import {restoreVerifiedCapturedOutfitBoard} from './reference/pr231/restore-verified-captured-outfit-board.mjs';
import {bridgeSavedOutfit,prepareWardrobeFor3D} from './reference/pr232/humanoid-3d-saved-bridge.mjs';

const SLOTS=['top','bottom','shoes','layer','layer2','layer3','bag','accessory','finish'];
const VISUAL=['top','bottom','shoes','layer','layer2','layer3'];
const COLORS={black:'#25232a',white:'#eeeeea',blue:'#4368a0',navy:'#1c3159',red:'#b94350',green:'#46816b',olive:'#73774d',tan:'#aa8a65',beige:'#b5a28c',cream:'#e8d8c0',brown:'#765039',gray:'#777b80',grey:'#777b80',pink:'#ca84a7',purple:'#7b5b9e'};
const validId=x=>typeof x==='string'&&x.trim().length>0;
function suitable(slot,item){
 if(!item)return false;
 if(slot==='top')return ['Tops','Dresses'].includes(item.category);
 if(slot==='bottom')return item.category==='Bottoms';
 if(slot==='shoes')return item.category==='Shoes';
 if(slot==='layer')return item.category==='Tops'||item.category==='Outerwear'&&['Cardigan','Vest'].includes(item.itemType);
 if(slot==='layer2')return item.category==='Outerwear'&&['Jacket','Blazer','Coat','Raincoat'].includes(item.itemType);
 if(slot==='layer3')return item.category==='Outerwear'&&['Coat','Raincoat'].includes(item.itemType);
 if(slot==='bag')return item.category==='Accessories'&&item.itemType==='Bag';
 if(slot==='accessory')return item.category==='Accessories'&&['Jewelry','Sunglasses'].includes(item.itemType);
 if(slot==='finish')return item.category==='Accessories'&&['Belt','Scarf','Hat'].includes(item.itemType);
 return false;
}
function cropValid(item){
 if(item?.invalidPhoto||item?.scanFailed||item?.originalPhoto?.blank)return false;
 try{return decodeOriginalJpegDataUrl(item.image).byteLength>=80;}catch{return false;}
}
function selectedFrom(board,items){
 if(!board||!board.slots||typeof board.slots!=='object'||Array.isArray(board.slots))throw Error('Board required');
 const byId=new Map(),ids=new Set();
 for(const x of items){if(!validId(x?.id)||byId.has(x.id))throw Error('Ambiguous wardrobe ID');byId.set(x.id,x);}
 const selected=[];
 for(const [slot,id]of Object.entries(board.slots)){
  if(!SLOTS.includes(slot)||!validId(id)||ids.has(id))throw Error('Invalid or duplicate board item');
  ids.add(id);const item=byId.get(id);
  if(!suitable(slot,item)||!cropValid(item))throw Error('Missing incompatible or invalid 2D photo');
  selected.push({slot,item});
 }
 if(!selected.length)throw Error('Empty outfit');
 if(byId.get(board.slots.top)?.category==='Dresses'&&['bottom','layer','layer2','layer3'].some(s=>board.slots[s]))throw Error('Dress layer conflict');
 return selected;
}
async function selectedMetadata(selected){
 const signatures={};
 for(const {slot,item}of selected){
  // No photo text is retained: hash a source identity + styling metadata.
  const payload=JSON.stringify([item.id,item.category,item.itemType,item.color,item.colorHex,item.pattern,item.cropIdentity,item.image]);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
  signatures[slot]=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
 }
 return signatures;
}
const boardCopy=b=>({name:String(b.name||'Saved outfit').slice(0,80),slots:{...b.slots}});
const deny=reason=>({mode:'unavailable',reason});
const twoD=(b,reason)=>({mode:'2d',board:boardCopy(b),reason,originalPixelsRenderedAs3D:false});
function verifiedColor(item){
 if(typeof item.colorHex==='string'&&/^#[0-9a-f]{6}$/i.test(item.colorHex))return item.colorHex;
 return COLORS[typeof item.color==='string'?item.color.trim().toLowerCase():'']||null;
}
function normal(selected,owner){
 return selected.map(({item})=>{
  if(!validId(item.outfitSourceId)||!validId(item.originalPhoto?.image))throw Error('Captured original missing');
  const colorHex=verifiedColor(item);
  if(!colorHex)throw Error('Known color missing; 3D is unavailable');
  return {...item,accountId:owner,ownerId:owner,colorHex,
   originalPhoto:{...item.originalPhoto,id:item.outfitSourceId,ownerId:owner}};
 });
}
function rendererPalette(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid renderer colors');
 const colors={};
 for(const [slot,value]of Object.entries(input)){
  if(![...VISUAL,'dress'].includes(slot)||!Array.isArray(value)||value.length!==4||value.some(x=>!Number.isFinite(x)||x<0||x>1))
   throw Error('Invalid renderer RGBA');
  colors[slot]=[...value];
 }
 return colors;
}
/** Synthetic, sealed, owner-scoped fixture. Not a production authentication service. */
export function syntheticAuthSource(initial={}){
 const data=new Map(Object.entries(initial).map(([owner,rows])=>[owner,structuredClone(rows)]));
 let owner=null,epoch=0;
 return Object.freeze({
  signIn(id){if(!validId(id)||!data.has(id))throw Error('Synthetic owner missing');owner=id;epoch++;},
  signOut(){owner=null;epoch++;},
  update(id,rows){if(!data.has(id)||!Array.isArray(rows))throw Error('Synthetic owner store missing');data.set(id,structuredClone(rows));epoch++;},
  current(){return owner?Object.freeze({owner,epoch}):null;},
  async read(token){if(!token||token.owner!==owner||token.epoch!==epoch)throw Error('Owner session changed');return structuredClone(data.get(owner));}
 });
}
export function createOfflineIntegrationQA(source){
 if(!source||typeof source.current!=='function'||typeof source.read!=='function')throw Error('Scoped authority required');
 let pin=null;
 const still=scope=>{const now=source.current();if(!now||now.owner!==scope.owner||now.epoch!==scope.epoch)throw Error('Account switched during verification');};
 async function scoped(){
  const scope=source.current();
  if(!scope||!validId(scope.owner)||!Number.isInteger(scope.epoch))throw Error('No verified synthetic owner');
  const items=await source.read(scope);still(scope);
  if(!Array.isArray(items))throw Error('Scoped wardrobe missing');
  return {...scope,items};
 }
 async function present(board,{record=null}={}){
  let scope,selected;
  try{scope=await scoped();selected=selectedFrom(board,scope.items);}catch{return deny('Authenticated scoped wardrobe or safe 2D selection missing');}
  if(record?.verifiedSnapshot?.accountId&&record.verifiedSnapshot.accountId!==scope.owner)return deny('Foreign saved snapshot');
  if(record?.schemaVersion!==undefined&&record.schemaVersion!==1)return deny('Unsupported snapshot');
  if(record?.board&&JSON.stringify(record.board.slots)!==JSON.stringify(board.slots))return deny('Saved selection changed');
  if(record?.verifiedSnapshot){
   if(!record.qaSelectionMetadata)return twoD(board,'Legacy verified snapshot missing category/color/crop version; retain 2D');
   const now=await selectedMetadata(selected);still(scope);
   if(JSON.stringify(now)!==JSON.stringify(record.qaSelectionMetadata))return twoD(board,'Saved category, color or crop changed; retain safe 2D');
  }
  if(Object.keys(board.slots).some(x=>!VISUAL.includes(x)))return twoD(board,'Unrenderable 3D accessory, retain 2D');
  // PR #231 supports top, bottom, shoe and one layer. It silently ignores
  // jacket/coat inputs, so do not allow lossy 3D selection.
  if(board.slots.layer2||board.slots.layer3)return twoD(board,'Verified bridge lacks jacket/coat slots, retain 2D');
  try{
   const prepared=normal(selected,scope.owner);
   const keyed=new Map(prepared.map(x=>[x.id,x]));
   const ownerCheck=(item,id)=>id===scope.owner&&source.current()?.epoch===scope.epoch&&source.current()?.owner===id&&keyed.get(item.id)===item;
   const verified=record?.verifiedSnapshot
    ?await restoreVerifiedCapturedOutfitBoard(record.verifiedSnapshot,board,prepared,scope.owner,ownerCheck)
    :await verifyCapturedOutfitBoard(board,prepared,scope.owner,ownerCheck);
   still(scope);
   const accepted=prepareWardrobeFor3D(prepared,scope.owner);
   if(accepted.size!==prepared.length)throw Error('PR232 refused '+(prepared.length-accepted.size)+' sources; metadata '+prepared.map(x=>[x.ownerId===scope.owner,x.originalPhoto?.ownerId===scope.owner,x.originalPhoto?.image?.startsWith('data:image/jpeg;base64,'),x.originalPhoto?.image?.length,x.originalPhoto?.id===x.outfitSourceId,Boolean(x.cropIdentity),x.colorHex]).join(',').slice(0,72));
   const proxy=bridgeSavedOutfit(board,prepared,scope.owner);still(scope);
   if(!verified.placeholderOnly||!proxy.syntheticGeometryOnly)throw Error('Not research-only placeholder');
   // proxy.references contains originals: never serialize/publish or send to WebGL.
   const colors=rendererPalette(proxy.colors);
   if(selected.some(x=>x.slot==='top'&&x.item.category==='Dresses')&&!colors.dress)throw Error('Missing dress RGBA');
   return {mode:'3d-placeholder',board:boardCopy(board),renderer:{colors,solidColorOnly:true,unseenSurfacesEstimated:true},contracts:{pr231:true,pr232:true}};
  }catch(error){
   try{still(scope);}catch{return deny('Session changed; 2D fallback denied');}
   // Test-only sanitized failure classifier; no error object or image bytes leave this branch.
   const code=String(error?.message||'').replace(/data:[^\\s]+/g,'[image-redacted]').slice(0,110);
   return twoD(board,'3D QA blocked: '+code);
  }
 }
 async function save(board){
  const scope=await scoped(),out=await present(board);still(scope);
  if(out.mode!=='3d-placeholder')return {mode:out.mode,record:boardCopy(board),reason:out.reason};
  const prepared=normal(selectedFrom(board,scope.items),scope.owner),keyed=new Map(prepared.map(x=>[x.id,x]));
  const check=(item,id)=>id===scope.owner&&source.current()?.epoch===scope.epoch&&keyed.get(item.id)===item;
  const snapshot=await verifyCapturedOutfitBoard(board,prepared,scope.owner,check);still(scope);
  const record=createVerifiedOutfitEnvelope(boardCopy(board),snapshot);
  record.qaSelectionMetadata=await selectedMetadata(selectedFrom(board,scope.items));still(scope);
  return {mode:'3d-placeholder',record};
 }
 async function restore(record){
  const classification=classifySavedOutfitFor3D(record);
  if(classification.mode==='legacy-2d'){
   const scope=await scoped();
   try{selectedFrom(classification.board,scope.items);still(scope);return twoD(classification.board,'Legacy saved outfit: original not verified for 3D');}
   catch{return deny('Unsafe legacy 2D selection');}
  }
  if(classification.mode!=='verify-3d')return deny('Unrecognized saved outfit');
  return present(classification.board,{record});
 }
 async function swap(board,slot,nextId){
  if(!VISUAL.includes(slot)||!validId(nextId))return deny('Unknown swap');
  if(pin?.slot===slot&&pin.id!==nextId)return deny('Pinned piece must remain');
  const next={...board,slots:{...board.slots,[slot]:nextId}};
  const scope=await scoped();
  try{selectedFrom(next,scope.items);}catch{return deny('Swap invalidates or moves another garment');}
  return present(next);
 }
 async function setPin(slot,id){
  const scope=await scoped();
  if(!VISUAL.includes(slot)||!scope.items.some(item=>item.id===id&&suitable(slot,item)))throw Error('Invalid pinned garment');
  pin={slot,id,owner:scope.owner};return {slot,id};
 }
 function clearPin(){pin=null;}
 return {present,save,restore,swap,setPin,clearPin};
}
