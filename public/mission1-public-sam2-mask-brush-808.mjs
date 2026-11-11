/**
 * Mission 1 P808: local bounded manual brush on a previously SHA-verified
 * P804 REAL SAM2 source-mask preview (P806 public original only).
 *
 * This does not execute or train SAM2, trust a user identity, verify human
 * mask IoU, approve a mask or save a cutout. No network or storage API.
 */
import {SAM2_EVIDENCE_SOURCE_SHA256_806} from './mission1-public-sam2-mask-preview-806.mjs';
const fail=why=>{throw Error('M1_P808_REAL_SAM2_PUBLIC_BRUSH '+why);};
const HASH=/^[a-f0-9]{64}$/;
const fixedHashes=new Set([
 'f8c50688b5932ae8c879b24ea638ade7994b3c1563b501c93d576c7236cb1bf9',
 'd76ab0fb867270eafc8d76f5a6dc5fa693d342cca049fc226aa8dc661cad7f7e'
]);
export function correctPublicSAM2Overlay808({state,box,point,x,y,mode,radius=5}={}){
 const e=state?.evidence;
 if(state?.schema!=='closet-current-m1-public-original-sam2-manual-808/transient/v1'||
    e?.schema!=='closet-current-m1-public-original-sam2-artifact-806/preview-only/v1'||
    e?.sourceSHA256!==SAM2_EVIDENCE_SOURCE_SHA256_806||
    !HASH.test(e?.modelMaskPNG_SHA256||'')||
    !fixedHashes.has(e.modelMaskPNG_SHA256)||
    e?.previewOnly!==true||e?.autoSaveAllowed!==false||
    e?.privatePersisted!==false||e?.externalUpload!==false||
    e?.maskVerifiedByHuman!==false||e?.currentBrowserDidNotRunSAM2!==true||
    box?.schema!=='closet-current-m1-owner-original-rectangle-800/review-only/v1'||
    point?.schema!=='closet-current-m1-owner-original-point-798/review-only/v1'||
    !box?.twoVerifiedOriginalJPEGCornerTaps||!point?.sourceBytesSHA256Verified||
    !point?.capturedFromOriginalJPEG||
    e?.ownerId!==box?.ownerId||e?.ownerId!==point?.ownerId||
    e?.sourceId!==box?.sourceId||e?.sourceId!==point?.sourceId||
    !e?.ownerId||!e?.sourceId||
    box?.sourceSHA256!==e?.sourceSHA256||point?.sourceSHA256!==e?.sourceSHA256||
    box?.sourceWidth!==1920||box?.sourceHeight!==2880||
    point?.sourceWidth!==1920||point?.sourceHeight!==2880)
  fail('exact P806 public SAM2 SHA/owner/source prompt required');
 const {width:w,height:h,overlay}=state;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<2||h<2||
    w>512||h>512||w*h>262144||
    !(overlay instanceof Uint8ClampedArray)||overlay.length!==w*h*4||
    !Number.isInteger(state.selectedPixels)||state.selectedPixels<1||
    state.selectedPixels>=w*h||
    !Number.isInteger(x)||!Number.isInteger(y)||
    !Number.isInteger(radius)||radius<1||radius>12||
    !['add','erase'].includes(mode))
  fail('bounded original-model mask or brush invalid');
 const x0=Math.floor(box.x0*w/1920),y0=Math.floor(box.y0*h/2880);
 const x1=Math.ceil(box.x1*w/1920),y1=Math.ceil(box.y1*h/2880);
 if(!(0<=x0&&x0<x1&&x1<=w&&0<=y0&&y0<y1&&y1<=h)||
    x<x0||x>=x1||y<y0||y>=y1)
  fail('model mask correction outside original owner source box');
 const count=state.manualEditCount||0;
 if(!Number.isInteger(count)||count<0||count>=1024)
  fail('maximum manual edit budget exceeded');
 const next=new Uint8ClampedArray(overlay),target=mode==='add'?122:0;
 let changes=0,delta=0;
 for(let sy=Math.max(y0,y-radius);sy<Math.min(y1,y+radius+1);sy++)
  for(let sx=Math.max(x0,x-radius);sx<Math.min(x1,x+radius+1);sx++){
   if((sx-x)**2+(sy-y)**2>radius**2)continue;
   const i=4*(sy*w+sx),before=next[i+3];
   if(before!==0&&before!==122)fail('untrusted model alpha value');
   if(before===target)continue;
   next[i]=25;next[i+1]=112;next[i+2]=222;next[i+3]=target;
   delta+=target?1:-1;changes++;
  }
 if(changes<1)fail('no model pixels changed');
 const selectedPixels=state.selectedPixels+delta;
 if(selectedPixels<0||selectedPixels>w*h)fail('corrected model mask count invalid');
 return Object.freeze({
  ...state,overlay:next,selectedPixels,manualEditCount:count+1,
  lastEditChangedPixels:changes,correctedOriginalSAM2Mask:true,
  modelPredictedPixelsHumanConfirmed:false,ownerApprovedMask:false,
  sourceOriginalUnchanged:true,previewOnly:true,autoSaveAllowed:false,
  externalUpload:false,privatePersisted:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
}
