import test from 'node:test';
import assert from 'node:assert/strict';
import {
 proposeSourceConservativeFringe42,
 M42_SOURCE_SHA,M42_BASELINE_SHA,M42_P93_TRIAL_SHA
} from '../research/main1054-mask42/conservative-fringe-trial.mjs';
const W=110,H=100;
function fixture(){
 const sourceRGBA=new Uint8Array(W*H*4);
 const baselineRGBA=new Uint8Array(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=(y*W+x)*4,alpha=x>=20&&x<=90&&y>=15&&y<=93?255:0;
  sourceRGBA.set([24,20,28,255],i);
  baselineRGBA.set([24,20,28,alpha],i);
 }
 const fill=(x,y,r,g,b)=>{
  const i=(y*W+x)*4;
  sourceRGBA.set([r,g,b,255],i);
  baselineRGBA.set([r,g,b,255],i);
 };
 // Existing P93 proposed authentic warm boundary pixels.
 for(let y=17;y<=24;y++)for(let x=22;x<=29;x++)
  fill(x,y,170,148,129);
 // A few source-color-consistent 1-pixel residual candidates.
 for(let y=18;y<=20;y++)fill(21,y,171,149,129);
 // Authentic white seam at old P93 boundary: must not be removed.
 for(let y=17;y<=24;y++)fill(30,y,245,245,245);
 // Distant warm cloth is NOT automatically proposed as mannequin.
 for(let y=18;y<=24;y++)for(let x=47;x<=50;x++)
  fill(x,y,172,148,126);
 const p93RGBA=new Uint8Array(baselineRGBA);
 for(let y=17;y<=24;y++)for(let x=22;x<=29;x++)
  p93RGBA[(y*W+x)*4+3]=0;
 return {sourceRGBA,baselineRGBA,p93RGBA,width:W,height:H,
  originalJpegSHA256:M42_SOURCE_SHA,
  baselinePngSHA256:M42_BASELINE_SHA,
  p93ProposalSHA256:M42_P93_TRIAL_SHA};
}
test('M42 actually proposes only source-continuous 1px fringe next to changed original P93 alpha',()=>{
 const f=fixture(),source=new Uint8Array(f.sourceRGBA),
  base=new Uint8Array(f.baselineRGBA),before=new Uint8Array(f.p93RGBA);
 const q=proposeSourceConservativeFringe42(f);
 assert.equal(q.status,'SOURCE_CONTINUOUS_FRINGE_CANDIDATE_UNREVIEWED');
 assert.equal(q.additionalAlphaPixelsProposed,3);
 assert.equal(q.existingP93RemovedAlphaPixels,64);
 assert.equal(q.totalSourceAlphaPixelsProposedRemoved,67);
 for(let y=18;y<=20;y++)assert.equal(q.candidateRGBA[(y*W+21)*4+3],0);
 assert.equal(q.candidateRGBA[(18*W+30)*4+3],255,'piping protected');
 assert.equal(q.candidateRGBA[(18*W+48)*4+3],255,'distant authentic cloth protected');
 assert.equal(q.newPixelsAreAdjacentToOldP93Only,true);
 assert.equal(q.candidateOriginalRGBMismatchPixels,0);
 assert.equal(q.protectedWhiteSourcePixelsRemoved,0);
 assert.equal(q.changedOutsideConservativeUpperSourceArea,0);
 assert.equal(q.independentHumanSourceFidelityAccepted,false);
 assert.equal(q.acceptedForPhotoDerivedMesh,false);
 assert.equal(q.consumer3DAdmitted,false);
 assert.equal(q.releaseAuthorized,false);
 assert.equal(q.familyAlpha,'HOLD');
 assert.deepEqual(f.sourceRGBA,source);
 assert.deepEqual(f.baselineRGBA,base);
 assert.deepEqual(f.p93RGBA,before);
});
test('M42 refuses forgery of real licensed source/p93 SHA or changed RGB',()=>{
 const f=fixture();
 for(const key of ['originalJpegSHA256','baselinePngSHA256','p93ProposalSHA256'])
  assert.throws(()=>proposeSourceConservativeFringe42({...f,[key]:'f'.repeat(64)}),/BLOCKED/);
 f.p93RGBA[(18*W+21)*4+1]=200;
 assert.throws(()=>proposeSourceConservativeFringe42(f),/BLOCKED/);
});
test('M42 rejects original P93 mass deletion, original piping loss or changed source RGB',()=>{
 const f=fixture();
 f.p93RGBA[(18*W+30)*4+3]=0;
 assert.throws(()=>proposeSourceConservativeFringe42(f),/BLOCKED/);
 const g=fixture();
 g.p93RGBA[(70*W+40)*4+3]=0;
 assert.throws(()=>proposeSourceConservativeFringe42(g),/BLOCKED/);
 const h=fixture();h.baselineRGBA[(40*W+40)*4]=200;
 assert.throws(()=>proposeSourceConservativeFringe42(h),/BLOCKED/);
});
test('M42 refuses overlarge source fringe rather than silently clipping pixel changes',()=>{
 const f=fixture();
 // Eight adjacent warm pixels exceed ceil(~5600 * .001) six-pixel cap.
 for(let y=17;y<=24;y++){
  const i=(y*W+21)*4;
  f.sourceRGBA.set([171,149,129,255],i);
  f.baselineRGBA.set([171,149,129,255],i);
  f.p93RGBA.set([171,149,129,255],i);
 }
 const q=proposeSourceConservativeFringe42(f);
 assert.equal(q.status,'TRIAL_REFUSED_OVERLARGE_UNCERTAIN_FRINGE');
 assert.deepEqual(q.candidateRGBA,f.p93RGBA);
 assert.equal(q.consumer3DAdmitted,false);
});
test('M42 no acceptable extra warm-contour witness does not manufacture improvement',()=>{
 const f=fixture();
 for(let y=18;y<=20;y++){
  const i=(y*W+21)*4;
  f.sourceRGBA.set([24,20,28,255],i);
  f.baselineRGBA.set([24,20,28,255],i);
  f.p93RGBA.set([24,20,28,255],i);
 }
 const q=proposeSourceConservativeFringe42(f);
 assert.equal(q.status,'NO_SOURCE_CONTINUOUS_SAFE_EXTRA_PIXEL_FOUND');
 assert.deepEqual(q.candidateRGBA,f.p93RGBA);
 assert.equal(q.humanContourAccepted,false);
});
test('M42 candidate cannot overstate actual visual accuracy with caller-side flags',()=>{
 const f=fixture();
 const result=proposeSourceConservativeFringe42({...f,
  independentHumanApproval:true,reviewerAuthenticated:true,
  actual3DQualityAccepted:true,releaseAuthorized:true});
 assert.equal(result.status,'SOURCE_CONTINUOUS_FRINGE_CANDIDATE_UNREVIEWED');
 assert.equal(result.photoFidelityNotMeasuredByColorContinuity,true);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.releaseAuthorized,false);
});
