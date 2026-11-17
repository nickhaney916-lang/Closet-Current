/**
 * PARALLEL #96 — opt-in 4K+ P88 research source/derivative bridge.
 * Original JPEG remains in proof + owner store; the resized JPEG is a transient
 * model input only. P88 is UNMODIFIED and its mask digest is a worker claim,
 * not a verified original-resolution mask or physical garment identity.
 */
import {verifyStoredCanonical,jpegBytes,digestBytes,jpegOrientation} from '../capture-proof-01/source-proof.mjs';
import {intakeProposal58,MAX_WORKER_PROPOSALS58} from '../multi-garment-capture-01/detection-intake-58.mjs';

const SHA96=/^[a-f0-9]{64}$/;
const REQ96=/^[0-9a-f-]{8,80}$/i;
export const MAX_SOURCE_PIXELS96=24_000_000;
export const MAX_SOURCE_SIDE96=8000;
export const MAX_MODEL_SIDE96=1536;
const fail=reason=>{throw Error('P96 '+reason);};
const dimension=n=>Number.isSafeInteger(n)&&n>0;
const safeSize=(w,h)=>dimension(w)&&dimension(h)&&
 w<=MAX_SOURCE_SIDE96&&h<=MAX_SOURCE_SIDE96&&w*h<=MAX_SOURCE_PIXELS96;
