/**
 * MAIN1054 M46 — strictly real photographed V-neck cutout A/B on a genuine
 * EXISTING 163-bone dress renderer. This is texture-opacity DIFFERENCE, NOT
 * new physical reconstructed clothing geometry or signed-owner approval.
 *
 * The original licensed Commons JPEG and Work47 RGB, P93 original cutout and
 * M45 candidate are all checked from actual immutable file hashes before any
 * browser-local manifest is composed. No donor manifest or consumer file is
 * ever changed on disk.
 */
export const M46_SOURCE=Object.freeze({
 id:'commons-0053',
 originalJpegSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 work47PNG_SHA256:'ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4',
 p93PNG_SHA256:'caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31',
 expectedP93Removed:12961,expectedM45ExtraRemoved:4890,
 width:1920,height:2880,
 expectedFigureBoneCount:163,
 noSignedOwner3D:true,originalPhoto2DFallbackRequired:true,
 independentHumanAccepted:false,physicalMobileApproved:false,
 releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
});
const fail=x=>{throw Error('M46 ORIGINAL PHOTO SOURCE-LOCKED 3D A/B BLOCKED: '+x);};
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const exact=(v,what)=>{if(!v)fail(what)};
const sourceRGB=(a,b,width,height)=>{
 exact(a instanceof Uint8Array&&b instanceof Uint8Array&&
   a.length===width*height*4&&b.length===a.length,'decoded genuine source RGBA');
 let changed=0;
 for(let i=0;i<a.length;i+=4)for(let k=0;k<3;k++)
  if(a[i+k]!==b[i+k])changed++;
 return changed;
};
export function verifyRealPhotoMaskRenderPair46({
 originalJpegSHA256,work47PngSHA256,p93PngSHA256,m45PngSHA256,
 sourceRGBA,originalWork47RGBA,p93RGBA,m45RGBA,
 width,height,sourceMeasure
}={}){
 exact(originalJpegSHA256===M46_SOURCE.originalJpegSHA256&&
  work47PngSHA256===M46_SOURCE.work47PNG_SHA256&&
  p93PngSHA256===M46_SOURCE.p93PNG_SHA256&&
  sha(m45PngSHA256)&&m45PngSHA256!==p93PngSHA256,
  'all four actual original/previous/candidate binary photo SHA identities');
 exact(width===M46_SOURCE.width&&height===M46_SOURCE.height,
  'unmodified real source dimensions');
 exact(sourceRGB(sourceRGBA,originalWork47RGBA,width,height)===0&&
  sourceRGB(sourceRGBA,p93RGBA,width,height)===0&&
  sourceRGB(sourceRGBA,m45RGBA,width,height)===0,
  'original source RGB must be byte-for-byte preserved through BOTH 3D source masks');
 let changed=0,p93Changes=0,m45Added=0,alphaIncrease=0;
 const x0=770,y0=450,x1=1230,y1=730;
 let outside=0,bright=0;
 for(let p=0;p<width*height;p++){
  const i=p*4,x=p%width,y=Math.floor(p/width);
  if(originalWork47RGBA[i+3]!==p93RGBA[i+3])p93Changes++;
  if(p93RGBA[i+3]!==m45RGBA[i+3]){
   changed++;
   if(p93RGBA[i+3]>=128&&m45RGBA[i+3]===0)m45Added++;
   else alphaIncrease++;
   if(x<x0||x>=x1||y<y0||y>=y1)outside++;
   const [r,g,b]=[sourceRGBA[i],sourceRGBA[i+1],sourceRGBA[i+2]];
   if(r>=160&&g>=160&&b>=160&&Math.abs(r-g)<4&&Math.abs(g-b)<4)
    bright++;
  }
  if(m45RGBA[i+3]>p93RGBA[i+3])alphaIncrease++;
 }
 exact(p93Changes===M46_SOURCE.expectedP93Removed&&
  changed===M46_SOURCE.expectedM45ExtraRemoved&&
  m45Added===changed&&alphaIncrease===0&&outside===0&&bright===0,
  'actual 4-source pixel alpha delta, logo and v-neck region mismatch');
 exact(sourceMeasure?.schema===
  'MAIN1054_M45_GENUINE_PHOTO_LOCAL_TONE_VNECK_PROPOSAL/v1'&&
  sourceMeasure?.originalJpegSHA256===M46_SOURCE.originalJpegSHA256&&
  sourceMeasure?.originalWork47PngSHA256===M46_SOURCE.work47PNG_SHA256&&
  sourceMeasure?.originalP93PngSHA256===M46_SOURCE.p93PNG_SHA256&&
  sourceMeasure?.additionallyTransparentOriginalOpaquePixels===changed&&
  sourceMeasure?.originalSourceRGBPixelsChanged===0&&
  sourceMeasure?.protectedOriginalBrightPipingOrLogoPixelsRemoved===0&&
  sourceMeasure?.sourceOrP93AlphaIncreasedPixels===0&&
  sourceMeasure?.offVNeckOriginalSourcePixelsChanged===0&&
  sourceMeasure?.consumer3DAdmitted===false&&
  sourceMeasure?.releaseAuthorized===false&&
  sourceMeasure?.familyAlpha==='HOLD',
  'candidate was not independently source-verified and release-denied by M45');
 return Object.freeze({
  schema:'MAIN1054_M46_GENUINE_PHOTO_P93_M45_3D_SOURCE_BOUND_PAIR/v1',
  status:'AUTHENTIC_SOURCE_MASK_PAIR_VERIFIED_NOT_WEARABLE_APPROVAL',
  sourceId:M46_SOURCE.id,
  originalSourceJpegSHA256:originalJpegSHA256,
  untouchedWork47PngSHA256:work47PngSHA256,
  untouchedP93PngSHA256:p93PngSHA256,
  separateUnapprovedM45PngSHA256:m45PngSHA256,
  originalSourceDimensions:Object.freeze([width,height]),
  originalP93AlphaChanged:p93Changes,additionalM45AlphaRemoved:changed,
  sourceRGBAAllRGBBytesIdentical:true,
  sourceWhitePipingPixelRemoval:0,sourceAlphaIncreases:0,
  changedOutsideOriginalVNeckROI:0,
  actualOriginalSourceIsFrontOnly:true,sourceBacksideObserved:false,
  verifiedRendererAnatomyRequiredBoneCount:163,
  noConsumer3DAdmission:true,noIndependentHumanTextureApproval:true,
  photoUVFitNotAutomaticallyMeasured:true,
  researchOnly:true,source2DFallbackRequired:true,
  sourceOwnerPrivatePhotosRead:false,
  releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
 });
}
/** Creates a LOCAL, in-memory, SHA-correct manifest row. The actual file
 * on disk remains immutable; this DOES NOT create consumer authorization. */
