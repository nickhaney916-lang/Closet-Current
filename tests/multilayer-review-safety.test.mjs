import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateMultiGarmentReview as pick} from '../benchmark/multilayer-review-safety.mjs';
const base={expected:['Tops'],personDetected:false,objectPixels:1000,
  parts:[{slot:'upper',objectPixels:1000,retainedPixels:600}]};
test('standalone garment can preview object cutout but cannot be auto catalogued',()=>{
 const x=pick(base);
 assert.equal(x.recommendedPreview,'object-alpha-only');
 assert.equal(x.automaticCatalogApproved,false);
 assert.equal(x.productionAuthorized,false);
});
test('strong worn garment may only be a human-review hybrid candidate',()=>{
 const x=pick({...base,personDetected:true});
 assert.equal(x.recommendedPreview,'clothing-guided-hybrid');
 assert.equal(x.humanReviewRequired,true);
});
test('portrait with unverified extra semantic garments preserves original',()=>{
 const x=pick({...base,personDetected:true,parts:[...base.parts,
   {slot:'pants-or-shorts',objectPixels:1000,retainedPixels:450}]});
 assert.deepEqual(x.unverifiedExtraRegions,['pants-or-shorts']);
 assert.equal(x.recommendedPreview,'original-source');
});
test('dress-and-jacket missing jacket does not turn into a single saved dress',()=>{
 const x=pick({...base,expected:['Dresses','Outerwear'],
   parts:[{slot:'dress',objectPixels:1000,retainedPixels:900}]});
 assert.deepEqual(x.missingExpected,['Outerwear']);
 assert.equal(x.recommendedPreview,'original-source');
 assert.equal(x.reason,'missing-expected-garment');
});
test('model cannot separate shirt and jacket from same semantic upper class',()=>{
 const x=pick({...base,expected:['Tops','Outerwear']});
 assert.equal(x.sharedClassAmbiguity,true);
 assert.equal(x.recommendedPreview,'original-source');
});
test('no usable foreground or weak partial garment cannot be promoted',()=>{
 assert.equal(pick({...base,objectPixels:0,
  parts:[{slot:'upper',objectPixels:0,retainedPixels:0}]}).recommendedPreview,'original-source');
 const x=pick({...base,personDetected:true,
  parts:[{slot:'upper',objectPixels:1000,retainedPixels:50}]});
 assert.equal(x.recommendedPreview,'original-source');
});
test('benchmark labels are not a production route or recognized ground truth',()=>{
 assert.throws(()=>pick({...base,mode:'production'}));
 assert.throws(()=>pick({...base,parts:[base.parts[0],base.parts[0]]}),/repeated/);
 assert.throws(()=>pick({...base,parts:[{slot:'upper',objectPixels:100,retainedPixels:101}]}));
});
