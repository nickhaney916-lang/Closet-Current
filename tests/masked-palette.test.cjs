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

test('white garment is not confused with removed white background',()=>{
 const data=sample(32,32,(x,y)=>x>=6&&x<26&&y>=4&&y<28?[245,245,245,255]:[255,255,255,0]);
 const result=maskedPalette(data,32,32);
 assert.equal(result.primary,'White');
 assert.equal(result.needsConfirmation,false);
 assert.ok(result.coverage<.5);
});
test('balanced red and blue garments require confirmation instead of a guessed dominant color',()=>{
 const data=sample(32,32,(x,y)=>x<16?[225,30,30,255]:[20,80,220,255]);
 const result=maskedPalette(data,32,32);
 assert.equal(result.needsConfirmation,true);
 assert.ok(result.secondary);
});
test('dim blue remains blue when mask contains enough valid pixels',()=>{
 const data=sample(32,32,(x,y)=>x<25?[14,45,125,255]:[255,255,255,0]);
 const result=maskedPalette(data,32,32);
 assert.equal(result.primary,'Blue');
 assert.equal(result.needsConfirmation,false);
});
test('tiny garment masks are withheld from automatic indexing',()=>{
 const data=sample(32,32,(x,y)=>x<5&&y<5?[225,30,30,255]:[255,255,255,0]);
 const result=maskedPalette(data,32,32);
 assert.equal(result,null);
});
