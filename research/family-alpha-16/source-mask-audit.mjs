/** Assignment #16: read-only, independent provenance + pixel-fidelity AUDITOR.
 * No masking, garment reconstruction, accounts, storage, network or image export.
 * Matching metadata is NOT independent source-to-mask proof.
 * Caller must supply a trusted JPEG decoder and a PRIVATE owner-scoped record.
 */
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment}
 from '../../public/family-alpha-2d-saved-board.mjs';

const sha=async(data,cryptoProvider=globalThis.crypto)=>{
 if(!cryptoProvider?.subtle?.digest)throw Error('SHA-256 unavailable');
 const hash=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',data));
 return 'sha256:'+Array.from(hash,n=>n.toString(16).padStart(2,'0')).join('');
};
export async function fingerprintSavedCrop(item,cryptoProvider=globalThis.crypto){
 if(typeof item?.image!=='string'||!/^data:image\/jpeg;base64,/.test(item.image))
  throw Error('Missing saved crop JPEG');
 const encoded=item.image.slice('data:image/jpeg;base64,'.length);
 if(encoded.length<80||encoded.length>11_000_000||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))
  throw Error('Invalid saved crop encoding');
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 if(bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)
  throw Error('Invalid saved crop JPEG');
 return sha(bytes,cryptoProvider);
}
const safeResult=(status,reason,metrics=null)=>Object.freeze({status,reason,metrics,canDisplay:false});
const sourceOf=item=>item?.originalPhoto===undefined?item?.image:item?.originalPhoto?.image;
function assertScope(scope,owner){
 if(!scope||scope.ownerId!==owner||!Number.isSafeInteger(scope.epoch)||scope.epoch<1)
  throw Error('Account scope changed or unavailable');
 return scope.epoch;
}
function checkFrame(frame){
 if(!frame||!Number.isInteger(frame.width)||!Number.isInteger(frame.height)||
 frame.width<32||frame.height<32||frame.width*frame.height>8_000_000||
 !(frame.data instanceof Uint8Array||frame.data instanceof Uint8ClampedArray)||
 frame.data.length!==frame.width*frame.height*4)
  throw Error('Invalid independently decoded retained original');
}
function checkPixels(prepared,original,truth){
 const {width:w,height:h,rgba,bounds}=prepared;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>8_000_000||
 !(rgba instanceof Uint8Array||rgba instanceof Uint8ClampedArray)||rgba.length!==w*h*4||
 !bounds||!Number.isInteger(bounds.left)||!Number.isInteger(bounds.top)||
 bounds.left<0||bounds.top<0||bounds.left+w>original.width||bounds.top+h>original.height)
  throw Error('Invalid transparent derivative bounds or pixels');
 if(bounds.right!==bounds.left+w||bounds.bottom!==bounds.top+h)
  throw Error('Transparent derivative bounds inconsistent');
 if(truth&&(!(truth instanceof Uint8Array)||truth.length!==original.width*original.height||
  truth.some(v=>v!==0&&v!==1)))throw Error('Invalid synthetic ground truth');
 let visible=0,sourceMismatches=0,backgroundLeaks=0,missing=0,TP=0,union=0,exact=0,alphaHalo=0,maskFilled=0;
 let squaredError=0, maxColorError=0;
 for(let i=0;i<w*h;i++){
  const x=i%w,y=Math.floor(i/w),src=(y+bounds.top)*original.width+x+bounds.left;
  const p=4*i,q=4*src,alpha=rgba[p+3],on=alpha>=128;
  if(alpha>0&&alpha<255)alphaHalo++;
  if(on){
   visible++;maskFilled++;
   let mismatch=false;
   for(let channel=0;channel<3;channel++){
    const d=Math.abs(rgba[p+channel]-original.data[q+channel]);
    squaredError+=d*d;maxColorError=Math.max(maxColorError,d);
    if(d!==0)mismatch=true;
   }
   if(!mismatch)exact++;
   else sourceMismatches++;
  }
  if(truth){
   const real=truth[src]===1;
   if(real&&on)TP++;
   if(real||on)union++;
   if(on&&!real)backgroundLeaks++;
   if(real&&!on)missing++;
  }
 }
 const truthCount=truth?.reduce((a,b)=>a+b,0)??null;
 const falseNegOutside=truth?(()=>{let out=0;for(let y=0;y<original.height;y++)for(let x=0;x<original.width;x++){
  if(x<bounds.left||x>=bounds.right||y<bounds.top||y>=bounds.bottom)
   out+=truth[y*original.width+x];
 }return out;})():0;
 const falseNeg=missing+falseNegOutside;
 const result={
  visiblePixels:visible,sourceMismatchPixels:sourceMismatches,
  exactSourceRGBRate:visible?exact/visible:0,
  rgbRMSE:visible?Math.sqrt(squaredError/(visible*3)):null,maxRGBError:maxColorError,
  transparentFraction:1-visible/(w*h),partialAlphaEdgePixels:alphaHalo,
  expectedGarmentPixels:truthCount,
  foregroundRecall:truthCount?TP/truthCount:null,
  foregroundPrecision:truth?(visible?TP/visible:0):null,
  maskIoU:truth?(union?TP/union:0):null,
  backgroundLeakPixels:truth?backgroundLeaks:null,
  missingFabricPixels:truth?falseNeg:null,
  aspectRatio:w/h
 };
 return Object.freeze(result);
}
/**
 * @param getScope trusted caller's current owner+monotonic epoch
 * @param getItem returns latest owner-scoped item after async decode (not cached unscoped)
 * @param decodeOriginal independent decoder of app-retained JPEG; frame MUST originate from JPEG argument
 * @param prepared PR257-style candidate, supplemented by independent originalSha/cropSha/itemId/ownerId
 * @param truth optional synthetic ground-truth mask. Without it this function returns review, not verified.
 */
