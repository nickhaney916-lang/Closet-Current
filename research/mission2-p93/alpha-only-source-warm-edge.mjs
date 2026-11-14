/**
 * P93 SOURCE-SPECIFIC, PROVISIONAL background/mannequin decontamination.
 *
 * Proposes alpha-only removal of coherent warm, pale, boundary-connected
 * contamination on top of the genuine licensed Commons-0053 dress cutout.
 * NEVER adjusts RGB, the source JPEG, white logo, piping, UV, owner data, or
 * an installed consumer asset. Human must review and explicitly accept/reject.
 *
 * A connected-color proposal is NOT a verified garment/background mask.
 */
export const LOCKED_P93_SOURCE='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
export const LOCKED_P93_CUTOUT='ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4';
export const P93_PARAMETERS=Object.freeze({
 topSourceFraction:0.23,
 transparentAlpha:16,
 visibleAlpha:128,
 warmRMin:90,warmGMin:75,warmBMin:60,
 warmRedGreenGap:4,warmGreenBlueGap:3,warmChannelSumMin:280,
 boundarySearchRadiusPixels:17,
 minimumSourceColorComponentPixels:25,
 maximumRemovedFractionOfOriginalVisible:.025,
 maximumSourcePixels:8000000,
 sourceApprovedByOwner:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const deny=reason=>{throw Error('M2 P93 original photographed cutout proposal BLOCKED: '+reason);};
const finiteNumber=x=>Number.isFinite(x);
export function proposeAlphaOnlyLicensedDress93({
 rgba,width,height,sourceSHA256,cutoutSHA256,
 parameters=P93_PARAMETERS
}={}){
 if(sourceSHA256!==LOCKED_P93_SOURCE||
    cutoutSHA256!==LOCKED_P93_CUTOUT)
  deny('exact original licensed JPEG and provisional transparent PNG SHA required');
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
    width<100||height<100||width*height>P93_PARAMETERS.maximumSourcePixels||
    !(rgba instanceof Uint8Array)||rgba.length!==width*height*4)
  deny('original licensed rgba bytes or source dimensions invalid');
 // The threshold is frozen research evidence for a SINGLE source photograph.
 // No arbitrary guest/user garment or disguised configuration override.
 if(parameters!==P93_PARAMETERS)deny('unexpected unverified original-photo palette or boundary policy');
 const n=width*height;
 let top=height,bottom=-1,visible=0;
 for(let pos=0;pos<n;pos++){
  if(rgba[pos*4+3]>=parameters.visibleAlpha){
   const y=Math.floor(pos/width);
   top=Math.min(top,y);bottom=Math.max(bottom,y);visible++;
  }
 }
 if(visible<10000||top>=bottom||bottom-top<height*.35)
  deny('authentic source garment alpha / silhouette invalid');
 const maxY=Math.min(height-1,top+Math.round((bottom-top)*parameters.topSourceFraction));
 const warm=new Uint8Array(n),seen=new Uint8Array(n);
 let candidates=0;
 // Preserve EVERY original RGB byte. Only alpha may be proposed for decrease.
 for(let y=top;y<=maxY;y++){
  const start=y*width;
  for(let x=0;x<width;x++){
   const p=start+x,o=p*4;
   if(rgba[o+3]<parameters.transparentAlpha)continue;
   const red=rgba[o],green=rgba[o+1],blue=rgba[o+2];
   if(red>=parameters.warmRMin&&green>=parameters.warmGMin&&blue>=parameters.warmBMin&&
      red-green>=parameters.warmRedGreenGap&&
      green-blue>=parameters.warmGreenBlueGap&&
      red+green+blue>=parameters.warmChannelSumMin){
    warm[p]=1;candidates++;
   }
  }
 }
 if(candidates<100)deny('no authentic pale source sample; never fabricate a repair');
 const result=new Uint8Array(rgba);
 const queue=new Int32Array(n);
 const radius=parameters.boundarySearchRadiusPixels;
 const hasNearbyTransparency=p=>{
  const y=Math.floor(p/width),x=p-y*width;
  // No cross-object 2D closing; only identify source-connected halo witnesses.
  const xa=Math.max(0,x-radius),xb=Math.min(width-1,x+radius);
  const ya=Math.max(0,y-radius),yb=Math.min(maxY,y+radius);
  for(let yy=ya;yy<=yb;yy++){
   const offset=yy*width*4+3;
   for(let xx=xa;xx<=xb;xx++)
    if(rgba[offset+xx*4]<parameters.transparentAlpha)return true;
  }
  return false;
 };
 let selectedComponents=0,selectedPixels=0,rejectedInterior=0,
  discardedTiny=0,componentCount=0;
 const offsets=Object.freeze([
  [-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]
 ]);
 for(let y=top;y<=maxY;y++)for(let x=0;x<width;x++){
  const p=y*width+x;
  if(!warm[p]||seen[p])continue;
  componentCount++;
  let start=0,end=1,near=false;
  queue[0]=p;seen[p]=1;
  while(start<end){
   const at=queue[start++],by=Math.floor(at/width),bx=at-by*width;
   if(!near&&hasNearbyTransparency(at))near=true;
   for(const [dy,dx] of offsets){
    const ny=by+dy,nx=bx+dx;
    if(ny<top||ny>maxY||nx<0||nx>=width)continue;
    const next=ny*width+nx;
    if(warm[next]&&!seen[next]){
     seen[next]=1;queue[end++]=next;
    }
   }
  }
  if(end<parameters.minimumSourceColorComponentPixels){discardedTiny+=end;continue;}
  if(!near){rejectedInterior+=end;continue;}
  selectedComponents++;
  for(let i=0;i<end;i++){
   const o=queue[i]*4+3;
   if(result[o]>0){result[o]=0;selectedPixels++;}
  }
 }
 if(selectedComponents<1||selectedPixels<100||
    selectedPixels>Math.round(visible*parameters.maximumRemovedFractionOfOriginalVisible))
  deny('unexpected source change volume; cannot silently mass-erase genuine cloth');
 let changed=0,changedOutsideTop=0,rgbMismatch=0,alphaIncreased=0,
  removedNonWarm=0,logosProtected=0;
 for(let i=0;i<n;i++){
  const o=i*4;
  if(result[o]!==rgba[o]||result[o+1]!==rgba[o+1]||
   result[o+2]!==rgba[o+2])rgbMismatch++;
  if(result[o+3]>rgba[o+3])alphaIncreased++;
  if(result[o+3]!==rgba[o+3]){
   changed++;
   if(Math.floor(i/width)>maxY||Math.floor(i/width)<top)changedOutsideTop++;
   if(!warm[i])removedNonWarm++;
  }
 }
 if(rgbMismatch||alphaIncreased||removedNonWarm||changedOutsideTop||
    changed!==selectedPixels)
  deny('original pixel color/protected body or unproven alpha changed');
 // All labels and white piping excluded by warm-source selection; count
 // explicit retained high-luminance near-whites in preserved image.
 for(let y=top;y<=maxY;y++)for(let x=0;x<width;x++){
  const o=(y*width+x)*4,red=rgba[o],green=rgba[o+1],blue=rgba[o+2];
  if(rgba[o+3]>=128&&red>=160&&green>=160&&blue>=160&&
      Math.abs(red-green)<4&&Math.abs(green-blue)<4&&
      result[o+3]===rgba[o+3])logosProtected++;
 }
 return Object.freeze({
  schema:'M2-P93-authentic-licensed-original-RGB-only-alpha-derivative-unreviewed',
  originalSourceSHA256:sourceSHA256,originalCutoutSHA256:cutoutSHA256,
  sourceWidth:width,sourceHeight:height,
  proposalUpperBoundRow:maxY,
  originalVisiblePixels:visible,warmCandidatePixels:candidates,
  originalColorComponentsExamined:componentCount,
  selectedBoundaryConnectedComponents:selectedComponents,
  proposedAlphaPixelsRemoved:selectedPixels,
  retainedWarmInteriorPixels:rejectedInterior,
  retainedSmallWarmPixels:discardedTiny,
  unchangedHighBrightnessNeutralPipingLogoSamples:logosProtected,
  sourceRGBChangedPixels:rgbMismatch,sourceAlphaIncreasedPixels:alphaIncreased,
  changedOutsideConservativeUpperRegion:changedOutsideTop,
  removedPixelsWithoutSourceWarmSignature:removedNonWarm,
  removalIsCompleteMannequinSegmentation:false,
  sourcePhotographAndAllOriginalRGBUntouched:true,
  originalOutlineAndLogoReviewStillRequired:true,
  noHumanOriginalPhotoApproval:true,
  sourceProvisionalCutoutOwnerApproved:false,
  physicallyReliableFabricOr3D:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  // Typed array intentionally held only in returned local research process,
  // never written into any owner wardrobe or public app bundle.
  candidateRGBA:result
 });
}
