/**
 * MULTI-GARMENT-CAPTURE-01 — owner-scoped, batch-atomic confirmed clothing.
 * Uses the real existing 'items' IDB store and v4 backup-compatible records.
 * No independent wardrobe, cloud endpoint, inference service or 3D assertion.
 */
import {verifyStoredCanonical} from '../capture-proof-01/source-proof.mjs';
export const COMMIT43_TYPES=Object.freeze({
 Tops:Object.freeze(['T-shirt','Blouse','Button-down shirt','Polo','Tank top','Sweater','Sweatshirt','Hoodie','Tunic','Other']),
 Bottoms:Object.freeze(['Jeans','Trousers','Leggings','Shorts','Skirt','Joggers','Other']),
 Dresses:Object.freeze(['Casual dress','Shirt dress','Sweater dress','Formal dress','Jumpsuit','Romper','Other']),
 Outerwear:Object.freeze(['Jacket','Coat','Blazer','Cardigan','Vest','Raincoat','Other']),
 Shoes:Object.freeze(['Sneakers','Flats','Heels','Sandals','Ankle boots','Tall boots','Loafers','Other'])
});
export function validReviewTaxonomy43(category,itemType){
 return Object.hasOwn(COMMIT43_TYPES,category)&&
  typeof itemType==='string'&&COMMIT43_TYPES[category].includes(itemType);
}
export function reviewedColor43(color){
 if(typeof color!=='string')return null;
 const clean=color.trim();
 return clean&&clean.length<=120&&clean.toLowerCase()!=='unknown'?clean:null;
}

