import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {COMMIT43_TYPES,validReviewTaxonomy43,reviewedColor43} from '../research/multi-garment-capture-01/commit-taxonomy-43.mjs';
import {atomicSaveGarments24,verifiedRecord24} from '../research/multi-garment-capture-01/atomic-group.mjs';
import {canConfirmScene32} from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const keys=Object.keys(COMMIT43_TYPES);
const photo=async()=>{
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const hash=createHash('sha256').update(bytes).digest('hex');
 const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8')).find(x=>x.id==='commons-0003');
 assert.equal(locked.sha256,hash);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {sourceSHA256:hash,sourceHashVerified:true,image,
   originalPhoto:{image,sha256:hash,width:800,height:900,origin:'licensed-frozen-source'}};
};
const piece=(id,category='Tops',type='T-shirt',color='Navy',index=0)=>({
 id,instanceKey:'seg-4-'+index+'-10-80-80-1',
 image:'data:image/jpeg;base64,/9j/2Q==',cropBounds:{x:.1+index*.2,y:.1,width:.18,height:.4},
 confirmed:true,category,itemType:type,color,cropReviewed:true,hint:{confidence:.99,categories:[category]}
});
const open=owner=>new Promise((resolve,reject)=>{
 const r=indexedDB.open('closet-current-user-'+owner,1);
 r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const rows=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
test('CATEGORY43 pinned research subtype contract exactly agrees with production taxonomy.js including every category and subtype',async()=>{
 const source=await readFile('public/taxonomy.js','utf8'),ctx={};
 vm.createContext(ctx);
 vm.runInContext(source+';globalThis.__schema=clothingSchema;globalThis.__normalize=normalizeClothing;',ctx);
 const actual=JSON.parse(JSON.stringify(ctx.__schema.types));
 assert.deepEqual(Object.fromEntries(keys.map(key=>[key,[...COMMIT43_TYPES[key]]])),Object.fromEntries(keys.map(key=>[key,actual[key]])));
 assert.deepEqual(Object.keys(actual).filter(x=>x!=='Accessories').sort(),keys.slice().sort());
 for(const [category,types] of Object.entries(COMMIT43_TYPES)){
  for(const type of types){
   assert.equal(validReviewTaxonomy43(category,type),true);
   assert.equal(ctx.__normalize({category,itemType:type}).itemType,type,'saved subtype must survive native My Closet normalization');
   assert.equal(canConfirmScene32({...piece('review',category,type),manual:false},ctx.__schema),true);
  }
 }
});
test('CATEGORY43 rejects wrong-category subtype, unavailable subtype, mixed casing and unknown',async()=>{
 const proof=await photo();
 for(const [category,itemType] of [
  ['Tops','Sneakers'],['Shoes','T-shirt'],['Bottoms','Hoodie'],['Dresses','Skirt'],
  ['Outerwear','Sneakers'],['Tops','sneakers'],['Tops','T-Shirt'],['Tops','Unknown'],
  ['Uncategorized','T-shirt'],['Accessories','Bag'],['Tops',''],['Tops',null]
 ]){
  assert.equal(validReviewTaxonomy43(category,itemType),false);
  assert.throws(()=>verifiedRecord24({proof,ownerId:'type-check',piece:piece('x',category,itemType)}),/unreviewed or invalid/);
 }
});
test('CATEGORY43 rejects non-string, empty, Unknown or too-long color before any record, but allows custom Navy and Charcoal',async()=>{
 const proof=await photo();
 for(const c of ['', ' ', 'Unknown', ' unknown ','UNKNOWN', 0, 12, null, {}, 'X'.repeat(121)]){
  assert.equal(reviewedColor43(c),null);
  assert.throws(()=>verifiedRecord24({proof,ownerId:'color-check',piece:piece('x','Tops','T-shirt',c)}),/unreviewed or invalid/);
 }
 for(const c of ['Navy','Charcoal','Dark teal','Blue / White','  Cream  ']){
  const rec=verifiedRecord24({proof,ownerId:'color-check',piece:piece('x','Tops','T-shirt',c)});
  assert.equal(rec.color,c.trim());assert.equal(rec.colorSource,'user');
  assert.equal(rec.sourceSHA256,proof.sourceSHA256);assert.equal(rec.originalPhoto.image,proof.image);
 }
});
test('CATEGORY43 atomic mixed batch fails closed before any extra garment writes, preserving prior valid record',async()=>{
 const proof=await photo(),db=await open('category43-atomic'),owner=()=> 'category43-atomic';
 try{
  await atomicSaveGarments24({db,proof,ownerId:'category43-atomic',currentOwner:owner,
   pieces:[piece('original','Tops','T-shirt','Red',0)]});
  const before=await rows(db);
  await assert.rejects(atomicSaveGarments24({db,proof,ownerId:'category43-atomic',currentOwner:owner,
   pieces:[piece('valid-new','Bottoms','Jeans','Blue',1),
     piece('mismatched','Shoes','T-shirt','Black',2)]}),/unreviewed or invalid/);
  assert.deepEqual(await rows(db),before,'no partial writes or modified existing record');
  await atomicSaveGarments24({db,proof,ownerId:'category43-atomic',currentOwner:owner,
   pieces:[piece('valid-new','Bottoms','Jeans','Blue',1),piece('valid-shoes','Shoes','Sneakers','Black',2)]});
  const after=await rows(db);
  assert.deepEqual(after.map(x=>x.itemType).sort(),['Jeans','Sneakers','T-shirt']);
  assert.ok(after.every(x=>x.ownerId==='category43-atomic'&&x.originalPhoto.sha256===proof.sourceSHA256));
 }finally{db.close();}
});
test('CATEGORY43 review UI and persistence are both guarded independently, not merely a model confidence flag',async()=>{
 const proof=await photo();
 const schema={types:Object.fromEntries(keys.map(key=>[key,[...COMMIT43_TYPES[key]]]))};
 const bad=piece('fake','Shoes','T-shirt','Blue');
 assert.equal(canConfirmScene32(bad,schema),false);
 assert.throws(()=>verifiedRecord24({proof,ownerId:'guard',piece:bad}),/unreviewed or invalid/);
 const good=piece('good','Shoes','Sneakers','Navy');
 assert.equal(canConfirmScene32(good,schema),true);
 const verified=verifiedRecord24({proof,ownerId:'guard',piece:good});
 assert.equal(verified.category,'Shoes');
 assert.equal(verified.itemType,'Sneakers');
 assert.equal(verified.color,'Navy');
 assert.equal(verified.threeDReady,false);
});
