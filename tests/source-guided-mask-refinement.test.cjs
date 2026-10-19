'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const refine=require('../public/source-guided-mask-refinement.js');
const apply=require('../public/dark-studio-garment-mask.js').applyAlpha;
function source(w=600,h=900){
 const d=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++)d.set([25,25,25,255],i*4);
 for(let y=120;y<790;y++)for(let x=160;x<440;x++)d.set([190,30,35,255],(y*w+x)*4);
 for(let y=300;y<400;y++)for(let x=220;x<380;x++)d.set([25,25,25,255],(y*w+x)*4);
 return {d,w,h};
}
test('higher-resolution proposals derive their guide from the exact source and remain held',()=>{
 const {d,w,h}=source(),before=Buffer.from(d),p=refine.propose(d,w,h,{category:'Tops',primaryColor:'Red'});
 assert.equal(p.proposalAvailable,true);assert.equal(p.displayEligible,false);assert.equal(p.eligible,false);
 assert.equal(p.alpha.length,w*h);assert.ok(p.guideWidth*p.guideHeight<=150000);
 assert.equal(p.alpha[350*w+280],255,'enclosed dark logo retained');
 assert.equal(p.alpha[50*w+50],0);assert.deepEqual(Buffer.from(d),before);
});
test('refinement changes only its declared uncertain boundary band',()=>{
 const {d,w,h}=source(),p=refine.propose(d,w,h,{category:'Tops',primaryColor:'Red'});
 assert.ok(p.uncertainBoundaryPixels>0);assert.equal(p.outsideBandChanges,0);
 let cleared=0,restored=0;
 for(let i=0;i<p.alpha.length;i++){
  assert.ok(p.alpha[i]>=p.projectedAlpha[i],'projected foreground cannot be erased');
  if(!p.uncertainty[i])assert.equal(p.alpha[i],p.projectedAlpha[i]);
  if(p.alpha[i]<p.projectedAlpha[i])cleared++;
  if(p.alpha[i]>p.projectedAlpha[i])restored++;
 }
 assert.equal(cleared,0);assert.equal(p.safetyMode,'preserve-projected-foreground');assert.equal(cleared,p.clearedBoundaryPixels);assert.equal(restored,p.restoredBoundaryPixels);
 const rgba=apply(d,p.alpha);
 for(let i=0;i<d.length;i++)if(i%4!==3)assert.equal(rgba[i],d[i]);
});
test('thin source-colored boundary pixels stay present without invented RGB',()=>{
 const {d,w,h}=source();
 for(let y=200;y<650;y++)d.set([210,35,40,255],(y*w+159)*4);
 const p=refine.propose(d,w,h,{category:'Tops',primaryColor:'Red'});
 for(let y=220;y<630;y++)assert.equal(p.alpha[y*w+159],255);
 assert.equal(p.completeBoundaryQualityVerified,false);
});
test('native soft alpha, neutral fabric and unrelated backgrounds stay on existing held paths',()=>{
 const {d,w,h}=source();d[3]=128;
 assert.equal(refine.propose(d,w,h,{category:'Tops',primaryColor:'Red'}).proposalAvailable,false);
 d[3]=255;assert.equal(refine.propose(d,w,h,{category:'Tops',primaryColor:'Black'}).proposalAvailable,false);
 assert.equal(refine.propose(d,w,h,{category:'Bottoms',primaryColor:'Blue'}).proposalAvailable,false);
});
test('invalid geometry and oversized inputs cannot allocate unbounded guides',()=>{
 for(const args of [[new Uint8Array(3),600,900],[new Uint8Array(0),0,900],
  [new Uint8Array(800*900*4),800,900],[new Uint8Array(0),NaN,900]])
  assert.throws(()=>refine.propose(...args,{category:'Tops',primaryColor:'Red'}),/Invalid/);
});

test('indistinguishable black trim is an explicit unresolved counterexample, never auto-approved',()=>{
 const {d,w,h}=source();
 // Synthetic black fabric against the identical black backdrop has no usable
 // color evidence. This deliberately records failure, not garment accuracy.
 for(let y=760;y<790;y++)for(let x=160;x<440;x++)d.set([25,25,25,255],(y*w+x)*4);
 const p=refine.propose(d,w,h,{category:'Tops',primaryColor:'Red'});
 assert.equal(p.proposalAvailable,true);assert.equal(p.alpha[780*w+250],0);
 assert.equal(p.displayEligible,false);assert.equal(p.completeBoundaryQualityVerified,false);
});

test('relative chroma recovers dark red boundary fabric that absolute RGB neutrality misses',()=>{
 const {d,w,h}=source();
 for(let y=200;y<650;y++)d.set([29,15,15,255],(y*w+158)*4);
 const p=refine.propose(d,w,h,{category:'Tops',primaryColor:'Red'});
 let recovered=0;
 for(let y=220;y<630;y++){
  assert.equal(p.alpha[y*w+158],255);
  if(p.projectedAlpha[y*w+158]===0)recovered++;
 }
 assert.ok(recovered>0);assert.ok(p.restoredDarkChromaPixels>=recovered);
 assert.equal(p.displayEligible,false);
});
