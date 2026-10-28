import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPortableCutoutEditRecipe,restorePortableCutoutEditRecipe,normalizeCutoutEdits}
 from '../research/work49/portable-edits.mjs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=(id='A')=>{
 const width=64,height=64,rgba=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<rgba.length;i+=4){rgba[i]=31;rgba[i+1]=93;rgba[i+2]=127;rgba[i+3]=i%512?255:0;}
 return {originalImage:'data:image/jpeg;base64,'+Buffer.from(('synthetic-original:'+id).repeat(5)).toString('base64'),
  maskFrame:{width,height,rgba},category:'Tops'};
};
const edits=[
 {action:'remove',x:.4,y:.6,radius:.014},
 {action:'soften',kind:'polygon',points:[{x:.1,y:.1},{x:.3,y:.2},{x:.3,y:.5}]},
 {action:'connected',x:.2,y:.2,radius:.008,tolerance:12}
];
test('portable recipe has no photo bytes, account identity, free text or approval',async()=>{
 const src=source(),recipe=await createPortableCutoutEditRecipe(src,edits),json=JSON.stringify(recipe);
 assert.equal(recipe.format,'closet-current-local-cutout-edits-v1');
 assert.equal(recipe.decision,'HOLD');
 assert.equal(recipe.ownerApproved,false);
 assert.equal(recipe.requiresReview,true);
 assert.match(recipe.originalSHA256,/^[a-f0-9]{64}$/);
 assert.match(recipe.maskSHA256,/^[a-f0-9]{64}$/);
 assert.doesNotMatch(json,/data:image|synthetic-original|fileName|email|photoBytes|userId|jwt|token|https:\/\//i);
 assert.deepEqual(await restorePortableCutoutEditRecipe(src,json),edits);
 assert.deepEqual(src.maskFrame.rgba,source().maskFrame.rgba,'source buffer preserved');
});
test('recipe strictly rejects altered original JPEG, mask RGB, mask alpha, dimensions or category',async()=>{
 const src=source(),json=JSON.stringify(await createPortableCutoutEditRecipe(src,edits));
 for(const variant of [
  source('B'),
  {...src,category:'Shoes'},
  {...src,maskFrame:{...src.maskFrame,width:32,height:128}},
  {...src,maskFrame:{...src.maskFrame,rgba:new Uint8ClampedArray(src.maskFrame.rgba)}},
 ]){
  if(variant.maskFrame?.rgba!==src.maskFrame.rgba&&variant.maskFrame?.rgba.length===src.maskFrame.rgba.length)
   variant.maskFrame.rgba[10]^=1;
  await assert.rejects(()=>restorePortableCutoutEditRecipe(variant,json),/source/);
 }
});
test('forged release approval, extra identity fields and unsafe edit keys are rejected',async()=>{
 const src=source(),r=await createPortableCutoutEditRecipe(src,edits);
 for(const mutate of [
  x=>x.ownerApproved=true,x=>x.decision='PASS',x=>x.requiresReview=false,
  x=>x.email='someone@example.com',x=>x.privatePhoto='data:image/jpeg;base64,secret',
  x=>x.edits[0].note='fabric',x=>x.edits[0].ownerId='other',
  x=>x.edits[0].action='paintNewFabric',x=>x.edits[0].radius=1,
  x=>x.edits[1].points[0].z=5,x=>x.format='other',
  x=>x.originalSHA256='bogus',x=>x.edits=new Array(41).fill({action:'remove',x:.1,y:.1,radius:.01})
 ]){const v=structuredClone(r);mutate(v);await assert.rejects(()=>restorePortableCutoutEditRecipe(src,JSON.stringify(v)));}
});
test('editor cannot restore old approval or prior source after a changed accepted mask',async()=>{
 const src=source(),json=JSON.stringify(await createPortableCutoutEditRecipe(src,edits));
 src.maskFrame.rgba[3]=src.maskFrame.rgba[3]?0:255;
 await assert.rejects(()=>restorePortableCutoutEditRecipe(src,json),/different source/);
});
test('only precisely normalized current refinements are portable, no legacy or arbitrary fields',()=>{
 assert.deepEqual(normalizeCutoutEdits(edits),edits);
 for(const bad of [
  [{x:.2,y:.2,radius:.02}],
  [{action:'remove',x:.2,y:.2,radius:.02,kind:'brush'}],
  [{action:'connected',x:.2,y:.2,radius:.02}],
  [{action:'remove',kind:'polygon',points:[{x:.1,y:.1},{x:.3,y:.2}]}],
  [{action:'remove',x:NaN,y:0,radius:.02}],
  [{action:'restore',x:.1,y:.2,radius:Infinity}],
 ])assert.throws(()=>normalizeCutoutEdits(bad));
});
test('malformed, huge and non-JSON recipes fail closed',async()=>{
 const src=source();
 for(const text of ['','null','[]','{','{}','x'.repeat(16001)]){
  await assert.rejects(()=>restorePortableCutoutEditRecipe(src,text));
 }
});
