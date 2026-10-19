import test from 'node:test';
import assert from 'node:assert/strict';
import {compareGarmentColors} from '../benchmark/garment-reconstruction-color-signals.mjs';
const hash='1'.repeat(64),outHash='2'.repeat(64),W=28,H=32;
const raster=(rgb,back=[255,255,255])=>{
 const n=W*H,data=new Uint8ClampedArray(n*3),mask=new Uint8Array(n);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,isGarment=x>=4&&x<24&&y>=4&&y<28;
  mask[i]=isGarment?255:0;data.set(isGarment?rgb:back,i*3);
 }
 return {width:W,height:H,data,mask};
};
const run=(src,dst,other={})=>compareGarmentColors({
 source:raster(src),generated:raster(dst),category:'Bottoms',
 sourceSha256:hash,generatedSha256:outHash,...other
});
test('identical orange fabric emits no color-drift warning but never approves garment',()=>{
 const x=run([231,69,13],[231,69,13]);
 assert.deepEqual(x.warnings,[]);assert.equal(x.chromaDistance,0);
 assert.equal(x.outputCanReplaceClosetTile,false);
 assert.equal(x.constructionDetailsVerified,false);
});
test('orange shorts changed to dark blue are flagged',()=>{
 const x=run([225,68,15],[30,55,195]);
 assert.ok(x.warnings.includes('dominant-color-chroma-drift'));
});
test('gray jeans changed to saturated blue are flagged',()=>{
 const x=run([166,169,164],[55,85,198]);
 assert.ok(x.warnings.includes('dominant-color-chroma-drift'));
});
test('moderate lighting difference in same hue is not automatically color drift',()=>{
 const x=run([200,75,30],[174,67,28]);
 assert.equal(x.warnings.includes('dominant-color-chroma-drift'),false);
 assert.equal(x.outputCanReplaceClosetTile,false);
});
test('black jacket requires visual inspection even if RGB statistic is inconclusive',()=>{
 const x=run([9,10,12],[8,9,10],{category:'Outerwear'});
 assert.ok(x.warnings.includes('dark-or-inadequately-sampled-fabric'));
 assert.equal(x.chromaDistance,null);
 assert.equal(x.garmentIdentityVerified,false);
});
test('background changes cannot affect garment color when trusted masks are provided',()=>{
 const clean=raster([231,69,13],[255,255,255]);
 const messy=raster([231,69,13],[0,44,160]);
 const x=compareGarmentColors({source:clean,generated:messy,
  category:'Bottoms',sourceSha256:hash,generatedSha256:outHash});
 assert.equal(x.chromaDistance,0);
});
test('too little garment foreground and malformed masks fail closed',()=>{
 const tiny=raster([231,69,13]);tiny.mask.fill(0);tiny.mask[0]=1;
 assert.throws(()=>compareGarmentColors({source:tiny,generated:raster([231,69,13]),
  category:'Bottoms',sourceSha256:hash,generatedSha256:outHash}),/foreground/);
 const corrupt=raster([231,69,13]);corrupt.mask[140]=72;
 assert.throws(()=>compareGarmentColors({source:corrupt,generated:raster([231,69,13]),
  category:'Bottoms',sourceSha256:hash,generatedSha256:outHash}),/binary/);
 assert.throws(()=>run([200,50,10],[205,45,7],{category:'Invalid'}));
 assert.throws(()=>run([200,50,10],[205,45,7],{generatedSha256:hash}));
});
