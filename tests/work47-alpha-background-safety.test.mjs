import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inspectReviewedCutoutAlpha as inspect,requireIsolatedCutoutForPreview as requireCutout}
 from '../research/work47/cutout-integrity.mjs';

function rgba(w,h,alpha){
 const out=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  out[i]=80+(x%11);out[i+1]=90+(y%17);out[i+2]=130;
  out[i+3]=alpha(x,y);
 }
 return out;
}
test('PNG with a fully opaque original photo is not valid clothing isolation',()=>{
 const pixels=rgba(48,64,()=>255),original=new Uint8ClampedArray(pixels);
 const a=inspect(pixels,48,64);
 assert.equal(a.status,'BLOCK_UNISOLATED_RECTANGLE');
 assert.equal(a.previewAllowed,false);
 assert.equal(a.solidRatio,1);
 assert.equal(a.solidCorners,4);
 assert.throws(()=>requireCutout(a),/original photo/);
 assert.deepEqual(pixels,original,'Cutout assessment never changes photograph pixels');
});
test('near-opaque rectangular photograph with tiny transparent corners inside must also fail',()=>{
 const a=inspect(rgba(100,100,(x,y)=>x>3&&x<96&&y>3&&y<96?255:255),100,100);
 assert.equal(a.previewAllowed,false);
 const b=inspect(rgba(100,100,(x,y)=>x>=20&&x<30&&y>=20&&y<30?0:255),100,100);
 assert.equal(b.solidRatio,.99);
 assert.equal(b.perimeterSolidRatio,1);
 assert.equal(b.previewAllowed,false);
 assert.throws(()=>requireCutout(b));
});
test('actual cutout silhouette with transparent corners remains available for human REVIEW',()=>{
 const img=rgba(100,100,(x,y)=>{
  if(x>=20&&x<=80&&y>=14&&y<=90)return x===20||x===80?90:255;
  return 0;
 });
 const original=new Uint8ClampedArray(img);
 const result=inspect(img,100,100);
 assert.equal(result.previewAllowed,true);
 assert.equal(result.status,'REVIEW_REAL_CUTOUT');
 assert.equal(result.humanVisualApproval,false);
 assert.equal(result.solidCorners,0);
 assert.equal(requireCutout(result),result);
 assert.deepEqual(img,original);
});
test('hard binary-alpha mask needs review, but its transparency is not falsely rejected',()=>{
 const a=inspect(rgba(100,100,(x,y)=>x>=20&&x<80&&y>=10&&y<95?255:0),100,100);
 assert.equal(a.status,'REVIEW_HARD_BINARY_EDGE');
 assert.equal(a.previewAllowed,true);
 assert.equal(a.translucent,0);
 assert.equal(requireCutout(a),a);
});
test('suspect three opaque corners warns instead of deleting legitimate reviewed cutout',()=>{
 const a=inspect(rgba(80,80,(x,y)=>{
  if((x===0&&y===0)||(x===79&&y===0)||(x===0&&y===79))return 255;
  if(x>=20&&x<60&&y>15&&y<70)return 255;
  return 0;
 }),80,80);
 assert.equal(a.status,'REVIEW_POSSIBLE_BACKGROUND');
 assert.equal(a.previewAllowed,true);
 assert.equal(requireCutout(a).humanVisualApproval,false);
});
test('opaque source image in wrong RGB encoding cannot bypass alpha-only detection',()=>{
 const first=rgba(64,64,()=>255),second=rgba(64,64,()=>255);
 for(let i=0;i<second.length;i+=4){second[i]=255;second[i+1]=0;second[i+2]=255;}
 assert.equal(inspect(first,64,64).status,inspect(second,64,64).status);
});
test('bad input, forged approval and malformed reports fail closed',()=>{
 for(const [x,w,h] of [[null,64,64],[[],64,64],
 [new Uint8ClampedArray(64*64*4),NaN,64],[new Uint8ClampedArray(12*12*4),12,12],
 [new Uint8ClampedArray(1),64,64],[new Uint8ClampedArray(64*64*4),64,6000]])
  assert.throws(()=>inspect(x,w,h),/bounded decoded/);
 for(const bad of [null,{status:'APPROVED',previewAllowed:true,humanVisualApproval:false},
 {status:'REVIEW_REAL_CUTOUT',previewAllowed:true,humanVisualApproval:true},
 {status:'BLOCK_UNISOLATED_RECTANGLE',previewAllowed:true,humanVisualApproval:false}])
  assert.throws(()=>requireCutout(bad));
});
test('protected painter and original-photo fallback remain exact source-owned, no file/network changes',async()=>{
 const [fit,editor,build]=await Promise.all(['research/work47/fit.mjs',
 'research/work47/editor.mjs','scripts/build-work47-fit-hold.mjs'].map(p=>readFile(p,'utf8')));
 assert.match(fit,/requireIsolatedCutoutForPreview\(inspectReviewedCutoutAlpha\(pixels/);
 assert.ok(fit.includes('return {...plan,fringe,binaryEdge,coverage,assignment,joins,faceOverlap,cutoutIntegrity};'));
 assert.match(editor,/Cutout still looks like a solid photograph/);
 assert.match(editor,/Keep the original and remove its background before fitting/);
 assert.ok(build.includes("['editor.mjs','fit.mjs','edge-fringe.mjs','binary-edge.mjs','atomic-preview.mjs','cutout-integrity.mjs']"),'Source-pinned offline preview module allowlist changed');
 const mod=await readFile('research/work47/cutout-integrity.mjs','utf8');
 assert.doesNotMatch(mod,/fetch\(|localStorage|indexedDB|XMLHttpRequest|\.src\s*=/);
 assert.match(editor,/isActive\(\)===true|isActive\(\)\s*===\s*true|isActive\(\)\s*\&\&|isActive\(\)\s*\?\s*true|isActive\(\)===true|isActive\(\)\s*===\s*true|isActive\(\)/);
});
