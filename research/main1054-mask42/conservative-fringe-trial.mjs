/**
 * M42 independent source-locked single-pixel contour color-continuity trial.
 *
 * This is an extra alpha-only PROPOSAL on the unapproved P93 original-dress
 * trial, never an improved garment or approved 3D input. It only considers
 * existing visible pale/warm pixels directly adjacent to PIXELS P93 REMOVED,
 * with close authentic source RGB to that removed source pixel. White piping,
 * neutral logo, untouched source pixels away from original trial regions,
 * front RGB, JPEG/UV/geometry and all real owner clothing remain unchanged.
 *
 * A warm pixel may be genuine beige fabric! No numeric improvement or
 * synthetic browser rating authorizes a human mask decision.
 */
import {auditSourceAlphaContours41} from '../main1054-mask41/original-rgb-alpha-audit.mjs';
export const M42_SOURCE_SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
export const M42_BASELINE_SHA='ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4';
export const M42_P93_TRIAL_SHA='caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31';
const fail=why=>{throw Error('M42 ORIGINAL SOURCE CONSERVATIVE TRIAL BLOCKED: '+why);};
const isRGB=x=>x instanceof Uint8Array;
const nearWhite=(r,g,b)=>r>=160&&g>=160&&b>=160&&Math.abs(r-g)<4&&Math.abs(g-b)<4;
const warm=(r,g,b)=>r>=90&&g>=75&&b>=60&&r-g>=4&&g-b>=3&&r+g+b>=280;
export const M42_POLICY=Object.freeze({
  onlyDirectlyTouchingPreviouslyRemovedP93Pixels:true,
  maxRgbaColorDeltaPerChannel:18,
  maxTotalRgbColorDelta:36,
  maxNewRemovedPixelsAbsolute:1000,
  maxExtraFractionOfOriginalVisible:.001,
  noColorOrOpaqueIncreases:true,
  preserveWhitePipingAndItsImmediateNeighbor:true,
  independentHumanApproval:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const empty=(status,sourceAudit,p93RGBA,counts)=>Object.freeze({
 schema:'MAIN1054_M42_ALPHA_ONLY_SOURCE_FRINGE_TRIAL/v1',status,
 sourceAuditStatus:sourceAudit?.status,
 existingP93RemovedAlphaPixels:sourceAudit?.candidateChangedAlphaPixels||0,
 extraCandidateAlphaPixels:0,
 comparedRealSourceAdjacentWitnesses:counts,
 finalRGBChangedPixels:0,
 protectedWhiteSourcePixelsRemoved:0,
 sourceOriginalRgbaUnchanged:true,
 suggestedPixelCountIsNotVisualAccuracy:true,
 humanContourAccepted:false,
 approvedReal3D:false,consumer3DAdmitted:false,releaseAuthorized:false,
 familyAlpha:'HOLD',
 candidateRGBA:new Uint8Array(p93RGBA)
});
export function proposeSourceConservativeFringe42({
 sourceRGBA,baselineRGBA,p93RGBA,width,height,
 originalJpegSHA256,baselinePngSHA256,p93ProposalSHA256
}={}){
 if(originalJpegSHA256!==M42_SOURCE_SHA||
   baselinePngSHA256!==M42_BASELINE_SHA||
   p93ProposalSHA256!==M42_P93_TRIAL_SHA)
  fail('all three genuine original, baseline and P93 source identities required');
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
   width<32||height<32||width*height>8_000_000||
   ![sourceRGBA,baselineRGBA,p93RGBA].every(isRGB)||
   [sourceRGBA,baselineRGBA,p93RGBA].some(x=>x.length!==width*height*4))
  fail('same-dimension original real source RGBA required');
 const first=auditSourceAlphaContours41({
  sourceRGBA,baselineRGBA,candidateRGBA:p93RGBA,width,height
 });
 if(first.sourceOriginalRGBMismatchPixels||first.candidateOriginalRGBMismatchPixels||
   first.alphaIncreasePixels||first.removedProtectedNearWhiteSamples||
   first.changedOutsideUpperSourceArea||first.removedNonWarmSamples)
  fail('original P93 cutout did not pass exact source audit');
 const n=width*height,changed=new Uint8Array(n),selected=new Uint8Array(n);
 const upper=first.sourceUpperBoundRow;
 let candidateWitnesses=0,sourceOnlyWarmRejectedWhite=0,scanned=0;
 const delta=(i,j)=>{
  let sum=0;
  for(let c=0;c<3;c++){
   const d=Math.abs(sourceRGBA[i+c]-sourceRGBA[j+c]);
   if(d>M42_POLICY.maxRgbaColorDeltaPerChannel)return false;
   sum+=d;
  }
  return sum<=M42_POLICY.maxTotalRgbColorDelta;
 };
 // Only original P93 *actually changed* pixels can seed the test. Do NOT
 // use general transparency in the background as an expansion prompt.
 const newly=new Uint32Array(first.candidateChangedAlphaPixels);
 let count=0;
 for(let p=0;p<n;p++){
  const i=p*4;
  if(baselineRGBA[i+3]>=16&&p93RGBA[i+3]===0){
   changed[p]=1;newly[count++]=p;
  }
 }
 if(count!==first.candidateChangedAlphaPixels)
  fail('original P93 changed alpha count missing or mismatched');
 const output=new Uint8Array(p93RGBA);
 for(let j=0;j<count;j++){
  const p=newly[j],y=Math.floor(p/width),x=p%width,i=p*4;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dy&&!dx)continue;
   const yy=y+dy,xx=x+dx;
   if(yy<0||yy>=height||xx<0||xx>=width||yy>upper)continue;
   const q=yy*width+xx,k=q*4;
   if(selected[q]||changed[q]||
     p93RGBA[k+3]<128||baselineRGBA[k+3]<128||
     !warm(sourceRGBA[k],sourceRGBA[k+1],sourceRGBA[k+2])||
     nearWhite(sourceRGBA[k],sourceRGBA[k+1],sourceRGBA[k+2])||
     !delta(i,k))continue;
   candidateWitnesses++;
   // Never erode the pixel immediately abutting authentic white piping/
   // lettering even if it looks like the photographed pale mannequin.
   let nearProtectedWhite=false;
   for(let ddy=-1;ddy<=1&&!nearProtectedWhite;ddy++)
    for(let ddx=-1;ddx<=1;ddx++){
     const yyy=yy+ddy,xxx=xx+ddx;
     if(yyy<0||yyy>=height||xxx<0||xxx>=width)continue;
     const t=(yyy*width+xxx)*4;
     if(baselineRGBA[t+3]>=128&&
        nearWhite(sourceRGBA[t],sourceRGBA[t+1],sourceRGBA[t+2])){
      nearProtectedWhite=true;break;
     }
    }
   if(nearProtectedWhite){sourceOnlyWarmRejectedWhite++;continue;}
   selected[q]=1;scanned++;
  }
 }
 const cap=Math.min(M42_POLICY.maxNewRemovedPixelsAbsolute,
   Math.round(first.originalVisiblePixels*M42_POLICY.maxExtraFractionOfOriginalVisible));
 if(scanned>cap)
  return empty('TRIAL_REFUSED_OVERLARGE_UNCERTAIN_FRINGE',first,p93RGBA,scanned);
 if(scanned===0)
  return empty('NO_SOURCE_CONTINUOUS_SAFE_EXTRA_PIXEL_FOUND',first,p93RGBA,0);
 for(let p=0;p<n;p++)if(selected[p])output[p*4+3]=0;
 const next=auditSourceAlphaContours41({
  sourceRGBA,baselineRGBA,candidateRGBA:output,width,height
 });
 if(next.candidateChangedAlphaPixels-first.candidateChangedAlphaPixels!==scanned||
    next.sourceOriginalRGBMismatchPixels||next.candidateOriginalRGBMismatchPixels||
    next.removedProtectedNearWhiteSamples||next.alphaIncreasePixels||
    next.removedNonWarmSamples||next.changedOutsideUpperSourceArea)
  fail('new alpha is not an exact source-preserving bounded extension');
 // These are diagnostic witness counts, not a claim of cleaner fabric.
 return Object.freeze({
  schema:'MAIN1054_M42_ALPHA_ONLY_SOURCE_FRINGE_TRIAL/v1',
  status:'SOURCE_CONTINUOUS_FRINGE_CANDIDATE_UNREVIEWED',
  existingP93RemovedAlphaPixels:first.candidateChangedAlphaPixels,
  additionalAlphaPixelsProposed:scanned,
  totalSourceAlphaPixelsProposedRemoved:next.candidateChangedAlphaPixels,
  originalVisiblePixels:first.originalVisiblePixels,
  sourceOnlyWarmCandidatesRejectedAtWhiteBorder:sourceOnlyWarmRejectedWhite,
  originalP93WarmNearEdgeSamples:first.possibleWarmContourResidues,
  currentWarmNearEdgeSamples:next.possibleWarmContourResidues,
  directAuthenticSourcePixelWitnesses:scanned,
  sourceOriginalRGBMismatchPixels:next.sourceOriginalRGBMismatchPixels,
  candidateOriginalRGBMismatchPixels:next.candidateOriginalRGBMismatchPixels,
  protectedWhiteSourcePixelsRemoved:next.removedProtectedNearWhiteSamples,
  newAlphaIncreasePixels:next.alphaIncreasePixels,
  changedOutsideConservativeUpperSourceArea:next.changedOutsideUpperSourceArea,
  newPixelsAreAdjacentToOldP93Only:true,
  originalSourceJpegUntouched:true,
  originalSourceRGBUntouched:true,
  originalBaselineAndP93ProposalUntouched:true,
  photoFidelityNotMeasuredByColorContinuity:true,
  independentHumanSourceFidelityAccepted:false,
  acceptedForPhotoDerivedMesh:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD',
  candidateRGBA:output
 });
}
