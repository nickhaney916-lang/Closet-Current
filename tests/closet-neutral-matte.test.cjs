'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const matte=require('../public/closet-neutral-matte.js');
const W=120,H=100;
function photo({category='Shoes',color=[24,29,35],background=[219,214,213],
 whiteUpper=false,edge=false}={}){
 const data=new Uint8ClampedArray(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const inside=x>20&&x<100&&y>=19&&y<86;
  const swatch=inside&&x>=40&&x<=78&&y>53&&y<82;
  const rgb=inside?(whiteUpper?[220,218,214]:(swatch?[249,93,75]:color)):background;
  data.set([...rgb,255],(y*W+x)*4);
 }
 if(edge)for(let y=25;y<70;y++)data.set([35,45,50,255],(y*W)*4);
 return {data,category};
}
test('dark shoes with coral details separate from pale studio background, source unchanged',()=>{
 const p=photo(),orig=new Uint8ClampedArray(p.data);
 const r=matte.analyze(p.data,W,H,'Shoes');
 assert.equal(r.eligible,true);
 assert.equal(r.sourceAltered,false);
 assert.equal(r.automaticGarmentReconstruction,false);
 assert.equal(r.alpha[0],0);
 assert.equal(r.alpha[55*W+60],255);
 assert.deepEqual(p.data,orig);
});
test('white or pale shoes remain photos rather than losing actual material',()=>{
 const p=photo({whiteUpper:true});
 const r=matte.analyze(p.data,W,H,'Shoes');
 assert.equal(r.eligible,false);assert.equal(r.alpha,undefined);
});
test('busy room or orange/blue shop backdrop never becomes a shoe cutout',()=>{
 for(const bg of [[30,70,112],[186,101,52],[107,159,103]]){
  assert.equal(matte.analyze(photo({background:bg}).data,W,H,'Shoes').eligible,false);
 }
});
test('no experimental neutral matte for jeans, jackets, shirts or dresses',()=>{
 const p=photo();
 for(const cat of ['Bottoms','Outerwear','Tops','Dresses','Accessories'])
  assert.equal(matte.analyze(p.data,W,H,cat).eligible,false);
});
test('edge-touching sneaker and already transparent clipped artwork never erased',()=>{
 const p=photo({edge:true});
 assert.equal(matte.analyze(p.data,W,H,'Shoes').eligible,false);
 const a=photo();a.data[3]=0;
 assert.equal(matte.analyze(a.data,W,H,'Shoes').eligible,false);
});
test('reject malformed and oversized preview pixels to protect low-memory mobile browser',()=>{
 assert.throws(()=>matte.analyze(new Uint8Array(6),W,H,'Shoes'));
 assert.throws(()=>matte.analyze(new Uint8Array(300000*4),600,500,'Shoes'));
 assert.throws(()=>matte.analyze(null,120,100,'Shoes'));
});

test('pale sole connected to backdrop above a dark shadow retains original photo',()=>{
 const p=photo();
 // Replace lower shoe rows with a pale sole; leave a dark shadow beneath.
 for(let y=72;y<82;y++)for(let x=21;x<100;x++)
  p.data.set([220,218,214,255],(y*W+x)*4);
 const before=new Uint8ClampedArray(p.data);
 const result=matte.analyze(p.data,W,H,'Shoes');
 assert.equal(result.eligible,false);
 assert.equal(result.reason,'possible-pale-sole-or-separated-shadow');
 assert.equal(result.alpha,undefined);
 assert.deepEqual(p.data,before);
});