function allowedOrientation(proof){
 // The proof's orientation field is metadata, not an independent observation.
 // A direct camera proof can report 1 while its byte-verified JPEG still
 // contains a mirrored/rotated EXIF tag. Without a source-to-display rotation
 // mapping, P88 normalized crop coordinates cannot be trusted on that source.
 // Reinspect the immutable JPEG bytes; retain manual owner review on mismatch.
 const v=proof?.originalPhoto?.orientation;
 if(!(v===1||v==='browser-decoded'||v===undefined))return false;
 return jpegOrientation(jpegBytes(proof.image))===1;
}
function validGeometry96(g){
 return g&&safeSize(g.sourceWidth,g.sourceHeight)&&
  dimension(g.modelWidth)&&dimension(g.modelHeight)&&
  Math.max(g.modelWidth,g.modelHeight)<=MAX_MODEL_SIDE96&&
  g.modelWidth<=g.sourceWidth&&g.modelHeight<=g.sourceHeight&&
  typeof g.sourceSHA256==='string'&&SHA96.test(g.sourceSHA256)&&
  typeof g.modelSHA256==='string'&&SHA96.test(g.modelSHA256);
}
export function inverseCrop96(box,geometry){
 if(!validGeometry96(geometry)||!box||typeof box!=='object'||Array.isArray(box))fail('invalid coordinate transform');
 const {x,y,width,height}=box;
 if(![x,y,width,height].every(Number.isFinite)||x<0||y<0||
    width<=0||height<=0||x+width>1+1e-9||y+height>1+1e-9)
  fail('invalid model crop');
 // P88 has already converted mask-grid bounds into the MODEL image's
 // normalized coordinates. Invert full-frame scale without pretending a
 // 128/512px semantic mask is an independently localized original mask.
 const {sourceWidth:w,sourceHeight:h,modelWidth:mw,modelHeight:mh}=geometry;
 const scaleX=w/mw,scaleY=h/mh;
 const l=Math.max(0,Math.floor(x*mw*scaleX+1e-7));
 const t=Math.max(0,Math.floor(y*mh*scaleY+1e-7));
 const r=Math.min(w,Math.ceil((x+width)*mw*scaleX-1e-7));
 const b=Math.min(h,Math.ceil((y+height)*mh*scaleY-1e-7));
 if(r<=l||b<=t)fail('empty inverse crop');
 const result={x:l/w,y:t/h,width:(r-l)/w,height:(b-t)/h};
 // All inverse bounding edges must be within one ORIGINAL pixel of the
 // ideal unrounded transform, including odd/asymmetric aspect ratios.
 if(Math.max(Math.abs(l-x*w),Math.abs(t-y*h),
   Math.abs(r-(x+width)*w),Math.abs(b-(y+height)*h))>1.001)
  fail('unstable inverse crop');
 return result;
}
export async function createInferenceDerivative96({proof,decoded,
 makeCanvas=()=>document.createElement('canvas')}={}){
 if(!proof||!await verifyStoredCanonical(proof))fail('unverified original JPEG');
 const w=decoded?.naturalWidth,h=decoded?.naturalHeight;
 if(!safeSize(w,h))fail('unsupported decoded pixel budget');
 if(proof.originalPhoto?.width!==w||proof.originalPhoto?.height!==h)
  fail('source decode dimensions changed');
 if(!allowedOrientation(proof))fail('EXIF orientation requires manual crop review');
 if(Math.max(w,h)<=3072)fail('not a high-resolution source');
 const ratio=MAX_MODEL_SIDE96/Math.max(w,h);
 const mw=Math.max(1,Math.round(w*ratio)),mh=Math.max(1,Math.round(h*ratio));
 if(mw*mh>MAX_MODEL_SIDE96*MAX_MODEL_SIDE96)fail('model pixel budget');
 let canvas,modelImage;
 try{
  canvas=makeCanvas();
  canvas.width=mw;canvas.height=mh;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)fail('canvas unavailable');
  context.drawImage(decoded,0,0,mw,mh);
  modelImage=canvas.toDataURL('image/jpeg',.9);
 }catch{fail('model derivative unavailable');}
 finally{if(canvas){canvas.width=0;canvas.height=0;}}
 const modelBytes=jpegBytes(modelImage);
 if(modelBytes.byteLength<128||modelImage.length>12_000_000)
  fail('model derivative exceeds worker byte budget');
 const modelSHA256=await digestBytes(modelBytes);
 const geometry=Object.freeze({
  sourceWidth:w,sourceHeight:h,modelWidth:mw,modelHeight:mh,
  sourceSHA256:proof.sourceSHA256,modelSHA256,
  sourceToModelX:mw/w,sourceToModelY:mh/h,
  modelToSourceX:w/mw,modelToSourceY:h/mh,
  mapping:'full-frame-axis-aligned-canvas-resize',
  maskResolutionVerified:false,physicalGarmentVerified:false
 });
 return Object.freeze({image:modelImage,geometry});
}
const overlap96=(a,b)=>{
 const dx=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
 const dy=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const area=dx*dy,union=a.width*a.height+b.width*b.height-area;
 return union>0?area/union:1;
};
export async function openHighResP88Intake96({
 proof,derivative,ownerId,requestId,reviewEpoch,
 getOwner,getSourceSHA256,getReviewEpoch,getActiveRequestId,getDbName
}={}){
 if(typeof ownerId!=='string'||!ownerId||typeof requestId!=='string'||
  !REQ96.test(requestId)||!Number.isSafeInteger(reviewEpoch)||reviewEpoch<0||
  [getOwner,getSourceSHA256,getReviewEpoch,getActiveRequestId,getDbName]
   .some(f=>typeof f!=='function'))fail('invalid owner or session lease');
 if(!proof||!await verifyStoredCanonical(proof))fail('unverified original JPEG');
 const sourceSHA256=proof.sourceSHA256,originalImage=proof.image;
 const modelImage=derivative?.image,geometry=derivative?.geometry;
 if(!validGeometry96(geometry)||geometry.sourceSHA256!==sourceSHA256||
  geometry.sourceWidth!==proof.originalPhoto?.width||
  geometry.sourceHeight!==proof.originalPhoto?.height||
  typeof modelImage!=='string'||modelImage.length>12_000_000||
  await digestBytes(jpegBytes(modelImage))!==geometry.modelSHA256)
  fail('derivative/source identity mismatch');
 let closed=false,received=0;
 const usedMasks=new Set(),usedBoxes=[];
 const live=()=>!closed&&getOwner()===ownerId&&
  getSourceSHA256()===sourceSHA256&&getReviewEpoch()===reviewEpoch&&
  getActiveRequestId()===requestId&&
  getDbName()==='closet-current-user-'+ownerId&&
  proof.image===originalImage&&proof.originalPhoto?.image===originalImage&&
  proof.sourceSHA256===sourceSHA256;
 if(!live())fail('stale source or owner lease');
 function close(){closed=true;usedMasks.clear();usedBoxes.length=0;}
 function workerRequest(){
  if(!live())fail('stale source or owner lease');
  // The P88 worker will hash and segment ONLY the resized derivative.
  // Original JPEG bytes, owner credentials and cloud IDs stay outside it.
  return {id:requestId,image:modelImage,instanceReview70:true,instanceReview840:true};
 }
 function intake(message,pieces=[]){
  if(!live()){close();return {accepted:false,reason:'stale-source-or-owner-lease'};}
  if(message?.type!=='piece'||message.id!==requestId)
   return {accepted:false,reason:'wrong-worker-session'};
  received++;
  if(received>MAX_WORKER_PROPOSALS58)
   return {accepted:false,reason:'worker-message-budget'};
  const raw=message.piece,receipt=raw?.reconciliation70;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
   !receipt||typeof receipt!=='object'||Array.isArray(receipt)||
   receipt.sourceSha256!==geometry.modelSHA256||
   !SHA96.test(receipt.maskSha256||'')||
   receipt.instanceOrdinal!==received-1||
   typeof raw.instanceMethod!=='string'||receipt.method!==raw.instanceMethod||
   !raw.hint||typeof raw.hint!=='object'||Array.isArray(raw.hint))
   return {accepted:false,reason:'invalid-model-source-mask-receipt'};
  if(usedMasks.has(receipt.maskSha256))
   return {accepted:false,reason:'duplicate-source-mask'};
  let crop;
  try{crop=inverseCrop96(raw.cropBounds,geometry);}
  catch{return {accepted:false,reason:'uncertain-original-crop-mapping'};}
  // A different mask claim cannot double-count the same physical region.
  // Cases with ambiguous overlaps remain owner-manual, never autoconfirmed.
  if([...usedBoxes,...pieces.map(p=>p?.cropBounds).filter(Boolean)]
    .some(b=>overlap96(b,crop)>.65))
   return {accepted:false,reason:'ambiguous-same-photo-region'};
  const key='seg-'+BigInt('0x'+receipt.maskSha256).toString(10);
  const result=intakeProposal58({
   instanceKey:key,cropBounds:crop,hint:raw.hint,
   instanceMethod:raw.instanceMethod,
   personDetected:false,colorEstimate:raw.colorEstimate
  },pieces,received);
  if(result.accepted){usedMasks.add(receipt.maskSha256);usedBoxes.push(crop);}
  return result;
 }
 // Only dimensions/identities and numerical transforms are disclosed here,
 // never JPEG/model pixels or an invented full-resolution mask.
 return Object.freeze({workerRequest,intake,close,
  ledger:()=>Object.freeze({...geometry,sourceBytesPreserved:true,
   fullResolutionMaskMeasured:false,reviewOnly:true,autoSave:false,
   renderAuthorized3D:false})});
}
