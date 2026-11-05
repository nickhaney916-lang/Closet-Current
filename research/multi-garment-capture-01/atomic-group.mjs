/**
 * MULTI-GARMENT-CAPTURE-01 — owner-scoped, batch-atomic confirmed clothing.
 * Uses the real existing 'items' IDB store and v4 backup-compatible records.
 * No independent wardrobe, cloud endpoint, inference service or 3D assertion.
 */
import {verifyStoredCanonical,jpegBytes,digestBytes} from '../capture-proof-01/source-proof.mjs';
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

/**
 * HINT50: SegFormer/local-worker metadata is untrusted evidence, never a
 * garment classification or private-user annotation. Retain ONLY bounded
 * taxonomy-mapped category/type hints, finite 0..1 mask score, and a boolean
 * clipped indicator. Never persist raw worker payloads, images, arbitrary
 * text, remote paths, owner IDs, nested data, or prototype keys.
 */
const SEGMENT50_CATEGORIES=Object.freeze(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
const SEGMENT50_TYPES=new Set(Object.values(COMMIT43_TYPES).flat());
function boundedLabels50(value,allow,max){
 if(!Array.isArray(value))return [];
 const out=[];
 for(const candidate of value.slice(0,24)){
  if(typeof candidate==='string'&&allow.has(candidate)&&!out.includes(candidate))
   out.push(candidate);
  if(out.length>=max)break;
 }
 return out;
}
const SEGMENT50_CATEGORY_SET=new Set(SEGMENT50_CATEGORIES);
export function sanitizeSegmentHint50(hint,{manual=false}={}){
 // A manually marked/contrast-only crop must never acquire an invented
 // detector score, even if a caller submits a counterfeit hint.
 if(manual||!hint||typeof hint!=='object'||Array.isArray(hint))return null;
 const categories=boundedLabels50(hint.categories,SEGMENT50_CATEGORY_SET,5);
 const types=boundedLabels50(hint.types,SEGMENT50_TYPES,6)
  .filter(type=>categories.some(category=>COMMIT43_TYPES[category].includes(type)));
 const confidence=typeof hint.confidence==='number'&&Number.isFinite(hint.confidence)&&
  hint.confidence>=0&&hint.confidence<=1?hint.confidence:null;
 const clipped=typeof hint.clipped==='boolean'?hint.clipped:null;
 if(!categories.length&&!types.length&&confidence===null&&clipped===null)return null;
 return {categories,types,clipped,confidence};
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
function safeSuggestion45(input,sourcePieceKey,cropBounds,proofSourceSHA256){
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
 // INPUT49: only retain bounded source/crop bytes hashes after the
 // all-or-nothing atomic helper has independently compared JPEG bytes.
 // This is a local input-binding receipt, NOT a signed model-weight proof.
 const receipt=input.inputBinding49;
 const inputBinding49=receipt?.hashAlgorithm==='SHA-256'&&
  receipt.sourceSHA256===proofSourceSHA256&&
  /^[0-9a-f]{64}$/.test(receipt.cropSHA256||'')&&
  typeof receipt.requestedAssetTag==='string'&&
  /^[A-Za-z0-9._-]{1,80}$/.test(receipt.requestedAssetTag)?
  {sourceSHA256:receipt.sourceSHA256,cropSHA256:receipt.cropSHA256,
   requestedAssetTag:receipt.requestedAssetTag,hashAlgorithm:'SHA-256'}:null;
 // SUBTYPE47: store the exact bounded ambiguity observed by the local model
 // adapter, not an untrusted high-confidence subtype asserted as verified.
 // The human-confirmed saved garment remains authoritative.
 const knownConfusions={
  Tops:{'T-shirt':'Sweatshirt','Sweatshirt':'T-shirt','Blouse':'Tunic','Tunic':'Blouse'},
  Shoes:{'Sneakers':'Ankle boots','Ankle boots':'Sneakers'}
 };
 const risk=input.subtypeReview47;
 const subtypeReview47=current.category&&current.itemType===null&&
  risk?.needsConfirmation===true&&
  risk.reason==='independently-observed-high-confidence-confusion'&&
  knownConfusions[current.category]?.[risk.candidate]===risk.alternative?
  {candidate:risk.candidate,alternative:risk.alternative,
   reason:'independently-observed-high-confidence-confusion',needsConfirmation:true}:null;
 // COLOR46: only a bounded palette observation, never an approved color.
 // Ignore arbitrary raw pixels, opaque masks, injected metadata or confidence.
 const pixel=input.colorReview46;
 const colorReview46=pixel?.source==='reviewed-crop-pixels'&&
  pixel.needsConfirmation===true&&suggestionColors45.has(pixel.primary)?
   {source:'reviewed-crop-pixels',primary:pixel.primary,
    secondary:suggestionColors45.has(pixel.secondary)&&pixel.secondary!==pixel.primary?pixel.secondary:null,
    needsConfirmation:true}:null;
 return {
  source:'local-fashionclip',
  ...current,originalContext,
  ...(colorReview46?{colorReview46}:{}),
  ...(subtypeReview47?{subtypeReview47}:{}),
  ...(inputBinding49?{inputBinding49}:{}),
  colorSource:current.color&&['recognition','mask-pixel-estimate','crop-pixel-estimate','reviewed-crop-pixel-estimate'].includes(input.colorSource)?input.colorSource:null,
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
 // DETECTOR57: validate crop review at the final immutable row boundary.
 // A caller bypassing native UI cannot self-assert that an automatic detector
 // crop was reviewed. Both manual and model regions require explicit review.
 if(piece.cropReviewed!==true)fail('detected piece requires explicit crop review');
 const sourcePieceKey=pieceKey24(proof.sourceSHA256,piece.instanceKey);
 const segmentHint50=sanitizeSegmentHint50(piece.hint,{manual:piece.manual===true});
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
  ...(safeSuggestion45(piece.recognitionSuggestion42,sourcePieceKey,piece.cropBounds,proof.sourceSHA256)?
   {recognitionSuggestion42:safeSuggestion45(piece.recognitionSuggestion42,sourcePieceKey,piece.cropBounds,proof.sourceSHA256)}:{}),
  colorSource:'user',userAdjusted:true,requiresOwnershipConfirmation:false,
  localAnalyzed:true,localStatus:'Confirmed and saved from original photo',
  segmentHint:segmentHint50,maskApplied:piece.maskApplied===true,
  sourceSegmentationConfidence:segmentHint50?.confidence??null,
  possibleDuplicate:false,threeDReady:false,photoOnly:true,
  savedAt:now,indexedAt:now,
  notes:'',seasons:[],brand:'',size:'',material:'',occasion:''
 };
}
/**
 * INPUT49: snapshot and re-verify any optional model receipt against the
 * actual crop bytes immediately before saving. A forged/stale proposal is
 * dropped without rejecting or changing an independently human-confirmed
 * garment. Legacy unbound suggestions remain explicitly unbound.
 */
export async function verifiedModelPieces49(pieces,proof){
 const snapshots=structuredClone(pieces);
 for(const piece of snapshots){
  const binding=piece?.recognitionSuggestion42?.inputBinding49;
  if(!binding)continue;
  let valid=false;
  try{
   valid=binding.hashAlgorithm==='SHA-256'&&
    binding.sourceSHA256===proof.sourceSHA256&&
    /^[0-9a-f]{64}$/.test(binding.cropSHA256||'')&&
    /^[A-Za-z0-9._-]{1,80}$/.test(binding.requestedAssetTag||'')&&
    (await (async()=>{
     const bytes=jpegBytes(piece.image);
     return bytes.length>=128&&await digestBytes(bytes)===binding.cropSHA256;
    })());
  }catch{/* Forged image bytes must not poison user-confirmed clothing. */}
  if(!valid)delete piece.recognitionSuggestion42;
 }
 return snapshots;
}

/**
 * SNAPSHOT51: The confirmed save must never deep-clone an untrusted garment
 * review object wholesale. A local worker, browser extension or stale UI can
 * leave unrelated binary masks, raw image copies, credentials, uncloneable
 * values or huge diagnostic objects on that input. Select only the fields
 * consumed by verifiedRecord24 / verifiedModelPieces49 BEFORE cloning.
 *
 * Preserve a malformed submitted model receipt as an invalid sentinel:
 * INPUT49 must still discard that whole forged/stale AI suggestion rather
 * than reinterpret it as an innocent legacy/unbound suggestion.
 */
export function minimalPieceSnapshot51(piece,proof){
 const p=piece&&typeof piece==='object'?piece:{};
 const r=p.cropBounds;
 const cropBounds=r&&typeof r==='object'?{
  x:r.x,y:r.y,width:r.width,height:r.height
 }:r;
 const sourceKey=String(proof?.sourceSHA256||'')+'/'+String(p.instanceKey||'');
 const rawAI=p.recognitionSuggestion42;
 let recognitionSuggestion42=safeSuggestion45(rawAI,sourceKey,cropBounds,proof?.sourceSHA256);
 if(recognitionSuggestion42&&rawAI?.inputBinding49&&!recognitionSuggestion42.inputBinding49){
  recognitionSuggestion42={...recognitionSuggestion42,inputBinding49:{hashAlgorithm:'INVALID'}};
 }
 return {
  id:p.id,instanceKey:p.instanceKey,image:p.image,cropBounds,
  cropReviewed:p.cropReviewed,confirmed:p.confirmed,category:p.category,
  itemType:p.itemType,color:p.color,manual:p.manual,
  name:typeof p.name==='string'?p.name.slice(0,120):p.name,
  hint:sanitizeSegmentHint50(p.hint,{manual:p.manual===true}),
  maskApplied:p.maskApplied===true,recognitionSuggestion42
 };
}

/** One readwrite IDB transaction, including read-time duplicate/CAS checks. */
export async function atomicSaveGarments24({db,proof,pieces,ownerId,currentOwner,now}){
 if(!db||db.name!=='closet-current-user-'+ownerId||currentOwner()!==ownerId)
  fail('owner database or session mismatch');
 if(!Array.isArray(pieces)||!pieces.length||pieces.length>24)fail('select 1–24 garments');
 // Immutable snapshot is taken before any WebCrypto digest or IndexedDB wait.
 // A concurrent user edit/crop cannot replace bytes while a batch is pending.
 // Drop bulky/unrecognized worker hints BEFORE cloning an immutable
 // confirmation snapshot; otherwise arbitrary nested detector data could
 // waste memory while hashing even though it never belongs in the closet.
 const piecesAtCall=pieces.map(piece=>structuredClone(minimalPieceSnapshot51(piece,proof)));
 if(!await verifyStoredCanonical(proof))fail('canonical JPEG SHA-256 mismatch');
 if(currentOwner()!==ownerId||db.name!=='closet-current-user-'+ownerId)
  fail('session changed during SHA-256');
 const checkedPieces=await verifiedModelPieces49(piecesAtCall,proof);
 if(currentOwner()!==ownerId||db.name!=='closet-current-user-'+ownerId)
  fail('session changed during optional crop validation');
 const records=checkedPieces.map(piece=>verifiedRecord24({proof,ownerId,piece,now}));
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
