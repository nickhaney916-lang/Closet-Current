/** 3D-68: actual Closet Current saved-item schema -> index-first 3D outfit
 * metadata bridge. In-memory read-only; original JPEG and masks NEVER exposed
 * in the plan, logged, uploaded, copied to public gallery or used as fake mesh.
 * The caller MUST provide an already authenticated, account-scoped DB snapshot;
 * this does NOT replace server RLS or authenticate a caller itself.
 */
import {validateIndexedWardrobeItem} from '../three-d-67/indexed-closet-3d-contract.mjs';

export const BOARD_SLOT_CATEGORY=Object.freeze({
 top:Object.freeze(['Tops','Dresses']),
 bottom:Object.freeze(['Bottoms']),
 layer:Object.freeze(['Tops','Outerwear']),
 layer2:Object.freeze(['Outerwear']),
 layer3:Object.freeze(['Outerwear']),
 shoes:Object.freeze(['Shoes']),
 bag:Object.freeze(['Accessories']),
 accessory:Object.freeze(['Accessories']),
 finish:Object.freeze(['Accessories'])
});
const accessoryTypes=Object.freeze({
 bag:Object.freeze(['Bag']),
 accessory:Object.freeze(['Jewelry','Sunglasses']),
 finish:Object.freeze(['Belt','Scarf','Hat'])
});
const slot3D=Object.freeze({top:'shirt-or-dress',bottom:'pants',layer:'layer-1',layer2:'layer-2',layer3:'layer-3',
 shoes:'shoes',bag:'accessory-bag',accessory:'accessory-small',finish:'accessory-finish'});
const imagePrefix='data:image/jpeg;base64,';
const MAX_JPEG_BASE64=12_000_000;

