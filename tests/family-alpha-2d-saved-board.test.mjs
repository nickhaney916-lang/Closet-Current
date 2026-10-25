import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {
 fingerprintAlphaRetainedOriginal,fingerprintAlphaReviewContext,identityForSavedGarment,
 prepareSavedBoard2D,renderSavedBoard2D
} from '../public/family-alpha-2d-saved-board.mjs';

const a='a1111111-1111-4111-8111-111111111111';
const b='b2222222-2222-4222-8222-222222222222';
const mkJPEG=(seed=2)=>{
 const raw=new Uint8Array(120).fill(seed);raw[0]=0xff;raw[1]=0xd8;
 raw[118]=0xff;raw[119]=0xd9;
 return 'data:image/jpeg;base64,'+btoa(String.fromCharCode(...raw));
};
const ctx=(owner=a,generation=1)=>({
 authenticatedUserId:owner,currentUserId:owner,cloudOwnerId:owner,
 indexedDbName:'closet-current-user-'+owner,sessionGeneration:generation
});
const item=(id,category,seed)=>({id,category,name:category+' owned',image:mkJPEG(seed),originalPhoto:{image:mkJPEG(seed+35)}});
const assemble=async(items,owner=a)=>{
 const presentations=Object.create(null);
 for(const x of items)presentations[x.id]={
  itemId:x.id,ownerId:owner,sourceIdentity:identityForSavedGarment(x),
  sourceVersion:await fingerprintAlphaRetainedOriginal(x.originalPhoto?.image||x.image,webcrypto),
  reviewContextVersion:await fingerprintAlphaReviewContext(x,webcrypto),
  approved:true,image:{id:x.id}
 };
 return presentations;
};
const prepare=(board,items,presentations,getContext=()=>ctx())=>
 prepareSavedBoard2D({board,items,presentations,getContext,cryptoProvider:webcrypto});
const wardrobe=()=>[item('shirt','Tops',3),item('pants','Bottoms',5),item('shoes','Shoes',7),item('jacket','Outerwear',9)];

