'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const app=fs.readFileSync('public/app.js','utf8');
const M=require('../public/clothing-memory.js');
const Details=require('../public/clothing-details.js');
const N=(()=>{const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('public/taxonomy.js','utf8')+';globalThis.norm=normalizeClothing',c);return x=>c.norm(x);})();
const sample=()=>({id:'item-1',ownerId:'owner-A',name:'Jacket',image:'data:image/jpeg;base64,AAAA',category:'Outerwear',itemType:'Jacket',color:'Gray',colorSource:'photo-estimate',notes:'',sourceSHA256:'b'.repeat(64),originalPhoto:{sha256:'b'.repeat(64)},seasons:['Winter'],pattern:'Solid',sleeveLength:'Long sleeve',fit:'Regular'});
const clone=x=>structuredClone(x);
const adjustCode=(()=>{
 const start=app.indexOf('form.onsubmit=async event=>{event.preventDefault();save.disabled=true;');
 const end=app.indexOf('dialog.onclose=',start);
 assert.ok(start>0&&end>start,'actual new photo save handler must be located');
 return app.slice(start,end);
})();
const savedCode=(()=>{
 const start=app.indexOf('f.onsubmit=async e=>{e.preventDefault();if(saving)return;');
 const end=app.indexOf('/* Saved editor actions */',start);
 assert.ok(start>0&&end>start,'actual saved closet edit handler must be located');
 return app.slice(start,end);
})();
async function newPhotoSubmit(source){
 let persisted,closed=false;
 const item=clone(source),sandbox={
  form:{},save:{disabled:false},item,draft:clone(source),collect:()=>N(clone(source)),
  batch:[{id:source.id}],items:[],captureProof01Active:false,
  expectedSavedRow:null,expectedDraftRow:clone(source),correction10:false,
  ClothingMemory:M,
  savePiece:async val=>{persisted=clone(val);},
  persistDraft:async()=>{},scheduleMemoryReview:()=>{},render:()=>{},
  dialog:{close:()=>{closed=true;}},message:()=>{},
  Date,structuredClone
 };
 vm.createContext(sandbox);vm.runInContext(adjustCode,sandbox);
 await sandbox.form.onsubmit({preventDefault(){}});
 assert.equal(closed,true,'new photo handler should finish saving');
 assert.ok(persisted,'actual savePiece must receive persisted row');
 return persisted;
}
async function savedClosetSubmit(source,{cas=false}={}){
 let persisted,closed=false,calls=0;
 const item=clone(source),sandbox={
  f:{},saving:false,cancel:{disabled:false},editStatus:{textContent:''},ok:{disabled:false},item,draft:clone(source),collect:()=>N(clone(source)),
  expectedSavedRow:cas?clone(source):null,
  ClothingMemory:M,nativeCorrection10Active:()=>cas,saveEditedGarment:async val=>{persisted=clone(val);calls++;},
  queued:async work=>work(),
  commitOwnerCorrection10:async val=>{persisted=clone(val);calls++;},
  // The owner stays current in this isolated color provenance form fixture.
  assertEditor:()=>{},nativeIndex07Refresh:async()=>{},
  writeAll:async rows=>{persisted=clone(rows[0]);calls++;},
  render:()=>{},scheduleMemoryReview:()=>{},message:()=>{},
  dialog:{close:()=>{closed=true;}}
 };
 vm.createContext(sandbox);vm.runInContext(savedCode,sandbox);
 await sandbox.f.onsubmit({preventDefault(){}});
 assert.equal(closed,true,'saved closet editor must close after success');
 assert.equal(calls,1,'exactly one write should occur');
 return persisted;
}
const verifyUnchanged=(saved,original)=>{
 assert.equal(saved.ownerId,original.ownerId);
 assert.equal(saved.sourceSHA256,original.sourceSHA256);
 assert.equal(saved.originalPhoto.sha256,original.originalPhoto.sha256);
 assert.equal(saved.image,original.image);
};
test('new photo save retains photo-derived color provenance rather than forging user confirmation',async()=>{
 const source=sample(),saved=await newPhotoSubmit(source);
 assert.equal(saved.color,'Gray');assert.equal(saved.colorSource,'photo-estimate');
 assert.equal(saved.userAdjusted,true);assert.equal(saved.requiresOwnershipConfirmation,false);
 verifyUnchanged(saved,source);
});
test('save an unrelated description in saved closet leaves estimated color estimated',async()=>{
 const row={...sample(),notes:'Edited garment notes'};
 const saved=await savedClosetSubmit(row);
 assert.equal(saved.notes,'Edited garment notes');assert.equal(saved.color,'Gray');
 assert.equal(saved.colorSource,'photo-estimate');
 verifyUnchanged(saved,row);
});
test('CAS edit and ordinary edit both keep photo estimate provenance',async()=>{
 for(const cas of [false,true]){
  const row={...sample(),itemType:'Coat',name:'Coat edit'};
  const saved=await savedClosetSubmit(row,{cas});
  assert.equal(saved.colorSource,'photo-estimate');assert.equal(saved.color,'Gray');
  if(cas)assert.equal(saved.requiresOwnershipConfirmation,false);
  verifyUnchanged(saved,row);
 }
});
test('explicit user recolor remains authoritative through new photo and saved closet submissions',async()=>{
 for(const handler of [newPhotoSubmit,x=>savedClosetSubmit(x),x=>savedClosetSubmit(x,{cas:true})]){
  const row={...sample(),color:'Green',colorSource:'user'};
  const saved=await handler(row);
  assert.equal(saved.color,'Green');assert.equal(saved.colorSource,'user');
  assert.equal(Details.fill(saved,{category:'Outerwear'},{color:'Red'},true).color,'Green');
  verifyUnchanged(saved,row);
 }
});
test('explicit user color clear remains empty through every actual save handler',async()=>{
 for(const handler of [newPhotoSubmit,x=>savedClosetSubmit(x),x=>savedClosetSubmit(x,{cas:true})]){
  const row={...sample(),color:'',colorSource:'user'};
  const saved=await handler(row);
  assert.equal(saved.color,'');assert.equal(saved.colorSource,'user');
  assert.strictEqual(Details.fillColor(saved,{color:'Red',support:1}),saved);
  verifyUnchanged(saved,row);
 }
});
test('recognition-color provenance is not falsely relabeled as manual by Save',async()=>{
 for(const handler of [newPhotoSubmit,x=>savedClosetSubmit(x)]){
  const row={...sample(),color:'Blue',colorSource:'recognition'};
  const saved=await handler(row);
  assert.equal(saved.color,'Blue');assert.equal(saved.colorSource,'recognition');
  verifyUnchanged(saved,row);
 }
});
test('empty unknown color remains unverified after a save, rather than invented as user confirmation',async()=>{
 for(const handler of [newPhotoSubmit,x=>savedClosetSubmit(x)]){
  const row={...sample(),color:'',colorSource:undefined};
  const saved=await handler(row);
  assert.equal(saved.color,'');assert.equal(saved.colorSource,undefined);
  verifyUnchanged(saved,row);
 }
});
test('saved batch rejects user provenance forgery even when other clothing details confirmed',async()=>{
 const row={...sample(),pattern:'Checked',itemType:'Coat'};
 const out=await newPhotoSubmit(row);
 assert.equal(out.confirmedDetails.category,'Outerwear');
 assert.equal(out.confirmedDetails.itemType,'Coat');
 assert.equal(out.colorSource,'photo-estimate','other confirmed visual fields do not prove user explicitly corrected color');
});
test('real UI input is the only direct source= user promotion of color in edit form',()=>{
 const handler=app.slice(app.indexOf('function clothingFields('),app.indexOf('function cropClothingPhoto('));
 assert.match(handler,/if\(key==='color'\)item\.colorSource='user'/);
 assert.doesNotMatch(adjustCode,/(?:value|updated)\.colorSource\s*=\s*['"]user['"]/);
 assert.doesNotMatch(savedCode,/(?:value|updated)\.colorSource\s*=\s*['"]user['"]/);
 assert.ok(adjustCode.includes('ClothingMemory.confirm'));
 assert.ok(savedCode.includes('ClothingMemory.confirm'));
});
