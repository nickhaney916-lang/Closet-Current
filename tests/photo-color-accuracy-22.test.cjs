const test=require('node:test');
const assert=require('node:assert/strict');
const {sceneSuggestion,estimate,maskedPalette}=require('../public/photo-color.js');
const {fillColor}=require('../public/clothing-details.js');
const size=48;
const paint=fn=>Uint8ClampedArray.from(Array.from({length:size*size},
 (_,i)=>fn(i%size,Math.floor(i/size))).flat());
const white=[240,240,240,255],blue=[30,50,155,255],black=[16,16,16,255];
const prior=(color,review=false)=>({color,support:.95,source:'photo-estimate',needsConfirmation:review});

test('edge-connected background can yield a different review-only suggestion',()=>{
 const scene=paint((x,y)=>x>=16&&x<32&&y>=12&&y<36?blue:white);
 const revised=sceneSuggestion(scene,size,size,prior('White'));
 assert.equal(revised.color,'Blue');
 assert.equal(revised.needsConfirmation,true);
 assert.equal(fillColor({color:''},revised).color,'');
});
test('uniform dark or pale crops retain prior evidence when foreground is unsupported',()=>{
 for(const [pixel,color] of [[black,'Black'],[white,'White']]){
  const baseline=prior(color);
  assert.equal(sceneSuggestion(paint(()=>pixel),size,size,baseline),baseline);
 }
});
test('disconnected pixels matching the border are retained as part of a visible subject',()=>{
 const scene=paint((x,y)=>x<12||x>=36||y<12||y>=36?white:
  x===12||x===35||y===12||y===35?black:white);
 const baseline=prior('Multicolor',true);
 assert.equal(sceneSuggestion(scene,size,size,baseline).color,'White');
});
test('transparent or invalid samples retain prior review and never promote acceptance',()=>{
 const baseline=prior('Gray',true);
 assert.equal(sceneSuggestion(null,size,size,baseline),baseline);
 assert.equal(sceneSuggestion(paint(()=>[0,0,0,0]),size,size,baseline),baseline);
 assert.equal(sceneSuggestion(paint(()=>blue),size,size,null),null);
 assert.equal(fillColor({color:'',colorSource:'user'},prior('Blue')).color,'');
});
test('alpha-masked palette and 16x16 safety thresholds remain callable',()=>{
 const masked=paint((x)=>x<24?blue:[240,240,240,0]);
 assert.equal(maskedPalette(masked,size,size).primary,'Blue');
 const pixels=Uint8ClampedArray.from(Array.from({length:256},()=>blue).flat());
 assert.equal(estimate(pixels,16,16).color,'Blue');
});