test('real board slots map four owned garments to 2D, retain original source, and never copy JPEG into refs',async()=>{
 const items=wardrobe(),presentations=await assemble(items);
 const prepared=await prepare({slots:{top:'shirt',bottom:'pants',shoes:'shoes',layer2:'jacket'}},items,presentations);
 assert.deepEqual(prepared.layerRefs.map(x=>x.slot),['shoes','bottom','top','layer2']);
 assert.deepEqual(prepared.layerRefs.map(x=>x.itemId),['shoes','pants','shirt','jacket']);
 assert.deepEqual(Object.keys(prepared.sourceHashes).sort(),['bottom','layer2','shoes','top']);
 assert.equal(prepared.ownerId,a);
 assert.equal(prepared.upstreamAuthorizationRequired,true);
 assert.equal(JSON.stringify(prepared.layerRefs).includes('data:image'),false);
 assert.equal(prepared.outfit.top,'shirt');
});
test('dress is actually stored in top slot and rendered as dress plus shoes',async()=>{
 const items=[item('dressA','Dresses',13),item('shoeA','Shoes',15)];
 const prepared=await prepare({slots:{top:'dressA',shoes:'shoeA'},layerCount:0},items,await assemble(items));
 assert.deepEqual(prepared.layerRefs.map(x=>x.slot),['shoes','dress']);
 await assert.rejects(prepare({slots:{top:'dressA',bottom:'shoeA'}},items,await assemble(items)));
 await assert.rejects(prepare({slots:{top:'dressA',layer:'jacket'}},[...items,item('jacket','Outerwear',19)],await assemble([...items,item('jacket','Outerwear',19)])));
});
test('shoe, top, bottom, layer categories must match actual saved items',async()=>{
 const items=wardrobe(),presentations=await assemble(items);
 await assert.rejects(prepare({slots:{top:'pants'}},items,presentations),/category/);
 await assert.rejects(prepare({slots:{shoes:'shirt'}},items,presentations),/category/);
 await assert.rejects(prepare({slots:{top:'shirt',layer:'shirt'}},items,presentations),/duplicate/);
 await assert.rejects(prepare({slots:{top:'not-owned'}},items,presentations),/Missing, foreign/);
 await assert.rejects(prepare({slots:{dress:'shirt'}},items,presentations),/real saved-board/);
});
test('unselected accessory references stay outside garment render and do not become 2D owned photos',async()=>{
 const items=wardrobe(),presentations=await assemble(items);
 const prepared=await prepare({slots:{top:'shirt',bag:'bag-not-photographed',accessory:'earrings',finish:'hat'}},items,presentations);
 assert.deepEqual(prepared.layerRefs.map(x=>x.slot),['top']);
});
test('original source changed but cropped preview unchanged invalidates presentation',async()=>{
 const items=wardrobe(),presentations=await assemble(items),oldPreview=items[0].image;
 items[0]={...items[0],originalPhoto:{image:mkJPEG(88)}};
 assert.equal(items[0].image,oldPreview);
 await assert.rejects(prepare({slots:{top:'shirt'}},items,presentations),/stale/);
});
test('source grouping identity changes invalidate prepared mask even if JPEG and crop do not',async()=>{
 const items=wardrobe(),presentations=await assemble(items);
 items[0]={...items[0],outfitSourceId:'capture_changed'};
 await assert.rejects(prepare({slots:{top:'shirt'}},items,presentations),/stale/);
});
test('cross-account, deleted, unapproved, or mismatched presentations are refused',async()=>{
 const items=wardrobe(),p=await assemble(items);
 p.shirt={...p.shirt,ownerId:b};
 await assert.rejects(prepare({slots:{top:'shirt'}},items,p),/foreign/);
 p.shirt={...p.shirt,ownerId:a,approved:false};
 await assert.rejects(prepare({slots:{top:'shirt'}},items,p),/Unapproved/);
 delete p.shirt;
 await assert.rejects(prepare({slots:{top:'shirt'}},items,p),/Unprepared/);
});
test('context must match authenticated ID, current session, cloud owner, and actual local DB scope',async()=>{
 const items=wardrobe(),p=await assemble(items);
 for(const bad of [
  {...ctx(),currentUserId:b},{...ctx(),cloudOwnerId:b},
  {...ctx(),indexedDbName:'closet-current-user-'+b},
  {...ctx(),sessionGeneration:null},
  null
 ])await assert.rejects(prepare({slots:{top:'shirt'}},items,p,()=>bad),/account/);
});
test('mid-flight account switch is rejected even if digest finishes with prior clothes',async()=>{
 const items=wardrobe(),p=await assemble(items);
 let current=ctx(a,2),resolveDigest;
 const delayed={subtle:{digest:async(...args)=>{
  await new Promise(resolve=>{resolveDigest=resolve;});
  return webcrypto.subtle.digest(...args);
 }}};
 const running=prepareSavedBoard2D({board:{slots:{top:'shirt'}},items,presentations:p,getContext:()=>current,cryptoProvider:delayed});
 await new Promise(resolve=>setImmediate(resolve));
 current=ctx(b,3);resolveDigest();
 await assert.rejects(running,/Account changed/);
});
test('malformed original photo, missing hash crypto and duplicate wardrobe records fail closed',async()=>{
 const items=wardrobe(),p=await assemble(items);
 const bad=[{...items[0],originalPhoto:{image:'data:image/jpeg;base64,xxxx'}}];
 await assert.rejects(prepare({slots:{top:'shirt'}},bad,p),/retained original|JPEG/);
 await assert.rejects(prepare({slots:{top:'shirt'}},[items[0],items[0]],p),/Duplicate/);
 await assert.rejects(fingerprintAlphaRetainedOriginal(items[0].image,{}),/SHA-256/);
});
class FakeNode{
 constructor(){this.style={};this.dataset={};this.children=[];this.attrs={};}
 replaceChildren(...x){this.children=x;}
 append(x){this.children.push(x);}
 setAttribute(a,b){this.attrs[a]=b;}
}
class FakeImage extends FakeNode{
 constructor(w=180,h=220){super();this.complete=true;this.naturalWidth=w;this.naturalHeight=h;}
 cloneNode(){return new FakeImage(this.naturalWidth,this.naturalHeight);}
}
test('render uses real owned item refs and replaces frame only on validated source',async()=>{
 const oldDoc=globalThis.document,oldEl=globalThis.HTMLImageElement;
 globalThis.document={createElement:()=>new FakeNode()};globalThis.HTMLImageElement=FakeImage;
 try{
  const items=wardrobe(),presentations=await assemble(items);
  for(const id of Object.keys(presentations))presentations[id].image=new FakeImage();
  const container=new FakeNode(),options={board:{slots:{top:'shirt',bottom:'pants',shoes:'shoes'}},items,presentations,getContext:()=>ctx(),cryptoProvider:webcrypto};
  const res=await renderSavedBoard2D(container,options);
  assert.equal(res.renderedLayers,3);
  assert.deepEqual(container.children[0].children.slice(1).map(x=>x.dataset.slot),['shoes','bottom','top']);
  const original=items[0].originalPhoto.image;
  items[0]={...items[0],originalPhoto:{image:mkJPEG(53)}};
  await assert.rejects(renderSavedBoard2D(container,options),/stale/);
  assert.equal(container.children.length,0,'old photo cannot remain on avatar');
  assert.notEqual(items[0].originalPhoto.image,original);
 }finally{globalThis.document=oldDoc;globalThis.HTMLImageElement=oldEl;}
});
test('new render supersedes old digest request without erasing newer account result',async()=>{
 const oldDoc=globalThis.document,oldEl=globalThis.HTMLImageElement;
 globalThis.document={createElement:()=>new FakeNode()};globalThis.HTMLImageElement=FakeImage;
 try{
  const items=wardrobe(),oldPresentations=await assemble(items),newPresentations=await assemble(items);
  for(const p of [oldPresentations,newPresentations])for(const id of Object.keys(p))p[id].image=new FakeImage();
  let resolveOld;
  const delayed={subtle:{digest:async(...args)=>{
   await new Promise(resolve=>resolveOld=resolve);
   return webcrypto.subtle.digest(...args);
  }}};
  const container=new FakeNode();
  const old=renderSavedBoard2D(container,{board:{slots:{top:'shirt'}},items,presentations:oldPresentations,getContext:()=>ctx(),cryptoProvider:delayed});
  await new Promise(resolve=>setImmediate(resolve));
  const newer=renderSavedBoard2D(container,{board:{slots:{top:'shirt'}},items,presentations:newPresentations,getContext:()=>ctx(),cryptoProvider:webcrypto});
  assert.equal((await newer).renderedLayers,1);
  resolveOld();
  await assert.rejects(old,/Superseded/);
  assert.equal(container.children[0].children[1].dataset.slot,'top','prior request never wipes newest frame');
 }finally{globalThis.document=oldDoc;globalThis.HTMLImageElement=oldEl;}
});