export const SHA24=/^[a-f0-9]{64}$/;
const JPEG24=/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;
function fail(text){throw Error('MULTI24 '+text);}
export function validCrop24(rect){
 return rect&&['x','y','width','height'].every(k=>Number.isFinite(rect[k]))&&
  rect.x>=0&&rect.y>=0&&rect.width>.025&&rect.height>.025&&
  rect.x+rect.width<=1.000001&&rect.y+rect.height<=1.000001;
}
export function pieceKey24(sha,instance){
 if(!SHA24.test(sha)||typeof instance!=='string'||!/^((seg-[a-z0-9-]+)|(manual-[0-9-]+))$/.test(instance)||instance.length>140)
  fail('invalid original/piece identity');
 return sha+'/'+instance;
}
export function duplicatePieceKeys24(saved,selected){
 const known=new Set((saved||[]).map(x=>x.sourcePieceKey).filter(Boolean));
 return selected.filter(x=>known.has(x.sourcePieceKey)).map(x=>x.sourcePieceKey);
}
// MODEL45: the source-verified AI observation remains a bounded suggestion,
// never authoritative human category/type/color fields or arbitrary worker data.
const suggestionColors45=new Set(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor']);
function safeSuggestion45(input,sourcePieceKey,cropBounds){
 if(!input||input.source!=='local-fashionclip')return null;
 const safe=raw=>{
  const category=Object.hasOwn(COMMIT43_TYPES,raw?.category)?raw.category:null;
  return {
   category,
   itemType:category&&validReviewTaxonomy43(category,raw?.itemType)?raw.itemType:null,
   color:suggestionColors45.has(raw?.color)?raw.color:null
  };
 };
 const current=safe(input),originalContext=safe(input.originalContext);
 return {
  source:'local-fashionclip',
  ...current,originalContext,
  colorSource:current.color&&['recognition','mask-pixel-estimate','crop-pixel-estimate'].includes(input.colorSource)?input.colorSource:null,
  status:current.itemType?'subtype-suggested':current.category?'category-only':'abstained',
  sourcePieceKey,cropBounds:{...cropBounds}
 };
}
export function verifiedRecord24({proof,ownerId,piece,now=new Date().toISOString()}){
 if(!proof?.sourceHashVerified||!SHA24.test(proof.sourceSHA256)||proof.originalPhoto?.sha256!==proof.sourceSHA256||
    proof.image!==proof.originalPhoto?.image||!JPEG24.test(proof.image))fail('original not authenticated');
 if(!ownerId||typeof ownerId!=='string')fail('missing owner');
 // CATEGORY43: enforce the CURRENT saved-closet schema at the last atomic
 // boundary, not solely in a potentially stale UI or model-result adapter.
 // A mismatched type would otherwise save successfully but normalize to
 // Unknown when My Closet reopens it, silently losing the accepted detail.
 const reviewedColor=reviewedColor43(piece?.color);
 if(!piece?.confirmed||!validReviewTaxonomy43(piece.category,piece.itemType)||
    !reviewedColor||!validCrop24(piece.cropBounds)||
    !JPEG24.test(piece.image)||typeof piece.id!=='string'||!piece.id||
    typeof piece.instanceKey!=='string'||!piece.instanceKey)
  fail('unreviewed or invalid piece');
 if(piece.manual&&!piece.cropReviewed)fail('manually detected piece needs crop review');
 const sourcePieceKey=pieceKey24(proof.sourceSHA256,piece.instanceKey);
 return {
  id:piece.id,ownerId,sourcePieceKey,
  outfitSourceId:proof.sourceSHA256,sourcePhotoId:proof.sourceSHA256,
  originalPhoto:structuredClone(proof.originalPhoto),sourceSHA256:proof.sourceSHA256,
  sourceHashVerified:true,singleGarmentVerified:false,
  recognitionFromOriginal:false,sourceExtraction:'visible-only',derivedAssetType:'reviewed-jpeg-crop',
  extractionReview:'human-confirmed',sourceCropReviewed:true,
  extractionBounds:{...piece.cropBounds},cropBounds:{...piece.cropBounds},
  image:piece.image,recognitionPhoto:{image:piece.image},
  name:String(piece.name||[piece.color,piece.itemType||piece.category].join(' ')).trim().slice(0,120),
  category:piece.category,itemType:piece.itemType,color:reviewedColor,
  ...(safeSuggestion45(piece.recognitionSuggestion42,sourcePieceKey,piece.cropBounds)?
   {recognitionSuggestion42:safeSuggestion45(piece.recognitionSuggestion42,sourcePieceKey,piece.cropBounds)}:{}),
  colorSource:'user',userAdjusted:true,requiresOwnershipConfirmation:false,
  localAnalyzed:true,localStatus:'Confirmed and saved from original photo',
  segmentHint:piece.hint||null,maskApplied:!!piece.maskApplied,
  sourceSegmentationConfidence:piece.hint?.confidence??null,
  possibleDuplicate:false,threeDReady:false,photoOnly:true,
  savedAt:now,indexedAt:now,
  notes:'',seasons:[],brand:'',size:'',material:'',occasion:''
 };
}
/** One readwrite IDB transaction, including read-time duplicate/CAS checks. */
export async function atomicSaveGarments24({db,proof,pieces,ownerId,currentOwner,now}){
 if(!db||db.name!=='closet-current-user-'+ownerId||currentOwner()!==ownerId)
  fail('owner database or session mismatch');
 if(!Array.isArray(pieces)||!pieces.length||pieces.length>24)fail('select 1–24 garments');
 if(!await verifyStoredCanonical(proof))fail('canonical JPEG SHA-256 mismatch');
 if(currentOwner()!==ownerId||db.name!=='closet-current-user-'+ownerId)
  fail('session changed during SHA-256');
 const records=pieces.map(piece=>verifiedRecord24({proof,ownerId,piece,now}));
 if(new Set(records.map(x=>x.id)).size!==records.length||
    new Set(records.map(x=>x.sourcePieceKey)).size!==records.length)
  fail('duplicate records inside one batch');
 return new Promise((resolve,reject)=>{
  let completed=false;
  const transaction=db.transaction('items','readwrite'),store=transaction.objectStore('items');
  const lookup=store.getAll();
  lookup.onerror=()=>{try{transaction.abort();}catch{}};
  lookup.onsuccess=()=>{
   try{
    if(currentOwner()!==ownerId||db.name!=='closet-current-user-'+ownerId)
     fail('session changed before atomic save');
    const existing=lookup.result;
    if(existing.some(row=>row.ownerId&&row.ownerId!==ownerId))fail('foreign owner record');
    const existingIds=new Set(existing.map(x=>x.id));
    if(records.some(x=>existingIds.has(x.id))||duplicatePieceKeys24(existing,records).length)
     fail('duplicate original garment detected; no pieces saved');
    for(const record of records)store.add(record);
   }catch(error){try{transaction.abort();}catch{};reject(error);}
  };
  transaction.oncomplete=()=>{
   completed=true;
   if(currentOwner()!==ownerId)reject(Error('MULTI24 session changed after commit; owner A records remain private'));
   else resolve(records);
  };
  transaction.onerror=()=>{if(!completed)reject(transaction.error||Error('MULTI24 IndexedDB storage error'));};
  transaction.onabort=()=>{if(!completed)reject(transaction.error||Error('MULTI24 canceled atomic save'));};
 });
}
