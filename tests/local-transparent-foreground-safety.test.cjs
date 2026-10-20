'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const safety=require('../public/local-transparent-foreground-safety.js');
const sha=require('node:crypto').createHash;

function fixture({neck='pale',body='blue',category='Dresses',split=false}={}){
 const width=120,height=190,data=new Uint8ClampedArray(width*height*4);
 const colored=(x0,y0,x1,y1,rgba)=>{
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)data.set(rgba,(y*width+x)*4);
 };
 const pigment=body==='blue'?[30,52,165,255]:[224,219,210,255];
 colored(20,38,100,177,pigment);
 if(split){
  // A V neckline has two fabric shoulders rather than a connected
  // central pale mannequin stem.
  colored(22,14,49,38,pigment);colored(71,14,98,38,pigment);
 }else{
  const stem=neck==='pale'?[192,182,165,255]:
   neck==='blue'?pigment:[240,236,229,255];
  colored(51,8,69,38,stem);
 }
 return {data,width,height,category};
}
const inspect=x=>safety.inspect(x.data,x.width,x.height,x.category);
test('original source cutout with a pale central neck over colored fabric is held, not fit',()=>{
 for(const category of ['Tops','Dresses','Outerwear']){
  const sample=fixture({category}),snapshot=Buffer.from(sample.data);
  const result=inspect(sample);
  assert.equal(result.hold,true,category);
  assert.equal(result.reason,'possible-attached-neutral-neck-or-hanger');
  assert.equal(result.sourcePixelsChanged,false);
  assert.equal(result.independentHumanMaskValidated,false);
  assert.deepEqual(Buffer.from(sample.data),snapshot);
 }
});
test('valid flat alpha silhouettes and matching fabric collars remain eligible to preview',()=>{
 const ok=[fixture({neck:'blue'}),fixture({neck:'pale',body:'light'}),
  fixture({split:true}),fixture({category:'Bottoms'}),fixture({category:'Shoes'})];
 for(const x of ok){
  const before=Buffer.from(x.data);
  assert.equal(inspect(x).hold,false,JSON.stringify({category:x.category}));
  assert.deepEqual(Buffer.from(x.data),before);
 }
});
test('invalid or giant alpha grids cannot allocate risky extra masks or invent human reviews',()=>{
 for(const x of [
  {width:200,height:200,data:[]},
  {width:1,height:200,data:new Uint8ClampedArray(800)},
  {width:3000,height:3000,data:new Uint8ClampedArray(4)},
  {width:100,height:80,data:new Uint8ClampedArray(100*80*4)}
 ]){
  const r=safety.inspect(x.data,x.width,x.height,'Dresses');
  assert.equal(r.hold,false);
  assert.equal(r.independentHumanMaskValidated,false);
 }
});
test('transparent cutter safety executes after original RGB recognition and BEFORE aligned rendering',()=>{
 const html=fs.readFileSync('public/index.html','utf8');
 const preview=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const app=fs.readFileSync('public/app.js','utf8');
 assert.ok(html.indexOf('src="local-transparent-foreground-safety.js"')<
  html.indexOf('src="reusable-figure-preview.js"'));
 assert.match(preview,/ClosetTransparentForegroundSafety\?\.inspect/);
 const i=preview.indexOf('ClosetTransparentForegroundSafety?.inspect(');
 assert.ok(i>preview.indexOf('if(white?.hasTransparentBackground('));
 assert.ok(i<preview.indexOf('return trimmed(high,nativeCutout);'));
 assert.ok(app.includes('function recognitionSourcePhoto('));
 assert.ok(!app.includes('ClosetTransparentForegroundSafety'));
 const src=fs.readFileSync('public/local-transparent-foreground-safety.js','utf8');
 assert.ok(!/fetch\(|WebSocket|localStorage|sessionStorage|\.postMessage\(/.test(src));
});
