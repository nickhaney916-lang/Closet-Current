import test from 'node:test';
import assert from 'node:assert/strict';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {unseededGarmentReview773} from '../research/mission1-unseeded-region-773/original-logit-review.mjs';

function make(w=20,h=20){
 const n=w*h,data=new Float32Array(n*18);data.fill(-20);
 for(let i=0;i<n;i++)data[i]=3; // ordinary non-garment background
 const set=(x,y,id,score=.6)=>{
  const i=y*w+x;for(let c=0;c<18;c++)data[c*n+i]=-20;
  data[i]=Math.log(1-score);data[id*n+i]=Math.log(score);
 };
 const area=(x0,y0,x1,y1,id,score=.6)=>{
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)set(x,y,id,score);
 };
 const inputs=()=>({data,dims:[1,18,h,w],
  map:clothingLabelMap(data,[1,18,h,w]),existingGroups:[]});
 return {w,h,n,set,area,inputs};
}
test('P773 genuine original-logit-supported dress region with no strong seed is ONLY a review candidate',()=>{
 const f=make();f.area(2,2,6,7,7,.6);
 const input=f.inputs(),before=Uint8Array.from(input.map.labels),raw=Float32Array.from(input.data);
 const result=unseededGarmentReview773(input);
 assert.equal(result.length,1);
 assert.equal(result[0].id,7);
 assert.equal(result[0].count,20);
 assert.equal(result[0].source,'real-original-logits-unseeded-review');
 assert.equal(result[0].accepted,false);
 assert.equal(result[0].needsReview,true);
 assert.equal(result[0].autoIndex,false);
 assert.equal(result[0].subtype,'Unknown');
 assert.equal(result[0].primaryColor,'Unknown');
 assert.deepEqual(input.map.labels,before);
 assert.deepEqual(input.data,raw);
});
test('P773 shoe class 10 remaps to semantic footwear 9 without inventing a source subtype or owner approval',()=>{
 const f=make();f.area(2,2,7,6,10,.62);
 const r=unseededGarmentReview773(f.inputs());
 assert.equal(r.length,1);assert.equal(r[0].id,9);
 assert.equal(r[0].count,20);assert.equal(r[0].autoIndex,false);
});
test('P773 two disconnected source-supported garments produce two separate source-preserving reviews',()=>{
 const f=make();f.area(2,2,6,6,7,.6);f.area(10,10,14,14,10,.61);
 const r=unseededGarmentReview773(f.inputs());
 assert.equal(r.length,2);assert.deepEqual(r.map(x=>x.id).sort(),[7,9]);
 for(let i=0;i<f.n;i++)assert.ok(r.reduce((n,x)=>n+x.selected[i],0)<=1);
});
test('P773 uncertain extension touching an actually accepted same-family source seed is NOT fabricated as another garment',()=>{
 const f=make();f.area(2,2,4,6,4,.94);f.area(4,2,8,6,4,.6);
 const p=f.inputs();
 const selected=Uint8Array.from(p.map.labels,x=>x===4?1:0);
 p.existingGroups=[{id:4,selected,instanceKey:'real-source-upper-1'}];
 assert.equal(unseededGarmentReview773(p).length,0);
});
test('P773 no source model support means no invented invisible source garment mask',()=>{
 const f=make();assert.deepEqual(unseededGarmentReview773(f.inputs()),[]);
 f.area(2,2,5,5,7,.6);assert.deepEqual(unseededGarmentReview773(f.inputs()),[]);
});
test('P773 model confidently identified a different family; original class is never overwritten or redistributed',()=>{
 const f=make();f.area(2,2,8,7,6,.95);
 const p=f.inputs(),initial=Uint8Array.from(p.map.labels);
 assert.deepEqual(unseededGarmentReview773(p),[]);
 assert.deepEqual(p.map.labels,initial);
});
test('P773 malformed source logits, spoofed original map, overlapping seed and duplicate seed identity are refused',()=>{
 const f=make();f.area(2,2,6,7,7,.6);
 const x=f.inputs();
 assert.throws(()=>unseededGarmentReview773({...x,dims:[1,18,20.5,20]}),/invalid source model dimensions/);
 assert.throws(()=>unseededGarmentReview773({...x,data:x.data.slice(1)}),/mismatched actual logits/);
 const badMap={...x.map,labels:Uint8Array.from(x.map.labels)};badMap.labels[0]=4;
 assert.throws(()=>unseededGarmentReview773({...x,map:badMap}),/source label SHA-inconsistent/);
 const protectedSource=make();protectedSource.area(1,1,5,5,4,.95);
 const y0=protectedSource.inputs();
 const s=Uint8Array.from({length:400},(_,i)=>i===21?1:0);
 assert.throws(()=>unseededGarmentReview773({...y0,existingGroups:[{id:7,selected:s,instanceKey:'forged'}]}),/overwrote other class/);
 const f2=make();f2.area(1,1,5,5,4,.9);
 const y=f2.inputs(),mask=Uint8Array.from(y.map.labels,c=>c===4?1:0),g={id:4,selected:mask,instanceKey:'same'};
 assert.throws(()=>unseededGarmentReview773({...y,existingGroups:[g,g]}),/duplicated source group|duplicated pixels/);
});
test('P773 source class probabilities do not rescue flat logits, ambiguous type margins, or huge unverifiable image islands',()=>{
 const f=make();f.area(2,2,8,7,7,.5);
 // Only two candidates of 18 at 0.5 vs 0.5 yield zero margin and no new source.
 assert.deepEqual(unseededGarmentReview773(f.inputs()),[]);
 const huge=make();huge.area(0,0,19,19,7,.6);
 assert.deepEqual(unseededGarmentReview773(huge.inputs()),[]);
});
test('P773 missing-region candidates never exceed bounded review cap even if source contains many separate support islands',()=>{
 const f=make(80,80);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const x=2+col*18,y=2+row*18;
  f.area(x,y,x+5,y+5,7,.63);
 }
 const r=unseededGarmentReview773(f.inputs());
 assert.equal(r.length,8);
 assert.ok(r.every(x=>!x.accepted&&x.needsReview&&!x.autoIndex&&x.count===25));
});
