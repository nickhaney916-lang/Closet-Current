const test=require('node:test');
const assert=require('node:assert/strict');
const PhotoColor=require('../public/photo-color.js');
const Details=require('../public/clothing-details.js');
const photo=(rgbA,rgbB,shareTenths)=>{
 const w=16,h=16,pixels=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  // The production sampler analyzes only [3..12] x [3..12].
  // Each sampled row contains exactly shareTenths/10 of the first color.
  const inCenter=x>=3&&x<13&&y>=3&&y<13;
  const main=inCenter&&(x-3+3*(y-3))%10<shareTenths;
  pixels.set([...(main?rgbA:rgbB),255],(y*w+x)*4);
 }
 return pixels;
};
const neutral=[120,120,120],red=[190,18,22],blue=[18,38,190];
test('neutral black/gray/white-like candidate with 80% support requires explicit user review',()=>{
 const e=PhotoColor.estimate(photo(neutral,red,8),16,16);
 assert.equal(e.color,'Gray');assert.equal(e.support,.8);
 assert.equal(e.needsConfirmation,true);
 assert.equal(Details.fillColor({color:'',category:'Tops'},e).color,'');
});
test('near-uniform neutral color can still be auto-suggested, requiring 90% support',()=>{
 const e=PhotoColor.estimate(photo(neutral,red,9),16,16);
 assert.equal(e.color,'Gray');assert.equal(e.support,.9);
 assert.equal(e.needsConfirmation,undefined);
 assert.equal(Details.fillColor({color:'',category:'Tops'},e).color,'Gray');
});
test('chromatic 70% support remains a review suggestion for source/background ambiguity',()=>{
 const e=PhotoColor.estimate(photo(red,blue,7),16,16);
 assert.equal(e.color,'Red');assert.equal(e.support,.7);
 assert.equal(e.needsConfirmation,true);
 assert.equal(Details.fillColor({color:'',category:'Tops'},e).color,'');
});
test('chromatic 80% support retains useful confident auto-color functionality',()=>{
 const e=PhotoColor.estimate(photo(red,blue,8),16,16);
 assert.equal(e.color,'Red');assert.equal(e.support,.8);
 assert.equal(e.needsConfirmation,undefined);
 assert.equal(Details.fillColor({color:'',category:'Tops'},e).color,'Red');
});
test('fully uniform dark neutral and fully uniform red remain safe estimates',()=>{
 const uniform=(r,g,b)=>new Uint8ClampedArray(Array.from({length:16*16},()=>[r,g,b,255]).flat());
 for(const [rgb,expected] of [[[5,5,5],'Black'],[[240,240,240],'White'],[[190,20,22],'Red']]){
  const out=PhotoColor.estimate(uniform(...rgb),16,16);
  assert.equal(out.color,expected);
  assert.equal(out.support,1);
  assert.notEqual(out.needsConfirmation,true);
 }
});
test('source-true masked palette remains unchanged by full-scene risk thresholds',()=>{
 const p=new Uint8ClampedArray(16*16*4);
 for(let i=0;i<16*16;i++)p.set(i<200?[40,40,40,255]:[230,230,230,0],i*4);
 const mask=PhotoColor.maskedPalette(p,16,16);
 assert.equal(mask.primary,'Gray');
 assert.equal(mask.needsConfirmation,false);
 assert.equal(mask.coverage,0.781);
});
test('a user-confirmed color remains highest authority even with 100% unambiguous sample',()=>{
 const confident=PhotoColor.estimate(photo(red,blue,10),16,16);
 const item={color:'Green',colorSource:'user',category:'Tops',sourceSHA256:'a'.repeat(64)};
 assert.strictEqual(Details.fillColor(item,confident),item);
 assert.equal(Details.fill(item,{category:'Tops'},{color:'Red'},true).color,'Green');
});
test('inadequate photo pixels never become accepted colors',()=>{
 assert.equal(PhotoColor.estimate(new Uint8ClampedArray(16*16*4),16,16),null);
 assert.throws(()=>PhotoColor.estimate([],16,16),/Invalid/);
});
