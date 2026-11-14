import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSourceAlphaContours41} from '../research/main1054-mask41/original-rgb-alpha-audit.mjs';

const W=110,H=100;
function fixture(){
 const source=new Uint8Array(W*H*4),baseline=new Uint8Array(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=(y*W+x)*4;
  source.set([24,20,28,255],i);
  baseline.set([24,20,28,x>=20&&x<=90&&y>=15&&y<=93?255:0],i);
 }
 for(let y=17;y<=24;y++)for(let x=22;x<=29;x++){
  const i=(y*W+x)*4;
  source.set([170,148,129,255],i);
  baseline.set([170,148,129,255],i);
 }
 // Explicit protected white piping remains present and unchanged.
 for(let y=17;y<=25;y++){
  const i=(y*W+30)*4;
  source.set([245,245,245,255],i);
  baseline.set([245,245,245,255],i);
 }
 const proposed=new Uint8Array(baseline);
 for(let y=17;y<=24;y++)for(let x=22;x<=29;x++)proposed[(y*W+x)*4+3]=0;
 return {sourceRGBA:source,baselineRGBA:baseline,candidateRGBA:proposed,width:W,height:H};
}
test('M41 measures source RGB-preserved bounded alpha-only contour removal but refuses 3D admission',()=>{
 const q=auditSourceAlphaContours41(fixture());
 assert.equal(q.candidateChangedAlphaPixels,64);
 assert.equal(q.removedComponents,1);
 assert.equal(q.largestRemovedComponentPixels,64);
 assert.deepEqual(q.changedPixelBounds,[22,17,8,8]);
 assert.equal(q.sourceOriginalRGBMismatchPixels,0);
 assert.equal(q.candidateOriginalRGBMismatchPixels,0);
 assert.equal(q.removedProtectedNearWhiteSamples,0);
 assert.equal(q.changedOutsideUpperSourceArea,0);
 assert.equal(q.alphaIncreasePixels,0);
 assert.equal(q.humanReviewerIndependentlyVerified,false);
 assert.equal(q.independentHumanSourceFidelityAccepted,false);
 assert.equal(q.consumer3DAdmitted,false);
 assert.equal(q.releaseAuthorized,false);
 assert.equal(q.familyAlpha,'HOLD');
});
test('M41 source RGB pixels are immune to candidate palette/texture replacement',()=>{
 const a=fixture();
 a.candidateRGBA[(30*W+40)*4+2]=220;
 assert.throws(()=>auditSourceAlphaContours41(a),/SOURCE INTEGRITY BLOCKED/);
 const b=fixture();b.baselineRGBA[(30*W+40)*4+2]=220;
 assert.throws(()=>auditSourceAlphaContours41(b),/SOURCE INTEGRITY BLOCKED/);
});
test('M41 original photo piping and unobserved cloth cannot be removed by contour guess',()=>{
 const a=fixture(),i=(20*W+30)*4+3;a.candidateRGBA[i]=0;
 assert.throws(()=>auditSourceAlphaContours41(a),/protected bright fabric/);
 const b=fixture();b.candidateRGBA[(70*W+40)*4+3]=0;
 assert.throws(()=>auditSourceAlphaContours41(b),/upper-bound/);
});
test('M41 rejects alpha increases, partial alpha, no-op and mass deletion',()=>{
 const a=fixture();
 a.baselineRGBA[(40*W+20)*4+3]=50;
 a.candidateRGBA[(40*W+20)*4+3]=255;
 assert.throws(()=>auditSourceAlphaContours41(a),/SOURCE INTEGRITY BLOCKED/);
 const b=fixture();b.candidateRGBA[(18*W+24)*4+3]=100;
 assert.throws(()=>auditSourceAlphaContours41(b),/fully removed/);
 const c=fixture();c.candidateRGBA=new Uint8Array(c.baselineRGBA);
 assert.throws(()=>auditSourceAlphaContours41(c),/nonzero/);
 const d=fixture();
 for(let y=17;y<=29;y++)for(let x=22;x<=48;x++)
  d.candidateRGBA[(y*W+x)*4+3]=0;
 assert.throws(()=>auditSourceAlphaContours41(d),/SOURCE INTEGRITY BLOCKED/);
});
test('M41 rejects wrong source geometry, byte lengths, absent alpha and fake masks',()=>{
 const x=fixture();
 for(const v of [{...x,width:500},{...x,candidateRGBA:new Uint8Array(10)},
  {...x,sourceRGBA:null},{...x,height:10}])
  assert.throws(()=>auditSourceAlphaContours41(v),/SOURCE INTEGRITY BLOCKED/);
});
test('M41 numeric diagnostics remain deterministic and cannot self-authorize a human review',()=>{
 const a=auditSourceAlphaContours41(fixture()),b=auditSourceAlphaContours41(fixture());
 assert.deepEqual(a,b);
 assert.equal(a.contourResidueMetricIsNotGroundTruth,true);
 assert.equal(a.acceptedForPhotoDerivedMesh,false);
 assert.ok(a.missingQualityEvidence.includes('ORIGINAL_PHOTO_REAR_UNOBSERVED'));
 assert.ok(a.missingQualityEvidence.includes('SOURCE_CONTOUR_AND_PIPING_INDEPENDENT_HUMAN_REVIEW_REQUIRED'));
});
