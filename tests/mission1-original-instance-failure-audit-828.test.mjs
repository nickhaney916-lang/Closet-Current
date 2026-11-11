import test from 'node:test';
import assert from 'node:assert/strict';
import {
 auditOriginalSourceErrors828,auditPinnedP827Files828,P828_PROFILES,P828_PINNED_P827
} from '../research/mission1-original-instance-failure-audit-828/audit.mjs';

function synthetic(){
 // These are deliberate synthetic unit cases, NOT 10 genuine publisher masks.
 const distribution=[1,2,3,4,4,3,3,1,1,1];
 const manifest={schema:'m1-p792-additional-publisher-originals-research-not-holdout/v1',
  releaseAuthorized:false,familyAlpha:'HOLD',
  blindHumanReviewIndependentlyVerified:false,
  publisherAnnotatedImageRightsIndependentlyCleared:false,
  trainingCorpusOverlapIndependentlyExcluded:false,
  rows:distribution.map((count,i)=>({
   id:1000+i,sha256:(i+1).toString(16).padStart(64,'0'),
   width:512,height:512,sourceSelectionStratum:count===1?'single':'multi',
   annotations:Array.from({length:count},(_,j)=>({
    id:10000+i*100+j,category_id:[1,8,23,10,6][j%5],
    segmentation:[[0,0,100,0,100,100]]
   }))
  }))};
 const truth=manifest.rows.flatMap(row=>row.annotations.map(a=>({
  sourceId:row.id,truthId:'annotation-'+a.id,
  region:({1:4,8:5,23:9,10:7,6:6})[a.category_id]
 })));
 assert.equal(truth.length,23);
 const runs=['chromium','webkit'].map((engine,idx)=>{
  const matched=new Set(truth.slice(0,idx?9:10).map(x=>x.truthId));
  const rows=manifest.rows.map((source,i)=>{
   const all=truth.filter(x=>x.sourceId===source.id);
   const metrics={};
   for(const name of P828_PROFILES){
    const m=all.filter(x=>matched.has(x.truthId)),fn=all.length-m.length;
    const fp=i<(idx?10:9)?1:0;
    metrics[name]={
     truthInstances:all.length,predictedInstances:m.length+fp,
     truePositives:m.length,falsePositives:fp,falseNegatives:fn,
     precision:m.length+fp?m.length/(m.length+fp):null,
     recall:all.length?m.length/all.length:null,
     f1:m.length*2+fp+fn?m.length*2/(m.length*2+fp+fn):null,
     matches:m.map(x=>({truthId:x.truthId,predictionId:'p-'+x.truthId,
      region:x.region,iou:.71})),
     missedTruthIds:all.filter(x=>!matched.has(x.truthId)).map(x=>x.truthId),
     unmatchedPredictionIds:Array.from({length:fp},(_,j)=>'false-'+i+'-'+j)
    };
   }
   return {id:source.id,sourceSHA256:source.sha256,
    publisherHumanInstances:all.length,
    model:P828_PINNED_P827.model,revision:P828_PINNED_P827.revision,
    thresholdMetrics821:metrics};
  });
  const scores=Object.fromEntries(P828_PROFILES.map(profile=>[
   profile,rows.reduce((sum,row)=>({
    truePositives:sum.truePositives+row.thresholdMetrics821[profile].truePositives,
    falsePositives:sum.falsePositives+row.thresholdMetrics821[profile].falsePositives,
    falseNegatives:sum.falseNegatives+row.thresholdMetrics821[profile].falseNegatives
   }),{truePositives:0,falsePositives:0,falseNegatives:0})
  ]));
  return {engine,rows,photos:10,publisherHumanInstances:23,
   frozenRealB0ThresholdSweep821:true,
   newlyEnrolledBlindedHumanHoldout:false,releaseAuthorized:false,
   familyAlpha:'HOLD',exactAppSubtypeAccuracy:null,primaryColorAccuracy:null,
   summary:{thresholdSourceScores821:scores,thresholdAutoPromoteAllowed:false,
    thresholdOriginalHumanMaskReviewers:0}};
 });
 return {manifest,chromium:runs[0],webkit:runs[1]};
}
const copy=x=>structuredClone(x);
test('P828 strict 10 originals / 23 human polygons and cross-browser consistent misses',()=>{
 const {manifest,chromium,webkit}=synthetic(),
  receipt=auditOriginalSourceErrors828(manifest,chromium,webkit);
 assert.equal(receipt.summary.photos,10);
 assert.equal(receipt.summary.publisherOriginalInstances,23);
 assert.equal(receipt.summary.matchedBoth,9);
 assert.equal(receipt.summary.chromiumOnlyMatched,1);
 assert.equal(receipt.summary.webkitOnlyMatched,0);
 assert.equal(receipt.summary.persistentMissedInBoth,13);
 assert.equal(receipt.profiles.length,5);
 assert.equal(receipt.profiles[0].chromium.truePositives,10);
 assert.equal(receipt.profiles[0].webkit.truePositives,9);
 assert.equal(receipt.independentBlindedHumanAcceptance,false);
 assert.equal(receipt.releaseAuthorized,false);
 assert.equal(receipt.automaticThresholdPromotionAllowed,false);
 assert.deepEqual(new Set(receipt.byRegion.map(x=>x.region)),new Set([4,5,6,7,9]));
 assert.equal(receipt.byPhoto.length,10);
 assert.ok(!JSON.stringify(receipt).includes('segmentation'));
 assert.ok(!JSON.stringify(receipt).includes('original_url'));
});
test('P828 refuse dropped original annotated source, swapped SHA or a duplicate image',()=>{
 for(const mutation of [
  m=>m.rows[0].annotations.pop(),
  m=>m.rows[0].sha256=m.rows[1].sha256,
  m=>m.rows.pop(),
  m=>m.rows[1].sourceSelectionStratum='single',
  m=>m.rows[3].annotations[0].category_id=12345,
  m=>m.blindHumanReviewIndependentlyVerified=true,
  m=>m.releaseAuthorized=true
 ]){
  const c=synthetic();mutation(c.manifest);
  assert.throws(()=>auditOriginalSourceErrors828(c.manifest,c.chromium,c.webkit),
   /M1_P828_FAIL_CLOSED/);
 }
});
test('P828 block fabricated extra TP, duplicate predictions, wrong family and omitted false positives',()=>{
 for(const mutation of [
  x=>x.rows[0].thresholdMetrics821[P828_PROFILES[0]].truePositives++,
  x=>x.rows[0].thresholdMetrics821[P828_PROFILES[0]].falsePositives++,
  x=>x.rows[0].thresholdMetrics821[P828_PROFILES[0]].missedTruthIds=[],
  x=>x.rows[0].thresholdMetrics821[P828_PROFILES[0]].matches.push({
   truthId:'annotation-99999',predictionId:'forged',region:4,iou:.9}),
  x=>x.rows[0].sourceSHA256='f'.repeat(64),
  x=>x.rows[0].model='not frozen model',
  x=>x.summary.thresholdAutoPromoteAllowed=true
 ]){
  const c=synthetic();mutation(c.chromium);
  assert.throws(()=>auditOriginalSourceErrors828(c.manifest,c.chromium,c.webkit),
   /M1_P828_FAIL_CLOSED/);
 }
});
test('P828 refused re-uploaded or independently altered numeric receipts even if JSON is semantically plausible',()=>{
 const c=synthetic();
 assert.throws(()=>auditPinnedP827Files828({
  manifest:Buffer.from(JSON.stringify(c.manifest)),
  chromium:Buffer.from(JSON.stringify(c.chromium)),
  webkit:Buffer.from(JSON.stringify(c.webkit))
 }),/M1_P828_FAIL_CLOSED: unverified exact real model artifact SHA/);
});
test('P828 all five experiments preserve per-photo truth denominators and stop profile cherrypicking',()=>{
 const c=synthetic();
 const swapped=copy(c.webkit);
 const a=swapped.rows[0].thresholdMetrics821;
 a[P828_PROFILES[1]]=undefined;
 assert.throws(()=>auditOriginalSourceErrors828(c.manifest,c.chromium,swapped),
  /M1_P828_FAIL_CLOSED/);
 const removed=copy(c.chromium);
 delete removed.rows[0].thresholdMetrics821[P828_PROFILES[4]];
 assert.throws(()=>auditOriginalSourceErrors828(c.manifest,removed,c.webkit),
  /M1_P828_FAIL_CLOSED/);
});
