import {buildAlpha2DSelections} from './family-alpha-2d-outfit-bridge.mjs';
import {planPhotoLayers} from './family-alpha-2d-layer-plan.mjs';
import {renderVerifiedOutfit2D} from './family-alpha-2d-render-outfit.mjs';

/**
 * Research-only adapter for actual Closet Current {slots:{top,bottom,...}} boards,
 * local items, and caller-approved source-bound transparent image layers.
 *
 * SECURITY BOUNDARY: Matching identifiers, hashes and IndexedDB names do NOT
 * prove a Supabase RLS decision, live Auth, or image ownership. The caller must
 * first obtain the correct private IndexedDB/backup snapshot via authenticated,
 * authorized access and must verify decoded image -> mask provenance upstream.
 * This module neither fetches nor persists any photos.
 */
const VISUAL_SLOTS=['top','bottom','shoes','layer','layer2','layer3'];
const AUTH_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCE_GROUP=/^[a-zA-Z0-9:_-]{1,160}$/;
const bytesMax=8_000_000;
const activeRenders=new WeakMap();

function requireContext(getContext){
 if(typeof getContext!=='function')throw new Error('Live account context required');
 const value=getContext();
 if(!value||!AUTH_ID.test(value.authenticatedUserId||'')||
    value.currentUserId!==value.authenticatedUserId||
    value.cloudOwnerId!==value.authenticatedUserId||
    value.indexedDbName!=='closet-current-user-'+value.authenticatedUserId||
    !Number.isSafeInteger(value.sessionGeneration)||value.sessionGeneration<0)
   throw new Error('Unverified or changing account scope');
 return {ownerId:value.authenticatedUserId,sessionGeneration:value.sessionGeneration};
}
function assertSameContext(getContext,initial){
 const current=requireContext(getContext);
 if(current.ownerId!==initial.ownerId||current.sessionGeneration!==initial.sessionGeneration)
  throw new Error('Account changed during wardrobe verification');
}
function decodeRetainedJPEG(value){
 if(typeof value!=='string'||value.length>11_000_000||
   !/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
  throw new Error('Invalid app-retained original photo');
 const encoded=value.slice('data:image/jpeg;base64,'.length);
 let binary;
 try{binary=atob(encoded);}catch{throw new Error('Corrupted original photo encoding');}
 if(binary.length<64||binary.length>bytesMax||binary.charCodeAt(0)!==255||
  binary.charCodeAt(1)!==216||binary.charCodeAt(binary.length-2)!==255||
  binary.charCodeAt(binary.length-1)!==217)
  throw new Error('Invalid retained JPEG boundaries');
 return Uint8Array.from(binary,x=>x.charCodeAt(0));
}
export async function fingerprintAlphaRetainedOriginal(image,cryptoProvider=globalThis.crypto){
 const bytes=decodeRetainedJPEG(image);
 if(!cryptoProvider?.subtle?.digest)throw new Error('SHA-256 unavailable');
 const hash=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes));
 return 'sha256:'+Array.from(hash,v=>v.toString(16).padStart(2,'0')).join('');
}
/** Local provenance label; intentionally not a proof of Auth or RLS ownership. */
export function identityForSavedGarment(item){
 if(!item||typeof item.id!=='string'||!SOURCE_GROUP.test(item.id)||
  item.outfitSourceId!==undefined&&(typeof item.outfitSourceId!=='string'||!SOURCE_GROUP.test(item.outfitSourceId)))
  throw new Error('Invalid saved garment/source identity');
 return 'saved:'+item.id+(item.outfitSourceId?':'+item.outfitSourceId:'');
}
function byItemId(items){
 if(!Array.isArray(items)||items.length>1000)throw new Error('Invalid scoped wardrobe snapshot');
 const indexed=new Map();
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id||indexed.has(item.id))
   throw new Error('Duplicate or invalid wardrobe item');
  indexed.set(item.id,item);
 }
 return indexed;
}
function categoryForSlot(slot,category){
 return slot==='top'?(category==='Dresses'||category==='Tops'):
  slot==='bottom'?category==='Bottoms':
  slot==='shoes'?category==='Shoes':
  slot==='layer'?(category==='Tops'||category==='Outerwear'):
  category==='Outerwear';
}
function readSelections(board,indexed){
 if(!board||!board.slots||typeof board.slots!=='object'||Array.isArray(board.slots))
  throw new Error('Actual saved outfit board.slots required');
 if(Object.hasOwn(board.slots,'dress'))throw new Error('Use real saved-board top slot for dresses');
 const owned=[],used=new Set();
 for(const slot of VISUAL_SLOTS){
  const id=board.slots[slot];
  if(id===undefined||id===null||id==='')continue;
  if(typeof id!=='string'||!indexed.has(id)||used.has(id))
   throw new Error('Missing, foreign, or duplicate saved garment');
  const item=indexed.get(id);
  if(!categoryForSlot(slot,item.category))throw new Error('Saved garment category does not match '+slot);
  used.add(id);
  owned.push({slot:slot==='top'&&item.category==='Dresses'?'dress':slot,item});
 }
 if(!owned.length)throw new Error('Outfit contains no saved garments');
 if(owned.some(x=>x.slot==='dress')&&owned.some(x=>['bottom','layer','layer2','layer3'].includes(x.slot)))
  throw new Error('Dress cannot be combined with bottoms or jackets');
 return owned;
}

