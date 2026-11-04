import test from 'node:test';import assert from 'node:assert/strict';
import {diagnoseOutfitRegions} from '../public/outfit-diagnostics.mjs';
function make(){
 const width=20,height=20,area=width*height,logits=new Float32Array(18*area).fill(-10),labels=new Uint8Array(area),confidence=new Float32Array(area);
 for(let i=0;i<area;i++)logits[i]=10;
 const paint=(id,x0,y0,w,h,ambiguous=null)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
  const p=y*width+x;for(let c=0;c<18;c++)logits[c*area+p]=-10;
  logits[id*area+p]=10;labels[p]=id===10?9:id;confidence[p]=1;
  if(ambiguous!==null){logits[ambiguous*area+p]=9.9;labels[p]=0;confidence[p]=0;}
 }};
 return {logits,dims:[1,18,height,width],map:{width,height,labels,confidence,personDetected:true},paint};
}
test('diagnostic exposes low-confidence winning skirt without creating an owned garment',()=>{
 const e=make();e.paint(7,2,2,10,10);e.paint(5,12,4,4,4,4);const before=e.map.labels.slice();
 const d=diagnoseOutfitRegions(e.logits,e.dims,e.map,[{id:7}]);
 const skirt=d.regions.find(x=>x.id===5);
 assert.equal(skirt.winningModelPixels,16);assert.equal(skirt.trustedMaskPixels,0);
 assert.equal(skirt.reason,'uncertain-model-pixels');assert.equal(skirt.emitted,false);
 assert.equal(d.emittedGroups,1);assert.deepEqual(e.map.labels,before);
});
test('diagnostic identifies mask-area rejection separately from model misclassification',()=>{
 const e=make();e.paint(4,1,1,2,2);e.paint(4,16,16,2,2);
 const d=diagnoseOutfitRegions(e.logits,e.dims,e.map,[]),top=d.regions.find(x=>x.id===4);
 assert.equal(top.winningModelPixels,8);assert.equal(top.trustedMaskPixels,8);
 assert.equal(top.discardedSmallComponentPixels,0);
 assert.equal(top.reason,'insufficient-mask-area');assert.equal(top.componentCount,2);
});
test('small disconnected components are identified as discarded, not missing model predictions',()=>{
 const e=make();e.paint(4,1,1,2,1);e.paint(4,16,16,2,1);
 const top=diagnoseOutfitRegions(e.logits,e.dims,e.map,[]).regions.find(x=>x.id===4);
 assert.equal(top.winningModelPixels,4);assert.equal(top.discardedSmallComponentPixels,4);
 assert.equal(top.reason,'small-disconnected-regions');
});
test('left/right shoe model labels combine into one semantic shoes class',()=>{
 const e=make();e.paint(9,2,2,4,4);e.paint(10,12,2,4,4);const d=diagnoseOutfitRegions(e.logits,e.dims,e.map,[{id:9}]);
 assert.equal(d.regions.find(x=>x.id===9).winningModelPixels,32);
 assert.equal(d.regions.find(x=>x.id===9).reason,'emitted');
 assert.equal(d.regions.some(x=>x.id===10),false);
});
test('person gate is reported separately from garment model evidence',()=>{
 const e=make();e.paint(7,3,3,8,8);e.map.personDetected=false;
 const d=diagnoseOutfitRegions(e.logits,e.dims,e.map,[]);
 assert.equal(d.regions.find(x=>x.id===7).reason,'person-evidence-gate');
 assert.equal(d.personGatePassed,false);
 assert.throws(()=>diagnoseOutfitRegions(e.logits,[1,17,20,20],e.map,[]),/Invalid/);
});
