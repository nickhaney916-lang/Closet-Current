/**
 * INDEX-03 isolated research gate: never writes photos or saved wardrobe records.
 * Apply AFTER the existing actual original-photo FashionCLIP worker, BEFORE an
 * experimental indexed save. An unverified source or uncertain subtype reviews.
 * Colors are suggestions only, derived from independently verified garment masks.
 */
import {localCandidates} from '../../public/local-catalog.mjs';

const CATEGORIES=['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const types=new Map(CATEGORIES.map(x=>[x,new Set(localCandidates.filter(v=>v.category===x).map(v=>v.itemType))]));
const SHA=/^[0-9a-f]{64}$/;
const guardedTypes=new Set(['Blazer','Tunic','Sweatshirt','Ankle boots']);
const shapeSensitive=new Set(['Shorts','Skirt','Sneakers','Sweater','Blouse','Jacket','Coat',
 'Casual dress','Shirt dress','Sweater dress','Formal dress','Tall boots']);
const recoveryReasons=new Set(['bottoms_independent_agreement','skirt_dress_independent_agreement',
 'skirt_full_catalog_independent_agreement','skirt_padded_views_agreement',
 'coat_independent_agreement','coat_near_full_independent_agreement',
 'jacket_runner_up_independent_agreement','outerwear_independent_agreement']);
const sameType=(a,b)=>a?.category===b?.category&&a?.itemType===b?.itemType;
const slots=(cat,type)=>{
 if(cat==='Tops')return ['top','layer'];
 if(cat==='Bottoms')return ['bottom'];
 if(cat==='Dresses')return ['top'];
 if(cat==='Outerwear')return type==='Unknown'?[]:['layer','layer2','layer3'];
 if(cat==='Shoes')return ['shoes'];
 if(cat==='Accessories')return type==='Bag'?['bag']:['Jewelry','Sunglasses'].includes(type)?['accessory']:['Hat','Scarf','Belt'].includes(type)?['finish']:[];
 return [];
};
export function hasOriginalSourceProof(source){
 return !!source&&source.verified===true&&source.recognitionFromOriginal===true&&
  typeof source.sha256==='string'&&SHA.test(source.sha256)&&
  (source.originalWidth===undefined||(Number.isInteger(source.originalWidth)&&source.originalWidth>0))&&
  (source.originalHeight===undefined||(Number.isInteger(source.originalHeight)&&source.originalHeight>0));
}
export async function verifyOriginalSourceBytes(bytes,expectedSha256,cryptoProvider=globalThis.crypto){
 if(!(bytes instanceof Uint8Array)||!bytes.length||!SHA.test(expectedSha256)||!cryptoProvider?.subtle?.digest)
  throw Error('INDEX-03 original source or crypto unavailable');
 const digest=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes));
 return Object.freeze({verified:Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('')===expectedSha256,
  sha256:expectedSha256,byteLength:bytes.byteLength});
}
/**
 * No model or filename inference here. "independent" evidence must come from
 * two actually executed full-vocabulary comparisons, not the same scores twice.
 */
