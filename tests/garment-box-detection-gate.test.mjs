import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGarmentDetectionBoxes as gate} from '../benchmark/garment-box-detection-gate.mjs';
const sha='9'.repeat(64),w=200,h=300;
const det=(label,score,box)=>({label,score,box});
const dress=det('a dress',.59,{xmin:40,ymin:40,xmax:170,ymax:280});
const jacket=det('a jacket.',.42,{xmin:60,ymin:60,xmax:150,ymax:175});
const run=detections=>gate({sourceSha256:sha,width:w,height:h,detections});
test('dress and jacket boxes may be proposed while physical items remain unverified',()=>{
 const r=run([dress,jacket]);assert.equal(r.layerPairProposed,true);
 assert.equal(r.candidates.length,2);assert.equal(r.canAutoCreateItems,false);
 assert.equal(r.physicalInstancesVerified,false);
 assert.ok(r.conflicts.some(c=>c.reason==='overlapping-layer-boxes-not-instance-masks'));
});
test('repeated shirt and blouse prompts cannot become multiple saved pieces',()=>{
 const a=det('a shirt',.8,{xmin:5,ymin:10,xmax:170,ymax:275});
 const b=det('a blouse',.71,{xmin:6,ymin:12,xmax:168,ymax:274});
 const r=run([a,b]);assert.equal(r.candidates.length,2);
 assert.ok(r.conflicts.some(c=>c.reason==='possibly-same-clothing-two-prompts'));
 assert.equal(r.canAutoCreateItems,false);
});
test('tiny, whole-scene and low-score boxes are rejected',()=>{
 const r=run([
  det('a shirt',.6,{xmin:20,ymin:20,xmax:22,ymax:22}),
  det('a shirt',.6,{xmin:0,ymin:0,xmax:200,ymax:300}),
  det('a shirt',.07,{xmin:20,ymin:20,xmax:100,ymax:200})
 ]);assert.equal(r.candidates.length,0);assert.equal(r.rejected.length,3);
});
test('unfamiliar labels and correct source are not silently assigned garment types',()=>{
 const r=run([det('a person',.99,dress.box),jacket]);
 assert.deepEqual(r.candidates.map(x=>x.category),['Outerwear']);
 assert.equal(r.rejected[0].reason,'unsupported-prompt-label');
 assert.equal(r.sourceSha256,sha);
});
test('out-of-frame but otherwise valid boxes are clamped to photo',()=>{
 const r=run([det('a blouse',.5,{xmin:-30,ymin:-10,xmax:90,ymax:170})]);
 assert.equal(r.candidates[0].box.xmin,0);assert.equal(r.candidates[0].box.ymin,0);
});
test('bad source, model values and malformed image coordinates fail closed',()=>{
 assert.throws(()=>gate({sourceSha256:'bad',width:w,height:h,detections:[]}));
 assert.throws(()=>run([det('a coat',NaN,jacket.box)]));
 assert.throws(()=>run([det('a shirt',.4,{xmin:10,ymin:0,xmax:Infinity,ymax:250})]));
 assert.throws(()=>gate({sourceSha256:sha,width:0,height:h,detections:[]}));
});
test('an empty detector result creates zero items and preserves the photo',()=>{
 const r=run([]);assert.equal(r.candidates.length,0);assert.equal(r.sourceImagePreserved,true);
 assert.equal(r.canAutoCreateItems,false);
});