test('layered real outfit keeps short and long sleeves on base top and jackets above them',async()=>{
 const base=item('short-top','Tops',21);base.sleeveLength='Short sleeve';
 const long=item('long-top','Tops',23);long.sleeveLength='Long sleeve';
 const jacket=item('outer-jacket','Outerwear',25);jacket.itemType='Jacket';
 const bottom=item('blue-jeans','Bottoms',27),shoes=item('sneakers','Shoes',29);
 const owned=[base,long,jacket,bottom,shoes];
 for(const top of [base,long]){
  const prepared=await prepare({slots:{top:top.id,bottom:bottom.id,
   shoes:shoes.id,layer2:jacket.id},layerCount:2},owned,await assemble(owned));
  assert.deepEqual(prepared.layerRefs.map(x=>x.slot),['shoes','bottom','top','layer2']);
  assert.equal(prepared.outfit.top,top.id);
  assert.equal(prepared.outfit.layer2,'outer-jacket');
 }
 const dress=item('one-dress','Dresses',31);
 await assert.rejects(prepare({slots:{top:dress.id,bottom:bottom.id,layer2:jacket.id}},
  [...owned,dress],await assemble([...owned,dress])),/Dress cannot be combined/);
});
test('full outfit unchanged, different unmasked recognition JPEG invalidates approved avatar cutout',async()=>{
 const garment=item('outfit-shirt','Tops',35);
 garment.outfitSourceId='scene-synth-1';
 garment.recognitionPhoto={image:mkJPEG(67)};
 garment.segmentHint={categories:['Tops'],types:['T-shirt'],clipped:false};
 const references=await assemble([garment]);
 assert.equal((await prepare({slots:{top:garment.id}},[garment],references)).layerRefs.length,1);
 const keptOriginal=garment.originalPhoto.image,keptDisplay=garment.image;
 garment.recognitionPhoto.image=mkJPEG(69);
 assert.equal(garment.originalPhoto.image,keptOriginal);
 assert.equal(garment.image,keptDisplay);
 await assert.rejects(prepare({slots:{top:garment.id}},[garment],references),/stale/);
});
test('changing segment hint or garment subtype invalidates previous human-approved layer',async()=>{
 const garment=item('outfit-bottom','Bottoms',37);
 garment.recognitionPhoto={image:mkJPEG(70)};
 garment.segmentHint={categories:['Bottoms'],types:['Shorts'],clipped:false};
 garment.itemType='Shorts';
 const p=await assemble([garment]);
 const board={slots:{bottom:garment.id}};
 assert.equal((await prepare(board,[garment],p)).layerRefs[0].slot,'bottom');
 garment.segmentHint={categories:['Bottoms'],types:['Skirt'],clipped:false};
 await assert.rejects(prepare(board,[garment],p),/stale/);
 garment.segmentHint={categories:['Bottoms'],types:['Shorts'],clipped:false};
 garment.itemType='Skirt';
 await assert.rejects(prepare(board,[garment],p),/stale/);
});
test('no per-garment region proof is accepted for a multi-item presentation',async()=>{
 const garment=item('outfit-skirt','Bottoms',43);
 garment.recognitionPhoto={image:mkJPEG(74)};
 garment.segmentHint={categories:['Bottoms'],types:['Skirt'],clipped:false};
 const p=await assemble([garment]);
 delete p[garment.id].reviewContextVersion;
 await assert.rejects(prepare({slots:{bottom:garment.id}},[garment],p),/stale/);
});