export function reviewRecognitionForIndex({ownerId,recordOwnerId,recognition,source,
  existing=null,independent=null,garmentCount=1,segment=null}={}){
 if(typeof ownerId!=='string'||!ownerId||recordOwnerId!==ownerId)
  throw Error('INDEX-03 owner mismatch');
 if(existing&&(existing.ownerId!==undefined&&existing.ownerId!==ownerId))
  throw Error('INDEX-03 existing record owner mismatch');
 if(!recognition||typeof recognition!=='object')throw Error('INDEX-03 missing recognition');
 const first=recognition.choices?.[0]||{};
 const known=CATEGORIES.includes(first.category)&&types.get(first.category)?.has(first.itemType);
 const manual=existing?.userAdjusted===true||existing?.confirmedCategory===true;
 const category=manual?existing.category:known?first.category:
  recognition.categoryConfirmed&&CATEGORIES.includes(first.category)?first.category:'Uncategorized';
 const itemType=manual?existing.itemType:known?first.itemType:'Unknown';
 const normalizedType=CATEGORIES.includes(category)&&types.get(category)?.has(itemType)?itemType:'Unknown';
 const reasons=[];
 if(!hasOriginalSourceProof(source))reasons.push('original-source-unverified');
 if(garmentCount!==1||!Number.isInteger(garmentCount))reasons.push('multiple-garments-require-isolation');
 if(segment?.clipped)reasons.push('clipped-cutout');
 if(garmentCount>1&&!(segment?.verified===true&&SHA.test(segment.cutoutSHA256||'')&&
  segment.originalSHA256===source?.sha256))reasons.push('cutout-identity-unverified');
 if(category==='Uncategorized')reasons.push('category-unconfirmed');
 if(normalizedType==='Unknown')reasons.push('type-unconfirmed');
 if(!manual&&(!recognition.strong||!known))reasons.push('recognition-unconfirmed');
 const verifiedChecks=independent?.executed===true&&independent?.fullVocabulary===true&&
  independent?.differentViews===true&&
  sameType(independent.primary,first)&&sameType(independent.confirmation,first);
 if(!manual&&known&&(guardedTypes.has(first.itemType)||
  (shapeSensitive.has(first.itemType)&&
   (recognition.preprocessingRecovery===true||recoveryReasons.has(recognition.reason))))) {
  if(!verifiedChecks)reasons.push('confusable-type-needs-independent-confirmation');
 }
 if(!manual&&recognition.diagnostics?.skirtDressConflict?.requiresManualReview)
  reasons.push('skirt-dress-conflict');
 if(existing?.possibleDuplicate)reasons.push('possible-duplicate');
 if(existing?.requiresOwnershipConfirmation)reasons.push('ownership-unconfirmed');
 const confirmedColor=existing?.userAdjusted===true||existing?.confirmedColor===true;
 const color=confirmedColor?String(existing.color||''):''; // AI color proposals MUST NOT replace a correction
 if(!color)reasons.push('color-needs-confirmation');
 const identityReady=!reasons.some(x=>x!=='color-needs-confirmation');
 const result={category,itemType:normalizedType,color:color||'Unknown',
  colorSuggestion:confirmedColor?null:recognition.details?.color||null,
  colorSuggestionRequiresReview:!confirmedColor,
  slotIds:slots(category,normalizedType),autoIndex:!manual&&identityReady,
  needsReview:reasons.length>0,reviewReasons:[...new Set(reasons)],
  sourceKind:hasOriginalSourceProof(source)?(segment?.verified?'verified-cutout':'verified-original'):'unverified'};
 // Never return image bytes, image data URLs or the previous owner's records.
 return Object.freeze({...result,slotIds:Object.freeze(result.slotIds),reviewReasons:Object.freeze(result.reviewReasons)});
}
function hsvFamily(r,g,b){
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b),delta=mx-mn,s=mx?delta/mx:0;
 if(mx<35)return 'Black';
 if(mx<78){if(b>=r*1.28&&b>=g*1.16&&b-r>=15)return 'Navy';if(s<.23)return 'Black';}
 if(mx>225&&delta<20)return 'White';
 if(r>210&&g>200&&b>160&&r>=g&&g>b&&r-b>=15&&r-b<=68)return 'Cream';
 if(s<.14){if(mx>207)return 'White';return 'Gray';}
 let h=mx===r?60*((g-b)/delta%6):mx===g?60*((b-r)/delta+2):60*((r-g)/delta+4);
 if(h<0)h+=360;
 if(h>=15&&h<65&&s<.42&&mx>=105)return 'Beige';
 if(h>=8&&h<65&&mx<170)return 'Brown';
 if(h<15||h>=345)return mx>185&&s<.65?'Pink':'Red';
 if(h<45)return 'Orange';
 if(h<68)return 'Yellow';
 if(h<175)return 'Green';
 if(h<246)return mx<105?'Navy':'Blue';
 if(h<290)return 'Purple';
 return 'Pink';
}
/** Only count fully masked garment pixels; no center-of-frame background fallback. */
export function analyzeVerifiedGarmentColor(pixels,width,height,{mask,sourceSHA256,maskSourceSHA256,
  maskVerified=false}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||
  !pixels||pixels.length!==width*height*4||!mask||mask.length!==width*height)
  throw Error('INDEX-03 invalid color pixels or mask');
 if(!SHA.test(sourceSHA256||'')||maskSourceSHA256!==sourceSHA256||maskVerified!==true)
  return Object.freeze({color:null,needsConfirmation:true,reason:'mask-source-unverified'});
 const counts=new Map();let n=0;
 for(let i=0;i<mask.length;i++){
  if(mask[i]<224||pixels[i*4+3]<224)continue;
  const color=hsvFamily(pixels[i*4],pixels[i*4+1],pixels[i*4+2]);
  counts.set(color,(counts.get(color)||0)+1);n++;
 }
 if(n<64||n<width*height*.01||n>width*height*.95)
  return Object.freeze({color:null,needsConfirmation:true,reason:'mask-coverage-unsafe'});
 const ranked=[...counts].sort((a,b)=>b[1]-a[1]),share=ranked[0][1]/n;
 const multi=ranked.slice(1).some(([,count])=>count/n>=.23)&&share<.69;
 const color=multi?'Multicolor':share>=.63?ranked[0][0]:null;
 return Object.freeze({color,needsConfirmation:true,reason:color?'photo-mask-proposal':'color-ambiguous',
  support:Number(share.toFixed(3)),samplePixels:n});
}
