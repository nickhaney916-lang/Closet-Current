/**
 * MAIN1054 M43: Human-annotated original-source contour correction contract.
 *
 * All edits are explicitly unverified annotation hypotheses, reconstructed
 * onto genuine SHA-locked licensed original RGB in a separate disposable
 * PNG. Neither browser controls nor synthetic tests ever grant consumer 3D.
 *
 * Authority to apply a patch is a local source-integrity check, NOT human
 * review verification or suitability to fit an anatomical 163-bone body.
 */
import {auditSourceAlphaContours41} from '../main1054-mask41/original-rgb-alpha-audit.mjs';
export const M43_SOURCE=Object.freeze({
 sourceId:'commons-0053',width:1920,height:2880,
 originalJpegSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 baselinePngSHA256:'ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4',
 p93ProposalSHA256:'caf1e8b5e292e9397262333ba6a3d2f673bd6c81b6b1694b5abf69aa90676a31',
 maxChangedPixels:2500,patchSchema:'MAIN1054_M43_UNVERIFIED_MANUAL_CONTOUR_PATCH/v1',
 releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
});
const fail=why=>{throw Error('M43 HUMAN ANNOTATION SOURCE BLOCKED: '+why);};
const isByte=a=>a instanceof Uint8Array;
const same=(a,b)=>a===b;
const neutral=(r,g,b)=>r>=160&&g>=160&&b>=160&&
 Math.abs(r-g)<4&&Math.abs(g-b)<4;