export async function auditMask({item,prepared,ownerId,getScope,getItem,decodeOriginal,
 cryptoProvider=globalThis.crypto,groundTruth=null,isCurrent=()=>true}={}){
 try{
  if(!item||typeof item.id!=='string'||typeof ownerId!=='string'||!item.id||!prepared||
   typeof getScope!=='function'||typeof getItem!=='function'||typeof decodeOriginal!=='function')
   return safeResult('reject','missing-trusted-input');
  const start=assertScope(getScope(),ownerId);
  const original=sourceOf(item),savedCrop=item.image,identity=identityForSavedGarment(item);
  const originalSha=await fingerprintAlphaRetainedOriginal(original,cryptoProvider);
  const cropSha=await fingerprintSavedCrop(item,cryptoProvider);
  if(!isCurrent())return safeResult('reject','superseded');
  if(prepared.status!=='prepared')return safeResult('review',prepared.reason||'garment-isolation-unavailable');
  // SHA values provided by the producer are comparison claims, not trusted attestations.
  if(prepared.itemId!==item.id||prepared.ownerId!==ownerId||
     prepared.sourceIdentity!==identity||prepared.sourceVersion!==originalSha||
     prepared.originalSha!==originalSha||prepared.cropSha!==cropSha||
     prepared.sourceRole!=='retained-original')
   return safeResult('reject','foreign-stale-or-wrong-derivative');
  const decoded=await decodeOriginal(original);
  checkFrame(decoded);
  if(!isCurrent())return safeResult('reject','superseded');
  const current=getItem(item.id);
  if(!current||current.id!==item.id||identityForSavedGarment(current)!==identity||
     sourceOf(current)!==original||current.image!==savedCrop)
   return safeResult('reject','saved-photo-changed');
  if(assertScope(getScope(),ownerId)!==start)
   return safeResult('reject','session-changed');
  const metrics=checkPixels(prepared,decoded,groundTruth);
  if(metrics.visiblePixels<64||metrics.transparentFraction<.01||metrics.transparentFraction>.98)
   return safeResult('review','empty-or-background-dominant',metrics);
  if(metrics.sourceMismatchPixels)
   return safeResult('reject','pixels-do-not-match-retained-original',metrics);
  if(groundTruth){
   if(metrics.maskIoU<.98||metrics.foregroundRecall<.98||metrics.foregroundPrecision<.98)
    return safeResult('review','segmentation-fidelity-below-synthetic-gate',metrics);
   return Object.freeze({status:'pass',reason:'synthetic-ground-truth-matched',
    metrics,canDisplay:false,independentSourceAndMaskVerifiedInFixture:true});
  }
  return safeResult('review','source-pixels-match-but-matting-unverified',metrics);
 }catch(error){
  return safeResult('reject',/Account|scope|session/i.test(error.message)?'session-changed':'invalid-source-or-derivative');
 }
}
