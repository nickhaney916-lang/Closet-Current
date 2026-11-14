import test from 'node:test';
import assert from 'node:assert/strict';
import {
 M44_SOURCE,locateOriginalSourceReviewRegions44 as review
} from '../research/main1054-mask44/priority-source-review.mjs';

const [W,H]=M44_SOURCE.dimensions;
const sourceRGBA=new Uint8Array(W*H*4);
const baselineRGBA=new Uint8Array(W*H*4);
for(let p=0;p<W*H;p++){
 const i=p*4,x=p%W,y=Math.floor(p/W);
 sourceRGBA.set([24,20,28,255],i);
 baselineRGBA.set([24,20,28,
  x>=700&&x<=1400&&y>=390&&y<=2400?255:0],i);
}
function set(x,y,r,g,b){
 const i=(y*W+x)*4;
 sourceRGBA.set([r,g,b,255],i);
 baselineRGBA.set([r,g,b,255],i);
}
for(let y=530;y<538;y++)for(let x=1050;x<1058;x++)
 set(x,y,170,148,129);
for(let y=531;y<536;y++)for(let x=1048;x<1050;x++)
 set(x,y,171,149,129);
for(let y=530;y<538;y++)set(1058,y,245,245,245);
const p93RGBA=new Uint8Array(baselineRGBA);
for(let y=530;y<538;y++)for(let x=1050;x<1058;x++)
 p93RGBA[(y*W+x)*4+3]=0;
function args(){return {
 sourceRGBA,baselineRGBA,p93RGBA,width:W,height:H,
 originalJpegSHA256:M44_SOURCE.originalJpegSHA256,
 baselinePngSHA256:M44_SOURCE.baselinePngSHA256,
 p93ProposalSHA256:M44_SOURCE.p93ProposalSHA256
};}
test('M44 groups actual candidate warm P93 edge source pixels into deterministic navigable tiles, not mask votes',()=>{
 const before=[new Uint8Array(sourceRGBA),new Uint8Array(baselineRGBA),new Uint8Array(p93RGBA)];
 const a=review(args()),b=review(args());
 assert.deepEqual(a,b);
 assert.ok(a.totalFlaggedWarmEdgeSamples>=10);
 assert.equal(a.tilesCount,a.targets.length);
 assert.equal(a.targets.reduce((sum,t)=>sum+t.flaggedSourceSamples,0),a.totalFlaggedWarmEdgeSamples);
 assert.equal(a.removedP93AlphaPixels,64);
 assert.ok(a.targets.every(t=>t.x>=0&&t.x<W&&t.y>=0&&t.y<H));
 assert.ok(a.targets.every(t=>t.pixelsProvenBackground===0&&t.pixelsApprovedForMaskChange===0));
 assert.ok(a.targets.every(t=>t.actualPhotoRegionNeedsHumanInspection));
 assert.equal(a.unchangedOriginalRGB,true);
 assert.equal(a.noAlphaPixelsModified,true);
 assert.equal(a.reviewerIndependentlyVerified,false);
 assert.equal(a.maskApproved,false);
 assert.equal(a.releaseAuthorized,false);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.familyAlpha,'HOLD');
 assert.deepEqual(sourceRGBA,before[0]);
 assert.deepEqual(baselineRGBA,before[1]);
 assert.deepEqual(p93RGBA,before[2]);
});
test('M44 cannot accept source ID, mask SHA, dimensions or decoded RGB swaps',()=>{
 for(const key of ['originalJpegSHA256','baselinePngSHA256','p93ProposalSHA256']){
  assert.throws(()=>review({...args(),[key]:'deadbeef'}),/M44 LICENSED PHOTO REVIEW BLOCKED/);
 }
 assert.throws(()=>review({...args(),width:W-1}),/BLOCKED/);
 const fake=new Uint8Array(baselineRGBA);
 fake[(535*W+1052)*4+1]=240;
 assert.throws(()=>review({...args(),baselineRGBA:fake}),/BLOCKED/);
});
test('M44 cannot escalate result by injecting caller-provided model or reviewer approval flags',()=>{
 const result=review({...args(),independentHumanApproval:true,modelAccurate:true,
  grantConsumer3D:true,releaseAuthorized:true});
 assert.equal(result.samplingIsNotImageSegmentationGroundTruth,true);
 assert.equal(result.noHumanAnnotationsProduced,true);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.maskApproved,false);
});
test('M44 rejects original cutout that erased protected near-white fabric instead of making it a target',()=>{
 const bad=new Uint8Array(p93RGBA);
 bad[(535*W+1058)*4+3]=0;
 assert.throws(()=>review({...args(),p93RGBA:bad}),/BLOCKED/);
});
