'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const fit=require('../public/garment-fit-geometry.js');
const engine=require('../public/reusable-figure-engine.js');
const room={left:24,top:15,width:52,height:40};
test('natural shirt width/height remain unchanged when displayed over either fixed figure',()=>{
 for(const figure of ['female','male']){
  const closet=[{id:'shirt',category:'Tops',itemType:'T-shirt',image:'data:image/png;base64,'+'Ab9/'.repeat(40)}];
  const placement=engine.plan({slots:{top:'shirt'}},closet,figure).placements[0];
  const p=fit.fitPlacement(placement.rect,62,123,{slot:'top',category:'Tops'});
  assert.ok(p);assert.equal(p.anchor,'upper-garment');assert.equal(p.aspectPreserved,true);
  assert.equal(p.top,placement.rect.top);
  const displayedRatio=p.width*647/(p.height*1199);
  assert.ok(Math.abs(displayedRatio-62/123)<1e-9);
  assert.ok(p.width<=placement.rect.width&&p.height<=placement.rect.height);
  assert.ok(Math.abs(p.left+p.width/2-placement.rect.left-placement.rect.width/2)<1e-9);
 }
});
test('waistline stays anchored for trousers and skirts with distinct hem lengths',()=>{
 const jeans=fit.fitPlacement(room,55,150,{slot:'bottom',category:'Bottoms'});
 const skirt=fit.fitPlacement({...room,height:24},70,75,{slot:'bottom',category:'Bottoms'});
 assert.equal(jeans.top,room.top);assert.equal(skirt.top,room.top);
 assert.equal(jeans.anchor,'waist-top');assert.equal(skirt.anchor,'waist-top');
 assert.ok(skirt.top+skirt.height<jeans.top+jeans.height);
});
test('shoes fit from sole baseline, and outer layers are top-anchored',()=>{
 const shoes=fit.fitPlacement({left:15,top:86,width:70,height:12},140,55,{slot:'shoes',category:'Shoes'});
 assert.ok(shoes);assert.equal(shoes.anchor,'sole-bottom');
 assert.ok(Math.abs(shoes.top+shoes.height-98)<1e-9);
 for(const slot of ['layer','layer2','layer3']){
  const coat=fit.fitPlacement(room,160,180,{slot,category:'Outerwear'});
  assert.equal(coat.top,room.top);
  assert.equal(coat.anchor,'upper-garment');
 }
});
test('reject invalid figure spaces, fake image dimensions and incompatible categories',()=>{
 const args={slot:'top',category:'Tops'};
 for(const rect of [null,{left:-1,top:0,width:1,height:1},
  {left:98,top:10,width:8,height:30},{left:0,top:0,width:0,height:40},
  {left:0,top:90,width:20,height:20},{left:0,top:0,width:Infinity,height:20}])
  assert.equal(fit.fitPlacement(rect,100,100,args),null);
 for(const [w,h] of [[0,50],[10,120],[120,10],[9999,9999],[10.5,80],[80,NaN]])
  assert.equal(fit.fitPlacement(room,w,h,args),null);
 for(const pair of [{slot:'top',category:'Shoes'},{slot:'bottom',category:'Tops'},
  {slot:'shoes',category:'Bottoms'},{slot:'layer',category:'Shoes'},
  {slot:'finish',category:'Tops'},{slot:'top',category:'__proto__'}])
  assert.equal(fit.fitPlacement(room,100,100,pair),null);
});
test('garment fitting is a pure local calculation; no source photo mutations or paid endpoints',()=>{
 const p=fit.fitPlacement(room,50,90,{slot:'top',category:'Tops'});
 assert.equal(p.sourcePixelsChanged,false);assert.equal(p.fitVerified,false);
 const s=fs.readFileSync('public/garment-fit-geometry.js','utf8');
 assert.ok(!/fetch\(|https:\/\/|localStorage|sessionStorage|indexedDB|WebSocket|\.postMessage\(/.test(s));
 const index=fs.readFileSync('public/index.html','utf8');
 assert.ok(index.indexOf('src="garment-fit-geometry.js"')<index.indexOf('src="reusable-figure-preview.js"'));
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 assert.match(ui,/ClosetGarmentFitGeometry\?\.fitPlacement/);
 assert.match(ui,/ClosetGarmentWarp\?\.alphaBounds/);
 assert.match(ui,/ClosetGarmentWarp\?\.hasAmbiguousNeck/);
});
test('the two fixed figures retain separate calibrated placement even after normalized fit',()=>{
 const male=engine.placementRect('top',{category:'Tops'},'male');
 const female=engine.placementRect('top',{category:'Tops'},'female');
 const a=fit.fitPlacement(male,80,100,{slot:'top',category:'Tops'});
 const b=fit.fitPlacement(female,80,100,{slot:'top',category:'Tops'});
 assert.notDeepEqual(a,b);assert.equal(a.top,male.top);assert.equal(b.top,female.top);
});
