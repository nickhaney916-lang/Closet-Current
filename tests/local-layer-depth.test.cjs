'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {depthFor}=require('../public/local-layer-depth.js');
const jacket={slot:'layer2',category:'Outerwear'};
test('only verified outerwear over an actually rendered underlayer receives contour contact depth',()=>{
 const yes=[
  [jacket,new Set(['bottom','top'])],
  [{slot:'layer',category:'Outerwear'},new Set(['top'])],
  [{slot:'layer3',category:'Outerwear'},new Set(['top','layer2'])],
  [{slot:'layer2',category:'Outerwear'},new Set(['layer'])]
 ];
 for(const [p,drawn] of yes){
  const before=[...drawn],r=depthFor(p,drawn);
  assert.equal(r.enabled,true);assert.equal(r.sourcePixelsChanged,false);
  assert.equal(r.anatomicalOcclusionVerified,false);
  assert.equal(r.physicalShadingVerified,false);
  assert.deepEqual([...drawn],before);
 }
 for(const [p,drawn] of [
  [jacket,new Set()], [jacket,new Set(['bottom'])],
  [{slot:'top',category:'Tops'},new Set(['bottom'])],
  [{slot:'top',category:'Dresses'},new Set(['bottom'])],
  [{slot:'shoes',category:'Shoes'},new Set(['top'])],
  [{slot:'layer2',category:'Tops'},new Set(['top'])],
  [{slot:'layer3',category:'Outerwear'},new Set(['shoes'])],
  [null,new Set(['top'])],[jacket,[]]
 ])assert.equal(depthFor(p,drawn).enabled,false);
});
test('contact depth is applied only after decoding valid garment layers and never through unreviewed photo masks',()=>{
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const imgDecode=ui.indexOf('try{await img.decode();}');
 const gate=ui.indexOf('ClosetLocalLayerDepth?.depthFor');
 const add=ui.indexOf('nextLayers.append(img);displayedSlots.add(placement.slot)');
 assert.ok(imgDecode>=0&&imgDecode<gate&&gate<add);
 assert.match(ui,/const displayedSlots=new Set\(\)/);
 assert.match(ui,/img\.dataset\.slot=placement\.slot/);
 assert.ok(!/ClosetDarkStudioMask|ClosetSourceGuidedMask/.test(ui));
 const local=fs.readFileSync('public/local-layer-depth.js','utf8');
 assert.ok(!/fetch\(|https:\/\/|localStorage|sessionStorage|indexedDB|WebSocket|XMLHttpRequest/.test(local));
});
test('CSS uses a subtle alpha contour filter, no rectangle shadows, and unaltered original RGBA',()=>{
 const css=fs.readFileSync('public/style.css','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 const m=css.match(/\.reusable-figure-layer--contact-depth\s*\{([^}]*)\}/);
 assert.ok(m);
 assert.match(m[1],/filter:drop-shadow\(0px 1px 1\.25px rgba\(30,28,26,\.16\)\)/);
 assert.ok(!/box-shadow|background|opacity:|filter:blur\(/.test(m[1]));
 assert.ok(html.indexOf('src="local-layer-depth.js"')>0);
 assert.ok(html.indexOf('src="local-layer-depth.js"')<html.indexOf('src="reusable-figure-preview.js"'));
 const paid=fs.readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(paid,/RESERVED_PAID_INFERENCE_APPROVED=false/);
 assert.match(paid,/CHAINED_PAID_INFERENCE_APPROVED=false/);
});
