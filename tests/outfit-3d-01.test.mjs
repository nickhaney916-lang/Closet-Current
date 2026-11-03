import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {createOwnerOutfit3DController} from '../research/outfit-3d-01/owner-outfit-controller.mjs';
import {decideOutfit3D01,OUTFIT3D_PINNED_SOURCE_SHA} from '../research/outfit-3d-01/source-true-viewer.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const photo=id=>{
 const data=readFileSync('benchmark/fixtures/'+id+'.jpg');
 const sha256=createHash('sha256').update(data).digest('hex');
 return {sha256,image:'data:image/jpeg;base64,'+data.toString('base64')};
};
const manifest=[
 ['t','commons-0003','Tops','T-shirt','Black'],
 ['jeans','commons-0021','Bottoms','Jeans','Blue'],
 ['shorts','commons-0033','Bottoms','Shorts','Brown'],
 ['sneaker','commons-0079','Shoes','Sneakers','White'],
 ['boot','commons-0088','Shoes','Ankle boots','Black'],
 ['blouse','commons-0014','Tops','Blouse','Cream'],
 ['skirt','commons-0041','Bottoms','Skirt','Blue'],
 ['dress','commons-0053','Dresses','Casual dress','Black'],
 ['jacket','commons-0064','Outerwear','Jacket','Black'],
 ['coat','commons-0067','Outerwear','Coat','Gray']
];
const base=manifest.map(([id,source,category,itemType,color])=>{
 const original=photo(source);
 return {id,ownerId:'A',name:'Saved '+id,category,itemType,color,colorSource:'user',
  userAdjusted:true,requiresOwnershipConfirmation:false,possibleDuplicate:false,
  originalPhoto:{image:original.image,sha256:original.sha256},
  sourceSHA256:original.sha256,image:original.image,
  outfitSourceId:null,notes:'',seasons:[]};
});
function harness({records=base}={}){
 let who='A',generation=1,readError=null,writeError=null;
 const wardrobe=new Map([['A',structuredClone(records)],['B',structuredClone(records.map(x=>({...x,ownerId:'B',id:'B-'+x.id})))]]);
 const outfits=new Map([['A',{current:{name:'My outfit',slots:{}},saved:[]}],
  ['B',{current:{name:'My outfit',slots:{}},saved:[]}]]);
 const auth={ready:Promise.resolve(),get user(){return who?{id:who}:null;},
  getSessionGeneration:()=>generation};
 const io={
  async readSavedItems({ownerId,generation:lease}){
   if(readError)throw readError;
   assert.equal(ownerId,who);assert.equal(lease,generation);
   return structuredClone(wardrobe.get(ownerId));
  },
  async loadOutfitState({ownerId}){
   if(readError)throw readError;
   return structuredClone(outfits.get(ownerId));
  },
  async commitOutfitState({lease,expectedFingerprint,state}){
   if(writeError)throw writeError;
   assert.equal(lease.ownerId,who);assert.equal(lease.generation,generation);
   const before=outfits.get(lease.ownerId),key=JSON.stringify({current:before.current||{},saved:before.saved||[]});
   if(key!==expectedFingerprint)throw Error('Saved outfits changed');
   outfits.set(lease.ownerId,structuredClone(state));
   return {saved:true};
  }
 };
 const create=()=>createOwnerOutfit3DController({auth,...io,createId:()=>String(++next)});
 let next=0;
 return {create,auth,io,wardrobe,outfits,
  switch(id){who=id;generation++;},get who(){return who;},
  injectRead(error){readError=error;},injectWrite(error){writeError=error;}
 };
}
test('three owned outfits preserve real categories, saved IDs and exact source SHA',async()=>{
 const h=harness(),c=h.create();await c.refresh();
 const choices=c.available('top');assert.ok(choices.find(x=>x.id==='t'));
 assert.ok(choices.find(x=>x.id==='dress'));
 c.setSlot('top','t');c.setSlot('bottom','jeans');c.setSlot('shoes','sneaker');c.setName('A casual');
 let p=c.plan();assert.equal(p.saveReady,true);assert.equal(p.selected.length,3);
 assert.equal(p.selected.find(x=>x.slot==='top').originalSHA256,photo('commons-0003').sha256);
 const a=await c.save();assert.equal(a.saved,true);
 c.clearSelection();c.setSlot('top','blouse');c.setSlot('bottom','skirt');c.setSlot('shoes','boot');c.setSlot('layer2','jacket');c.setName('B layers');
 p=c.plan();assert.deepEqual(Object.keys(p.slots).sort(),['bottom','layer2','shoes','top']);
 const b=await c.save();assert.equal(b.saved,true);
 c.clearSelection();c.setSlot('top','dress');c.setSlot('shoes','boot');c.setSlot('layer2','jacket');c.setName('C dress');
 p=c.plan();assert.equal(p.dress,true);assert.equal(p.slots.bottom,undefined);
 assert.equal(p.selected.length,3);
 const d=await c.save();assert.equal(d.saved,true);
 assert.equal(c.listSaved().length,3);
 const newSession=h.create();await newSession.refresh();
 assert.equal(newSession.listSaved().length,3);
 for(const [id,name]of [[a.id,'A casual'],[b.id,'B layers'],[d.id,'C dress']]){
  const restored=newSession.openSaved(id);assert.equal(restored.name,name);assert.equal(restored.saveReady,true);
  assert.ok(restored.selected.every(x=>x.originalSHA256===photo(manifest.find(m=>m[0]===x.itemId)[1]).sha256));
 }
});
test('jeans-to-shorts, tee-to-blouse, sneaker-to-boots retain unchanged saved choices and no ghost slots',async()=>{
 const h=harness(),c=h.create();await c.refresh();
 c.setSlot('top','t');c.setSlot('bottom','jeans');c.setSlot('shoes','sneaker');
 c.swap('bottom','shorts');assert.deepEqual(c.plan().slots,{top:'t',bottom:'shorts',shoes:'sneaker'});
 c.swap('top','blouse');assert.deepEqual(c.plan().slots,{top:'blouse',bottom:'shorts',shoes:'sneaker'});
 c.swap('shoes','boot');c.setSlot('layer2','jacket');
 assert.equal(c.plan().slots.layer2,'jacket');assert.equal(c.plan().slots.bottom,'shorts');
 c.setSlot('layer2',null);assert.equal(c.plan().slots.layer2,undefined);
 c.setSlot('top','dress');assert.equal(c.plan().slots.bottom,undefined);
 assert.equal(c.plan().slots.layer2,undefined);assert.equal(c.plan().slots.shoes,'boot');
 assert.throws(()=>c.swap('bottom','jeans'),/Dress covers/);
 c.setSlot('layer3','coat');assert.equal(c.plan().saveReady,true);
 assert.equal(c.plan().selected.length,3);
});
test('previously saved missing garment keeps original saved ID visible, never substitutes another piece',async()=>{
 const h=harness(),c=h.create();await c.refresh();
 c.setSlot('top','t');c.setSlot('bottom','jeans');c.setSlot('shoes','sneaker');
 const {id}=await c.save();
 h.wardrobe.set('A',h.wardrobe.get('A').filter(x=>x.id!=='jeans'));
 const restored=h.create();await restored.refresh();
 const plan=restored.openSaved(id);
 assert.equal(plan.slots.bottom,'jeans');assert.deepEqual(plan.missing,[{slot:'bottom',itemId:'jeans',reason:'deleted-saved-garment'}]);
 assert.equal(plan.saveReady,false);
 assert.equal(plan.selected.find(x=>x.slot==='shoes').itemId,'sneaker');
 await assert.rejects(restored.save(),/Review missing/);
});
test('corrected type prevents incompatible 3D slot; manual color always respected',async()=>{
 const h=harness(),c=h.create();await c.refresh();
 c.setSlot('top','t');c.setSlot('bottom','skirt');const {id}=await c.save();
 const snapshot=h.wardrobe.get('A');const edited=snapshot.find(x=>x.id==='skirt');
 edited.category='Dresses';edited.itemType='Casual dress';edited.color='Cream';edited.userAdjusted=true;
 const restored=h.create();await restored.refresh();const p=restored.openSaved(id);
 assert.equal(p.saveReady,false);assert.equal(p.needsReview[0].reason,'corrected-type-does-not-fit-slot');
 assert.equal(restored.sourceIndex().byId.get('skirt').color,'Cream');
 await assert.rejects(restored.save(),/Review missing/);
});
test('two owners isolated across reads, saved selections, original image and source hash, logout clears',async()=>{
 const h=harness(),c=h.create();await c.refresh();
 c.setSlot('top','t');await c.save();const image=c.photoFor('t');
 assert.ok(image.original.startsWith('data:image/jpeg;base64,'));
 h.switch('B');
 assert.throws(()=>c.photoFor('t'),/session changed/i);
 assert.throws(()=>c.plan(),/session changed/i);
 const b=h.create();await b.refresh();
 assert.equal(b.listSaved().length,0);assert.equal(b.photoFor('t'),null);
 assert.equal(b.photoFor('B-t').original,image.original); // same licensed bytes, owner-bound record ID
 b.setSlot('top','B-t');await b.save();
 assert.equal(b.listSaved().length,1);assert.equal(h.outfits.get('A').saved.length,1);
 h.switch(null);
 assert.throws(()=>b.photoFor('B-t'),/Signed-in owner/);
 b.invalidate();
 assert.throws(()=>b.listSaved(),/Signed-in owner/);
});
test('source bytes are never rewritten, and tampered hash / unconfirmed / duplicate remain visible as review',async()=>{
 const tampered=structuredClone(base);
 tampered.find(x=>x.id==='t').sourceSHA256='0'.repeat(64);
 tampered.find(x=>x.id==='jeans').userAdjusted=false;
 tampered.find(x=>x.id==='jeans').indexedAt=null;
 tampered.find(x=>x.id==='sneaker').possibleDuplicate=true;
 const h=harness({records:tampered}),c=h.create();await c.refresh();
 assert.equal(c.available('top').some(x=>x.id==='t'),false);
 assert.equal(c.available('bottom').some(x=>x.id==='jeans'),false);
 assert.equal(c.available('shoes').some(x=>x.id==='sneaker'),false);
 assert.equal(c.photoFor('t').original,base.find(x=>x.id==='t').originalPhoto.image);
 assert.throws(()=>c.setSlot('top','t'),/unsupported/);
});
test('source matching only grants exact licensed original dress/tee/denim; all others 2D',()=>{
 const mk=(slot,id,category,itemType,originalSHA256)=>({slot,itemId:id,category,itemType,originalSHA256});
 const plan=items=>({ownerId:'A',generation:1,selected:items,missing:[],needsReview:[]});
 const t=mk('top','t','Tops','T-shirt',OUTFIT3D_PINNED_SOURCE_SHA.shirt);
 const jeans=mk('bottom','j','Bottoms','Jeans',OUTFIT3D_PINNED_SOURCE_SHA.denim[0]);
 const shoes=mk('shoes','s','Shoes','Sneakers',photo('commons-0079').sha256);
 const d=mk('top','d','Dresses','Casual dress',OUTFIT3D_PINNED_SOURCE_SHA.dress);
 const a=decideOutfit3D01(plan([t,jeans,shoes]));
 assert.equal(a.mode,'shirt-pants');assert.deepEqual(a.renderedIds,['t','j']);assert.deepEqual(a.fallbackIds,['s']);assert.equal(a.complete3D,false);
 const c=decideOutfit3D01(plan([d,shoes]));
 assert.equal(c.mode,'dress');assert.deepEqual(c.fallbackIds,['s']);
 assert.equal(decideOutfit3D01(plan([mk('top','x','Tops','Blouse',OUTFIT3D_PINNED_SOURCE_SHA.shirt),jeans])).mode,'none');
 assert.equal(decideOutfit3D01(plan([mk('top','x','Tops','T-shirt','a'.repeat(64)),jeans])).mode,'none');
 assert.equal(decideOutfit3D01(plan([jeans])).mode,'none');
});
test('save and delete retain other outfits; reopens safely and save failure is retryable',async()=>{
 const h=harness(),c=h.create();await c.refresh();c.setSlot('top','t');
 const a=await c.save();c.setSlot('bottom','jeans');const next=await c.save();
 assert.equal(next.id,a.id);assert.equal(c.listSaved().length,1);
 c.clearSelection();c.setSlot('top','dress');const b=await c.save();
 assert.equal(c.listSaved().length,2);
 h.injectWrite(Error('Disk full'));
 c.setSlot('shoes','boot');await assert.rejects(c.save(),/Disk full/);
 assert.equal(h.outfits.get('A').saved.length,2);
 h.injectWrite(null);const updated=await c.save();assert.equal(updated.id,b.id);
 assert.equal(h.outfits.get('A').saved.length,2);
 await c.deleteSaved(a.id);assert.equal(c.listSaved().length,1);
 assert.equal(c.listSaved()[0].id,b.id);
 assert.equal(c.photoFor('jeans').original,base.find(x=>x.id==='jeans').originalPhoto.image);
});
test('save as new preserves the existing look; Save updates only the selected look',async()=>{
 const h=harness(),c=h.create();await c.refresh();
 c.setSlot('top','t');c.setSlot('bottom','jeans');c.setName('Existing outfit A');
 const a=await c.save();
 c.swap('bottom','shorts');c.setName('Different outfit B');
 const b=await c.save({asNew:true});
 assert.notEqual(a.id,b.id);assert.equal(c.listSaved().length,2);
 const reopenedA=c.openSaved(a.id);
 assert.equal(reopenedA.slots.bottom,'jeans');
 assert.equal(reopenedA.name,'Existing outfit A');
 const reopenedB=c.openSaved(b.id);
 assert.equal(reopenedB.slots.bottom,'shorts');
 assert.equal(reopenedB.name,'Different outfit B');
 c.setSlot('shoes','sneaker');await c.save();
 assert.equal(c.listSaved().length,2);
 c.openSaved(a.id);assert.equal(c.plan().slots.shoes,undefined);
 c.openSaved(b.id);assert.equal(c.plan().slots.shoes,'sneaker');
 await assert.rejects(c.save({asNew:true,updateId:a.id}),/either updateId or save as new/);
});
test('stale board state rejects concurrent overwrite instead of losing saves',async()=>{
 const h=harness(),c=h.create();await c.refresh();c.setSlot('top','t');
 h.outfits.set('A',{current:{name:'Other edit',slots:{top:'dress'}},saved:[]});
 await assert.rejects(c.save(),/Saved outfits changed/);
 assert.equal(h.outfits.get('A').current.slots.top,'dress');
});
test('owner switch during async original-photo hashing aborts without leaking source or saving',async()=>{
 const h=harness(),c=h.create();let finish;
 const original=h.io.readSavedItems;
 h.io.readSavedItems=()=>new Promise(resolve=>{finish=()=>resolve(structuredClone(h.wardrobe.get('A')));});
 const delayed=h.create();const loading=delayed.refresh();await new Promise(setImmediate);
 h.switch('B');finish();await assert.rejects(loading,/Owner changed|account|session/i);
 assert.throws(()=>delayed.plan(),/session|owner/i);
 h.io.readSavedItems=original;
});
test('original source 3D evidence and saved record identify exact known photographs, not invented user photos',async()=>{
 const h=harness(),c=h.create();await c.refresh();
 const r=c.sourceIndex().byId.get('t');
 assert.equal(r.sourceSHA256,OUTFIT3D_PINNED_SOURCE_SHA.shirt);
 assert.equal(r.ownerId,'A');
 assert.equal(r.photographic3DReconstructionApproved,false);
 assert.equal(c.photoFor('t').original,base[0].originalPhoto.image);
});
