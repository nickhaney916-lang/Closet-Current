/**
 * MAIN1054 M45 — source-image-specific V-neck mannequin-area alpha hypothesis.
 *
 * The original dress shows sizeable BEIGE MANNEQUIN material that survives
 * P93 as an antialiased woven checkerboard inside a BLACK V-collar. M44
 * flagged only 301 remaining warm *boundary* samples; none is ground truth.
 *
 * This bounded trial uses LOCAL ORIGINAL SOURCE COLOR CONTINUITY (blurred
 * native source RGB, not generated texture), seeded ONLY from pixels that P93
 * had already made transparent. A strict 16-source-pixel distance from those
 * same P93 seeds prevents growth across a whole garment or body. Bright white
 * piping and its 2px neighbors, dark black dress cloth and all original RGB
 * are protected. It is a DIFFERENT unapproved hypothesis than failed M42.
 *
 * The proposal is never auto-adopted, owned, rendered, accepted by a human,
 * or given consumer 3D authorization. Front image only; rear unobserved.
 */
import {auditSourceAlphaContours41} from '../main1054-mask41/original-rgb-alpha-audit.mjs';
export const M45_LOCK=Object.freeze({
 sourceId:'commons-0053',width:1920,height:2880,
 originalJpegSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 work47PngSHA256:'ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4',
 p93PngSHA256:'caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31',
 // Observed actual mannequin/collar cavity, not a generic segmentation box.
 // Includes the photographed V opening but not the garment logos or hem.
 region:Object.freeze([770,450,1230,730]),
 gaussianSigma:2.8,gaussianRadius:9,
 maxDistanceFromExistingP93Transparency:16,
 maxExtraOpaquePixelDeletion:7500,
 originalSourceRGBPreserved:true,
 originalP93NeverModified:true,
 independentHumanMaskAccepted:false,
 approved3D:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const refuse=x=>{throw Error('M45 REAL ORIGINAL VNECK SOURCE TRIAL BLOCKED: '+x)};
const accepted=x=>x instanceof Uint8Array;
const bright=(r,g,b)=>r>=160&&g>=160&&b>=160&&
 Math.abs(r-g)<4&&Math.abs(g-b)<4;
const reflect=(p,max)=>{
 if(p<0)return -p;
 if(p>=max)return 2*max-2-p;
 return p;
};
const pixel=(x,y,w)=>(y*w+x)*4;
export function proposeOriginalVNeckSourceMatte45({
 sourceRGBA,baselineRGBA,p93RGBA,width,height,
 sourceJpegSHA256,baselinePngSHA256,p93PngSHA256
}={}){
 if(sourceJpegSHA256!==M45_LOCK.originalJpegSHA256||
    baselinePngSHA256!==M45_LOCK.work47PngSHA256||
    p93PngSHA256!==M45_LOCK.p93PngSHA256||
    width!==M45_LOCK.width||height!==M45_LOCK.height||
    ![sourceRGBA,baselineRGBA,p93RGBA].every(accepted)||
    [sourceRGBA,baselineRGBA,p93RGBA].some(a=>a.length!==width*height*4))
  refuse('exact public source JPEG/P93 SHA-locked input and dimensions required');
 const earlier=auditSourceAlphaContours41({
  sourceRGBA,baselineRGBA,candidateRGBA:p93RGBA,width,height
 });
 if(earlier.candidateChangedAlphaPixels!==12961||
    earlier.sourceOriginalRGBMismatchPixels!==0||
    earlier.candidateOriginalRGBMismatchPixels!==0||
    earlier.alphaIncreasePixels!==0||
    earlier.removedProtectedNearWhiteSamples!==0)
  refuse('immutable authentic original P93 audit mismatch');
 const [x0,y0,x1,y1]=M45_LOCK.region,w=x1-x0,h=y1-y0,n=w*h;
 if(y1>earlier.sourceUpperBoundRow)
  refuse('trial neighborhood extends outside observed upper source region');
 const sz=M45_LOCK.gaussianRadius,sg=M45_LOCK.gaussianSigma;
 const kernel=Float64Array.from({length:sz*2+1},(_,i)=>
  Math.exp(-.5*((i-sz)/sg)**2));
 let total=0;for(const k of kernel)total+=k;
 for(let i=0;i<kernel.length;i++)kernel[i]/=total;
 // Build a Gaussian original-photo local tone estimate. The same exact RGB
 // of the untouched JPEG is used for both axes; no generated photo pixels.
 // The padded source sample uses real JPEG image pixels beyond the ROI edge.
 const horizontal=new Float32Array(n*3),smooth=new Float32Array(n*3);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const o=(y*w+x)*3,Y=y+y0;
  for(let k=-sz;k<=sz;k++){
   const X=x0+x+k,i=pixel(X,Y,width),f=kernel[k+sz];
   for(let c=0;c<3;c++)horizontal[o+c]+=sourceRGBA[i+c]*f;
  }
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const o=(y*w+x)*3;
  for(let k=-sz;k<=sz;k++){
   const Y=reflect(y+k,h),j=(Y*w+x)*3,f=kernel[k+sz];
   for(let c=0;c<3;c++)smooth[o+c]+=horizontal[j+c]*f;
  }
 }
 const protect=new Uint8Array(n),allowed=new Uint8Array(n),
  visited=new Uint8Array(n),dist=new Uint8Array(n);
 const queue=new Int32Array(n);
 let tail=0,seedCount=0;
 // A WHITE source piping pixel or nearby pixel cannot be removed. Radius 2
 // is intentionally stricter than the M43 manual one-pixel piping guard.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=pixel(x+x0,y+y0,width);
  if(baselineRGBA[i+3]<128||
     !bright(sourceRGBA[i],sourceRGBA[i+1],sourceRGBA[i+2]))continue;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const xx=x+dx,yy=y+dy;
   if(xx>=0&&xx<w&&yy>=0&&yy<h)protect[yy*w+xx]=1;
  }
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=y*w+x,i=pixel(x+x0,y+y0,width),j=p*3;
  const R=smooth[j],G=smooth[j+1],B=smooth[j+2];
  const oldTransparent=p93RGBA[i+3]<16;
  const originalMannequinLikeTone=R>=68&&G>=59&&B>=52&&
   R-G>=1&&R-G<=31&&G-B>=0&&G-B<=27;
  if(!protect[p]&&(oldTransparent||originalMannequinLikeTone))
   allowed[p]=1;
  const actualOriginalSeed=oldTransparent&&sourceRGBA[i]>=65&&
   sourceRGBA[i+1]>=55&&sourceRGBA[i+2]>=45&&!protect[p];
  if(actualOriginalSeed){
   visited[p]=1;queue[tail++]=p;seedCount++;
  }
  dist[p]=255;
 }
 if(seedCount<100||seedCount>n*.7)refuse('no defensible real P93 source transparency seeds');
 // Compute the distance to an original P93 transparent seed using a separate
 // uniform 8-neighbor distance BFS. Never seed from newly selected pixels.
 let head=0,dtail=tail;
 const dq=new Int32Array(n);
 for(let k=0;k<tail;k++){dq[k]=queue[k];dist[queue[k]]=0;}
 const moves=[-1,0,1];
 while(head<dtail){
  const p=dq[head++],d=dist[p],x=p%w,y=Math.floor(p/w);
  if(d>=M45_LOCK.maxDistanceFromExistingP93Transparency)continue;
  for(const dy of moves)for(const dx of moves){
   if(!dx&&!dy)continue;
   const xx=x+dx,yy=y+dy;
   if(xx<0||xx>=w||yy<0||yy>=h)continue;
   const q=yy*w+xx;
   if(dist[q]>d+1){dist[q]=d+1;dq[dtail++]=q;}
  }
 }
 // Flood through source-image color continuity but stop at real dark cloth,
 // protected piping and at most 16 original-image pixels from actual P93.
 head=0;
 while(head<tail){
  const p=queue[head++],x=p%w,y=Math.floor(p/w);
  for(const dy of moves)for(const dx of moves){
   if(!dx&&!dy)continue;
   const xx=x+dx,yy=y+dy;
   if(xx<0||xx>=w||yy<0||yy>=h)continue;
   const q=yy*w+xx;
   if(!visited[q]&&allowed[q]&&
      dist[q]<=M45_LOCK.maxDistanceFromExistingP93Transparency){
    visited[q]=1;queue[tail++]=q;
   }
  }
 }
 const candidate=new Uint8Array(p93RGBA);
 let extra=0,rawDarkFiltered=0,changedProtected=0,alphaAboveOriginal=0;
 let minX=width,maxX=-1,minY=height,maxY=-1;
 let originalVisible=earlier.originalVisiblePixels;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=y*w+x,i=pixel(x+x0,y+y0,width);
  if(!visited[p]||p93RGBA[i+3]<128||baselineRGBA[i+3]<128)continue;
  // A locally bright, woven mannequin pattern may include very dark camera
  // noise. Restrict this unreviewed hypothesis further to original RGB
  // above genuinely black textile. Some mannequin speckles are left intact.
  if(sourceRGBA[i]<60||sourceRGBA[i+1]<50||sourceRGBA[i+2]<42){
   rawDarkFiltered++;continue;
  }
  if(protect[p]){changedProtected++;continue;}
  candidate[i+3]=0;extra++;
  const X=x+x0,Y=y+y0;
  minX=Math.min(minX,X);maxX=Math.max(maxX,X);
  minY=Math.min(minY,Y);maxY=Math.max(maxY,Y);
 }
 if(extra<50||extra>M45_LOCK.maxExtraOpaquePixelDeletion||
    extra>Math.round(originalVisible*.01)||
    changedProtected!==0)
  refuse('original-only cavity candidate too small, too large or protected');
 let originalRgbErrors=0,opaqueIncreased=0,elsewhereChanged=0,
  logoErasure=0,changedAlpha=0;
 for(let p=0;p<width*height;p++){
  const i=p*4,X=p%width,Y=Math.floor(p/width);
  for(let c=0;c<3;c++)if(candidate[i+c]!==sourceRGBA[i+c])originalRgbErrors++;
  if(candidate[i+3]>p93RGBA[i+3]||candidate[i+3]>baselineRGBA[i+3])
   opaqueIncreased++;
  if(candidate[i+3]!==p93RGBA[i+3]){
   changedAlpha++;
   if(X<x0||X>=x1||Y<y0||Y>=y1)elsewhereChanged++;
   if(bright(sourceRGBA[i],sourceRGBA[i+1],sourceRGBA[i+2]))
    logoErasure++;
  }
 }
 if(originalRgbErrors||opaqueIncreased||elsewhereChanged||
    logoErasure||changedAlpha!==extra)
  refuse('original JPEG RGB/opaque/piping/off-region changed');
 return Object.freeze({
  candidateRGBA:candidate,
  receipt:Object.freeze({
   schema:'MAIN1054_M45_GENUINE_PHOTO_LOCAL_TONE_VNECK_PROPOSAL/v1',
   status:'LICENSED_ORIGINAL_JPEG_VNECK_SOURCE_MATTE_CANDIDATE_UNREVIEWED',
   originalJpegSHA256:M45_LOCK.originalJpegSHA256,
   originalWork47PngSHA256:M45_LOCK.work47PngSHA256,
   originalP93PngSHA256:M45_LOCK.p93PngSHA256,
   observedOriginalSourceDimensions:Object.freeze([width,height]),
   originalP93AlphaRemoved:earlier.candidateChangedAlphaPixels,
   additionallyTransparentOriginalOpaquePixels:extra,
   totalOriginalOpaqueRemovedIncludingP93:earlier.candidateChangedAlphaPixels+extra,
   changedPixelBounds:Object.freeze([minX,minY,maxX-minX+1,maxY-minY+1]),
   protectedOriginalBrightPipingOrLogoPixelsRemoved:logoErasure,
   originalSourceRGBPixelsChanged:originalRgbErrors,
   sourceOrP93AlphaIncreasedPixels:opaqueIncreased,
   offVNeckOriginalSourcePixelsChanged:elsewhereChanged,
   sourcePhotoUnaltered:true,sourceP93Unaltered:true,
   originalPhotoBacksideObserved:false,
   excludedDarkOriginalPixels:rawDarkFiltered,
   sourceColorSegmentationNotGroundTruth:true,
   automaticMannequinVsFabricAccuracyNotProven:true,
   visuallyBetterIsNotHumanAcceptance:true,
   sourceOriginalPhoto2DFallbackRequired:true,
   humanMaskAccepted:false,approved3D:false,originalSourceGarmentFidelityAccepted:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  })
 });
}
