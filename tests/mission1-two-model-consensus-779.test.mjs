import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {scoreInstances} from '../research/mission1-external-human-evidence/instance-metrics.mjs';
import {packModelMasks779,unpackModelMasks779,scoreTwoModelConsensus779} from '../research/mission1-two-model-consensus-779/mask-consensus.mjs';
const sourceSHA='a'.repeat(64),w=16,h=16,n=w*h;
const rev={b0:'a2489ea8e7ec1ee912190546bad31a4906ccca76',b2:'cb6ac44e641faa309f29561c1afe08d87ef52631'};
const hash=b=>createHash('sha256').update(b).digest('hex');
const mask=(left,top,right,bottom)=>Array.from({length:n},(_,i)=>Number(i%w>=left&&i%w<right&&Math.floor(i/w)>=top&&Math.floor(i/w)<bottom));
const truth=[{id:'publisher-1',region:4,mask:mask(1,1,6,6)}];
const first=[{id:'model-left-1',region:4,mask:mask(1,1,6,6)}];
const good=[{id:'model-right-1',region:4,mask:mask(1,1,6,6)}];
const falseRegion={id:'model-right-fp',region:4,mask:mask(10,10,14,14)};
function fixture(variant,preds=variant==='b0'?first:good,gt=truth){
 const evidence={width:w,height:h,sourceCohort:'prior6',
  publisherTruth:packModelMasks779(gt,w,h),
  seededReviewProposals:packModelMasks779(preds,w,h)};
 const count=scoreInstances({truth:gt,predictions:preds,width:w,height:h});
 return {
  modelComparisonVariant:variant,sourceCohort:'prior6',engine:'chromium',
  releaseAuthorized:false,familyAlpha:'HOLD',
  modelPromotionAuthorized:false,licenseIndependentlyCleared:false,
  photos:1,publisherHumanInstances:gt.length,
  rows:[{id:10,sourceSHA256:sourceSHA,revision:rev[variant],
   model:'Xenova/segformer_'+variant+'_clothes',
   publisherHumanInstances:gt.length,
   maskEvidence:evidence,candidateInstances:count,
   candidateReceipts:preds.map(x=>({id:x.id,maskSHA256:hash(Uint8Array.from(x.mask))}))}]
 };
}
const compare=(b0,b2)=>scoreTwoModelConsensus779({b0,b2,expectedSources:[sourceSHA],engine:'chromium'});
test('P779 masks round-trip exact original raster RLE and refuse corruption, empty pixels and fake duplicate IDs',()=>{
 const p=packModelMasks779([truth[0],falseRegion],w,h);
 assert.deepEqual(unpackModelMasks779(p,w,h).map(x=>x.mask),[truth[0].mask,falseRegion.mask]);
 for(const bad of [
  {...p[0],sourceMaskSHA256:'f'.repeat(64)},
  {...p[0],rle:[0,1]},
  {...p[0],rle:[-1,n+1]},
  {...p[0],rle:[0,n]},
  {...p[0],rle:[n]}
 ])assert.throws(()=>unpackModelMasks779([bad],w,h),/M1_CONSENSUS_779:/);
 assert.throws(()=>packModelMasks779([truth[0],truth[0]],w,h),/duplicated/);
});
test('P779 genuine two-model same-source same-class overlap corroborates a review only; B2-only false positive stays unconfirmed',()=>{
 const b0=fixture('b0'),b2=fixture('b2',[...good,falseRegion]);
 const result=compare(b0,b2);
 assert.equal(result.rawB0SeededReview.truePositives,1);
 assert.equal(result.rawB2SeededReview.falsePositives,1);
 assert.equal(result.twoModelCorroboratedOnly.truePositives,1);
 assert.equal(result.twoModelCorroboratedOnly.falsePositives,0);
 assert.equal(result.photoEvidence[0].corroboratedReviewOnly,1);
 assert.equal(result.modelPromotionAuthorized,false);
 assert.equal(result.missionOneCompleted,false);
 assert.equal(result.familyAlpha,'HOLD');
 assert.equal(result.photoEvidence[0].autoAccepted,0);
});
test('P779 same-class proposals at different coordinates or mismatched semantics cannot be counted by consensus',()=>{
 const b0=fixture('b0'),b2=fixture('b2',[falseRegion]);
 const result=compare(b0,b2);
 assert.equal(result.twoModelCorroboratedOnly.truePositives,0);
 assert.equal(result.twoModelCorroboratedOnly.falseNegatives,1);
 const other={...good[0],id:'wrong-class',region:6};
 assert.equal(compare(b0,fixture('b2',[other])).photoEvidence[0].corroboratedReviewOnly,0);
});
test('P779 fail closed on provenance changes, switched model metadata, source JPEG digest or fabricated publisher mask',()=>{
 const a=fixture('b0'),b=fixture('b2');
 for(const [x,y] of [
  [a,{...b,licenseIndependentlyCleared:true}],
  [a,{...b,rows:[{...b.rows[0],sourceSHA256:'f'.repeat(64)}]}],
  [a,{...b,rows:[{...b.rows[0],revision:rev.b0}]}],
  [a,{...b,rows:[{...b.rows[0],maskEvidence:{...b.rows[0].maskEvidence,publisherTruth:packModelMasks779([{...truth[0],mask:mask(2,1,7,6)}],w,h)}}]}],
  [a,{...b,rows:[{...b.rows[0],candidateReceipts:[]}]}]
 ])assert.throws(()=>compare(x,y),/M1_CONSENSUS_779:/);
});
test('P779 human polygon truth cannot change the prediction-only matched candidates',()=>{
 const a=fixture('b0'),b=fixture('b2',[...good,falseRegion]);
 const first=compare(a,b);
 const revisedTruth=[{...truth[0],mask:mask(10,10,14,14)}];
 const a2=fixture('b0',a.rows[0].maskEvidence.seededReviewProposals.map((_,i)=>i===0?{
  id:'model-left-1',region:4,mask:mask(1,1,6,6)}:null).filter(Boolean),revisedTruth);
 const b2=fixture('b2',[...good,falseRegion],revisedTruth);
 const second=compare(a2,b2);
 assert.deepEqual(first.photoEvidence[0].matchedPredictionPairs,second.photoEvidence[0].matchedPredictionPairs);
 assert.notEqual(first.twoModelCorroboratedOnly.truePositives,second.twoModelCorroboratedOnly.truePositives);
});
