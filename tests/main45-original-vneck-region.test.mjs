import test from 'node:test';
import assert from 'node:assert/strict';
import {
 M45_LOCK,proposeOriginalVNeckSourceMatte45
} from '../research/main1054-mask45/vneck-source-region-trial.mjs';
const W=M45_LOCK.width,H=M45_LOCK.height;
const sourceRGBA=new Uint8Array(W*H*4);
const baselineRGBA=new Uint8Array(W*H*4);
for(let p=0;p<W*H;p++){
 const i=p*4,x=p%W,y=Math.floor(p/W);
 sourceRGBA.set([24,20,28,255],i);
 baselineRGBA.set([24,20,28,
  x>=400&&x<=1510&&y>=390&&y<=2500?254:0],i);
}
function set(x,y,r,g,b,alpha=254){
 const i=(y*W+x)*4;
 sourceRGBA.set([r,g,b,255],i);
 baselineRGBA.set([r,g,b,alpha],i);
}
const p93RGBA=new Uint8Array(baselineRGBA);
let oldChanges=0;
// A genuine-source-like filled pale mannequin patch INSIDE dark garment,
// 12,961 real warm original alpha deletions from P93.
for(let y=520;y<=634;y++)for(let x=910;x<=1022;x++){
 if(oldChanges>=12961)continue;
 set(x,y,141,125,112);
 p93RGBA[(y*W+x)*4+3]=0;
 oldChanges++;
}
assert.equal(oldChanges,12961);
// Border woven mannequin-alike color, not physically independently reviewed.
for(let y=518;y<=636;y++)for(let x=906;x<=1026;x++){
 const i=(y*W+x)*4;
 if(p93RGBA[i+3]===0)continue;
 set(x,y,145,128,117);
}
// Original bright piping must be protected, including its neighboring source.
for(let y=518;y<=635;y++)set(1028,y,245,245,245);
const args=()=>({
 sourceRGBA,baselineRGBA,p93RGBA,width:W,height:H,
 sourceJpegSHA256:M45_LOCK.originalJpegSHA256,
 baselinePngSHA256:M45_LOCK.work47PngSHA256,
 p93PngSHA256:M45_LOCK.p93PngSHA256
});
test('M45 actual-mask-shaped source region expands true P93 matte without changing RGB, piping, old files or authorizing 3D',()=>{
 const before=[new Uint8Array(sourceRGBA),
  new Uint8Array(baselineRGBA),new Uint8Array(p93RGBA)];
 const {candidateRGBA,receipt:r}=proposeOriginalVNeckSourceMatte45(args());
 assert.equal(r.originalP93AlphaRemoved,12961);
 assert.ok(r.additionallyTransparentOriginalOpaquePixels>50);
 assert.ok(r.additionallyTransparentOriginalOpaquePixels<=7500);
 assert.equal(candidateRGBA[(520*W+909)*4+3],0,'candidate may clean a pale source pixel adjacent to P93');
 assert.equal(candidateRGBA[(530*W+1028)*4+3],254,'protected white piping remains');
 assert.equal(candidateRGBA[(530*W+1030)*4+3],254,'distant garment/region not changed');
 assert.equal(candidateRGBA[(1100*W+1000)*4+3],254,'outside V neckline unchanged');
 assert.equal(r.protectedOriginalBrightPipingOrLogoPixelsRemoved,0);
 assert.equal(r.originalSourceRGBPixelsChanged,0);
 assert.equal(r.sourceOrP93AlphaIncreasedPixels,0);
 assert.equal(r.offVNeckOriginalSourcePixelsChanged,0);
 assert.equal(r.sourceOriginalPhoto2DFallbackRequired,true);
 assert.equal(r.humanMaskAccepted,false);
 assert.equal(r.consumer3DAdmitted,false);
 assert.equal(r.approved3D,false); // undefined is not true, but contract requires explicit FALSE
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.deepEqual(sourceRGBA,before[0]);
 assert.deepEqual(baselineRGBA,before[1]);
 assert.deepEqual(p93RGBA,before[2]);
});
test('M45 source JPEG original and P93 byte identity cannot be forged via labels or caller permissions',()=>{
 const q=args();
 for(const k of ['sourceJpegSHA256','baselinePngSHA256','p93PngSHA256']){
  assert.throws(()=>proposeOriginalVNeckSourceMatte45({...q,[k]:'a'.repeat(64)}),/BLOCKED/);
 }
 assert.throws(()=>proposeOriginalVNeckSourceMatte45({...q,width:W-1}),/BLOCKED/);
});
test('M45 forged P93 original-RGB change cannot pass independent original M41 audit',()=>{
 const copy=new Uint8Array(p93RGBA);
 copy[(540*W+1000)*4+1]=0;
 assert.throws(()=>proposeOriginalVNeckSourceMatte45({...args(),p93RGBA:copy}),/BLOCKED|violated|RGB/);
});
test('M45 source pixels outside original upper observed region cannot be laundered as a mannequin cleanup',()=>{
 const copy=new Uint8Array(p93RGBA);
 copy[(1750*W+1000)*4+3]=0;
 assert.throws(()=>proposeOriginalVNeckSourceMatte45({...args(),p93RGBA:copy}),/BLOCKED|upper/);
});
