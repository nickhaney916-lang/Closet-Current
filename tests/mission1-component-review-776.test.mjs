import test from 'node:test';
import assert from 'node:assert/strict';
import {clothingLabelMap} from '../public/outfit-segmentation.mjs';
import {sourceComponentReview776} from '../research/mission1-component-review-776/source-component-review.mjs';
const W=32,H=32,N=W*H;
const rect=(l,t,r,b)=>{const a=[];for(let y=t;y<b;y++)for(let x=l;x<r;x++)a.push(y*W+x);return a;};
function source(family=4,parts=[rect(2,2,6,6),rect(20,20,24,24)]){
 const data=new Float32Array(18*N),selected=new Uint8Array(N);
 for(let i=0;i<N;i++)data[i]=8;
 for(const part of parts)for(const i of part){
  data[i]=0;data[family*N+i]=12;selected[i]=1;
 }
 const dims=[1,18,H,W],map=clothingLabelMap(data,dims);
 const count=selected.reduce((a,b)=>a+b,0);
 const g={id:family,instanceKey:'frozen-real-model-group',selected,count,
  seedPixelCount:count,addedPixelCount:0,maximumAddedPixels:Math.floor(count*.5),
  confidence:null,needsReview:true,accepted:false,autoIndex:false};
 return {data,dims,map,groups:[g],g};
}
test('P776 two separated strong source regions create two review-only instance alternatives while preserving every source pixel',()=>{
 const s=source(),copy=Uint8Array.from(s.g.selected),out=sourceComponentReview776(s);
 assert.equal(out.length,2);
 assert.ok(out.every(x=>x.count===16&&x.sourceComponentCount===2&&x.sourceGroupId===s.g.instanceKey));
 assert.ok(out.every(x=>x.accepted===false&&x.autoIndex===false&&x.needsReview===true&&x.confidence===null));
 assert.ok(out.every(x=>x.subtype==='Unknown'&&x.primaryColor==='Unknown'));
 const union=new Uint8Array(N);
 for(const g of out)for(let i=0;i<N;i++)if(g.selected[i]){
  assert.equal(union[i],0,'no proposal overlap');union[i]=1;
 }
 assert.deepEqual(union,copy,'conserve source pixels exactly');
 assert.deepEqual(s.g.selected,copy,'original mask unchanged');
});
test('P776 connected garments and tiny occlusion fragments stay a single uncertain proposal',()=>{
 const joined=source(4,[rect(2,2,22,12)]);
 assert.equal(sourceComponentReview776(joined).length,1);
 const cuff=source(4,[rect(2,2,22,12),rect(29,29,31,31)]);
 const result=sourceComponentReview776(cuff);
 assert.equal(result.length,1);
 assert.deepEqual(result[0].selected,cuff.g.selected);
 assert.equal(result[0].accepted,false);
});
test('P776 paired footwear is never split solely from disconnection',()=>{
 const shoes=source(9);
 const out=sourceComponentReview776(shoes);
 assert.equal(out.length,1);
 assert.deepEqual(out[0].selected,shoes.g.selected);
 assert.equal(out[0].autoIndex,false);
});
test('P776 altered original logits, source map, overgrowth, imaginary seeds and owner acceptance fail closed',()=>{
 const s=source(),poisoned=Float32Array.from(s.data);const garmentPixel=2*W+2;poisoned[garmentPixel]=99;poisoned[4*N+garmentPixel]=-99;
 for(const bad of [
  {...s,data:poisoned},
  {...s,map:{...s.map,labels:new Uint8Array(N)}},
  {...s,groups:[{...s.g,seedPixelCount:1}]},
  {...s,groups:[{...s.g,addedPixelCount:1}]},
  {...s,groups:[{...s.g,maximumAddedPixels:999}]},
  {...s,groups:[{...s.g,accepted:true}]},
  {...s,groups:[{...s.g,needsReview:false}]}
 ])assert.throws(()=>sourceComponentReview776(bad),/MISSION1_COMPONENT_776:/);
});
test('P776 duplicate groups, overlapping pixels and inconsistent source pixel counts are rejected',()=>{
 const s=source(),snapshot=Float32Array.from(s.data);
 assert.throws(()=>sourceComponentReview776({...s,groups:[s.g,{...s.g,instanceKey:'other-group'}]}),/duplicated/);
 assert.throws(()=>sourceComponentReview776({...s,groups:[{...s.g,count:2}]}),/mismatch/);
 const result=sourceComponentReview776(s);
 assert.deepEqual(s.data,snapshot);
 assert.equal(result.some(x=>x.accepted||x.autoIndex),false);
});