function requireSession(snapshot,session){
 if(!session?.authenticated||!snapshot?.authenticated||
    typeof session.ownerId!=='string'||!session.ownerId||
    snapshot.ownerId!==session.ownerId||
    !Number.isSafeInteger(session.generation)||session.generation<0||
    snapshot.generation!==session.generation||
    snapshot.origin!=='authenticated-account-scoped-closet-read')
  throw Error('Fresh, authenticated and owner-scoped closet snapshot required');
}
function originalPhotoBytes(dataUrl){
 if(typeof dataUrl!=='string'||!dataUrl.startsWith(imagePrefix)||
    dataUrl.length<imagePrefix.length+80||dataUrl.length>MAX_JPEG_BASE64||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(dataUrl.slice(imagePrefix.length)))
  throw Error('Original stored JPEG unavailable or invalid; no fabricated 3D garment permitted');
 const raw=dataUrl.slice(imagePrefix.length);
 const decoded=atob(raw);
 const bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0));
 if(bytes.length<60||bytes[0]!==255||bytes[1]!==216||
    bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  throw Error('Stored original JPEG signature invalid');
 return bytes;
}
async function localSHA256(bytes){
 if(!globalThis.crypto?.subtle)throw Error('On-device SHA256 unavailable; original-photo identity is mandatory');
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const validText=(s,max=160)=>typeof s==='string'&&s.length>0&&s.length<=max;
function confirmedFromSaved(item){
 // Actual saved app fields: userAdjusted, confirmedDetails, colorSource,
 // category, itemType, recognitionPhoto, originalPhoto, image.
 // Auto recognition ('indexedAt' alone) is NOT a user confirmation.
 const confirmed=item?.confirmedDetails;
 const detailsConfirmed=confirmed?.category===item.category&&confirmed?.itemType===item.itemType;
 // The actual saveIndexed() path in public/app.js only stores a
 // non-user-adjusted specific-type item after the local multiple-view
 // classifier returns result.strong, source masks agree, and duplicates and
 // ownership questions are absent. It stamps indexedAt, localAnalyzed and
 // indexingLevel='specific-type'. Do not infer strong from indexedAt alone:
 // category-only guesses and imported records must still be reviewed.
 const strongLocallyIndexed=item?.userAdjusted!==true&&
   item?.localAnalyzed===true&&item?.indexingLevel==='specific-type'&&
   validText(item?.indexedAt,64)&&item?.scanFailed!==true&&
   item?.saveFailed!==true;
 const classified=Boolean(item?.userAdjusted===true||detailsConfirmed||strongLocallyIndexed);
 return classified&&item.requiresOwnershipConfirmation!==true&&
   item.possibleDuplicate!==true&&item.colorSource!=='photo-estimate';
}
export async function indexAuthenticatedSavedCloset(snapshot,session,{getCurrentSession}={}){
 requireSession(snapshot,session);
 if(!Array.isArray(snapshot.items)||snapshot.items.length>1000)throw Error('Invalid indexed closet snapshot size');
 if(typeof getCurrentSession!=='function')throw Error('Session freshness checker required');
 const byId=new Map(),byOriginalGroup=new Map();
 for(const item of snapshot.items){
  requireSession(snapshot,getCurrentSession());
  if(!item||!validText(item.id)||byId.has(item.id))throw Error('Duplicate or missing stored garment ID');
  if(item.ownerId&&item.ownerId!==session.ownerId)throw Error('Stored garment account mismatch');
  if(!confirmedFromSaved(item))throw Error('Saved clothing category, subtype or color needs actual user confirmation: '+item.id);
  const original=(item.originalPhoto?.image||item.image);
  const bytes=originalPhotoBytes(original);
  const hash=await localSHA256(bytes);
  requireSession(snapshot,getCurrentSession());
  const group=item.outfitSourceId||item.id;
  if(!validText(group))throw Error('Invalid original outfit photo group');
  if(item.originalPhoto?.image&&byOriginalGroup.has(group)&&byOriginalGroup.get(group)!==hash)
   throw Error('Items assigned to the same original outfit photograph have conflicting original bytes');
  if(item.originalPhoto?.image)byOriginalGroup.set(group,hash);
  // Distinct crop products from the SAME full outfit photo are distinct
  // closet items and valid outfit choices, even with the same source SHA.
  // Item id is the unique segment/source instance; group is shared.
  const record=validateIndexedWardrobeItem({
   id:item.id,ownerId:session.ownerId,sourceId:item.id,
   sourceSHA256:hash,category:item.category,itemType:item.itemType,
   color:item.color,recognitionStatus:'confirmed',ownerReviewed:true,
   sourcePhotoOriginal:true,
   // A saved image, even with genuine provenance, is NEVER a certified
   // reconstructible 3D mesh without a separate source/fit/pose gate.
   threeDimensionalMeshApproved:false,garmentMeshVerified:false
  },{ownerId:session.ownerId});
  byId.set(record.id,Object.freeze({...record,originalOutfitGroup:group,
   sourceFrom:item.originalPhoto?.image?'original-outfit-photo':'stored-single-garment-photo',
   categoryFrom:item.userAdjusted===true||item.confirmedDetails?.category===item.category&&item.confirmedDetails?.itemType===item.itemType?'user-reviewed-existing-closet':'strong-multicheck-auto-indexed',
   photographic3DReconstructionApproved:false}));
 }
 return Object.freeze({ownerId:session.ownerId,generation:session.generation,
  byId,validatedItems:byId.size,originalPhotosHashedLocally:true,
  originalJPEGBytesDiscarded:true,
  externalUpload:false,releaseAuthorized:false,
  source:'authenticated-existing-closet-records',recognitionCorrectnessHumanReviewed:true});
}
function slotAllowed(slot,item){
 if(!BOARD_SLOT_CATEGORY[slot]?.includes(item.category))return false;
 if(accessoryTypes[slot]&&!accessoryTypes[slot].includes(item.itemType))return false;
 return true;
}
export function planIndexedBoardToAnatomical3D(board,indexed){
 if(!indexed?.byId||!(indexed.byId instanceof Map)||!indexed.ownerId||indexed.releaseAuthorized!==false)
  throw Error('Authenticated indexed closet evidence required');
 if(!board||typeof board!=='object'||Array.isArray(board)||!board.slots||
    typeof board.slots!=='object'||Array.isArray(board.slots))
  throw Error('Existing saved outfit-board slots required');
 const plan={},used=new Set();
 const requests=Object.entries(board.slots).filter(([,id])=>id!==null&&id!==undefined&&id!=='');
 if(requests.length>9)throw Error('Outfit board exceeds supported physical slots');
 for(const [slot,id] of requests){
  if(!Object.hasOwn(BOARD_SLOT_CATEGORY,slot)||!validText(id))
   throw Error('Unrecognized saved outfit slot or invalid item id');
  const item=indexed.byId.get(id);
  if(!item||item.ownerId!==indexed.ownerId)throw Error('Saved outfit contains an unauthorized or unconfirmed item');
  if(used.has(id))throw Error('One original garment cannot occupy two outfit slots');
  if(!slotAllowed(slot,item))throw Error('Indexed category or subtype incompatible with saved outfit slot '+slot);
  used.add(id);
  plan[slot]=Object.freeze({itemId:item.id,originalSourceId:item.sourceId,
   sourceSHA256:item.sourceSHA256,originalOutfitGroup:item.originalOutfitGroup,
   category:item.category,itemType:item.itemType,color:item.color,
   anatomicalSlot:slot3D[slot],actual3DMeshReady:false,
   presentation:'original-photograph-or-existing-2d-fallback'});
 }
 if(plan.top?.category==='Dresses'&&['bottom','layer','layer2','layer3'].some(k=>plan[k]))
  throw Error('Dress is incompatible with overlapping pants/layers in current original outfit board');
 if(!plan.top&&['layer','layer2','layer3'].some(k=>plan[k]))
  throw Error('Layered outfit needs a base top; do not invent absent garment');
 const slotKeys=Object.keys(plan);
 return Object.freeze({ownerId:indexed.ownerId,generation:indexed.generation,
  selected:Object.freeze(plan),selectedCount:slotKeys.length,sourceClothingCategoryVerified:true,
  actual3DMeshReady:false,threeDClothingStatus:'requires-genuine-photo-to-mesh-verification',
  mannequinRotationIndependent:true,ownerPhotosNeverExported:true,
  sourcePhotoIdentityPreserved:true,
  fallback:'existing-2d-board-and-original-photo',releaseAuthorized:false});
}
export function previewExistingThreeSuggestions(boards,indexed){
 if(!Array.isArray(boards)||boards.length!==3)throw Error('Use exactly three existing owned-closet outfit proposals');
 const plans=boards.map(board=>planIndexedBoardToAnatomical3D(board,indexed));
 if(plans.some(p=>p.selectedCount===0))throw Error('Generated option cannot be an empty invented outfit');
 return Object.freeze(plans);
}
export function swapRealBoardGarment(board,indexed,{slot,itemId}={}){
 if(!Object.hasOwn(BOARD_SLOT_CATEGORY,slot)||!validText(itemId))throw Error('Select a valid existing garment slot and closet item');
 const next={...board,slots:{...(board?.slots||{}),[slot]:itemId}};
 return planIndexedBoardToAnatomical3D(next,indexed);
}
