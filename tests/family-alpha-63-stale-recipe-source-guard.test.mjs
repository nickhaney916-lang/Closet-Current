/**
 * Family Alpha #63 — independent adversarial regression of the source/auto
 * cutout boundary. Recipes are a local, *untrusted* replay instruction;
 * they never authorize account access, visual approval, or deployment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {prepareAutomaticGarment} from '../research/work50/isolate.mjs';
import {createPortableCutoutEditRecipe,restorePortableCutoutEditRecipe}
 from '../research/work49/portable-edits.mjs';
import {applyMaskRefinement} from '../research/work49/refine-engine.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

function proposal(id=1){
 const width=128,height=160,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const on=x>=30&&x<98&&y>=35&&y<135,k=(y*width+x)*4,v=on?30:250;
  data.set([v,v,v,255],k);
 }
 const photo={width,height,data,sourceIdentity:'synthetic-only-'+id,sourceVersion:'v-'+id};
 const result=prepareAutomaticGarment(photo,{category:'Tops',sourceIdentity:photo.sourceIdentity,sourceVersion:photo.sourceVersion});
 assert.equal(result.status,'prepared');
 assert.equal(result.autoAccepted,false);
 assert.equal(result.requiresHumanReview,true);
 const originalImage='data:image/jpeg;base64,'+Buffer.from(('synthetic-image-no-person-'+id).repeat(8)).toString('base64');
 return {photo,result,source:{originalImage,category:'Tops',
  maskFrame:{width:result.width,height:result.height,rgba:new Uint8ClampedArray(result.rgba)}}};
}
const edits=[{action:'remove',x:.42,y:.55,radius:.02}];
test('unchanged Work50 original and cutout recover edits but never recover approval',async()=>{
 const {source,result}=proposal();
 const original=new Uint8ClampedArray(source.maskFrame.rgba);
 const recipe=await createPortableCutoutEditRecipe(source,edits);
 const recovered=await restorePortableCutoutEditRecipe(source,JSON.stringify(recipe));
 assert.deepEqual(recovered,edits);
 const out=applyMaskRefinement(source.maskFrame,recovered);
 assert.notDeepEqual(out.rgba,original);
 assert.deepEqual(source.maskFrame.rgba,original);
 assert.equal(recipe.ownerApproved,false);
 assert.equal(recipe.requiresReview,true);
 assert.equal(recipe.decision,'HOLD');
 assert.equal(result.autoAccepted,false);
});
test('one changed Work50 alpha pixel blocks stale recipe even with SAME JPEG and category',async()=>{
 const {source}=proposal();
 const recipe=JSON.stringify(await createPortableCutoutEditRecipe(source,edits));
 const changed={...source,maskFrame:{...source.maskFrame,
  rgba:new Uint8ClampedArray(source.maskFrame.rgba)}};
 const offset=changed.maskFrame.rgba.length-1;
 changed.maskFrame.rgba[offset]=changed.maskFrame.rgba[offset]===255?0:255;
 await assert.rejects(()=>restorePortableCutoutEditRecipe(changed,recipe),/different source/);
 assert.deepEqual(await restorePortableCutoutEditRecipe(source,recipe),edits);
});
test('photo swap, crop-frame change and category change cannot silently inherit edits',async()=>{
 const {source}=proposal(1),{source:other}=proposal(2);
 const recipe=JSON.stringify(await createPortableCutoutEditRecipe(source,edits));
 for(const candidate of [
  {...source,originalImage:other.originalImage},
  {...source,category:'Dresses'},
  {...source,maskFrame:{...source.maskFrame,width:source.maskFrame.width+1}},
  {...source,maskFrame:{...source.maskFrame,rgba:new Uint8ClampedArray(source.maskFrame.rgba.subarray(0,-4))}}
 ])await assert.rejects(()=>restorePortableCutoutEditRecipe(candidate,recipe));
 assert.deepEqual(await restorePortableCutoutEditRecipe(source,recipe),edits);
});
test('two owners may not share a recipe just because simulated dimensions and RGB match',async()=>{
 const a=proposal(11).source,b=proposal(12).source;
 assert.deepEqual(a.maskFrame.rgba,b.maskFrame.rgba,'The test intentionally reuses identical cutout pixels');
 const json=JSON.stringify(await createPortableCutoutEditRecipe(a,edits));
 await assert.rejects(()=>restorePortableCutoutEditRecipe(b,json),/different source/);
 // SHA binding is data integrity only. The real host must authorize identity.
 assert.deepEqual(await restorePortableCutoutEditRecipe(a,json),edits);
});
test('a recipe cannot forge owner approval, acceptance, deployment, extra private data or extra edits',async()=>{
 const {source}=proposal();
 const recipe=await createPortableCutoutEditRecipe(source,edits);
 for(const bad of [
  {...recipe,ownerApproved:true},
  {...recipe,decision:'PASS'},
  {...recipe,requiresReview:false},
  {...recipe,release:'READY'},
  {...recipe,userEmail:'private@example.test'},
  {...recipe,edits:[...Array(41)].map(()=>edits[0])},
 ]){
  await assert.rejects(()=>restorePortableCutoutEditRecipe(source,JSON.stringify(bad)));
 }
 assert.ok(!JSON.stringify(recipe).includes('data:image'));
 assert.ok(!JSON.stringify(recipe).includes('synthetic-image'));
 assert.ok(!JSON.stringify(recipe).includes('private@example'));
});
test('changing Work50 proposal cannot change original camera RGBA or convert review into automatic approval',()=>{
 const {photo,result}=proposal(91);
 const original=new Uint8ClampedArray(photo.data);
 const next=prepareAutomaticGarment(photo,{category:'Tops',sourceIdentity:photo.sourceIdentity,sourceVersion:photo.sourceVersion});
 assert.deepEqual(photo.data,original);
 assert.equal(result.qualityDecision,'REVIEW');
 assert.equal(next.qualityDecision,'REVIEW');
 assert.equal(next.autoAccepted,false);
 assert.equal(next.requiresHumanReview,true);
 assert.deepEqual(next.rgba,result.rgba,'Source-identical auto proposals must be deterministic');
});