/**
 * Rehashes original app-retained JPEG bytes on every call, even when cropped
 * preview bytes remain identical. Rejects stale/mismatched transparent masks.
 * The caller MUST validate real authenticated ownership and derived mask origin.
 */
export async function prepareSavedBoard2D({
 board,items,presentations,getContext,cryptoProvider=globalThis.crypto
}={}){
 const initial=requireContext(getContext);
 const selections=readSelections(board,byItemId(items));
 if(!presentations||typeof presentations!=='object'||Array.isArray(presentations))
  throw new Error('Owner-scoped transparent garment presentations required');
 const refs={};
 const images=Object.create(null);
 const sourceHashes=Object.create(null);
 for(const {slot,item} of selections){
  assertSameContext(getContext,initial);
  const source=item.originalPhoto===undefined?item.image:item.originalPhoto?.image;
  if(typeof item.image!=='string')throw new Error('Missing saved clothing photo');
  // Indexing is performed on original full photo when present; do not infer
  // that cropping, masked pixels or JPEG marker checks establish correct label.
  const sourceVersion=await fingerprintAlphaRetainedOriginal(source,cryptoProvider);
  assertSameContext(getContext,initial);
  const sourceIdentity=identityForSavedGarment(item);
  if(!Object.hasOwn(presentations,item.id))throw new Error('Unprepared clothing photo for '+slot);
  const prepared=presentations[item.id];
  if(!prepared||prepared.itemId!==item.id||prepared.ownerId!==initial.ownerId||
   prepared.sourceIdentity!==sourceIdentity||prepared.sourceVersion!==sourceVersion||
   prepared.approved!==true||!prepared.image)
    throw new Error('Unapproved, foreign, or stale garment presentation for '+slot);
  refs[slot]=item.id;
  sourceHashes[slot]=sourceVersion;
  images[item.id]=prepared.image;
 }
 assertSameContext(getContext,initial);
 const verifiedGarments=Object.create(null);
 for(const {item} of selections)verifiedGarments[item.id]={
  itemId:item.id,sourceIdentity:identityForSavedGarment(item),
  sourceVersion:sourceHashes[selections.find(x=>x.item.id===item.id).slot]
 };
 const outfit=Object.freeze({...refs});
 const layerRefs=planPhotoLayers(buildAlpha2DSelections(outfit,verifiedGarments));
 return Object.freeze({
  ownerId:initial.ownerId,sessionGeneration:initial.sessionGeneration,
  outfit,layerRefs,verifiedGarments,images,sourceHashes,
  appRetainedOriginalOnly:true,upstreamAuthorizationRequired:true,
  realImageMaskVerificationRequired:true
 });
}
/**
 * Invalidate a pending saved-board render when a higher-level authenticated
 * request starts. The old SHA digest may still finish, but it cannot place
 * the previous account's garment pixels back into this avatar container.
 *
 * This is intentionally synchronous and scoped to this one avatar surface.
 */
export function invalidateSavedBoard2D(container){
 if(!container||typeof container.replaceChildren!=='function')
  throw new TypeError('Container required');
 activeRenders.set(container,(activeRenders.get(container)||0)+1);
 container.replaceChildren();
}

/** Atomic fail-closed avatar rendering, with a new render superseding stale calls. */
export async function renderSavedBoard2D(container,options={}){
 if(!container||typeof container.replaceChildren!=='function')throw new TypeError('Container required');
 invalidateSavedBoard2D(container);
 const request=activeRenders.get(container);
 try{
  const prepared=await prepareSavedBoard2D(options);
  if(activeRenders.get(container)!==request)throw new Error('Superseded avatar request');
  assertSameContext(options.getContext,{ownerId:prepared.ownerId,sessionGeneration:prepared.sessionGeneration});
  const count=renderVerifiedOutfit2D(container,prepared.outfit,prepared.verifiedGarments,prepared.images);
  return Object.freeze({renderedLayers:count,ownerId:prepared.ownerId,sourceHashes:prepared.sourceHashes});
 }catch(error){
  // An older rejected request may not erase a newer current account's display.
  if(activeRenders.get(container)===request)container.replaceChildren();
  throw error;
 }
}
