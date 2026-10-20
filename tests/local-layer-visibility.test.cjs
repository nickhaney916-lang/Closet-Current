'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const visibility=require('../public/local-layer-visibility.js');
function filled(w=100,h=100,x0=20,x1=80,y0=20,y1=80,alpha=255){
 const data=new Uint8ClampedArray(w*h);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)data[y*w+x]=alpha;
 return data;
}
test('fully covered opaque shirt remains worn, but visibility audit reports almost no visible pixels',()=>{
 const shirt=filled(),coat=filled(100,100,0,100,0,100),old=Buffer.from(shirt);
 const report=visibility.auditAlphaMasks([shirt,coat],100,100);
 assert.ok(report);assert.equal(report.length,2);
 assert.equal(report[0].visibleFraction,0);assert.equal(report[0].mostlyConcealed,true);
 assert.equal(report[1].visibleFraction,1);assert.equal(report[1].mostlyConcealed,false);
 assert.deepEqual(Buffer.from(shirt),old);
 assert.equal(report[0].sourcePixelsChanged,false);
 assert.equal(report[0].bodyOcclusionMeasured,false);
 assert.equal(report[0].visualQualityVerified,false);
});
test('open jacket sides do not hide shirt in center',()=>{
 const w=100,h=100,shirt=filled(w,h,25,75,20,80);
 const coat=new Uint8ClampedArray(w*h);
 for(let y=0;y<85;y++)for(const [left,right] of [[5,25],[75,95]])
  for(let x=left;x<right;x++)coat[y*w+x]=255;
 const p=visibility.auditAlphaMasks([shirt,coat],w,h);
 assert.equal(p[0].visibleFraction,1);
 assert.equal(p[0].mostlyConcealed,false);
 assert.equal(p[1].visibleFraction,1);
});
test('partial transparency multiplies layer visibility without inventing mask coverage',()=>{
 const w=100,h=100;
 const src=filled(w,h,10,90,10,90),semi=filled(w,h,0,100,0,100,128);
 const p=visibility.auditAlphaMasks([src,semi],w,h);
 assert.ok(Math.abs(p[0].visibleFraction-(1-128/255))<1e-8);
 assert.equal(p[1].visibleFraction,1);
 assert.equal(p[0].mostlyConcealed,false);
});
test('z-order matters and any missing/empty layer remains unscored instead of marked hidden',()=>{
 const w=100,h=100,transparent=new Uint8ClampedArray(w*h),opaque=filled(w,h,0,100,0,100);
 const a=visibility.auditAlphaMasks([transparent,opaque],w,h);
 assert.equal(a[0].visibleFraction,null);assert.equal(a[0].mostlyConcealed,false);
 const b=visibility.auditAlphaMasks([opaque,transparent],w,h);
 assert.equal(b[0].visibleFraction,1);assert.equal(b[0].mostlyConcealed,false);
 assert.ok(visibility.auditAlphaMasks([],w,h));
});
test('reject oversized/mismatched buffers rather than turning failures into confident clothing claims',()=>{
 const good=filled();
 for(const invalid of [
  [good,new Uint8ClampedArray(15)],null,new Array(7).fill(good),[{foo:'bar'}]
 ])assert.equal(visibility.auditAlphaMasks(invalid,100,100),null);
 assert.equal(visibility.auditAlphaMasks([good],2,100),null);
 assert.equal(visibility.auditAlphaMasks([good],1000,1000),null);
 assert.equal(visibility.auditAlphaMasks([good],Infinity,100),null);
});
test('pixel sampling uses only transient browser canvas and never changes original clothing or network',()=>{
 const s=fs.readFileSync('public/local-layer-visibility.js','utf8');
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|https:\/\/|localStorage|sessionStorage|indexedDB|postMessage\(/.test(s));
 assert.match(ui,/renderedLayers\.push\(\{image:img,rect,slot:placement\.slot\}\)/);
 assert.match(ui,/ClosetLayerVisibility\?\.auditPlacedLayers/);
 assert.match(ui,/mostly hidden behind other clothing/);
 assert.match(ui,/if\(revision!==renderRevision\)return true/);
 assert.match(html,/src="local-layer-visibility\.js"/);
 assert.ok(html.indexOf('src="local-layer-visibility.js"')<
  html.indexOf('src="reusable-figure-preview.js"'));
 const provider=fs.readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(provider,/RESERVED_PAID_INFERENCE_APPROVED=false/);
 assert.match(provider,/CHAINED_PAID_INFERENCE_APPROVED=false/);
});
