'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const geometry=require('../public/garment-fit-geometry.js');
function sample(width=100,height=150,box={x:20,y:15,width:60,height:118}){
 const p=new Uint8ClampedArray(width*height*4);
 for(let y=box.y;y<box.y+box.height;y++)for(let x=box.x;x<box.x+box.width;x++){
  const i=(y*width+x)*4;p[i]=35;p[i+1]=65;p[i+2]=210;p[i+3]=255;
 }
 return p;
}
test('measures visible bounds without altering original garment pixels',()=>{
 const rgba=sample(),old=Buffer.from(rgba);
 const result=geometry.inspectAlpha(rgba,100,150);
 assert.ok(result);
 assert.deepEqual(result.bounds,{x:20,y:15,width:60,height:118});
 assert.deepEqual(result.crop,{x:18,y:12,width:64,height:124});
 assert.equal(result.originalPhotoChanged,false);
 assert.equal(result.sourceColorOrTypeInferred,false);
 assert.equal(result.fitVerified,false);
 assert.equal(Buffer.from(rgba).equals(old),true);
});
test('crop never exceeds image boundaries even when garment reaches corner',()=>{
 const r=geometry.inspectAlpha(sample(100,150,{x:0,y:0,width:85,height:135}),100,150);
 assert.ok(r);assert.equal(r.crop.x,0);assert.equal(r.crop.y,0);
 assert.ok(r.crop.x+r.crop.width<=100);assert.ok(r.crop.y+r.crop.height<=150);
});
test('opaque raw photos, near-empty masks and malformed images must not be overlaid',()=>{
 const opaque=sample();for(let i=3;i<opaque.length;i+=4)opaque[i]=255;
 assert.equal(geometry.inspectAlpha(opaque,100,150),null);
 assert.equal(geometry.inspectAlpha(new Uint8ClampedArray(100*150*4),100,150),null);
 assert.equal(geometry.inspectAlpha(sample(100,150,{x:2,y:3,width:2,height:5}),100,150),null);
 assert.equal(geometry.inspectAlpha(new Uint8ClampedArray(10),100,150),null);
 assert.equal(geometry.inspectAlpha(null,100,150),null);
 assert.equal(geometry.inspectAlpha(sample(),1,150),null);
 assert.equal(geometry.inspectAlpha(sample(),100,Number.NaN),null);
 assert.equal(geometry.inspectAlpha(sample(),2000,2000),null);
});
test('garment aspect ratio is preserved, upper collar/waist anchors stay stable',()=>{
 for(const category of ['Tops','Bottoms','Dresses','Outerwear']){
  const rect={left:20,top:15,width:55,height:35};
  const place=geometry.fitPlacement(rect,65,125,category);
  assert.ok(place&&place.aspectPreserved);
  assert.equal(place.anchor,'upper-garment');
  assert.equal(place.top,rect.top);
  assert.ok(place.width<=rect.width&&place.height<=rect.height);
  const displayedRatio=(place.width*647)/(place.height*1199);
  assert.ok(Math.abs(displayedRatio-65/125)<1e-9);
  assert.ok(Math.abs((place.left+place.width/2)-(rect.left+rect.width/2))<1e-9);
  assert.equal(place.physicalSizeOrDrapeInferred,false);
 }
});
test('shoe soles use bottom anchor and remain within the selected figure rect',()=>{
 const target={left:18,top:85,width:64,height:14};
 const p=geometry.fitPlacement(target,160,60,'Shoes');
 assert.ok(p);
 assert.equal(p.anchor,'sole-bottom');
 assert.ok(Math.abs(p.top+p.height-target.top-target.height)<1e-9);
 assert.ok(p.width<=target.width&&p.height<=target.height);
});
test('geometry refuses unsupported input, oversized images and impossible placement',()=>{
 const target={left:20,top:20,width:60,height:40};
 for(const c of ['Other','Accessory','__proto__',null])
  assert.equal(geometry.fitPlacement(target,100,100,c),null);
 for(const [w,h] of [[0,100],[10,100],[100,10],[9000,9000],[1.5,100],[100,Infinity]])
  assert.equal(geometry.fitPlacement(target,w,h,'Tops'),null);
 for(const rect of [null,{left:90,top:10,width:20,height:30},
  {left:10,top:90,width:20,height:20},
  {left:0,top:0,width:-1,height:30},
  {left:0,top:0,width:Infinity,height:30}])
  assert.equal(geometry.fitPlacement(rect,100,100,'Tops'),null);
});
test('local rendering module cannot call a provider or persist source/selfie data',()=>{
 const source=fs.readFileSync('public/garment-fit-geometry.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|\.postMessage\(/.test(source));
 assert.ok(!/FASHN|OPENAI_API_KEY|https:\/\//.test(source));
 assert.match(html,/script src="garment-fit-geometry\.js"/);
 assert.ok(html.indexOf('src="garment-fit-geometry.js"')<html.indexOf('src="reusable-figure-preview.js"'));
 assert.match(ui,/ClosetGarmentFitGeometry\?\.inspectAlpha/);
 assert.match(ui,/ClosetGarmentFitGeometry\?\.fitPlacement/);
 assert.match(ui,/ctx\.putImageData\(pixels,0,0\)/);
});
