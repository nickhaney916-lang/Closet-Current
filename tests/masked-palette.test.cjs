'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {maskedPalette}=require('../public/photo-color.js');
function sample(width,height,paint){
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;data.set(paint(x,y),i);
 }
 return data;
}
test('transparent background does not change garment primary color',()=>{
 const data=sample(20,20,(x,y)=>x<12?[20,80,220,255]:[255,255,255,0]);
 const result=maskedPalette(data,20,20);
 assert.equal(result.primary,'Blue');
 assert.equal(result.secondary,null);
 assert.equal(result.coverage,.6);
});
test('secondary garment color is indexed by visible share',()=>{
 const data=sample(20,20,(x,y)=>x<14?[20,80,220,255]:[220,30,30,255]);
 const result=maskedPalette(data,20,20);
 assert.equal(result.primary,'Blue');
 assert.equal(result.secondary,'Red');
 assert.equal(result.needsConfirmation,false);
});
test('partially transparent mask edges are ignored',()=>{
 const data=sample(20,20,(x,y)=>x<10?[20,80,220,255]:[255,255,255,100]);
 assert.equal(maskedPalette(data,20,20).primary,'Blue');
});
test('unusable masks do not produce invented colors',()=>{
 const data=sample(20,20,()=>[0,0,0,0]);
 assert.equal(maskedPalette(data,20,20),null);
});
