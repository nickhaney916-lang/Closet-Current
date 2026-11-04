'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../public/closet-white-matte.js');
function make({
 width=100,height=120,object='colored',background='white',hole=true,touches=false,
 edgeAlpha=255
}={}){
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const inside=touches?(x<55&&y>20&&y<100):x>=22&&x<=77&&y>=12&&y<=107;
  const decorative=hole&&x>=43&&x<=52&&y>=45&&y<=58;
  let col=inside?(object==='white'?[250,250,249,255]:[37,73,157,255]):[255,255,255,edgeAlpha];
  if(background==='scene')col=[80+(x*3)%140,84+(y*5)%150,115+(x+y)%90,255];
  if(background==='cream'&&!inside)col=[242,236,223,255];
  if(decorative&&inside&&object==='colored')col=[255,255,255,255];
  data.set(col,(y*width+x)*4);
 }
 return {data,width,height};
}
const alpha=(r,x,y,w)=>r.alpha[y*w+x];
test('clean white-background blue shirt becomes transparent around the actual apparel',()=>{
 const im=make(),snapshot=im.data.slice();
 const r=analyze(im.data,im.width,im.height);
 assert.equal(r.eligible,true);assert.equal(r.garmentReconstructed,false);
 assert.equal(r.sourceAltered,false);
 assert.equal(alpha(r,0,0,im.width),0);
 assert.equal(alpha(r,45,35,im.width),255);
 assert.deepEqual(im.data,snapshot,'original RGBA unchanged');
});
test('enclosed white print remains opaque, never gets mistaken for white exterior',()=>{
 const im=make(),r=analyze(im.data,im.width,im.height);
 assert.equal(r.eligible,true);
 assert.equal(alpha(r,47,49,im.width),255);
 assert.equal(alpha(r,0,80,im.width),0);
});
test('white or extremely pale garment stays entirely unchanged',()=>{
 const im=make({object:'white'});
 assert.equal(analyze(im.data,im.width,im.height).eligible,false);
});
test('busy room, pale wall and transparent/dirty image boundaries remain unmodified',()=>{
 for(const im of [make({background:'scene'}),make({background:'cream'}),
   make({edgeAlpha:110}),make({touches:true})]){
  const r=analyze(im.data,im.width,im.height);
  assert.equal(r.eligible,false);
  assert.equal(r.alpha,undefined);
 }
});
test('legwear, dress and shoes are treated by pixels, not guessed into new categories',()=>{
 const im=make(),r=analyze(im.data,im.width,im.height);
 assert.ok(r.backgroundFraction>.18);
 assert.equal(r.originalDetailsPreserved,true);
 assert.equal('category' in r,false);
});
test('garment smaller than evidence threshold cannot become a fake cutout',()=>{
 const im=make({width:80,height:100});im.data.fill(255);
 for(let y=47;y<52;y++)for(let x=35;x<40;x++)
  im.data.set([32,44,57,255],(y*80+x)*4);
 assert.equal(analyze(im.data,80,100).eligible,false);
});
test('three-channel RGB supported and malformed images fail closed',()=>{
 const im=make(),rgb=new Uint8ClampedArray(im.width*im.height*3);
 for(let i=0;i<im.width*im.height;i++)rgb.set(im.data.slice(i*4,i*4+3),i*3);
 assert.equal(analyze(rgb,im.width,im.height).eligible,true);
 assert.throws(()=>analyze(new Uint8Array(8),100,120));
 assert.throws(()=>analyze(im.data,1,120));
 assert.throws(()=>analyze(im.data,1000,1000));
});

test('already transparent cutout stays transparent on the virtual hanger',()=>{
 const src=make({hole:false}),{data,width,height}=src;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const isGarment=x>=22&&x<=77&&y>=12&&y<=107;
  if(!isGarment)data[(y*width+x)*4+3]=0;
 }
 const before=data.slice();
 const {hasTransparentBackground}=require('../public/closet-white-matte.js');
 assert.equal(hasTransparentBackground(data,width,height),true);
 assert.equal(analyze(data,width,height).eligible,false);
 assert.deepEqual(data,before);
});
test('no false transparent source on a fully opaque photograph',()=>{
 const {hasTransparentBackground}=require('../public/closet-white-matte.js');
 const src=make(),busy=make({background:'scene'});
 assert.equal(hasTransparentBackground(src.data,src.width,src.height),false);
 assert.equal(hasTransparentBackground(busy.data,busy.width,busy.height),false);
});

test('white-background cutout avoids removing a bright sole between shoe upper and outsole',()=>{
 const im=make({hole:false}),original=im.data.slice();
 for(let y=63;y<79;y++)for(let x=22;x<=77;x++)
  im.data.set([252,252,252,255],(y*im.width+x)*4);
 const originalWithSole=im.data.slice();
 // The old mask falsely turns this middle shoe region transparent.
 const unqualified=analyze(im.data,im.width,im.height);
 assert.equal(unqualified.eligible,true);
 assert.equal(unqualified.alpha[70*im.width+50],0);
 const guarded=analyze(im.data,im.width,im.height,{category:'Shoes',primaryColor:'Blue'});
 assert.equal(guarded.eligible,false);
 assert.equal(guarded.reason,'possible-pale-sole-or-split-foreground');
 assert.equal(guarded.alpha,undefined);
 assert.deepEqual(im.data,originalWithSole,'never change original photo or shoe colors');
 assert.notDeepEqual(im.data,original);
});
test('known white or beige clothing keeps the complete original before any matte',()=>{
 const im=make({hole:false}),original=im.data.slice();
 for(const cat of ['Shoes','Dresses','Outerwear','Tops','Bottoms']){
  for(const color of ['White','Beige']){
   const checked=analyze(im.data,im.width,im.height,{category:cat,primaryColor:color});
   assert.equal(checked.eligible,false,cat+' '+color);
   assert.equal(checked.reason,'pale-garment-background-ambiguity');
   assert.equal(checked.alpha,undefined);
  }
 }
 assert.equal(analyze(im.data,im.width,im.height,{category:'Tops',primaryColor:'Blue'}).eligible,true,
  'normal saturated blue clothing still gets the approved white backdrop');
 assert.deepEqual(im.data,original);
});
test('closet tile engine passes garment identity into conservative white backdrop safety',()=>{
 const fs=require('node:fs');
 const tile=fs.readFileSync('public/closet-tile-engine.js','utf8');
 assert.match(tile,/ClosetWhiteMatte\.analyze\(thumbnail\.data,aw,ah,\{category:item\.category,primaryColor:item\.color\}\)/);
});
