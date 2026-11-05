import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {
 sanitizeSegmentHint50,verifiedRecord24,atomicSaveGarments24
} from '../research/multi-garment-capture-01/atomic-group.mjs';

if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function source(){
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const sourceSHA256=sha(bytes);
 const lock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 assert.equal(sourceSHA256,lock.sha256);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {image,sourceSHA256,sourceHashVerified:true,
  originalPhoto:{image,sha256:sourceSHA256,width:800,height:900,origin:'rights-verified-JPEG'}};
}
function piece(id,hint,extra={}){
 return {id,instanceKey:'seg-4-10-10-80-80-1',image:'data:image/jpeg;base64,/9j/2Q==',
  cropBounds:{x:.1,y:.1,width:.75,height:.7},cropReviewed:true,confirmed:true,
  category:'Tops',itemType:'T-shirt',color:'Navy',hint,...extra};
}
const openDb=owner=>new Promise((resolve,reject)=>{
 const r=indexedDB.open('closet-current-user-'+owner,1);
 r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const readRows=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const ownerHint=()=>({categories:['Tops','Outerwear'],types:['T-shirt','Coat'],
 confidence:.93,clipped:false});
const hostileHint=()=>({
 categories:['Tops','Accessories','Tops',{label:'Shoes'},'__proto__','Outerwear'],
 types:['T-shirt','Hat','Coat','Sneakers','T-shirt','__proto__'],
 confidence:.86,clipped:true,
 originalJPEG:'data:image/jpeg;base64,SENSITIVE-PHOTOGRAPH',
 oauthToken:'top-secret',
 rawSegmentation:{ownerId:'foreign-user',pixels:new Uint8Array(80000)},
 segmentationMask:new Uint8Array(2000),
 credentials:{Authorization:'Bearer NEVER-PERSIST'},
 diagnostics:{image:'hidden'}});

test('HINT50 exact valid SegFormer category, type, finite score and clipping evidence retained',()=>{
 assert.deepEqual(sanitizeSegmentHint50(ownerHint()),{
  categories:['Tops','Outerwear'],types:['T-shirt','Coat'],clipped:false,confidence:.93
 });
});

test('HINT50 unknown categories, irrelevant types, arbitrary nested raw pixels and secrets are excluded',()=>{
 const cleaned=sanitizeSegmentHint50(hostileHint());
 assert.deepEqual(cleaned,{
  categories:['Tops','Outerwear'],types:['T-shirt','Coat'],clipped:true,confidence:.86
 });
 assert.equal(JSON.stringify(cleaned).includes('SENSITIVE'),false);
 assert.equal(JSON.stringify(cleaned).includes('Bearer'),false);
 assert.equal(Object.hasOwn(cleaned,'rawSegmentation'),false);
 assert.equal(Object.hasOwn(cleaned,'oauthToken'),false);
});

test('HINT50 untrusted confidence is rejected unless a finite number in [0,1]',()=>{
 for(const invalid of [-2,-.00001,1.00001,Infinity,-Infinity,NaN,'0.99',null,{},[]]){
  const result=sanitizeSegmentHint50({categories:['Tops'],confidence:invalid});
  assert.equal(result.confidence,null);
 }
 for(const good of [0,1,.65])assert.equal(
  sanitizeSegmentHint50({categories:['Shoes'],confidence:good}).confidence,good
 );
 assert.equal(sanitizeSegmentHint50({confidence:'0.99'}),null);
});

test('HINT50 only literal boolean clipped/maskApplied values survive, not truthy strings',async()=>{
 const proof=await source();
 for(const malicious of ['true',1,'false',{enabled:true},null]){
  const saved=verifiedRecord24({proof,ownerId:'owner50',piece:piece('bool', {
   categories:['Tops'],confidence:.54,clipped:malicious
  },{maskApplied:malicious})});
  assert.equal(saved.segmentHint.clipped,null);
  assert.equal(saved.maskApplied,false);
 }
 const genuinelyApplied=verifiedRecord24({proof,ownerId:'owner50',piece:piece('bool-yes',
  {categories:['Tops'],confidence:.54,clipped:true},{maskApplied:true})});
 assert.equal(genuinelyApplied.segmentHint.clipped,true);
 assert.equal(genuinelyApplied.maskApplied,true);
});

test('HINT50 manually cropped garments cannot acquire fabricated segmentation-worker evidence',async()=>{
 const proof=await source();
 const r=verifiedRecord24({proof,ownerId:'owner50',piece:piece('manual',
  hostileHint(),{manual:true,instanceKey:'manual-100-100-750-700'})});
 assert.equal(r.segmentHint,null);
 assert.equal(r.sourceSegmentationConfidence,null);
 assert.equal(r.category,'Tops');
 assert.equal(r.itemType,'T-shirt');
 assert.equal(r.color,'Navy');
 assert.equal(r.colorSource,'user');
});

test('HINT50 empty or non-object hints and unbounded labels cannot become private record payload',()=>{
 for(const h of [null,undefined,'confidence=1',[],{},new Uint8Array([1,2,3])]){
  assert.equal(sanitizeSegmentHint50(h),null);
 }
 const arrays=new Array(2000).fill('Tops');
 arrays[1]='Shoes';arrays[2]='Bottoms';
 const cleaned=sanitizeSegmentHint50({
  categories:arrays,types:new Array(2000).fill('Sneakers'),confidence:.4
 });
 assert.deepEqual(cleaned.categories,['Tops','Shoes','Bottoms']);
 assert.deepEqual(cleaned.types,['Sneakers']);
 assert.ok(JSON.stringify(cleaned).length<240);
});

test('HINT50 original SHA, user-selected category/subtype/color and photo remain unchanged',async()=>{
 const proof=await source(),r=verifiedRecord24({proof,ownerId:'owner50',
  piece:piece('shirt-50',hostileHint(),{maskApplied:'false'})});
 assert.equal(r.ownerId,'owner50');
 assert.equal(r.sourceSHA256,proof.sourceSHA256);
 assert.equal(r.originalPhoto.image,proof.image);
 assert.equal(r.originalPhoto.sha256,proof.sourceSHA256);
 assert.equal(r.color,'Navy');
 assert.equal(r.itemType,'T-shirt');
 assert.equal(r.category,'Tops');
 assert.equal(r.sourceSegmentationConfidence,.86);
 assert.equal(r.maskApplied,false);
 assert.equal(r.threeDReady,false);
 assert.equal(JSON.stringify(r).includes('top-secret'),false);
 assert.equal(JSON.stringify(r).includes('SENSITIVE-PHOTOGRAPH'),false);
 assert.deepEqual(r.segmentHint,{
  categories:['Tops','Outerwear'],types:['T-shirt','Coat'],clipped:true,confidence:.86
 });
});

test('HINT50 real owner-private IndexedDB 2-item atomic commit rejects worker payload even in exported record JSON',async()=>{
 const proof=await source(),owner='segment50-owner',db=await openDb(owner);
 const first=piece('shirt',hostileHint());
 const second=piece('shoes',ownerHint(),{
  instanceKey:'seg-9-35-20-40-40-1',
  category:'Shoes',itemType:'Sneakers',color:'Black'
 });
 try {
  const rows=await atomicSaveGarments24({db,proof,pieces:[first,second],ownerId:owner,currentOwner:()=>owner});
  const saved=await readRows(db);
  assert.deepEqual(saved,rows);
  assert.equal(saved.length,2);
  assert.deepEqual(saved[0].segmentHint,{
   categories:['Tops','Outerwear'],types:['T-shirt','Coat'],clipped:true,confidence:.86
  });
  assert.deepEqual(saved[1].segmentHint,{
   categories:['Tops','Outerwear'],types:['T-shirt','Coat'],clipped:false,confidence:.93
  });
  assert.ok(saved.every(x=>x.originalPhoto.image===proof.image&&x.ownerId===owner));
  const backupFragment=JSON.stringify({items:saved});
  assert.equal(backupFragment.includes('top-secret'),false);
  assert.equal(backupFragment.includes('NEVER-PERSIST'),false);
  assert.equal(backupFragment.includes('SENSITIVE-PHOTOGRAPH'),false);
 }finally{db.close();}
});

test('HINT50 in-flight mutation of detector hint cannot affect already-frozen private atomic save',async()=>{
 const proof=await source(),owner='segment50-snapshot',db=await openDb(owner);
 const first=piece('shirt-snapshot',hostileHint());
 try{
  const pending=atomicSaveGarments24({db,proof,pieces:[first],ownerId:owner,currentOwner:()=>owner});
  first.hint.categories=['Accessories'];
  first.hint.types=['Bag'];
  first.hint.confidence=Infinity;
  first.hint.oauthToken='changed-after-snapshot';
  const result=await pending;
  assert.deepEqual(result[0].segmentHint,{
   categories:['Tops','Outerwear'],types:['T-shirt','Coat'],clipped:true,confidence:.86
  });
  assert.deepEqual(await readRows(db),result);
 }finally{db.close();}
});

test('HINT50 invalid user-selected category/type still rejects entire group without weakening #43 atomic gate',async()=>{
 const proof=await source(),owner='segment50-reject',db=await openDb(owner);
 try{
  await assert.rejects(atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,
   pieces:[piece('valid',hostileHint()),piece('bad',hostileHint(),{
    instanceKey:'seg-6-40-50-35-35-1',category:'Shoes',itemType:'T-shirt'
   })]}),/unreviewed or invalid/);
  assert.deepEqual(await readRows(db),[]);
 }finally{db.close();}
});