export function makeResearchOnlyRendererMaskManifest46(original,{pngSHA256,variant,sourcePair}={}){
 exact(original&&typeof original==='object'&&!Array.isArray(original)&&
  Array.isArray(original.rows),'actual original Work47 manifest');
 exact(sourcePair?.schema===
  'MAIN1054_M46_GENUINE_PHOTO_P93_M45_3D_SOURCE_BOUND_PAIR/v1'&&
  sourcePair?.sourceId===M46_SOURCE.id&&sourcePair.releaseAuthorized===false,
  'only actual previously byte-validated original photo pair may be used');
 exact(['P93','M45'].includes(variant),'known original P93 or separate M45 trial');
 exact(pngSHA256===(variant==='P93'?
   sourcePair.untouchedP93PngSHA256:sourcePair.separateUnapprovedM45PngSHA256),
  'derived png must match selected original candidate');
 const ix=original.rows.findIndex(r=>r.id===M46_SOURCE.id);
 exact(ix>=0&&original.rows.filter(r=>r.id===M46_SOURCE.id).length===1,
  'exact one original photographed dress source row');
 const row=original.rows[ix];
 exact(row.sourceSHA256===M46_SOURCE.originalJpegSHA256&&
  row.cutoutSHA256===M46_SOURCE.work47PNG_SHA256&&
  row.hasCutout===true&&row.ownerApproved===false&&
  row.attribution?.license==='CC BY 4.0',
  'renderer manifest must descend from original immutable licensed source');
 const changed={...row,cutoutSHA256:pngSHA256};
 const rows=original.rows.map((r,i)=>i===ix?changed:r);
 return Object.freeze({...original,rows});
}
