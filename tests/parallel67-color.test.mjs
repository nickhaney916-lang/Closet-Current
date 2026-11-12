import test from 'node:test';
import assert from 'node:assert/strict';
import {pixelColor67,measurePrimaryColor67} from '../research/parallel67/color.mjs';

// Synthetic cases verify arithmetic/safety contracts, NOT real-photo accuracy.
function image(rgb,{channels=3,width=10,height=10,maskReliability=.95}={}){
 const pixel=channels===4?[...rgb,255]:rgb;
 return {data:Uint8Array.from(Array(width*height).fill(pixel).flat()),width,height,channels,mask:new Float32Array(width*height).fill(1),maskReliability};
}
test('P67 pixel measurement requires independently supplied reliable foreground',()=>{
 const x=image([50,100,210]);delete x.mask;
 assert.equal(measurePrimaryColor67(x).reason,'foreground_mask_missing');
 x.mask=new Float32Array(100).fill(1);delete x.maskReliability;
 assert.equal(measurePrimaryColor67(x).reason,'foreground_mask_unreliable');
 x.maskReliability=.5;assert.equal(measurePrimaryColor67(x).color,null);
});
test('P67 mask excludes white background without compositing it into garment color',()=>{
 const x=image([245,245,245],{width:20,height:20});x.mask.fill(0);
 for(let i=0;i<100;i++){x.mask[i]=1;x.data.set([50,100,210],i*3);}
 const result=measurePrimaryColor67(x);
 assert.equal(result.color,'Blue');assert.equal(result.coverage,.25);
 assert.equal(result.dominance,1);assert.equal(result.verified,false);
});
test('P67 transparent foreground cannot become white, black or automatic color',()=>{
 const x=image([50,100,210],{channels:4});
 for(let i=0;i<100;i++)x.data[i*4+3]=0;
 const result=measurePrimaryColor67(x);
 assert.equal(result.color,null);assert.equal(result.status,'review');
 assert.equal(result.foregroundPixels,0);
});
test('P67 partially transparent foreground is rejected even if remaining color is uniform',()=>{
 const x=image([50,100,210],{channels:4,width:20,height:20});
 for(let i=0;i<200;i++)x.data[i*4+3]=100;
 assert.equal(measurePrimaryColor67(x).reason,'foreground_transparency');
});
test('P67 low foreground coverage and small samples cannot imply verified color',()=>{
 const x=image([50,100,210],{width:100,height:100});x.mask.fill(0);x.mask.fill(1,0,100);
 assert.equal(measurePrimaryColor67(x).reason,'insufficient_foreground');
 assert.equal(measurePrimaryColor67(image([50,100,210],{width:5,height:5})).color,null);
});
test('P67 saturated black/white exposure requires review rather than fabricated lighting correction',()=>{
 for(const rgb of [[0,0,0],[255,255,255]]){
  const result=measurePrimaryColor67(image(rgb));
  assert.equal(result.reason,'lighting_clipping');assert.equal(result.color,null);
 }
 assert.equal(measurePrimaryColor67(image([240,240,240])).color,'White');
 assert.equal(measurePrimaryColor67(image([25,25,25])).color,'Black');
});
test('P67 mixed foreground returns multicolor review with honest fractions',()=>{
 const x=image([50,100,210]);for(let i=0;i<40;i++)x.data.set([210,40,40],i*3);
 const r=measurePrimaryColor67(x);
 assert.equal(r.color,'Multicolor');assert.equal(r.status,'review');
 assert.equal(r.dominance,.6);assert.equal(r.secondFraction,.4);assert.equal(r.verified,false);
});
test('P67 invalid arrays, mismatched masks and nonfinite values fail closed',()=>{
 for(const mutate of [x=>x.mask=new Uint8Array(2),x=>x.mask=new Float32Array(100).fill(NaN),x=>x.channels=2,x=>x.width=0,x=>x.mask=new Float32Array(100).fill(255)]){
  const x=image([50,100,210]);mutate(x);assert.throws(()=>measurePrimaryColor67(x),/Invalid/);
 }
 assert.throws(()=>pixelColor67(NaN,0,0),/Invalid/);
});
test('P67 neutral and hue rules are deterministic and label no external truth',()=>{
 assert.equal(pixelColor67(130,130,130),'Gray');
 assert.equal(pixelColor67(50,100,210),'Blue');
 assert.equal(pixelColor67(200,35,35),'Red');
 assert.equal(pixelColor67(90,150,55),'Green');
 assert.equal(pixelColor67(130,85,40),'Brown');
});
