'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const edge=require('../public/local-garment-edge-finish.js');
function hardShirt(w=100,h=150){
 const rgba=new Uint8ClampedArray(w*h*4);
 for(let y=10;y<h-10;y++)for(let x=15;x<w-15;x++)
  rgba.set([46,75,160,255],(y*w+x)*4);
 // Original opaque logos must not be altered while alpha contours soften.
 for(let y=47;y<85;y++)for(let x=40;x<60;x++)
  rgba.set([240,178,40,255],(y*w+x)*4);
 return rgba;
}
test('only bounded display alpha contours soften; every RGB byte and original remain intact',()=>{
 const w=100,h=150,src=hardShirt(w,h),before=Buffer.from(src);
 const p=edge.finish(src,w,h);
 assert.equal(p.eligible,true,JSON.stringify(p));
 assert.ok(p.softenedEdgePixels>=8);
 assert.ok(p.alphaMassLossFraction>0&&p.alphaMassLossFraction<=.01);
 assert.equal(p.allRgbUnchanged,true);assert.equal(p.alphaNeverIncreased,true);
 assert.equal(p.sourceAltered,false);assert.equal(p.inventedPixels,false);
 assert.equal(p.visualQualityVerified,false);
 assert.notEqual(p.pixels,src);assert.deepEqual(Buffer.from(src),before);
 let modified=0;for(let i=0;i<src.length;i++){
  if(i%4!==3)assert.equal(p.pixels[i],src[i],'garment RGB colors / logos never recolored');
  else{
   assert.ok(p.pixels[i]<=src[i]);
   if(p.pixels[i]!==src[i]){modified++;assert.equal(src[i],255);assert.equal(p.pixels[i],232);}
  }
 }
 assert.equal(modified,p.softenedEdgePixels);
 const center=(65*w+50)*4;
 assert.deepEqual([...p.pixels.slice(center,center+4)],[...src.slice(center,center+4)]);
});
test('existing native soft cuffs and semi-transparent printed pixels are untouched',()=>{
 const w=100,h=150,src=hardShirt(w,h);
 src[(20*w+15)*4+3]=128;
 const before=Buffer.from(src),p=edge.finish(src,w,h);
 assert.equal(p.eligible,false);assert.equal(p.reason,'existing-soft-alpha-preserved');
 assert.deepEqual(Buffer.from(src),before);
});
test('no cutout or tiny isolated details are not invented, thinned or displayed as trusted',()=>{
 const w=100,h=150,clear=new Uint8ClampedArray(w*h*4);
 assert.equal(edge.finish(clear,w,h).eligible,false);
 const opaque=hardShirt(w,h);for(let i=3;i<opaque.length;i+=4)opaque[i]=255;
 assert.equal(edge.finish(opaque,w,h).eligible,false);
 const tiny=new Uint8ClampedArray(w*h*4);
 for(let y=30;y<120;y++)tiny.set([120,50,40,255],(y*w+50)*4);
 assert.equal(edge.finish(tiny,w,h).eligible,false);
});
test('invalid image geometry or inputs are rejected before allocation',()=>{
 for(const [data,w,h] of [
  [new Uint8Array(2),100,150],
  [new Uint8ClampedArray(100*150*4),100,NaN],
  [new Uint8ClampedArray(100*150*4),23,150],
  [new Uint8ClampedArray(100*150*4),10000,10000],
  [[],100,150]
 ])assert.equal(edge.finish(data,w,h).eligible,false);
});
test('local finishing is only installed on safe-cutout path, never promoted from held masks',()=>{
 const source=fs.readFileSync('public/local-garment-edge-finish.js','utf8');
 const preview=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 assert.match(html,/script src="local-garment-edge-finish\.js"/);
 assert.ok(html.indexOf('src="local-garment-edge-finish.js"')<
  html.indexOf('src="reusable-figure-preview.js"'));
 assert.match(preview,/const edge=root\.ClosetGarmentEdgeFinish\?\.finish/);
 assert.match(preview,/if\(edge\?\.eligible===true/);
 assert.match(preview,/const white=root\.ClosetWhiteMatte/);
 assert.ok(!/ClosetSourceGuidedMask|ClosetDarkStudioMask/.test(preview),
  'Work research held proposals must never automatically display');
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|https:\/\/|localStorage|sessionStorage|indexedDB|\.postMessage\(/.test(source));
 const edgeProvider=fs.readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(edgeProvider,/RESERVED_PAID_INFERENCE_APPROVED=false/);
 assert.match(edgeProvider,/CHAINED_PAID_INFERENCE_APPROVED=false/);
});
