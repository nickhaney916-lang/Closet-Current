'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const warp=require('../public/local-garment-warp.js');
function garment(w=100,h=150){
 const data=new Uint8ClampedArray(w*h*4);
 for(let y=12;y<h-12;y++)for(let x=12;x<w-12;x++){
  const k=(y*w+x)*4;data.set([38,68,178,255],k);
 }
 // The center print is a user's real design, not a surface to recolor.
 for(let y=40;y<80;y++)for(let x=42;x<58;x++)
  data.set([242,180,60,255],(y*w+x)*4);
 return data;
}
test('bounded real warp of a transparent shirt leaves central print intact',()=>{
 const w=100,h=150,source=garment(w,h),original=Buffer.from(source);
 const out=warp.rasterize(source,warp.makeMesh(w,h,'Tops'));
 assert.ok(out);
 const result=warp.validateWarp(source,out,w,h);
 assert.equal(result.accepted,true,JSON.stringify(result));
 assert.equal(result.fabricFitOrRealismVerified,false);
 assert.ok(result.visibleAlphaRatio>=.64&&result.visibleAlphaRatio<=1.08);
 assert.equal(result.centerCorrupted,0);
 assert.deepEqual(Buffer.from(source),original,'source image bytes remain unchanged');
});
test('warn-and-revert if all garment alpha is removed by a bad transform',()=>{
 const w=100,h=150,s=garment(w,h),out=new Uint8ClampedArray(s.length);
 const result=warp.validateWarp(s,out,w,h);
 assert.equal(result.accepted,false);
 assert.equal(result.reason,'implausible-visible-fabric-change');
 assert.equal(result.sourcePixelsChanged,false);
});
test('warn-and-revert a warped print/logo that changes colors in the central region',()=>{
 const w=100,h=150,s=garment(w,h);
 const out=warp.rasterize(s,warp.makeMesh(w,h,'Tops'));
 for(let y=42;y<75;y++)for(let x=44;x<56;x++){
  const k=(y*w+x)*4;out.set([50,210,70,255],k);
 }
 const r=warp.validateWarp(s,out,w,h);
 assert.equal(r.accepted,false);
 assert.equal(r.reason,'central-texture-or-seam-corrupted');
});
test('warn-and-revert partial central seam disappearance even if total area changes little',()=>{
 const w=100,h=150,s=garment(w,h);
 const out=warp.rasterize(s,warp.makeMesh(w,h,'Tops'));
 for(let y=30;y<65;y++)for(let x=47;x<53;x++)out[(y*w+x)*4+3]=0;
 const r=warp.validateWarp(s,out,w,h);
 assert.equal(r.accepted,false);assert.equal(r.reason,'central-texture-or-seam-corrupted');
});
test('no successful fit claims or fabricated pixels from missing/corrupt inputs',()=>{
 const w=100,h=150,s=garment(w,h);
 assert.equal(warp.validateWarp(s,new Uint8ClampedArray(3),w,h).accepted,false);
 assert.equal(warp.validateWarp(s,s,200,500).accepted,false);
 assert.equal(warp.validateWarp(new Uint8Array(s.length),new Uint8Array(s.length),w,h).accepted,false);
 assert.equal(warp.validateWarp(s,s,10000,10000).accepted,false);
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const engine=fs.readFileSync('public/local-garment-warp.js','utf8');
 assert.match(engine,/if\(!quality\.accepted\)return null/);
 assert.match(ui,/if\(warped\)image=warped/); // bad mesh retains intact transparent copy
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|\.postMessage\(/.test(engine));
});
test('open jacket can have transparent center without being misclassified as damaged',()=>{
 const w=100,h=150,s=new Uint8ClampedArray(w*h*4);
 for(let y=8;y<138;y++)for(const [l,r] of [[8,35],[65,92]])
  for(let x=l;x<r;x++)s.set([29,86,46,255],(y*w+x)*4);
 const out=warp.rasterize(s,warp.makeMesh(w,h,'Outerwear'));
 const p=warp.validateWarp(s,out,w,h);
 assert.equal(p.accepted,true,JSON.stringify(p));
 assert.equal(out[(65*w+50)*4+3],0,'jacket opening exposes underlying shirt');
});