const nearP93=(x,y,base,p93,w,h,radius=8)=>{
 for(let yy=Math.max(0,y-radius);yy<=Math.min(h-1,y+radius);yy++)
  for(let xx=Math.max(0,x-radius);xx<=Math.min(w-1,x+radius);xx++){
   const k=(yy*w+xx)*4+3;
   if(base[k]>=128&&p93[k]===0)return true;
  }
 return false;
};
const besideBright=(x,y,source,base,w,h)=>{
 for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)
  for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){
   const i=(yy*w+xx)*4;
   if(base[i+3]>=128&&neutral(source[i],source[i+1],source[i+2]))
    return true;
  }
 return false;
};
/** Returns only a local UNAPPROVED candidate and anonymous measurements. */
export function applyUnverifiedSourceAnnotations43({
 patch,sourceRGBA,baselineRGBA,p93RGBA,width,height
}={}){
 if(width!==M43_SOURCE.width||height!==M43_SOURCE.height||
  ![sourceRGBA,baselineRGBA,p93RGBA].every(isByte)||
  [sourceRGBA,baselineRGBA,p93RGBA].some(a=>a.length!==width*height*4))
  fail('exact pixel dimensions and original licensed source required');
 if(!patch||Array.isArray(patch)||typeof patch!=='object'||
  patch.schema!==M43_SOURCE.patchSchema||
  patch.sourceId!==M43_SOURCE.sourceId||
  patch.sourceJpegSHA256!==M43_SOURCE.originalJpegSHA256||
  patch.baselinePngSHA256!==M43_SOURCE.baselinePngSHA256||
  patch.p93ProposalSHA256!==M43_SOURCE.p93ProposalSHA256||
  !Array.isArray(patch.dimensions)||patch.dimensions.length!==2||
  patch.dimensions[0]!==width||patch.dimensions[1]!==height||
  patch.releaseAuthorized!==false||patch.consumer3DAdmitted!==false||
  patch.independentHumanReviewAccepted!==false||
  patch.reviewerIdentityIndependentlyVerified!==false||
  patch.familyAlpha!=='HOLD'||patch.recordKind!=='LOCAL_UNVERIFIED_SOURCE_PIXEL_ANNOTATIONS')
  fail('the patch is neither source-pinned nor explicitly non-authorizing');
 if(typeof patch.notes!=='string'||patch.notes.length>1500||
  !Array.isArray(patch.changes)||patch.changes.length===0||
  patch.changes.length>M43_SOURCE.maxChangedPixels)
  fail('bounded annotated pixel list and reviewer notes required');
 const sourceAudit=auditSourceAlphaContours41({
  sourceRGBA,baselineRGBA,candidateRGBA:p93RGBA,width,height
 });
 const upper=sourceAudit.sourceUpperBoundRow;
 const alpha=new Uint8Array(p93RGBA);
 const seen=new Set();let restored=0,removed=0,closest=height;
 for(const c of patch.changes){
  if(!c||Array.isArray(c)||typeof c!=='object'||
   !Number.isInteger(c.x)||!Number.isInteger(c.y)||
   c.x<0||c.y<0||c.x>=width||c.y>=height||
   !['remove','restore'].includes(c.operation))
   fail('pixel coordinate and mode invalid');
  const {x,y,operation}=c,p=y*width+x,i=p*4;
  if(seen.has(p))fail('duplicate pixel annotation could mask conflicting edits');
  seen.add(p);
  if(y<0||y>upper)fail('outside the conservative upper photograph contour review region');
  for(let color=0;color<3;color++){
   if(!same(sourceRGBA[i+color],baselineRGBA[i+color])||
      !same(sourceRGBA[i+color],p93RGBA[i+color]))
    fail('source JPEG original RGB differed from the annotation baseline');
  }
  if(operation==='remove'){
   if(p93RGBA[i+3]<128||baselineRGBA[i+3]<128||
    !nearP93(x,y,baselineRGBA,p93RGBA,width,height))
    fail('removal outside the authentic original P93 changed-edge neighborhood');
   if(besideBright(x,y,sourceRGBA,baselineRGBA,width,height))
    fail('cannot remove original near-white logo/piping or a neighboring source pixel');
   alpha[i+3]=0;removed++;
  }else{
   if(p93RGBA[i+3]!==0||baselineRGBA[i+3]<128||
     !nearP93(x,y,baselineRGBA,p93RGBA,width,height,0))
    fail('restore must reverse only an actually removed original P93 pixel');
   alpha[i+3]=baselineRGBA[i+3];restored++;
  }
  closest=Math.min(closest,y);
 }
 let mismatches=0,actualAlphaChanged=0,alphaIncreaseVsOriginal=0;
 for(let p=0;p<width*height;p++){
  const i=p*4;
  for(let color=0;color<3;color++)if(alpha[i+color]!==sourceRGBA[i+color])mismatches++;
  if(alpha[i+3]!==p93RGBA[i+3])actualAlphaChanged++;
  if(alpha[i+3]>baselineRGBA[i+3])alphaIncreaseVsOriginal++;
 }
 if(mismatches||alphaIncreaseVsOriginal||actualAlphaChanged!==patch.changes.length)
  fail('generated candidate mutated source JPEG RGB or violated old source alpha');
 const receipt=Object.freeze({
  schema:'MAIN1054_M43_ORIGINAL_SOURCE_MANUAL_PATCH_LOCAL_PROPOSAL_ONLY/v1',
  status:'UNVERIFIED_PERSON_ANNOTATED_ALPHA_ONLY_NOT_FOR_3D',
  sourceId:M43_SOURCE.sourceId,sourceJpegSHA256:M43_SOURCE.originalJpegSHA256,
  totalUserAnnotatedPixels:patch.changes.length,manuallyRemovedPixels:removed,
  p93PixelsRestoredFromOriginalBaseline:restored,
  originalRGBChangedPixels:mismatches,alphaAboveOriginalBaseline:alphaIncreaseVsOriginal,
  originalP93MaskPreserved:true,originalJpegPreserved:true,
  usedOnlyOriginalSourceRGB:true,sourceUpperBoundRow:upper,
  nearestChangedSourceRow:closest,
  syntheticClickTestsAreNotRealHumanAcceptance:true,
  reviewerIdentityIndependentlyVerified:false,
  independentHumanReviewAccepted:false,
  acceptedOriginalPhotoSegmentation:false,acceptedPhotoDerived3D:false,
  releaseAuthorized:false,consumer3DAdmitted:false,familyAlpha:'HOLD'
 });
 return Object.freeze({candidateRGBA:alpha,receipt});
}
