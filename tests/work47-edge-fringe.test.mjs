import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {attenuateReviewedFringeAlpha} from '../research/work47/edge-fringe.mjs';

const make=(w,h,getAlpha)=>{
 const d=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  d[i]=34+(x%17);d[i+1]=105+(y%23);d[i+2]=201;d[i+3]=getAlpha(x,y);
 }
 return d;
};
test('alpha-only cleanup weakens the translucent edge but does not modify RGB, opaque fabric or original buffer',()=>{
 const w=40,h=40,original=make(w,h,(x,y)=>
   x<5||x>34||y<5||y>34?0:x===5||x===34||y===5||y===34?120:255);
 const display=new Uint8ClampedArray(original);
 const r=attenuateReviewedFringeAlpha(display,w,h);
 assert.ok(r.changed>0);
 assert.equal(r.ownerApproved,false);
 assert.equal(r.mode,'optional-review-only');
 assert.equal(display[(6*w+6)*4+3],255,'solid garment must not disappear');
 assert.equal(display[(5*w+10)*4+3],Math.round(120*.5));
 for(let i=0;i<original.length;i++){
  if(i%4===3){
   assert.ok(display[i]<=original[i],'preview must never fabricate opaque cloth');
   if(original[i]===255)assert.equal(display[i],255);
  }else assert.equal(display[i],original[i],'original source RGB must match byte-for-byte');
 }
 const unchanged=make(w,h,(x,y)=>original[(y*w+x)*4+3]);
 assert.deepEqual(unchanged,original,'original data never edited');
});
test('fully opaque masks and unchanged RGB cannot be described as fringe cleaned',()=>{
 for(const alpha of [0,255]){
  const d=make(24,24,()=>alpha);
  const original=new Uint8ClampedArray(d);
  const r=attenuateReviewedFringeAlpha(d,24,24);
  assert.equal(r.changed,0);
  assert.deepEqual(d,original);
 }
});
test('only one original 4-neighbor border ring changes; no cascading erosion into sleeve fabric',()=>{
 const d=make(40,40,(x,y)=>x>=4&&x<=35&&y>=4&&y<=35?128:0);
 const before=new Uint8ClampedArray(d);
 attenuateReviewedFringeAlpha(d,40,40);
 assert.equal(d[(4*40+5)*4+3],Math.round(128*.5));
 assert.equal(d[(5*40+5)*4+3],128,'second layer not removed by sequential reads');
 assert.equal(d[(20*40+20)*4+3],128);
 assert.equal(before[(4*40+5)*4+3],128);
});
test('transparent edge and abnormal sizes fail closed without RGB loss',()=>{
 for(const args of [
 [new Uint8ClampedArray(4),16,16],
 [new Uint8ClampedArray(16*16*4),NaN,16],
 [new Uint8ClampedArray(16*16*4),16,15],
 [new Uint8ClampedArray(16*16*4),16,Infinity],
 [[],16,16],
 [new Uint8ClampedArray(1),8000,8000]
 ])assert.throws(()=>attenuateReviewedFringeAlpha(...args),/Valid bounded/);
 const d=make(16,16,(x,y)=>x===0?100:255);
 attenuateReviewedFringeAlpha(d,16,16);
 assert.equal(d[3],Math.round(100*.5));
 assert.equal(d[(8*16+3)*4+3],255);
});
test('preview remains explicit, reversible, non-network, non-storage, unapproved and default disabled',async()=>{
 const [fit,editor,build,edge]=await Promise.all([
  readFile('research/work47/fit.mjs','utf8'),
  readFile('research/work47/editor.mjs','utf8'),
  readFile('scripts/build-work47-fit-hold.mjs','utf8'),
  readFile('research/work47/edge-fringe.mjs','utf8')
 ]);
 assert.match(fit,/if\(adjust.edgeCleanup===true\)/);
 assert.match(fit,/ctx.drawImage\(drawable,0,0\)/);
 assert.ok(fit.includes('return {...plan,fringe,binaryEdge,coverage,assignment,joins,faceOverlap,cutoutIntegrity};'));
 assert.match(editor,/edgeToggle.type='checkbox';edgeToggle.disabled=true/);
 assert.match(editor,/edgeToggle.onchange=/);
 assert.match(editor,/records.clear\(\);foreground\?\.remove\(\)/);
 assert.match(editor,/edgeToggle.onchange=null/);
 assert.ok(build.includes("['editor.mjs','fit.mjs','edge-fringe.mjs','binary-edge.mjs','atomic-preview.mjs','cutout-integrity.mjs']"),'Source-pinned offline preview module allowlist changed');
 for(const s of [fit,edge,editor])assert.doesNotMatch(s,/fetch\(|localStorage|indexedDB|XMLHttpRequest|\.src\s*=/);
});

test('display-relevant scaled fringe band affects 960px cutouts but never changes distant details',()=>{
 const width=960,height=960;
 const src=make(width,height,(x,y)=>{
  if(x<100||x>=860||y<100||y>=860)return 0;
  if(x<125||x>=835||y<125||y>=835)return 180;
  return 255;
 });
 const before=new Uint8ClampedArray(src);
 const r=attenuateReviewedFringeAlpha(src,width,height);
 assert.equal(r.radiusNativePx,8);
 assert.ok(r.changed>1000,'At phone scale cleanup must affect a visible band, not subpixel noise');
 const alphaAt=(x,y)=>src[(y*width+x)*4+3];
 assert.equal(alphaAt(100,500),Math.round(180/8),'Nearest edge uses exact radius-scaled attenuation');
 assert.equal(alphaAt(105,500),Math.round(180*6/8));
 assert.equal(alphaAt(112,500),180,'Fringe beyond max distance must remain original');
 assert.equal(alphaAt(130,500),255,'Opaque original texture core remains');
 for(const [x,y] of [[100,500],[105,500],[112,500],[130,500]]){
  const k=(y*width+x)*4;
  assert.deepEqual([...src.slice(k,k+3)],[...before.slice(k,k+3)],'Exact RGB preservation');
 }
});
