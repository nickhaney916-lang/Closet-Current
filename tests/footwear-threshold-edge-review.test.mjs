import test from 'node:test';
import assert from 'node:assert/strict';
import {footwearThresholdEdgeReview} from '../benchmark/footwear-threshold-edge-review.mjs';
import {alphaPrediction} from '../benchmark/object-cutout-mask.mjs';
function pair(a,b,w=5,h=5){
 const source={width:w,height:h,image:'sneaker.jpg',sourceSha256:'a'.repeat(64)};
 return [alphaPrediction(Uint8Array.from(a),source,128),
  alphaPrediction(Uint8Array.from(b),source,224)];
}
test('same 8-bit alpha loses predicted lower silhouette pixels under strict threshold',()=>{
 const raw=Uint8Array.from([
  0,0,0,0,0,
  0,255,255,255,0,
  0,255,255,255,0,
  0,128,255,128,0,
  0,128,128,128,0
 ]);
 const source={width:5,height:5,image:'sneaker.jpg',sourceSha256:'a'.repeat(64)};
 const a=alphaPrediction(raw,source,128),b=alphaPrediction(raw,source,224);
 const score=footwearThresholdEdgeReview(a,b,{lowerFraction:.5});
 assert.equal(score.standardPixels,12);
 assert.equal(score.strictPixels,7);
 assert.equal(score.discardedPixels,5);
 assert.ok(score.lowerDiscardedPixels>=3);
 assert.equal(score.lowerBandIsNotAnApprovedSoleMask,true);
 assert.equal(score.pixelAccuracyMeasured,false);
 assert.equal(score.verifiedSoleOrToeRetention,false);
});
test('strict alpha can preserve all candidate pixels without proving shoe quality',()=>{
 const source={width:5,height:5,image:'sneaker.jpg',sourceSha256:'a'.repeat(64)};
 const raw=Uint8Array.from(Array(25).fill(255));
 const score=footwearThresholdEdgeReview(alphaPrediction(raw,source,128),
  alphaPrediction(raw,source,224));
 assert.equal(score.discardedPixels,0);
 assert.equal(score.lowerDiscardShare,0);
 assert.equal(score.verifiedSoleOrToeRetention,false);
});
test('empty alpha outputs cannot invent a shoe silhouette',()=>{
 const source={width:5,height:5,image:'sneaker.jpg',sourceSha256:'a'.repeat(64)};
 const raw=Uint8Array.from(Array(25).fill(0));
 const score=footwearThresholdEdgeReview(alphaPrediction(raw,source,128),
  alphaPrediction(raw,source,224));
 assert.equal(score.lowerBandStartRow,null);
 assert.equal(score.discardShare,null);
 assert.equal(score.productionAuthorized,false);
});
test('wrong threshold, different image, or reversed subset fails closed',()=>{
 const source={width:5,height:5,image:'sneaker.jpg',sourceSha256:'a'.repeat(64)};
 const raw=Uint8Array.from(Array(25).fill(128));
 const a=alphaPrediction(raw,source,128),b=alphaPrediction(raw,source,224);
 assert.throws(()=>footwearThresholdEdgeReview(a,a),/unpinned/);
 assert.throws(()=>footwearThresholdEdgeReview(a,{...b,image:'boots.jpg'}),/Different/);
 assert.throws(()=>footwearThresholdEdgeReview(a,b,{lowerFraction:1}),/unpinned/);
 const sneaky={...b,runs:[0,25]}; // impossible: model-224 cannot exceed 128 mask
 assert.throws(()=>footwearThresholdEdgeReview(a,sneaky),/subset/);
});
