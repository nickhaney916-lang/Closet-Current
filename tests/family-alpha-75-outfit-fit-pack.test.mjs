import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createOutfitFitPack,restoreOutfitFitPack,FORMAT,MAX_BYTES}
 from '../research/family-alpha-75/outfit-fit-pack.mjs';
import {patchEditor,PARENT_SHA,OUTPUT,EDITOR,PACK}
 from '../scripts/build-family-alpha-75-fit-pack-hold.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=(slot,c)=>({png:'data:image/png;base64,'+c.repeat(400),slot,width:200,height:250});
const row=(slot,c,n)=>({slot,source:source(slot,c),record:{
 profile:{slot,anchors:[[.25,.1],[.75,.1]]},
 adjust:{dx:n,dy:5,scale:1.03,edgeCleanup:false,binaryEdgeReview:false}
}});
const entries=()=>[row('top','A',3),row('bottom','B',-2)];
const edit=(s,fn)=>{const d=JSON.parse(s);fn(d);return JSON.stringify(d);};
test('two independent outfit pieces use exact PNG hashes and restore both without user data',async()=>{
 const e=entries(),json=await createOutfitFitPack(e),pack=JSON.parse(json);
 assert.equal(pack.format,FORMAT);assert.equal(pack.decision,'HOLD');
 assert.equal(pack.ownerApproved,false);assert.equal(pack.automaticallySaved,false);
 assert.equal(pack.recipes.length,2);
 assert.equal(pack.recipes[0].cutoutSHA256===pack.recipes[1].cutoutSHA256,false);
 assert.ok(json.length<MAX_BYTES);
 assert.doesNotMatch(json,/data:image|accountId|email|password|https?:|jwt|owner_id|photoName/i);
 const loaded=await restoreOutfitFitPack(e,json);
 assert.equal(loaded.length,2);assert.equal(loaded[0].slot,'top');assert.equal(loaded[1].slot,'bottom');
 assert.equal(loaded[0].restored.adjust.dx,3);assert.equal(loaded[1].restored.adjust.dx,-2);
 assert.equal(loaded[0].record,e[0].record,'No applied mutations in pure validation');
});
test('different cutout bytes, slots, dimensions or any missing member rejects ENTIRE pack',async()=>{
 const e=entries(),json=await createOutfitFitPack(e);
 const mismatches=[
  x=>x[0].source.png=x[0].source.png.slice(0,-1)+'C',
  x=>x[1].source.width++,
  x=>x[0].source.height++,
  x=>x.pop(),
  x=>x.reverse(),
  x=>x[0].slot='layer2',
  x=>x[1].slot='top',
  x=>x.push(row('layer2','C',1))
 ];
 for(const [i,change] of mismatches.entries()){
  const v=structuredClone(e);change(v);
  if(i===4) {
   const restored=await restoreOutfitFitPack(v,json);
   assert.equal(restored[0].slot,'bottom','Exact slot inventory can be in different view order');
  }else await assert.rejects(restoreOutfitFitPack(v,json),undefined,'Mismatched wardrobe '+i);
 }
});
test('reject approval forgery, hidden private metadata, duplicated entries, swapped recipe and unsafe geometry',async()=>{
 const e=entries(),json=await createOutfitFitPack(e);
 const edits=[
  x=>x.ownerApproved=true,
  x=>x.decision='READY',
  x=>x.automaticallySaved=true,
  x=>x.email='tester@example.org',
  x=>x.accountToken='secret',
  x=>x.photo='data:image/jpeg;base64,ABC',
  x=>x.recipes[0].ownerApproved=true,
  x=>x.recipes[0].slot='bottom',
  x=>x.recipes[1]=structuredClone(x.recipes[0]),
  x=>x.recipes.pop(),
  x=>x.recipes[0].cutoutSHA256='0'.repeat(64),
  x=>x.recipes[1].adjust.scale=10,
  x=>x.recipes[1].traces={left:'untrusted'},
  x=>x.recipes[0].reviewer='my name'
 ];
 for(const [i,change] of edits.entries())
  await assert.rejects(restoreOutfitFitPack(e,edit(json,change)),undefined,'Forged pack '+i);
 for(const bad of ['{}','not-json','['+' '.repeat(MAX_BYTES)+']',null])
  await assert.rejects(restoreOutfitFitPack(e,bad));
});
test('reject missing/duplicate/unsafe source list, no partial or fabricated outfit',async()=>{
 const e=entries();
 for(const bad of [[],Array(5).fill(e[0]),[e[0],e[0]],[{...e[0],slot:'shoes'}],[{...e[0],source:{...e[0].source,slot:'bottom'}}]])
  await assert.rejects(createOutfitFitPack(bad));
});
test('exact compiled editor adds only reviewed user-driven pack and no original source/storage mutation',async()=>{
 const parent=await readFile('dist-family-alpha-74-work54-phone-HOLD/'+EDITOR,'utf8');
 const app=await readFile(OUTPUT+'/'+EDITOR,'utf8');
 assert.equal(app,patchEditor(parent));
 assert.match(app,/Download all reviewed outfit fits/);
 assert.match(app,/Restore all reviewed outfit fits JSON/);
 assert.match(app,/if\(!event\.isTrusted\|\|!check\(\)\)/);
 assert.match(app,/repaintReviewedPreviewAtomic/);
 assert.match(app,/no approval|No approval granted/i);
 assert.ok(app.includes('Suggest starting fit'));
 assert.equal(PARENT_SHA.length,40);
 assert.ok((await readFile(OUTPUT+'/'+PACK,'utf8')).includes('restorePortableFitRecipe'));
});
