import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleGarmentGroups16} from '../research/auto-multi-diversity-16/visible-proposals-16.mjs';
import {visibleGarmentGroups24} from '../research/multi-garment-capture-01/visible-groups.mjs';
function frame(w=100,h=100){
 const labels=new Uint8Array(w*h),confidence=new Float32Array(w*h);
 return {width:w,height:h,labels,confidence,personDetected:false,
  paint(id,x,y,dx,dy,score=.97){for(let yy=y;yy<y+dy;yy++)
   for(let xx=x;xx<x+dx;xx++){const p=yy*w+xx;labels[p]=id;confidence[p]=score;}
   return this;}};
}
test('two separated shirts have distinct region IDs and keys, never merged by same broad class',()=>{
 const m=frame().paint(4,8,10,17,22).paint(4,60,12,18,23);
 const old=visibleGarmentGroups24(m),newer=visibleGarmentGroups16(m);
 assert.equal(old.length,2);assert.equal(newer.length,2);
 assert.equal(new Set(newer.map(p=>p.instanceKey)).size,2);
 assert.ok(newer.every(p=>p.requiresLayerReview&&p.needsReview&&p.proposalOnly));
});
test('two neighboring shoe components preserve both visible shoes in ONE pair review item',()=>{
 const m=frame().paint(9,20,78,9,9).paint(9,36,79,9,9);
 const rows=visibleGarmentGroups16(m);assert.equal(rows.length,1);
 assert.equal(rows[0].shoePairCandidate,true);
 assert.equal(rows[0].shoePartBoxes.length,2);
 assert.notDeepEqual(rows[0].shoePartBoxes[0],rows[0].shoePartBoxes[1]);
 assert.equal(rows[0].inferredHiddenPixels,0);
});
test('accessories in flat lays can be proposed but cannot save automatically',()=>{
 const m=frame().paint(4,6,5,19,27).paint(6,39,26,19,27).paint(16,71,55,14,19);
 assert.equal(visibleGarmentGroups24(m).length,2);
 const next=visibleGarmentGroups16(m);
 assert.deepEqual(new Set(next.map(x=>x.id)),new Set([4,6,16]));
 assert.ok(next.every(x=>x.needsReview&&x.proposalOnly));
});
test('weak accessory and tiny noisy patches cannot become furniture/skin clothing',()=>{
 const m=frame().paint(4,10,10,14,20).paint(16,66,56,16,19,.77).paint(1,90,3,2,2,.99);
 assert.deepEqual(visibleGarmentGroups16(m).map(x=>x.id),[4]);
});
test('mixed semantics preserve separate skirt, dress, bottoms and upper, not guessed layers',()=>{
 const m=frame(200,140).paint(5,8,10,21,40).paint(7,60,9,24,50).paint(6,110,20,25,50).paint(4,155,15,30,25);
 assert.deepEqual(new Set(visibleGarmentGroups16(m).map(x=>x.id)),new Set([4,5,6,7]));
});
test('source segmentation map remains byte-identical, clipped items carry review flag',()=>{
 const m=frame().paint(4,0,10,19,30);
 const original=Uint8Array.from(m.labels),conf=Float32Array.from(m.confidence);
 const result=visibleGarmentGroups16(m);
 assert.equal(result[0].clipped,true);assert.equal(result[0].sourceOriginalUnchanged,true);
 assert.deepEqual(m.labels,original);assert.deepEqual(m.confidence,conf);
 assert.equal(result[0].inferredHiddenPixels,0);
});
test('invalid maps and absurd caps fail closed',()=>{
 assert.throws(()=>visibleGarmentGroups16({labels:[1],confidence:[.9],width:20,height:20}),/invalid/);
 assert.throws(()=>visibleGarmentGroups16(frame(),{limit:25}),/invalid/);
});
test('no mask IoU, garment subtype or human approval is claimed by connected-components proposal',()=>{
 const g=visibleGarmentGroups16(frame().paint(4,7,7,21,21))[0];
 assert.equal(g.needsReview,true);
 assert.equal(g.proposalOnly,true);
 assert.equal('maskIoU' in g,false);
 assert.equal('itemType' in g,false);
});
