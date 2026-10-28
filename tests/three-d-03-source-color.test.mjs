import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {representativeFabricColor} from '../research/three-d-03/fabric-color.mjs';
const frame=(w=80,h=80,{color=[23,25,30],logo=[225,225,225],opaque=false}={})=>{
 const d=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=(y*w+x)*4,inside=x>8&&x<w-9&&y>8&&y<h-9;
  const bright=inside&&x>28&&x<38&&y>25&&y<37;
  const rgb=bright?logo:color;
  for(let c=0;c<3;c++)d[p+c]=rgb[c];
  d[p+3]=opaque?255:inside?255:0;
 }
 return {data:d,width:w,height:h};
};
test('black real garment fabric color comes from original opaque RGB, not red template',()=>{
 const p=frame(),snapshot=Buffer.from(p.data),result=representativeFabricColor(p);
 assert.deepEqual(result.rgb,[23,25,30]);
 assert.ok(result.baseColor.every(x=>x>=0&&x<=1));
 assert.equal(result.generatedFabric,false);
 assert.equal(result.ownerApproved,false);
 assert.equal(result.humanVisualApproval,false);
 assert.deepEqual(Buffer.from(p.data),snapshot,'Must never modify original source pixels');
});
test('white print/logo pixels cannot override dominant black source cloth',()=>{
 const p=frame(80,80,{color:[22,27,30],logo:[255,255,255]});
 assert.deepEqual(representativeFabricColor(p).rgb,[22,27,30]);
});
test('independent fabric median channels remain from genuine opaque pixels',()=>{
 const p=frame(80,80,{color:[200,123,82],logo:[23,25,30]});
 assert.deepEqual(representativeFabricColor(p).rgb,[200,123,82]);
});
test('opaque backgrounds, invalid masks and empty source fail closed',()=>{
 for(const p of [
  frame(80,80,{opaque:true}),
  {data:new Uint8ClampedArray(80*80*4),width:80,height:80},
  {data:new Uint8ClampedArray(80*80*4),width:80,height:79},
  {data:new Uint8ClampedArray(80*80*4),width:0,height:80},
  {data:new Uint8Array(80*80*4),width:80,height:80}
 ])assert.throws(()=>representativeFabricColor(p));
});
test('shader crop converts original top-left RGBA bounds to GL bottom-left UV space',async()=>{
 const src=await readFile('research/three-d-01/webgl-renderer.mjs','utf8');
 assert.match(src,/1-crop\[1\]-crop\[3\]/);
 assert.match(src,/UNPACK_FLIP_Y_WEBGL,true/);
 assert.match(src,/m\.material\.photographed&&matchedColor/);
 assert.match(src,/Invalid reviewed fabric color/);
});
test('cutout only provides source-representative uniform and existing photo identity checks remain intact',async()=>{
 const [loader,demo]=await Promise.all([
  readFile('research/three-d-02/reviewed-texture.mjs','utf8'),
  readFile('research/three-d-02/demo.mjs','utf8')
 ]);
 assert.match(loader,/representativeFabricColor/);
 assert.match(loader,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+id\+'\.jpg'/);
 assert.match(loader,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+id\+'\.png'/);
 assert.match(demo,/viewer\.setPhoto\(loaded\.cutout,\{cropRect:loaded\.cropRect,baseColor:loaded\.baseColor\}\)/);
 assert.match(demo,/event\.isTrusted/);
 assert.match(demo,/dataset\.fabricRgb/);
});
test('no source/user account data storage, external renderer or service calls',async()=>{
 const paths=['research/three-d-03/fabric-color.mjs','research/three-d-01/webgl-renderer.mjs',
  'research/three-d-02/demo.mjs'];
 for(const path of paths){
  const src=await readFile(path,'utf8');
  assert.doesNotMatch(src,/localStorage|indexedDB|sendBeacon|supabase\.co|openai\.com|unpkg\.com|jsdelivr|camera\.getUserMedia/);
 }
});
