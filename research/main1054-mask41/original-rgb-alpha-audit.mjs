/**
 * M41 — independent original-RGB / source-alpha contour integrity auditor.
 *
 * Pinned to original licensed Commons-0053 P93 sources by its caller's exact
 * SHA checks. This auditor neither proposes a new cutout, changes original
 * photographic pixels, edits owner data nor grants original-photo 3D.
 *
 * Suspected bright/warm boundary residuals are *diagnostic candidates*, NOT
 * automatically identified mannequin pixels. Genuine pale fabric and light
 * piping are ambiguous until independent human visual examination.
 */
export const M41_GUARDS=Object.freeze({
 upperGarmentFraction:.23,
 maxRemovedOriginalVisibleFraction:.025,
 minimumChangedPixels:50,
 minimumWidth:32,
 minimumHeight:32,
 maxPixels:8_000_000,
 familyAlpha:'HOLD',
 consumer3DAdmitted:false,
 humanQualityApproved:false,
 originalSourceJpegMutable:false
});
const fail=(reason)=>{throw new Error('M41 PHOTO SOURCE INTEGRITY BLOCKED: '+reason);};
const isBytes=x=>x instanceof Uint8Array||Buffer.isBuffer(x);
const nearWhite=(r,g,b)=>r>=160&&g>=160&&b>=160&&Math.abs(r-g)<4&&Math.abs(g-b)<4;
const warm=(r,g,b)=>r>=90&&g>=75&&b>=60&&r-g>=4&&g-b>=3&&r+g+b>=280;
export function auditSourceAlphaContours41({
 sourceRGBA,baselineRGBA,candidateRGBA,width,height
}={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<M41_GUARDS.minimumWidth||height<M41_GUARDS.minimumHeight||
  width*height>M41_GUARDS.maxPixels||
  ![sourceRGBA,baselineRGBA,candidateRGBA].every(isBytes)||
  [sourceRGBA,baselineRGBA,candidateRGBA].some(x=>x.length!==width*height*4))
  fail('exact equal-sized original/source/mask RGB pixel data required');
 const pixels=width*height,changed=new Uint8Array(pixels),seen=new Uint8Array(pixels);
 let top=height,bottom=-1,visible=0,change=0,alphaAdded=0,changedRGB=0,
  sourceVsOriginal=0,protectedWhiteChanged=0,removedNonWarm=0,
  removedOutsideUpper=0,removedCandidates=0,changedX0=width,changedX1=-1,
  changedY0=height,changedY1=-1;
 for(let p=0;p<pixels;p++){
  const i=p*4;
  if(sourceRGBA[i]!==baselineRGBA[i]||
     sourceRGBA[i+1]!==baselineRGBA[i+1]||
     sourceRGBA[i+2]!==baselineRGBA[i+2])sourceVsOriginal++;
  if(sourceRGBA[i]!==candidateRGBA[i]||
     sourceRGBA[i+1]!==candidateRGBA[i+1]||
     sourceRGBA[i+2]!==candidateRGBA[i+2])changedRGB++;
  const alpha=baselineRGBA[i+3],next=candidateRGBA[i+3];
  if(alpha>=128){visible++;const y=Math.floor(p/width);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(next>alpha)alphaAdded++;
  if(alpha!==next){
   change++;changed[p]=1;
   const y=Math.floor(p/width),x=p%width;
   changedX0=Math.min(changedX0,x);changedX1=Math.max(changedX1,x);
   changedY0=Math.min(changedY0,y);changedY1=Math.max(changedY1,y);
   if(next!==0)fail('candidate alpha must be fully removed, not silently softened');
   if(nearWhite(sourceRGBA[i],sourceRGBA[i+1],sourceRGBA[i+2]))protectedWhiteChanged++;
   if(!warm(sourceRGBA[i],sourceRGBA[i+1],sourceRGBA[i+2]))removedNonWarm++;
  }
 }
 if(visible<1000||top>=bottom)
  fail('original cutout has no credible source-visible silhouette');
 const limit=Math.min(height-1,top+Math.round((bottom-top)*M41_GUARDS.upperGarmentFraction));
 for(let p=0;p<pixels;p++)if(changed[p]){
  const y=Math.floor(p/width);
  if(y<top||y>limit)removedOutsideUpper++;
 }
 if(sourceVsOriginal||changedRGB||alphaAdded||protectedWhiteChanged||
  removedNonWarm||removedOutsideUpper)
  fail('original RGB, protected bright fabric, alpha-only upper-bound, or warm source rule violated');
 if(change<M41_GUARDS.minimumChangedPixels||
  change>Math.round(visible*M41_GUARDS.maxRemovedOriginalVisibleFraction))
  fail('alpha candidate must have bounded nonzero source change volume');
 const queue=new Int32Array(change);
 const components=[],neighbors=[-1,0,1];
 for(let y=changedY0;y<=changedY1;y++)for(let x=changedX0;x<=changedX1;x++){
  const p=y*width+x;
  if(!changed[p]||seen[p])continue;
  let start=0,end=1,minX=x,maxX=x,minY=y,maxY=y;
  queue[0]=p;seen[p]=1;
  while(start<end){
   const at=queue[start++],yy=Math.floor(at/width),xx=at%width;
   minX=Math.min(xx,minX);maxX=Math.max(xx,maxX);minY=Math.min(yy,minY);maxY=Math.max(yy,maxY);
   for(const dy of neighbors)for(const dx of neighbors){
    if(!dx&&!dy)continue;
    const ny=yy+dy,nx=xx+dx;
    if(ny<0||ny>=height||nx<0||nx>=width)continue;
    const np=ny*width+nx;
    if(changed[np]&&!seen[np]){seen[np]=1;queue[end++]=np;}
   }
  }
  components.push({pixels:end,bounds:[minX,minY,maxX-minX+1,maxY-minY+1]});
 }
 components.sort((a,b)=>b.pixels-a.pixels);
 // A deliberately narrow diagnostic, not segmentation acceptance: remaining
 // warm pixels <=2 original-source pixels from candidate transparent alpha.
 // It cannot distinguish pale textile, seams, fringes and mannequin in RGB.
 let possibleWarmContourResidues=0,warmNearEdgeBefore=0;
 for(let y=Math.max(0,top);y<=limit;y++)for(let x=0;x<width;x++){
  const p=y*width+x,i=p*4;
  if(!warm(sourceRGBA[i],sourceRGBA[i+1],sourceRGBA[i+2]))continue;
  const near=(a)=>{
   for(let yy=Math.max(0,y-2);yy<=Math.min(height-1,y+2);yy++)
    for(let xx=Math.max(0,x-2);xx<=Math.min(width-1,x+2);xx++)
     if(a[(yy*width+xx)*4+3]<16)return true;
   return false;
  };
  if(baselineRGBA[i+3]>=128&&near(baselineRGBA))warmNearEdgeBefore++;
  if(candidateRGBA[i+3]>=128&&near(candidateRGBA))possibleWarmContourResidues++;
 }
 const missing=Object.freeze([
  'SOURCE_CONTOUR_AND_PIPING_INDEPENDENT_HUMAN_REVIEW_REQUIRED',
  'GARBAGE_MANNEQUIN_AND_TRUE_FABRIC_BOUNDARY_UNRESOLVED',
  '3D_SOURCE_UV_AND_ACTUAL_MASK_REVIEW_UNACCEPTED',
  'BOTH_AVATARS_FITTING_AND_PHOTO_STRETCH_UNREVIEWED',
  'CONTINUOUS_BODY_FABRIC_AND_LAYER_CLEARANCE_MISSING',
  'ORIGINAL_PHOTO_REAR_UNOBSERVED',
  'REAL_OWNER_SIGNED_DISPLAY_AND_PHYSICAL_PHONE_MISSING'
 ]);
 return Object.freeze({
  schema:'MAIN1054_M41_REAL_RGB_ALPHA_VISUAL_INSPECTION_ONLY/v1',
  status:'REAL_LICENSED_SOURCE_ALPHA_ONLY_CANDIDATE_NEEDS_HUMAN_REVIEW',
  dimensions:[width,height],
  originalVisiblePixels:visible,
  candidateChangedAlphaPixels:change,
  candidatePercentVisibleAffected:Number((100*change/visible).toFixed(4)),
  sourceOriginalRGBMismatchPixels:sourceVsOriginal,
  candidateOriginalRGBMismatchPixels:changedRGB,
  alphaIncreasePixels:alphaAdded,
  removedProtectedNearWhiteSamples:protectedWhiteChanged,
  removedNonWarmSamples:removedNonWarm,
  changedOutsideUpperSourceArea:removedOutsideUpper,
  changedPixelBounds:[changedX0,changedY0,changedX1-changedX0+1,changedY1-changedY0+1],
  sourceUpperBoundRow:limit,
  removedComponents:components.length,
  smallRemovedComponents:components.filter(c=>c.pixels<25).length,
  largestRemovedComponentPixels:components[0]?.pixels??0,
  leadingRemovedComponentBounds:components.slice(0,12).map(c=>c.bounds),
  possibleWarmContourResidues,
  warmNearEdgeBefore,
  contourResidueMetricIsNotGroundTruth:true,
  sourceRGBAndOriginalJpegUnchanged:true,
  humanReviewerIndependentlyVerified:false,
  independentHumanSourceFidelityAccepted:false,
  acceptedForPhotoDerivedMesh:false,
  consumer3DAdmitted:false,
  releaseAuthorized:false,
  familyAlpha:'HOLD',
  missingQualityEvidence:missing
 });
}
