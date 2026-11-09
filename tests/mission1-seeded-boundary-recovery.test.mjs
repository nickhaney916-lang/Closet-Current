import test from 'node:test';import assert from 'node:assert/strict';
import {seededBoundaryReview} from '../research/mission1-seeded-boundary-recovery/review-growth.mjs';
function fixture(labels,winners=labels){
 const width=labels.length,n=width,data=new Float32Array(n*18);data.fill(-20);
 for(let i=0;i<n;i++){data[winners[i]*n+i]=Math.log(labels[i]===winners[i]&&labels[i]!==0?.9:.6);data[0*n+i]=Math.log(labels[i]===winners[i]&&labels[i]!==0?.1:.4);if(winners[i]===0)data[i]=1;}
 const map={labels:Uint8Array.from(labels),width,height:1};
 return {data,dims:[1,18,1,width],map,groups:[]};
}
const group=(id,key,selected)=>({id,instanceKey:key,selected:Uint8Array.from(selected),confidence:.9,needsReview:true});
test('real uncertain same-class neighbours extend an existing seed within fixed budget, preserving original pixels',()=>{
 const x=fixture([4,4,0,0],[4,4,4,4]);x.groups=[group(4,'one',[1,1,0,0])];
 const r=seededBoundaryReview(x)[0];assert.deepEqual([...r.selected],[1,1,1,0]);
 assert.equal(r.addedPixelCount,1);assert.equal(r.needsReview,true);assert.equal(r.accepted,false);
 assert.deepEqual([...x.groups[0].selected],[1,1,0,0]);assert.deepEqual([...x.map.labels],[4,4,0,0]);
 assert.ok(r.boundaryReviewConfidence>=.5);assert.equal(r.seedPixelCount,2);
});
test('confident other labels, body winners and remote islands cannot be claimed by a seed',()=>{
 for(const [labels,winners] of [[[4,4,6,0],[4,4,6,4]],[[4,4,0,0],[4,4,11,4]],[[4,4,0,0],[4,4,0,4]]]){
  const x=fixture(labels,winners);x.groups=[group(4,'one',[1,1,0,0])];assert.equal(seededBoundaryReview(x)[0].addedPixelCount,0);
 }
});
test('separate same-class seeds cannot merge or duplicate newly assigned pixels',()=>{
 const x=fixture([4,4,0,0,4,4],[4,4,4,4,4,4]);x.groups=[group(4,'one',[1,1,0,0,0,0]),group(4,'two',[0,0,0,0,1,1])];
 const r=seededBoundaryReview(x);assert.equal(r.length,2);for(let i=0;i<6;i++)assert.ok(r[0].selected[i]+r[1].selected[i]<=1);
 assert.deepEqual(r.map(x=>x.instanceKey),['one','two']);
});
test('missing seed never invents a garment from uncertain class islands',()=>{
 assert.deepEqual(seededBoundaryReview(fixture([0,0],[4,4])),[]);
});
test('malformed dimensions, nonfinite logits and wrong/overlapping seed provenance fail closed',()=>{
 const x=fixture([4,4]);x.groups=[group(4,'one',[1,1])];
 assert.throws(()=>seededBoundaryReview({...x,dims:[1,18,1.1,2]}));
 const d=Float32Array.from(x.data);d[0]=NaN;assert.throws(()=>seededBoundaryReview({...x,data:d}));
 assert.throws(()=>seededBoundaryReview({...x,groups:[group(6,'wrong',[1,1])]}));
 assert.throws(()=>seededBoundaryReview({...x,groups:[...x.groups,...x.groups]}));
});

test('source-map swaps, duplicate proposal identities and fabricated seed confidence cannot enter review growth',()=>{
 const x=fixture([4,4,0],[4,4,4]);x.groups=[group(4,'one',[1,1,0])];
 assert.throws(()=>seededBoundaryReview({...x,map:{...x.map,labels:Uint8Array.from([0,4,0])}}),/match logits/);
 assert.throws(()=>seededBoundaryReview({...x,groups:[{...x.groups[0],confidence:.6}]}));
 assert.throws(()=>seededBoundaryReview({...x,groups:[{...x.groups[0],instanceKey:''}]}));
});

test('default recovery preserves footwear; explicit all-class research arm remains measurable',()=>{
 const x=fixture([9,9,0],[9,9,9]);x.groups=[group(9,'shoe-pair',[1,1,0])];
 assert.equal(seededBoundaryReview(x)[0].addedPixelCount,0);
 assert.equal(seededBoundaryReview({...x,recoverFootwear:true})[0].addedPixelCount,1);
 assert.throws(()=>seededBoundaryReview({...x,recoverFootwear:'yes'}));
});
