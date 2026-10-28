import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {softenReviewedBinarySilhouette} from '../research/work47/binary-edge.mjs';

function make(w,h,fn){
 const d=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=4*(y*w+x);d[k]=37+x%40;d[k+1]=109+y%31;d[k+2]=195;d[k+3]=fn(x,y);
 }
 return d;
}
test('hard binary cutout gains only a reversible inward alpha boundary, without RGB change or new fabric',()=>{
 const w=320,h=320,original=make(w,h,(x,y)=>x>=25&&x<295&&y>=25&&y<295?255:0);
 const display=new Uint8ClampedArray(original);
 const result=softenReviewedBinarySilhouette(display,w,h);
 assert.equal(result.radiusNativePx,2);
 assert.ok(result.changed>0);
 assert.equal(result.ownerApproved,false);
 assert.equal(result.sourceRGBModified,false);
 assert.equal(display[4*(100*w+25)+3],Math.round(255*.6));
 assert.equal(display[4*(100*w+30)+3],255,'opaque interior remains unchanged');
 assert.equal(display[4*(100*w+24)+3],0,'transparent exterior cannot become synthetic clothing');
 for(let i=0;i<original.length;i++){
  if(i%4!==3)assert.equal(display[i],original[i],'RGB never changed');
  else assert.ok(display[i]<=original[i],'cannot create opaque cloth');
 }
 assert.equal(original[4*(100*w+25)+3],255,'reviewed source remains pristine');
});
test('complete opaque photo, transparent canvas, translucent fringe cutout, invalid size all fail closed',()=>{
 for(const alpha of [0,255]){
  const d=make(40,40,()=>alpha),prior=new Uint8ClampedArray(d);
  assert.equal(softenReviewedBinarySilhouette(d,40,40).changed,0);
  assert.deepEqual(d,prior);
 }
 const soft=make(40,40,(x,y)=>x>6&&x<33&&y>6&&y<33?(x===7||y===7?126:255):0);
 const copy=new Uint8ClampedArray(soft);
 assert.equal(softenReviewedBinarySilhouette(soft,40,40).changed,0);
 assert.deepEqual(soft,copy);
 assert.throws(()=>softenReviewedBinarySilhouette(new Uint8ClampedArray(4),40,40));
 assert.throws(()=>softenReviewedBinarySilhouette(new Uint8ClampedArray(4),4000,4000));
});
test('scaled 960px native hard masks change phone-visible edge band and preserve core',()=>{
 const w=960,h=960,d=make(w,h,(x,y)=>x>=100&&x<860&&y>=100&&y<860?255:0);
 const r=softenReviewedBinarySilhouette(d,w,h);
 assert.equal(r.radiusNativePx,4);
 assert.ok(r.changed>2000);
 assert.ok(r.affectedOpaqueRatio<.15);
 assert.equal(d[4*(500*w+100)+3],153);
 assert.equal(d[4*(500*w+105)+3],255);
});
test('both edge previews cannot be simultaneously requested; default fit remains untouched',async()=>{
 const fit=await readFile('research/work47/fit.mjs','utf8');
 const editor=await readFile('research/work47/editor.mjs','utf8');
 const build=await readFile('scripts/build-work47-fit-hold.mjs','utf8');
 assert.match(fit,/adjust.binaryEdgeReview===true&&adjust.edgeCleanup===true/);
 assert.ok(fit.includes('if(adjust.edgeCleanup===true||adjust.binaryEdgeReview===true)'));
 assert.ok(fit.includes('affectedOpaqueRatio>.15'));
 assert.match(editor,/binaryToggle.type='checkbox';binaryToggle.disabled=true/);
 assert.match(editor,/binaryToggle.onchange=/);
 assert.match(editor,/binaryToggle.onchange=null/);
 assert.match(build,/'binary-edge.mjs'/);
});


test('enclosed transparent print holes and interior fabric are never treated as exterior silhouette',()=>{
 const w=320,h=320;
 const original=make(w,h,(x,y)=>{
  const garment=x>=25&&x<295&&y>=25&&y<295;
  const printedHole=x>=145&&x<175&&y>=145&&y<175;
  return garment&&!printedHole?255:0;
 });
 const after=new Uint8ClampedArray(original);
 const result=softenReviewedBinarySilhouette(after,w,h);
 assert.ok(result.changed>0,'Actual exterior garment contour should be softened');
 const a=(x,y,bytes)=>bytes[4*(y*w+x)+3];
 assert.equal(a(144,160,after),255,'Opaque pixels beside enclosed print holes must be preserved');
 assert.equal(a(175,160,after),255,'Opposite edge of enclosed hole unchanged');
 assert.equal(a(130,160,after),255,'Interior fabric untouched');
 assert.equal(a(25,160,after),153,'Outer silhouette still softens');
 assert.equal(a(145,160,after),0,'Original printed transparent hole remains empty');
 assert.equal(a(25,160,original),255,'The source garment never changes');
});
