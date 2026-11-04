import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shoePairEligible30,boundsForShoePair30}
 from '../research/multi-garment-capture-01/shoe-pair-geometry-30.mjs';
import {visibleGarmentGroups24}
 from '../research/multi-garment-capture-01/visible-groups.mjs';
import {clothingCropBounds,cropClothingPhotoPixels}
 from '../public/outfit-segmentation.mjs';

const map=(w=200,h=200)=>{
 const labels=new Uint8Array(w*h),confidence=new Float32Array(w*h);
 return {width:w,height:h,labels,confidence,personDetected:false,
  paint(id,x,y,width,height,value=.96){
   for(let row=y;row<y+height;row++)for(let col=x;col<x+width;col++){
    const n=row*w+col;labels[n]=id;confidence[n]=value;
   }
  }};
};
const left={left:.2375886524822695,right:.3723404255319149,
 top:.9028662420382165,bottom:.9968152866242038};
const right={left:.5336879432624113,right:.7322695035460993,
 top:.8614649681528662,bottom:.9745222929936305};
test('genuine frozen commons-0021 shoe pair gaps by 16.13% — wider than old 15%, but same-row + matching size',()=>{
 const gap=right.left-left.right;
 assert.ok(gap>.15&&gap<.22);
 assert.equal(shoePairEligible30(left,right,1,1),true);
 assert.equal(shoePairEligible30(right,left,1,1),true);
 const pair=boundsForShoePair30(left,right);
 assert.ok(pair.right-pair.left>.49);
 assert.ok(pair.bottom-pair.top<.15);
});
test('actual semantic component grouping creates ONE unverified source-preserving sneaker pair',()=>{
 const m=map();
 m.paint(9,47,180,27,16,.95);
 m.paint(9,107,172,40,19,.93);
 const grouped=visibleGarmentGroups24(m);
 assert.equal(grouped.length,1);
 const p=grouped[0];
 assert.equal(p.label,'Shoes');
 assert.equal(p.id,9);
 assert.equal(p.needsReview,true);
 assert.equal(p.confidence>.9,true);
 assert.equal(p.selected.reduce((a,b)=>a+b,0),27*16+40*19);
 assert.equal(p.count,27*16+40*19);
 assert.ok(p.instanceKey.startsWith('seg-9-'));
 assert.equal(p.types.includes('Sneakers'),false,'no sneaker subtype guess');
 const sourceImage={width:564,height:628,channels:3,data:new Uint8ClampedArray(564*628*3)};
 const crop=clothingCropBounds(sourceImage,m,p);
 const pixels=cropClothingPhotoPixels(sourceImage,m,p);
 assert.ok(crop.width>230&&crop.width<400);
 assert.equal(pixels.width,crop.width);
 assert.equal(pixels.height,crop.height);
});
test('two unequal height, unrelated shoes must remain independent; no false pair assertion',()=>{
 const m=map();
 m.paint(9,30,25,22,20);
 m.paint(9,100,135,25,28);
 const out=visibleGarmentGroups24(m);
 assert.equal(out.length,2);
 assert.ok(out.every(x=>x.needsReview));
});
test('same-class two distinct tops remain separate, never inferred to be one upper garment',()=>{
 const m=map();
 m.paint(4,18,22,50,45);
 m.paint(4,120,22,45,43);
 const result=visibleGarmentGroups24(m);
 assert.equal(result.length,2);
 assert.ok(result.every(x=>x.label==='Upper garment'&&x.needsReview));
 assert.notEqual(result[0].instanceKey,result[1].instanceKey);
});
test('different shoe size ratio, low vertical overlap and extremely wide gap refuse new extension',()=>{
 const a={left:10,right:26,top:150,bottom:166},b={left:61,right:120,top:150,bottom:166};
 assert.equal(shoePairEligible30(a,b,200,200),false,'>2.5x width ratio');
 const c={left:12,right:32,top:130,bottom:145},d={left:69,right:99,top:161,bottom:178};
 assert.equal(shoePairEligible30(c,d,200,200),false,'no vertical overlap');
 const e={left:8,right:34,top:156,bottom:171},f={left:116,right:145,top:155,bottom:174};
 assert.equal(shoePairEligible30(e,f,200,200),false,'too-wide gap');
});
test('old near-neighbor pair behavior preserved within existing 15%-of-image gap',()=>{
 const a={left:20,right:44,top:164,bottom:182};
 const b={left:63,right:89,top:167,bottom:186};
 assert.equal(shoePairEligible30(a,b,200,200),true);
});
test('malformed boxes, invalid dimensions and impossible coordinates fail closed',()=>{
 const valid={left:12,right:25,top:50,bottom:70};
 for(const x of [null,{}, {left:-1,right:25,top:50,bottom:70},
  {left:12,right:12,top:50,bottom:70},
  {left:12,right:25,top:50,bottom:Infinity},
  {left:12,right:25,top:50,bottom:201}]){
  assert.equal(shoePairEligible30(valid,x,200,200),false);
 }
 assert.equal(shoePairEligible30(valid,valid,0,200),false);
});
test('same masked pair is stable across repeated inference grouping; no mutation of source masks',()=>{
 const m=map();
 m.paint(9,40,175,30,18);
 m.paint(9,102,176,36,17);
 const originalLabels=m.labels.slice(),originalConfidence=m.confidence.slice();
 const p=visibleGarmentGroups24(m),q=visibleGarmentGroups24(m);
 assert.equal(p.length,1);assert.equal(q.length,1);
 assert.equal(p[0].instanceKey,q[0].instanceKey);
 assert.deepEqual(m.labels,originalLabels);
 assert.deepEqual(m.confidence,originalConfidence);
});
test('no semantic model or owned wardrobe storage pathways are changed by geometry helper',()=>{
 const source=readFileSync('research/multi-garment-capture-01/shoe-pair-geometry-30.mjs','utf8');
 for(const forbidden of ['fetch(', 'indexedDB', 'localStorage', 'PhotoColor.', 'sourceSHA256 =','threeDReady:true','automaticSave:true'])
  assert.equal(source.includes(forbidden),false);
 assert.match(readFileSync('research/multi-garment-capture-01/visible-groups.mjs','utf8'),/shoePairEligible30\(a\.bounds,b\.bounds,w,h\)/);
});
