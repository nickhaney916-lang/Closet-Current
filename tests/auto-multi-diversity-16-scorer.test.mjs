import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {boxIoU16,matchBoxes16,detectionUnits16,scoreAutoMulti16 as score} from '../scripts/score-auto-multi-16.mjs';
const frozen=JSON.parse(readFileSync('research/auto-multi-diversity-16/provisional-15-locked.json','utf8'));
const modelRow=(x,browser)=>({
 id:x.id+'-'+browser,originalId:x.id,browser,sourceSha256:x.sourceSha256,
 originalBytesVerified:true,originalJpegUnchanged:true,modelExecuted:true,error:null,
 baseline:[],updated:[]});
const cases=()=>frozen.flatMap(x=>['chromium','webkit'].map(b=>modelRow(x,b)));
test('fifteen source-locked originals and 58 visually annotated regions; not human-certified or mask IoU',()=>{
 const ids=new Set(frozen.map(x=>x.sourceSha256));
 assert.equal(frozen.length,15);assert.equal(ids.size,15);
 assert.equal(frozen.reduce((a,x)=>a+x.regions.length,0),58);
 assert.ok(frozen.every(x=>x.originalJpeg&&x.humanReviewerVerified===false&&
  x.sourceIdentityLocked&&x.annotationStatus.includes('NOT_INDEPENDENT_HUMAN_VERIFIED')));
 const report=score(frozen,cases());
 assert.equal(report.uniqueOriginalPhotographs,15);assert.equal(report.humanGroundTruthVerified,false);
 assert.equal(report.truePixelMaskIoU,null);assert.equal(report.qualityGatePassed,false);
 assert.equal(report.results['chromium-baseline'].supportedExpected,57);
 assert.equal(report.results['webkit-updated'].supportedExpected,57);
});
test('two shoes in one wardrobe pair retain distinct shoe instance detection',()=>{
 const group={regionId:9,label:'Shoes',confidence:.97,needsReview:true,
  box:{x:.2,y:.65,width:.5,height:.22},
  shoePartBoxes:[{x:.2,y:.65,width:.20,height:.22},{x:.5,y:.65,width:.20,height:.22}]};
 const expected=[{family:'shoes',box:group.shoePartBoxes[0]},{family:'shoes',box:group.shoePartBoxes[1]}];
 const before=matchBoxes16(expected,detectionUnits16([group]),.3);
 const after=matchBoxes16(expected,detectionUnits16([group],{splitShoePairs:true}),.3);
 assert.equal(before.matched,1);assert.equal(after.matched,2);
 assert.equal(before.missed,1);assert.equal(after.missed,0);
});
test('same-class garment instances match one-to-one, not one enormous clothing rectangle',()=>{
 const expected=[{family:'upper',box:{x:.02,y:.1,width:.2,height:.5}},
 {family:'upper',box:{x:.72,y:.1,width:.2,height:.5}}];
 const one=[{family:'upper',box:{x:0,y:.05,width:1,height:.57}}];
 assert.equal(matchBoxes16(expected,one,.3).matched,0);
 const two=expected.map(x=>({family:'upper',box:x.box}));
 assert.equal(matchBoxes16(expected,two,.3).matched,2);
});
test('duplicate same-class proposal and wrong class are separate false positives',()=>{
 const gt=[{family:'upper',box:{x:.1,y:.1,width:.3,height:.4}}];
 const proposals=[{family:'upper',box:{...gt[0].box}},
 {family:'upper',box:{...gt[0].box}},
 {family:'shoes',box:{...gt[0].box}},
 {family:'bottom',box:{x:.7,y:.7,width:.1,height:.1}}];
 const r=matchBoxes16(gt,proposals,.3);
 assert.equal(r.matched,1);assert.equal(r.duplicates,1);
 assert.equal(r.incorrectRegionCategories,1);assert.equal(r.backgroundOrExtra,1);
 assert.equal(r.precisionPercent,25);
});
test('invalid or unreviewed models cannot fabricate success',()=>{
 const valid=cases(),missing=valid.slice(1);
 assert.throws(()=>score(frozen,missing),/30/);
 const swapped=cases();swapped[0].sourceSha256='0'.repeat(64);
 assert.throws(()=>score(frozen,swapped),/source identity/);
 const untrusted=cases();untrusted[0].updated=[{regionId:4,label:'Upper garment',confidence:.9,
  box:{x:.1,y:.1,width:.2,height:.3},needsReview:false}];
 assert.throws(()=>score(frozen,untrusted),/invalid unverified/);
 const relabeled=structuredClone(frozen);relabeled[0].humanReviewerVerified=true;
 assert.throws(()=>score(relabeled,cases()),/misleading human review claim/);
});
test('missing model not counted as zero errors: precision can be undefined, recall remains zero',()=>{
 const xs=cases();xs[0].modelExecuted=false;xs[0].error='model worker failure';
 const r=score(frozen,xs);
 assert.equal(r.results['chromium-updated'].errors,1);
 assert.equal(r.results['chromium-updated'].recallPercent,0);
 assert.equal(r.qualityGatePassed,false);
});
test('true mask IoU unavailable without pixel-level human masks, regardless of box IoU',()=>{
 const box={x:.2,y:.2,width:.4,height:.4};
 assert.equal(boxIoU16(box,box),1);
 assert.equal(score(frozen,cases()).truePixelMaskIoU,null);
});
