import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeObjectHybridDisagreement} from '../benchmark/object-hybrid-disagreement.mjs';
const width=20,height=16,n=width*height;
const build=(personDetected=false)=>{
 const object=new Uint8Array(n),hybrid=new Uint8Array(n);
 for(let y=3;y<12;y++)for(let x=5;x<12;x++)object[y*width+x]=hybrid[y*width+x]=255;
 // An attached "toe", possibly actual missing footwear fabric.
 for(let y=8;y<11;y++)for(let x=2;x<5;x++)object[y*width+x]=255;
 // An unrelated foreground island, possibly a cast shadow.
 for(let y=12;y<14;y++)for(let x=16;x<18;x++)object[y*width+x]=255;
 return {object,hybrid,personDetected};
};
test('finds toe-like model disagreement and detached possible shadow separately',()=>{
 const {object,hybrid}=build();
 const origA=object.slice(),origB=hybrid.slice();
 const r=analyzeObjectHybridDisagreement(object,hybrid,width,height,
  {category:'Shoes',personDetected:false});
 assert.equal(r.objectPixels,76);
 assert.equal(r.retainedPixels,63);
 assert.equal(r.objectOnlyPixels,13);
 assert.equal(r.connectedRegionCount,2);
 assert.equal(r.largestRegions[0].pixels,9);
 assert.equal(r.largestRegions[0].touchesRetainedGarment,true);
 assert.equal(r.largestRegions[1].pixels,4);
 assert.equal(r.largestRegions[1].touchesRetainedGarment,false);
 assert.ok(r.objectOnlyLowerBandPixels>0);
 assert.equal(r.requiresShadowReview,true);
 assert.equal(r.garmentPixelsRecoveredVerified,false);
 assert.equal(r.productionAuthorized,false);
 assert.equal(r.notPixelAccuracy,true);
 assert.deepEqual(object,origA);
 assert.deepEqual(hybrid,origB);
});
test('person and mannequin scenes explicitly block treating extra pixels as clothing',()=>{
 const {object,hybrid}=build(true);
 const r=analyzeObjectHybridDisagreement(object,hybrid,width,height,
  {category:'Dresses',personDetected:true});
 assert.equal(r.requiresSkinOrMannequinReview,true);
 assert.equal(r.backgroundPixelsIdentifiedVerified,false);
 assert.equal(r.reviewOnly,true);
});
test('matching model masks report no difference and no invented recovery',()=>{
 const {object,hybrid}=build();
 const r=analyzeObjectHybridDisagreement(hybrid,hybrid,width,height,
  {category:'Shoes',personDetected:false});
 assert.equal(r.objectOnlyPixels,0);
 assert.equal(r.connectedRegionCount,0);
 assert.equal(r.requiresShadowReview,false);
 assert.equal(r.garmentPixelsRecoveredVerified,false);
});
test('invalid shape, alpha, thresholds, and unsupported hybrid additions fail closed',()=>{
 const {object,hybrid}=build();
 assert.throws(()=>analyzeObjectHybridDisagreement(object,hybrid,width,0,
  {category:'Shoes',personDetected:false}),/Invalid/);
 assert.throws(()=>analyzeObjectHybridDisagreement(object,hybrid,width,height,
  {category:'Shoes',personDetected:'unknown'}),/Invalid/);
 assert.throws(()=>analyzeObjectHybridDisagreement(object,hybrid,width,height,
  {category:'Shoes',personDetected:false,threshold:0}),/Invalid/);
 const leaked=hybrid.slice();leaked[0]=255;
 assert.throws(()=>analyzeObjectHybridDisagreement(object,leaked,width,height,
  {category:'Shoes',personDetected:false}),/unsupported object/);
 const wrong=object.slice();wrong[0]=NaN;wrong[0]=140;
 assert.throws(()=>analyzeObjectHybridDisagreement(object,new Uint8Array(n-1),width,height,
  {category:'Shoes',personDetected:false}),/Invalid/);
});
