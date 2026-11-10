/**
 * Mission 1 P803: PURE bounded manual pixel correction of the P802 local
 * COLOR-connected research preview, using the same SHA-bound owner box/point.
 * This is not SAM2, not an independently judged mask or saved garment.
 * Only ephemeral RGBA canvas preview bytes are changed; no photo, cloud,
 * database, storage, model or network interaction.
 */
const fail=why=>{throw Error('M1_LOCAL_MASK_CORRECTION_803 '+why);};
const SHA=/^[a-f0-9]{64}$/;
export function correctOwnerLocalMask803({
 preview,box,point,x,y,mode,radius=5
}={}){
 if(!preview||!box||!point||
    preview.schema!=='closet-current-m1-owner-local-color-mask-802/ephemeral-preview/v1'||
    box.schema!=='closet-current-m1-owner-original-rectangle-800/review-only/v1'||
    point.schema!=='closet-current-m1-owner-original-point-798/review-only/v1'||
    !SHA.test(preview.sourceSHA256||'')||
    preview.sourceSHA256!==box.sourceSHA256||preview.sourceSHA256!==point.sourceSHA256||
    preview.ownerId!==box.ownerId||preview.ownerId!==point.ownerId||
    !preview.ownerId||preview.sourceId!==box.sourceId||preview.sourceId!==point.sourceId||
    preview.previewOnly!==true||preview.actualPixelRegionGenerated!==true||
    preview.externalUpload!==false||preview.privatePersisted!==false||
    preview.ownerApprovedMask!==false||preview.autoSaveAllowed!==false||
    !box.twoVerifiedOriginalJPEGCornerTaps||!point.sourceBytesSHA256Verified||
    !point.capturedFromOriginalJPEG)
  fail('active verified original owner/point/box and unapproved color preview required');
 const {width,height}=preview;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||
    width>512||height>512||width*height>262144||
    !(preview.overlay instanceof Uint8ClampedArray)||
    preview.overlay.length!==4*width*height||
    !Number.isInteger(x)||!Number.isInteger(y)||
    !Number.isInteger(radius)||radius<1||radius>12||
    !['add','erase'].includes(mode))
  fail('invalid coordinates, preview or local memory budget');
 const x0=Math.floor(box.x0*width/box.sourceWidth);
 const y0=Math.floor(box.y0*height/box.sourceHeight);
 const x1=Math.ceil(box.x1*width/box.sourceWidth);
 const y1=Math.ceil(box.y1*height/box.sourceHeight);
 if(![x0,y0,x1,y1].every(Number.isFinite)||
    x0<0||y0<0||x1>width||y1>height||x0>=x1||y0>=y1||
    x<x0||y<y0||x>=x1||y>=y1||
    !Number.isInteger(preview.maskPixels)||preview.maskPixels<0||
    preview.maskPixels>preview.ownerBoxPixels||
    preview.ownerBoxPixels!==(x1-x0)*(y1-y0))
  fail('correction must remain inside the verified original owner box');
 const priorCount=preview.manualEditCount||0;
 if(!Number.isInteger(priorCount)||priorCount<0||priorCount>=1024)
  fail('bounded manual correction limit exceeded');
 const pixels=new Uint8ClampedArray(preview.overlay);
 const target=mode==='add'?112:0;
 let changed=0,delta=0;
 for(let py=Math.max(y0,y-radius);py<Math.min(y1,y+radius+1);py++)
  for(let px=Math.max(x0,x-radius);px<Math.min(x1,x+radius+1);px++){
   if((px-x)*(px-x)+(py-y)*(py-y)>radius*radius)continue;
   const i=4*(py*width+px),old=pixels[i+3];
   if(old===target)continue;
   if(old!==0&&old!==112)fail('unexpected preview alpha; cannot edit an untrusted region');
   if(target){
    pixels[i]=31;pixels[i+1]=117;pixels[i+2]=219;pixels[i+3]=112;
    delta++;
   }else{
    pixels[i]=0;pixels[i+1]=0;pixels[i+2]=0;pixels[i+3]=0;
    delta--;
   }
   changed++;
  }
 if(changed===0)fail('correction did not change mask pixels');
 const area=preview.maskPixels+delta;
 if(area<0||area>preview.ownerBoxPixels)
  fail('invalid corrected region size');
 return {
  ...preview,overlay:pixels,maskPixels:area,
  fractionOfBox:area/preview.ownerBoxPixels,
  manualEditCount:priorCount+1,manualPixelCorrectionApplied:true,
  manualEditPixelsChanged:changed,previewOnly:true,
  pixelDerivedLocalHeuristic:true,learnedGarmentSegmentation:false,
  independentHumanVerified:false,ownerApprovedMask:false,
  categoryConfirmed:false,subtypeConfirmed:false,colorConfirmed:false,
  autoSaveAllowed:false,privatePersisted:false,externalUpload:false
 };
}
