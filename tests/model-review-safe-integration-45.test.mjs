import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import vm from 'node:vm';
import {verifiedRecord24,atomicSaveGarments24} from '../research/multi-garment-capture-01/atomic-group.mjs';
import {normalizeSuggestion42} from '../research/multi-garment-capture-01/recognition-review-42.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const schema={types:{Tops:['T-shirt','Blouse'],Bottoms:['Jeans'],Shoes:['Sneakers','Ankle boots']}};
const colors=['Black','White','Blue','Green','Red'];
const mock=(options={})=>({
 id:'piece45',instanceKey:'seg-4-4-4-90-90-1',
 cropBounds:{x:.15,y:.1,width:.42,height:.7},image:'data:image/jpeg;base64,/9j/2Q==',
 category:'Shoes',itemType:'Sneakers',color:'Navy',confirmed:true,cropReviewed:true,
 recognitionSuggestion42:{
  source:'local-fashionclip',category:'Tops',itemType:'T-shirt',color:'Red',
  status:'subtype-suggested',colorSource:'recognition',
  originalContext:{category:'Bottoms',itemType:'Jeans',color:'Blue'},
  payload:{privateImage:'do-not-persist',largeMetadata:'model is not trusted'}
 },...options
});
async function photo(){
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const fixture=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 assert.equal(fixture.sha256,sha);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {image,sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{image,sha256:sha,width:800,height:900,origin:'licensed-original'}};
}
async function open(name){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+name,1);
  r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
const rows=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
test('MODEL45 genuine crop suggestion is never a verified category, subtype or human color, and persisted metadata is bounded',async()=>{
 const p=await photo(),row=verifiedRecord24({proof:p,ownerId:'owner45',piece:mock()});
 assert.equal(row.category,'Shoes');
 assert.equal(row.itemType,'Sneakers');
 assert.equal(row.color,'Navy');
 assert.equal(row.colorSource,'user');
 assert.equal(row.recognitionSuggestion42.category,'Tops');
 assert.equal(row.recognitionSuggestion42.itemType,'T-shirt');
 assert.equal(row.recognitionSuggestion42.color,'Red');
 assert.equal(row.recognitionSuggestion42.source,'local-fashionclip');
 assert.equal(row.recognitionSuggestion42.sourcePieceKey,row.sourcePieceKey);
 assert.deepEqual(row.recognitionSuggestion42.cropBounds,row.cropBounds);
 assert.equal(row.recognitionSuggestion42.originalContext.category,'Bottoms');
 assert.equal(JSON.stringify(row).includes('do-not-persist'),false);
 assert.equal(row.originalPhoto.image,p.image);
 assert.equal(row.sourceSHA256,p.sourceSHA256);
 assert.equal(row.threeDReady,false);
});
test('MODEL45 invalid category, subtype, color or fake source in untrusted suggestions cannot enter saved metadata',async()=>{
 const p=await photo();
 for(const candidate of [
  {source:'spoof',category:'Shoes',itemType:'Sneakers',color:'Blue'},
  {source:'local-fashionclip',category:'Tops',itemType:'Sneakers',color:'Atomic Green'},
  {source:'local-fashionclip',category:'Shoes',itemType:'T-shirt',color:'Blue'}
 ]){
  const record=verifiedRecord24({proof:p,ownerId:'owner45',piece:mock({recognitionSuggestion42:candidate})});
  if(candidate.source==='spoof'){assert.equal(record.recognitionSuggestion42,undefined);continue;}
  assert.equal(record.recognitionSuggestion42.color,candidate.color==='Atomic Green'?null:'Blue');
  assert.equal(record.recognitionSuggestion42.itemType,null);
  assert.equal(record.recognitionSuggestion42.source,'local-fashionclip');
  assert.equal(record.itemType,'Sneakers');
 }
});
test('MODEL45 source model cannot trigger saving without explicit human confirmed valid category/subtype/color',async()=>{
 const p=await photo();
 for(const item of [
  mock({confirmed:false}),
  mock({category:'Tops',itemType:'Sneakers'}),
  mock({color:' Unknown '}),
  mock({itemType:'Unknown'})
 ]){
  assert.throws(()=>verifiedRecord24({proof:p,ownerId:'owner45',piece:item}),/unreviewed or invalid/);
 }
});
test('MODEL45 real owner-scoped atomic private IndexedDB stores the human row with separate AI evidence, without allowing a duplicate',async()=>{
 const p=await photo(),db=await open('model45-owner');
 try{
  const owner=()=> 'model45-owner',piece=mock();
  await atomicSaveGarments24({db,proof:p,pieces:[piece],ownerId:'model45-owner',currentOwner:owner});
  const saved=(await rows(db))[0];
  assert.equal(saved.recognitionSuggestion42.sourcePieceKey,saved.sourcePieceKey);
  assert.equal(saved.category,'Shoes');
  assert.equal(saved.itemType,'Sneakers');
  assert.equal(saved.color,'Navy');
  assert.equal(saved.originalPhoto.image,p.image);
  await assert.rejects(atomicSaveGarments24({db,proof:p,pieces:[{...piece,id:'new-duplicate'}],
   ownerId:'model45-owner',currentOwner:owner}),/duplicate/i);
  assert.equal((await rows(db)).length,1);
 }finally{db.close();}
});
test('MODEL45 category/type normalization of a stored human review preserves approved subtype while excluding unrelated model suggestion',async()=>{
 const p=await photo(),row=verifiedRecord24({proof:p,ownerId:'owner45',piece:mock()});
 const context={};vm.createContext(context);
 vm.runInContext((await readFile('public/taxonomy.js','utf8'))+
  ';globalThis.norm=normalizeClothing;',context);
 const normalized=structuredClone(context.norm(row));
 assert.equal(normalized.itemType,'Sneakers');
 assert.equal(normalized.color,'Navy');
 assert.deepEqual(normalized.recognitionSuggestion42,row.recognitionSuggestion42);
 const mismatch=normalizeSuggestion42({strong:true,
  choices:[{category:'Shoes',itemType:'T-shirt'}],details:{color:'Blue'}},
  schema,colors,['Tops','Bottoms','Shoes']);
 assert.equal(mismatch.category,'Shoes');
 assert.equal(mismatch.itemType,null);
});
